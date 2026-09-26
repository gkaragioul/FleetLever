import { randomUUID } from "node:crypto";
import * as fsPromises from "node:fs/promises";
import path from "node:path";

// Temporary public demo workspaces, one JSON file each. Anyone can create one, so the store keeps
// a hard cap on how many exist and evicts the oldest first. It keeps an in-memory index loaded
// from disk once per process, so creating a session never rescans the directory.

const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createDemoSessionStore({
  directory,
  ttlMs,
  maxSessions,
  fs = fsPromises,
  now = () => Date.now(),
  newId = () => randomUUID(),
}) {
  /** @type {Map<string, { createdAt: number, expiresAt: number }>} insertion order = oldest first */
  let index = null;
  let loading = null;

  const fileFor = (id) => path.join(directory, `${id}.json`);

  function parseSession(id, raw) {
    const parsed = JSON.parse(raw);
    if (
      parsed?.id !== id ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.expiresAt !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    return {
      id: parsed.id,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
      snapshot: parsed.snapshot ?? null,
      updatedAt: parsed.updatedAt,
    };
  }

  async function remove(id) {
    index?.delete(id);
    await fs.rm(fileFor(id), { force: true });
  }

  async function loadIndex() {
    await fs.mkdir(directory, { recursive: true });
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const found = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (entry.name.endsWith(".tmp")) {
        await fs.rm(path.join(directory, entry.name), { force: true });
        continue;
      }
      const id = entry.name.endsWith(".json") ? entry.name.slice(0, -5) : "";
      if (!sessionIdPattern.test(id)) continue;
      try {
        const session = parseSession(id, await fs.readFile(fileFor(id), "utf8"));
        if (session) {
          found.push({ id, createdAt: Date.parse(session.createdAt), expiresAt: Date.parse(session.expiresAt) });
          continue;
        }
      } catch {
        // Unreadable leftovers are removed below.
      }
      await fs.rm(fileFor(id), { force: true });
    }
    found.sort((left, right) => left.createdAt - right.createdAt);
    index = new Map(found.map(({ id, createdAt, expiresAt }) => [id, { createdAt, expiresAt }]));
  }

  async function ensureIndex() {
    if (index) return;
    loading ??= loadIndex().finally(() => {
      loading = null;
    });
    await loading;
  }

  async function evict(currentTime, room) {
    for (const [id, entry] of [...index]) {
      if (entry.expiresAt <= currentTime) await remove(id);
    }
    while (index.size > 0 && index.size + room > maxSessions) {
      const [oldest] = index.keys();
      await remove(oldest);
    }
  }

  async function writeSession(session) {
    const target = fileFor(session.id);
    const temporary = `${target}.${newId()}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(session), "utf8");
    await fs.rename(temporary, target);
  }

  async function create() {
    await ensureIndex();
    const currentTime = now();
    await evict(currentTime, 1);
    const createdAt = new Date(currentTime).toISOString();
    const session = {
      id: newId(),
      createdAt,
      expiresAt: new Date(currentTime + ttlMs).toISOString(),
      snapshot: null,
      updatedAt: createdAt,
    };
    await writeSession(session);
    index.set(session.id, { createdAt: currentTime, expiresAt: currentTime + ttlMs });
    return session;
  }

  async function read(id) {
    if (!sessionIdPattern.test(String(id ?? ""))) return { status: "missing" };
    await ensureIndex();
    if (!index.has(id)) return { status: "missing" };

    let session;
    try {
      session = parseSession(id, await fs.readFile(fileFor(id), "utf8"));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (!session) {
      await remove(id);
      return { status: "missing" };
    }
    if (Date.parse(session.expiresAt) <= now()) {
      await remove(id);
      return { status: "expired" };
    }
    return { status: "active", session };
  }

  async function writeSnapshot(id, snapshot) {
    const result = await read(id);
    if (result.status !== "active") return result;
    const session = { ...result.session, snapshot, updatedAt: new Date(now()).toISOString() };
    await writeSession(session);
    return { status: "active", session };
  }

  async function cleanupExpired() {
    await ensureIndex();
    await evict(now(), 0);
  }

  return { create, read, writeSnapshot, cleanupExpired, size: () => index?.size ?? 0 };
}

export function demoSessionLimit(env = process.env) {
  const configured = Number(env.FLEETLEVER_DEMO_SESSION_MAX ?? "");
  return Number.isInteger(configured) && configured >= 1 && configured <= 5000 ? configured : 100;
}
