import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const DEMO_SESSION_TTL_MS = 10 * 60 * 60 * 1000;

const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DemoSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  snapshot: unknown | null;
  updatedAt: string;
};

export type DemoSessionLookup =
  | { status: "active"; session: DemoSession }
  | { status: "expired" | "missing" };

function demoSessionDirectory() {
  return process.env.FLEETLEVER_DEMO_SESSION_DIR
    ? path.resolve(process.env.FLEETLEVER_DEMO_SESSION_DIR)
    : path.join(process.cwd(), ".fleetlever", "demo-sessions");
}

function sessionPath(sessionId: string) {
  if (!sessionIdPattern.test(sessionId)) return null;
  return path.join(demoSessionDirectory(), `${sessionId}.json`);
}

async function writeSession(session: DemoSession) {
  const directory = demoSessionDirectory();
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, `${session.id}.json`);
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(session), "utf8");
  await rename(temporary, target);
}

async function readSessionFile(sessionId: string) {
  const target = sessionPath(sessionId);
  if (!target) return null;

  try {
    const parsed = JSON.parse(await readFile(target, "utf8")) as Partial<DemoSession>;
    if (
      parsed.id !== sessionId ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.expiresAt !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      await rm(target, { force: true });
      return null;
    }

    return {
      id: parsed.id,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
      snapshot: parsed.snapshot ?? null,
      updatedAt: parsed.updatedAt,
    } satisfies DemoSession;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function cleanupExpiredDemoSessions(now = Date.now()) {
  const directory = demoSessionDirectory();
  await mkdir(directory, { recursive: true });
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const id = entry.name.slice(0, -5);
        const session = await readSessionFile(id);
        if (!session || Date.parse(session.expiresAt) <= now) {
          await rm(path.join(directory, entry.name), { force: true });
        }
      }),
  );
}

export async function createDemoSession(now = Date.now()) {
  await cleanupExpiredDemoSessions(now);
  const createdAt = new Date(now).toISOString();
  const session: DemoSession = {
    id: randomUUID(),
    createdAt,
    expiresAt: new Date(now + DEMO_SESSION_TTL_MS).toISOString(),
    snapshot: null,
    updatedAt: createdAt,
  };
  await writeSession(session);
  return session;
}

export async function readDemoSession(sessionId: string, now = Date.now()): Promise<DemoSessionLookup> {
  const target = sessionPath(sessionId);
  if (!target) return { status: "missing" };

  const session = await readSessionFile(sessionId);
  if (!session) return { status: "missing" };

  if (Date.parse(session.expiresAt) <= now) {
    await rm(target, { force: true });
    return { status: "expired" };
  }

  return { status: "active", session };
}

export async function writeDemoSessionSnapshot(
  sessionId: string,
  snapshot: unknown,
  now = Date.now(),
): Promise<DemoSessionLookup> {
  const result = await readDemoSession(sessionId, now);
  if (result.status !== "active") return result;

  const session = {
    ...result.session,
    snapshot,
    updatedAt: new Date(now).toISOString(),
  } satisfies DemoSession;
  await writeSession(session);
  return { status: "active", session };
}
