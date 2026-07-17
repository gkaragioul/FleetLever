import { timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";

export const bridgeRequestLimitBytes = 16 * 1024;

export function classifyBridgeConfig({ enabled, secret }) {
  if (!enabled) return "disabled";
  if (typeof secret !== "string" || secret.length < 32) return "misconfigured";
  return "connected";
}

export function requestIsAuthorized(authorization, secret) {
  if (typeof authorization !== "string" || typeof secret !== "string") return false;
  const prefix = "Bearer ";
  if (!authorization.startsWith(prefix)) return false;

  const received = Buffer.from(authorization.slice(prefix.length));
  const expected = Buffer.from(secret);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function buildCodexArgs(knowledgeDirectory) {
  return [
    "exec",
    "--ephemeral",
    "--ignore-user-config",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--json",
    "-C",
    knowledgeDirectory,
    "-",
  ];
}

export async function discoverWindowsCodexBinary(binaryRoot, { readdirImpl, statImpl }) {
  const directories = await readdirImpl(binaryRoot, { withFileTypes: true });
  const candidates = [];

  for (const directory of directories) {
    if (!directory.isDirectory()) continue;
    const path = resolve(binaryRoot, directory.name, "codex.exe");
    try {
      candidates.push({ path, modifiedAt: (await statImpl(path)).mtimeMs });
    } catch {
      // Codex desktop can leave old version directories behind after an update.
    }
  }

  candidates.sort((left, right) => right.modifiedAt - left.modifiedAt);
  return candidates[0]?.path ?? null;
}

export function launchChildProcess(spawnImpl, executable, args, options) {
  try {
    return { child: spawnImpl(executable, args, options), error: null };
  } catch (error) {
    return { child: null, error };
  }
}

export function createRateLimiter({ limit = 12, now = Date.now, windowMs = 60_000 } = {}) {
  const buckets = new Map();

  return {
    take(key) {
      const timestamp = now();
      const current = buckets.get(key);
      if (!current || timestamp - current.startedAt >= windowMs) {
        buckets.set(key, { count: 1, startedAt: timestamp });
        return true;
      }

      if (current.count >= limit) return false;
      current.count += 1;
      return true;
    },
  };
}

export function parseCodexEventLine(line) {
  try {
    const event = JSON.parse(line);
    if (event?.type !== "item.completed" || event?.item?.type !== "agent_message") return null;
    return typeof event.item.text === "string" ? event.item.text.trim() : null;
  } catch {
    return null;
  }
}

export function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function writeServerEvent(response, event, data) {
  if (response.writableEnded || response.destroyed) return;
  response.write(`event: ${event}\ndata: ${safeJson(data)}\n\n`);
}
