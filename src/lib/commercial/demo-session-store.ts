import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  createDemoSessionStore,
  demoSessionLimit,
  type DemoSession,
  type DemoSessionLookup,
} from "@/lib/commercial/demo-session-core.mjs";

export type { DemoSession, DemoSessionLookup };

export const DEMO_SESSION_TTL_MS = 10 * 60 * 60 * 1000;

function demoSessionDirectory() {
  return process.env.FLEETLEVER_DEMO_SESSION_DIR
    ? path.resolve(process.env.FLEETLEVER_DEMO_SESSION_DIR)
    : path.join(process.cwd(), ".fleetlever", "demo-sessions");
}

// One store per server process. It holds at most FLEETLEVER_DEMO_SESSION_MAX sessions (default
// 100), each capped at 2 MB by the state route, and evicts the oldest when full. A session is
// removed once its expiresAt time (DEMO_SESSION_TTL_MS after creation) has passed.
const store = createDemoSessionStore({
  directory: demoSessionDirectory(),
  ttlMs: DEMO_SESSION_TTL_MS,
  maxSessions: demoSessionLimit(),
  newId: randomUUID,
});

export async function cleanupExpiredDemoSessions() {
  await store.cleanupExpired();
}

export async function createDemoSession() {
  return store.create();
}

export async function readDemoSession(sessionId: string): Promise<DemoSessionLookup> {
  return store.read(sessionId);
}

export async function writeDemoSessionSnapshot(sessionId: string, snapshot: unknown): Promise<DemoSessionLookup> {
  return store.writeSnapshot(sessionId, snapshot);
}
