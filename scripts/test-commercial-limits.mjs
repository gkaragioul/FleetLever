import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { after } from "node:test";

import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

import { createDemoSessionStore, demoSessionLimit } from "../src/lib/commercial/demo-session-core.mjs";
import { readBodyText, readJsonBody } from "../src/lib/security/request-body.mjs";

const temporaryDirectories = [];
after(async () => {
  await Promise.all(temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })));
});

async function temporaryDirectory() {
  const directory = await mkdtemp(path.join(tmpdir(), "fleetlever-demo-sessions-"));
  temporaryDirectories.push(directory);
  return directory;
}

function countingFs() {
  const calls = { readdir: 0 };
  return {
    calls,
    fs: { ...fs, readdir: (...args) => { calls.readdir += 1; return fs.readdir(...args); } },
  };
}

function streamedRequest(chunks, headers = {}) {
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
  });
  return new Request("https://example.test/api", { method: "POST", body, headers, duplex: "half" });
}

test("a body larger than its declared cap is refused before it is read", async () => {
  const request = new Request("https://example.test/api", { method: "POST", body: "x".repeat(10), headers: { "content-length": "999999" } });
  assert.deepEqual(await readJsonBody(request, 1024), { status: "too_large" });
});

test("a streamed body without Content-Length is cut off once it passes the cap", async () => {
  const request = streamedRequest(["{\"a\":\"", "x".repeat(800), "y".repeat(800), "\"}"]);
  assert.deepEqual(await readJsonBody(request, 1024), { status: "too_large" });
  await assert.rejects(readBodyText(streamedRequest(["z".repeat(2048)]), 1024), { name: "BodyTooLargeError" });
});

test("bodies within the cap are parsed, and broken JSON is reported as invalid", async () => {
  assert.deepEqual(await readJsonBody(streamedRequest(["{\"event\":", "\"view\"}"]), 1024), { status: "ok", value: { event: "view" } });
  assert.deepEqual(await readJsonBody(streamedRequest(["{nope"]), 1024), { status: "invalid" });
});

test("the demo store never keeps more than its cap and evicts the oldest first", async () => {
  const directory = await temporaryDirectory();
  let clock = 1_000_000;
  const store = createDemoSessionStore({ directory, ttlMs: 60_000, maxSessions: 3, now: () => clock });

  const created = [];
  for (let index = 0; index < 5; index += 1) {
    clock += 10;
    created.push((await store.create()).id);
  }

  const files = (await readdir(directory)).filter((name) => name.endsWith(".json"));
  assert.equal(files.length, 3);
  assert.equal(store.size(), 3);
  assert.equal((await store.read(created[0])).status, "missing");
  assert.equal((await store.read(created[1])).status, "missing");
  for (const id of created.slice(2)) assert.equal((await store.read(id)).status, "active");
});

test("creating sessions does not rescan the directory", async () => {
  const directory = await temporaryDirectory();
  const { calls, fs: spy } = countingFs();
  const store = createDemoSessionStore({ directory, ttlMs: 60_000, maxSessions: 50, fs: spy });

  for (let index = 0; index < 20; index += 1) await store.create();
  assert.equal(calls.readdir, 1, "the directory is read once per process, not once per create");
});

test("expired sessions are removed, and a restarted process enforces the cap on existing files", async () => {
  const directory = await temporaryDirectory();
  let clock = 5_000_000;
  const first = createDemoSessionStore({ directory, ttlMs: 1_000, maxSessions: 10, now: () => clock });
  const stale = await first.create();
  clock += 2_000;
  assert.equal((await first.read(stale.id)).status, "expired");

  for (let index = 0; index < 6; index += 1) {
    clock += 1;
    await first.create();
  }
  const restarted = createDemoSessionStore({ directory, ttlMs: 1_000, maxSessions: 4, now: () => clock });
  await restarted.create();
  assert.equal((await readdir(directory)).filter((name) => name.endsWith(".json")).length, 4);
});

test("the session cap is configurable within safe bounds", () => {
  assert.equal(demoSessionLimit({}), 100);
  assert.equal(demoSessionLimit({ FLEETLEVER_DEMO_SESSION_MAX: "25" }), 25);
  assert.equal(demoSessionLimit({ FLEETLEVER_DEMO_SESSION_MAX: "0" }), 100);
  assert.equal(demoSessionLimit({ FLEETLEVER_DEMO_SESSION_MAX: "999999" }), 100);
});

test("anonymous commercial routes are rate limited per client, size capped and never create tables", async () => {
  const routes = {
    "src/app/api/commercial/events/route.ts": /readJsonBody\(request, maximumBodyBytes\)/,
    "src/app/api/commercial/demo-request/route.ts": /readJsonBody\(request, maximumBodyBytes\)/,
    "src/app/api/commercial/demo-sessions/route.ts": null,
    "src/app/api/commercial/demo-sessions/[sessionId]/state/route.ts": /readBodyText\(request, maximumSnapshotBytes\)/,
  };
  for (const [file, bodyCap] of Object.entries(routes)) {
    const source = await readFile(file, "utf8");
    assert.match(source, /takeRateLimit\(`[a-z-]+(\$\{action\})?:\$\{clientRateLimitKey\(request\.headers\)\}`/, `${file} must rate limit per client`);
    if (bodyCap) assert.match(source, bodyCap, `${file} must cap the request body while reading it`);
    assert.doesNotMatch(source, /request\.(json|text)\(\)/, `${file} must not buffer an unbounded body`);
    assert.doesNotMatch(source, /create table/i, `${file} must not change the schema at request time`);
  }
});

test("migration 0014 creates the intake tables and leaves the runtime role insert-only", async () => {
  const db = await PGlite.create({ extensions: { citext, pgcrypto } });
  try {
    const files = (await readdir("db/migrations")).filter((file) => file.endsWith(".sql")).sort();
    const intake = files.find((file) => file.startsWith("0014_"));
    assert.ok(intake, "migration 0014 must exist");

    await db.exec("create role fleetlever_app nologin; grant usage, create on schema public to fleetlever_app;");
    for (const file of files.filter((name) => name < intake)) await db.exec(await readFile(`db/migrations/${file}`, "utf8"));

    // What the old request-time code left behind: a table owned by the runtime role.
    await db.exec(`
      set role fleetlever_app;
      create table public.commercial_events (
        id bigserial primary key, event_name text not null, path text not null, label text,
        referrer text, metadata jsonb, created_at timestamptz not null default now());
      reset role;
    `);

    await db.exec(await readFile(`db/migrations/${intake}`, "utf8"));

    await db.exec("set role fleetlever_app");
    await db.query("insert into public.commercial_events (event_name, path) values ('view', '/')");
    await db.query(
      "insert into public.commercial_demo_requests (name, company, work_email, role, fleet_size, challenge) values ('a', 'b', 'c@example.com', 'd', 'e', 'f')",
    );
    await assert.rejects(db.query("select * from public.commercial_events"), /permission denied/);
    await assert.rejects(db.query("delete from public.commercial_demo_requests"), /permission denied/);
    await assert.rejects(db.query("alter table public.commercial_events add column x text"), /must be owner|permission denied/);
    await db.exec("reset role");
  } finally {
    await db.close();
  }
});
