import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  bridgeRequestLimitBytes,
  buildCodexArgs,
  classifyBridgeConfig,
  createRateLimiter,
  discoverWindowsCodexBinary,
  launchChildProcess,
  parseCodexEventLine,
  requestIsAuthorized,
  writeServerEvent,
} from "./lib/lisa-bridge-core.mjs";
import { classifyRelayConfig } from "../src/lib/lisa/relay-core.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const knowledgeDirectory = resolve(repositoryRoot, "docs", "lisa");
const knowledgePath = resolve(knowledgeDirectory, "knowledge.md");
const enabled = process.env.FLEETLEVER_LISA_LOCAL_BRIDGE_ENABLED === "true";
const secret = process.env.FLEETLEVER_LISA_BRIDGE_SECRET ?? "";
const host = process.env.FLEETLEVER_LISA_BRIDGE_HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.FLEETLEVER_LISA_BRIDGE_PORT ?? "3210", 10);
const timeoutMs = Number.parseInt(process.env.FLEETLEVER_LISA_TIMEOUT_MS ?? "90000", 10);
const relayEnabled = process.env.FLEETLEVER_LISA_RELAY_ENABLED === "true";
const relayBaseUrl = process.env.FLEETLEVER_LISA_RELAY_URL ?? "";
const relaySecret = process.env.FLEETLEVER_LISA_RELAY_SECRET ?? "";
const relayCompanionId = (process.env.FLEETLEVER_LISA_RELAY_COMPANION_ID ?? "primary").slice(0, 120);
const relayVersion = "0.11.1";
const limiter = createRateLimiter({ limit: 12, windowMs: 60_000 });
let activeRequest = null;

async function resolveCodexBinary() {
  const configured = process.env.CODEX_BIN;
  if (configured && !configured.toLowerCase().endsWith(".cmd")) return configured;
  if (process.platform !== "win32") return configured ?? "codex";

  const binaryRoot = resolve(process.env.LOCALAPPDATA ?? "", "OpenAI", "Codex", "bin");
  try {
    const discovered = await discoverWindowsCodexBinary(binaryRoot, { readdirImpl: readdir, statImpl: stat });
    if (discovered) return discovered;
  } catch {
    // The health check will report an unavailable companion if Codex cannot start.
  }
  return configured ?? "codex.exe";
}

function json(response, status, body) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function readRequestBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > bridgeRequestLimitBytes) {
      const error = new Error("Request is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function cleanContext(value) {
  if (!value || typeof value !== "object") return {};
  const context = value;
  return {
    locale: typeof context.locale === "string" ? context.locale.slice(0, 12) : "en",
    route: typeof context.route === "string" ? context.route.slice(0, 160) : "/fleet-management",
    view: typeof context.view === "string" ? context.view.slice(0, 80) : "tomorrow",
    organization: typeof context.organization === "string" ? context.organization.slice(0, 120) : "Current organization",
    selectedAsset: typeof context.selectedAsset === "string" ? context.selectedAsset.slice(0, 80) : null,
    summary: typeof context.summary === "string" ? context.summary.slice(0, 3000) : "No authorized live summary supplied.",
  };
}

async function createPrompt(question, context) {
  const knowledge = await readFile(knowledgePath, "utf8");
  return `${knowledge}\n\nCURRENT AUTHORIZED CONTEXT\n${JSON.stringify(cleanContext(context), null, 2)}\n\nUSER QUESTION\n${question}\n\nAnswer directly in the user's language. Use only the supplied knowledge and authorized context. If data is missing, say so. Recommend and navigate; do not claim to make changes. Do not use tools or execute commands.`;
}

async function bridgeHealth() {
  const configuration = classifyBridgeConfig({ enabled, secret });
  if (configuration !== "connected") return { status: configuration };

  try {
    await access(knowledgePath, constants.R_OK);
  } catch {
    return { status: "misconfigured", detail: "Lisa knowledge file is missing." };
  }

  return { status: activeRequest ? "busy" : "connected" };
}

async function handleChat(request, response) {
  const health = await bridgeHealth();
  if (health.status === "busy") return json(response, 409, health);
  if (health.status !== "connected") return json(response, 503, health);

  let body;
  try {
    body = await readRequestBody(request);
  } catch (error) {
    return json(response, error?.statusCode ?? 400, { status: "invalid_request", detail: "Invalid request body." });
  }

  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 2000) {
    return json(response, 400, { status: "invalid_request", detail: "Question must be between 1 and 2,000 characters." });
  }

  const prompt = await createPrompt(question, body.context);
  response.writeHead(200, {
    "Cache-Control": "no-store, no-transform",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream; charset=utf-8",
    "X-Accel-Buffering": "no",
    "X-Content-Type-Options": "nosniff",
  });
  writeServerEvent(response, "status", { status: "thinking" });

  const codexBin = await resolveCodexBinary();
  const launch = launchChildProcess(spawn, codexBin, buildCodexArgs(knowledgeDirectory), {
    cwd: knowledgeDirectory,
    env: {
      ...process.env,
      CODEX_BIN: codexBin,
      NO_COLOR: "1",
    },
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  if (!launch.child) {
    console.error(`[Lisa bridge] Codex launch failed (${launch.error?.code ?? "unknown"}).`);
    writeServerEvent(response, "error", { status: "unavailable", detail: "The local Codex companion could not start." });
    response.end();
    return;
  }
  const child = launch.child;
  activeRequest = child;
  let stdoutBuffer = "";
  let answerSent = false;
  let stderrSeen = false;

  const timeout = setTimeout(() => {
    child.kill();
    writeServerEvent(response, "error", { status: "timeout", detail: "Lisa took too long to answer." });
    response.end();
  }, timeoutMs);

  const cancel = () => {
    if (!response.writableEnded) child.kill();
  };
  request.once("aborted", cancel);
  response.once("close", cancel);

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk;
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? "";
    for (const line of lines) {
      const text = parseCodexEventLine(line);
      if (!text) continue;
      answerSent = true;
      writeServerEvent(response, "message", { text });
    }
  });
  child.stderr.on("data", () => {
    stderrSeen = true;
  });
  child.once("error", (error) => {
    console.error(`[Lisa bridge] Codex process failed (${error?.code ?? "unknown"}).`);
    clearTimeout(timeout);
    if (!response.writableEnded) {
      writeServerEvent(response, "error", { status: "unavailable", detail: "The local Codex companion could not start." });
      response.end();
    }
    activeRequest = null;
  });
  child.once("close", (code) => {
    clearTimeout(timeout);
    activeRequest = null;
    if (response.writableEnded) return;
    if (code === 0 && answerSent) {
      writeServerEvent(response, "done", { status: "connected" });
    } else {
      writeServerEvent(response, "error", {
        status: "unavailable",
        detail: stderrSeen ? "Codex did not return an answer. Check the companion login." : "Lisa did not return an answer.",
      });
    }
    response.end();
  });

  child.stdin.end(prompt);
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function relayUrl(pathname) {
  return new URL(pathname, relayBaseUrl.endsWith("/") ? relayBaseUrl : `${relayBaseUrl}/`);
}

async function relayFetch(pathname, options = {}) {
  return fetch(relayUrl(pathname), {
    ...options,
    headers: {
      Authorization: `Bearer ${relaySecret}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    signal: options.signal ?? AbortSignal.timeout(10_000),
  });
}

async function postRelayEvent(jobId, event, data) {
  const response = await relayFetch(`api/fleetlever/lisa/relay/jobs/${jobId}/events`, {
    body: JSON.stringify({ event, data }),
    method: "POST",
  });
  if (!response.ok) throw new Error(`Relay event rejected (${response.status}).`);
  return response.json();
}

async function forwardServerEvents(jobId, body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";
  let dataLines = [];

  const dispatch = async () => {
    if (!dataLines.length) return;
    let data;
    try {
      data = JSON.parse(dataLines.join("\n"));
    } catch {
      data = { status: "unavailable", detail: "Lisa returned an invalid stream event." };
      eventName = "error";
    }
    await postRelayEvent(jobId, eventName, data);
    eventName = "message";
    dataLines = [];
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = done ? "" : (lines.pop() ?? "");
    for (const line of lines) {
      if (!line) {
        await dispatch();
      } else if (line.startsWith("event:")) {
        eventName = line.slice("event:".length).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trimStart());
      }
    }
    if (done) break;
  }
  if (buffer) dataLines.push(buffer);
  await dispatch();
}

async function runRelayJob(job) {
  const controller = new AbortController();
  let cancelled = false;
  const heartbeat = setInterval(() => {
    void relayFetch("api/fleetlever/lisa/relay/heartbeat", {
      body: JSON.stringify({ companionId: relayCompanionId, status: "busy", version: relayVersion }),
      method: "POST",
    }).catch(() => {});
  }, 15_000);
  const cancellationPoll = setInterval(async () => {
    try {
      const response = await relayFetch(`api/fleetlever/lisa/relay/jobs/${job.id}/status`);
      const status = await response.json();
      if (status.cancel_requested === true || status.status === "cancelled") {
        cancelled = true;
        controller.abort();
      }
    } catch {
      // A transient status check must not discard the active Codex response.
    }
  }, 1000);

  try {
    const response = await fetch(`http://${host}:${port}/v1/chat`, {
      body: JSON.stringify({ question: job.question, context: job.context }),
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });
    if (!response.ok || !response.body) {
      await postRelayEvent(job.id, "error", { status: "unavailable", detail: "The local Codex companion could not answer." });
      return;
    }
    await forwardServerEvents(job.id, response.body);
  } catch {
    if (!cancelled) {
      await postRelayEvent(job.id, "error", { status: "unavailable", detail: "The local Lisa companion was interrupted." }).catch(() => {});
    }
  } finally {
    clearInterval(heartbeat);
    clearInterval(cancellationPoll);
  }
}

async function runRelayLoop() {
  const configuration = classifyRelayConfig({ enabled: relayEnabled, baseUrl: relayBaseUrl, secret: relaySecret });
  if (configuration !== "connected") {
    console.log(`[Lisa relay] ${configuration}; outbound relay is not running.`);
    return;
  }

  console.log(`[Lisa relay] connecting outbound as ${relayCompanionId}.`);
  while (relayEnabled) {
    try {
      const response = await relayFetch("api/fleetlever/lisa/relay/jobs/claim", {
        body: JSON.stringify({ companionId: relayCompanionId, version: relayVersion }),
        method: "POST",
      });
      if (response.status === 204) {
        await delay(800);
        continue;
      }
      if (!response.ok) throw new Error(`Relay claim rejected (${response.status}).`);
      const payload = await response.json();
      if (payload?.job?.id) await runRelayJob(payload.job);
    } catch (error) {
      console.error(`[Lisa relay] connection unavailable (${error?.name ?? "network"}).`);
      await delay(3000);
    }
  }
}

const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "null");
  const remoteAddress = request.socket.remoteAddress ?? "unknown";
  if (!limiter.take(remoteAddress)) return json(response, 429, { status: "rate_limited" });

  if (!requestIsAuthorized(request.headers.authorization, secret)) {
    return json(response, 401, { status: "unauthorized" });
  }

  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  if (request.method === "GET" && url.pathname === "/health") {
    return json(response, 200, await bridgeHealth());
  }
  if (request.method === "POST" && url.pathname === "/v1/chat") {
    return handleChat(request, response);
  }
  return json(response, 404, { status: "not_found" });
});

server.listen(port, host, () => {
  const status = classifyBridgeConfig({ enabled, secret });
  console.log(`[Lisa bridge] ${status} on http://${host}:${port}`);
  if (relayEnabled) void runRelayLoop();
});

function shutdown() {
  activeRequest?.kill();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
