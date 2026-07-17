import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  classifyRelayConfig,
  relayRequestIsAuthorized,
  sanitizeRelayEvent,
  relayConnectionStatus,
} from "../src/lib/lisa/relay-core.mjs";

test("relay configuration requires an enabled flag, public URL, and long secret", () => {
  assert.equal(classifyRelayConfig({ enabled: false, baseUrl: "https://app.example.com", secret: "x".repeat(40) }), "disabled");
  assert.equal(classifyRelayConfig({ enabled: true, baseUrl: "", secret: "x".repeat(40) }), "misconfigured");
  assert.equal(classifyRelayConfig({ enabled: true, baseUrl: "http://app.example.com", secret: "x".repeat(40) }), "misconfigured");
  assert.equal(classifyRelayConfig({ enabled: true, baseUrl: "https://app.example.com", secret: "short" }), "misconfigured");
  assert.equal(classifyRelayConfig({ enabled: true, baseUrl: "https://app.example.com", secret: "x".repeat(40) }), "connected");
});

test("relay authorization compares the configured bearer secret", () => {
  const secret = "a".repeat(40);
  assert.equal(relayRequestIsAuthorized(`Bearer ${secret}`, secret), true);
  assert.equal(relayRequestIsAuthorized(`Bearer ${"b".repeat(40)}`, secret), false);
  assert.equal(relayRequestIsAuthorized(undefined, secret), false);
});

test("relay events only allow the public Lisa stream contract", () => {
  assert.deepEqual(sanitizeRelayEvent({ event: "message", data: { text: "Ready." } }), {
    event: "message",
    data: { text: "Ready." },
    terminal: false,
  });
  assert.deepEqual(sanitizeRelayEvent({ event: "done", data: { status: "connected" } }), {
    event: "done",
    data: { status: "connected" },
    terminal: true,
  });
  assert.equal(sanitizeRelayEvent({ event: "command", data: { command: "whoami" } }), null);
  assert.equal(sanitizeRelayEvent({ event: "message", data: { text: "x".repeat(20_001) } }), null);
});

test("relay connection status expires stale companion heartbeats", () => {
  const now = new Date("2026-07-17T12:00:00.000Z");
  assert.equal(relayConnectionStatus(null, now), "unavailable");
  assert.equal(relayConnectionStatus(new Date("2026-07-17T11:59:40.000Z"), now), "connected");
  assert.equal(relayConnectionStatus(new Date("2026-07-17T11:58:00.000Z"), now), "unavailable");
});

test("hosted relay contract uses ephemeral tenant jobs and outbound companion routes", async () => {
  const [migration, relayServer, chatRoute, bridge, proxy] = await Promise.all([
    readFile("db/migrations/0006_lisa_outbound_relay.sql", "utf8"),
    readFile("src/lib/lisa/relay.ts", "utf8"),
    readFile("src/app/api/fleetlever/lisa/chat/route.ts", "utf8"),
    readFile("scripts/lisa-bridge.mjs", "utf8"),
    readFile("src/proxy.ts", "utf8"),
  ]);

  assert.match(migration, /lisa_relay_jobs/);
  assert.match(migration, /expires_at/);
  assert.match(migration, /row level security/);
  assert.match(migration, /security definer/);
  assert.match(migration, /revoke all on function app_private\.claim_lisa_relay_job\(text\) from public/i);
  assert.match(relayServer, /enqueueLisaRelayJob/);
  assert.match(relayServer, /claimLisaRelayJob/);
  assert.match(chatRoute, /streamLisaRelayJob/);
  assert.match(bridge, /FLEETLEVER_LISA_RELAY_ENABLED/);
  assert.match(bridge, /runRelayLoop/);
  assert.match(proxy, /isLisaCompanionRelayApi/);
  assert.match(proxy, /!isLisaCompanionRelayApi\(pathname\)/);
  assert.doesNotMatch(bridge, /0\.0\.0\.0/);
});
