import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildCodexArgs,
  classifyBridgeConfig,
  createRateLimiter,
  discoverWindowsCodexBinary,
  launchChildProcess,
  parseCodexEventLine,
  requestIsAuthorized,
} from "./lib/lisa-bridge-core.mjs";

test("Codex discovery ignores stale desktop cache directories", async () => {
  const binary = await discoverWindowsCodexBinary("C:/Codex/bin", {
    readdirImpl: async () => [
      { isDirectory: () => true, name: "current" },
      { isDirectory: () => true, name: "stale" },
    ],
    statImpl: async (path) => {
      if (path.includes("stale")) throw Object.assign(new Error("missing"), { code: "ENOENT" });
      return { mtimeMs: 200 };
    },
  });

  assert.match(binary, /current[\\/]codex\.exe$/);
});

test("synchronous process launch failures stay inside the bridge", () => {
  const launch = launchChildProcess(() => {
    const error = new Error("denied");
    error.code = "EPERM";
    throw error;
  }, "codex.exe", [], {});

  assert.equal(launch.child, null);
  assert.equal(launch.error?.code, "EPERM");
});

test("bridge configuration is explicit and never pretends to be connected", () => {
  assert.equal(classifyBridgeConfig({ enabled: false, secret: "x".repeat(32) }), "disabled");
  assert.equal(classifyBridgeConfig({ enabled: true, secret: "short" }), "misconfigured");
  assert.equal(classifyBridgeConfig({ enabled: true, secret: "x".repeat(32) }), "connected");
});

test("bridge authorization uses the configured bearer token", () => {
  const secret = "a".repeat(40);
  assert.equal(requestIsAuthorized(`Bearer ${secret}`, secret), true);
  assert.equal(requestIsAuthorized(`Bearer ${"b".repeat(40)}`, secret), false);
  assert.equal(requestIsAuthorized(undefined, secret), false);
});

test("Codex runs ephemerally in a read-only knowledge directory", () => {
  const args = buildCodexArgs("C:/fleetlever/lisa-knowledge");

  assert.deepEqual(args.slice(0, 2), ["exec", "--ephemeral"]);
  assert.ok(args.includes("read-only"));
  assert.ok(args.includes("--ignore-user-config"));
  assert.ok(args.includes("--skip-git-repo-check"));
  assert.ok(args.includes("--json"));
  assert.ok(args.includes("C:/fleetlever/lisa-knowledge"));
  assert.ok(!args.includes("workspace-write"));
  assert.ok(!args.includes("danger-full-access"));
  assert.ok(!args.some((argument) => argument.includes("bypass")));
});

test("rate limiter rejects requests over the per-window limit", () => {
  let now = 1000;
  const limiter = createRateLimiter({ limit: 2, now: () => now, windowMs: 100 });

  assert.equal(limiter.take("127.0.0.1"), true);
  assert.equal(limiter.take("127.0.0.1"), true);
  assert.equal(limiter.take("127.0.0.1"), false);

  now = 1101;
  assert.equal(limiter.take("127.0.0.1"), true);
});

test("Codex JSON events expose only assistant text", () => {
  assert.equal(
    parseCodexEventLine(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "Ready." } })),
    "Ready.",
  );
  assert.equal(
    parseCodexEventLine(JSON.stringify({ type: "item.completed", item: { type: "command_execution", command: "whoami" } })),
    null,
  );
  assert.equal(parseCodexEventLine("not json"), null);
});

test("Lisa knowledge covers the product modules and exact navigation protocol", async () => {
  const knowledge = await readFile(new URL("../docs/lisa/knowledge.md", import.meta.url), "utf8");

  for (const topic of [
    "Tomorrow's work",
    "Worksites / operations",
    "Stop list",
    "Machines / assets",
    "Documents & checks",
    "Service",
    "People",
    "Decision history",
    "Settings",
    "Battery level",
    "logo or banner",
  ]) {
    assert.match(knowledge, new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  assert.match(knowledge, /NAVIGATE:\s*<view>/);
  assert.match(knowledge, /tomorrow\|worksites\|machines\|blockers\|certificates\|service\|staff\|history\|settings/);
  assert.match(knowledge, /final line/i);
  assert.match(knowledge, /do not emit NAVIGATE/i);
});
