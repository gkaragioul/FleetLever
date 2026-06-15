import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const sessionCookieName = "fleetlever_super_admin_session";
const sessionMaxAgeSeconds = 60 * 60 * 12;
const hashPrefix = "scrypt";

export type SuperAdminSession = {
  role: "super_admin";
  username: string;
  expiresAt: number;
};

function isLocalAuthBypassed() {
  return process.env.NODE_ENV === "development" && process.env.FLEETLEVER_BYPASS_AUTH === "true";
}

function sessionSecret() {
  const secret = process.env.FLEETLEVER_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("FLEETLEVER_SESSION_SECRET must be set to a random value with at least 32 characters.");
  }

  return secret;
}

function configuredUsername() {
  return process.env.FLEETLEVER_SUPER_ADMIN_USERNAME ?? "karagioules";
}

function configuredPasswordHash() {
  const hash = process.env.FLEETLEVER_SUPER_ADMIN_PASSWORD_HASH;

  if (!hash) {
    throw new Error("FLEETLEVER_SUPER_ADMIN_PASSWORD_HASH is required for super admin login.");
  }

  return hash;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function encodeSession(session: SuperAdminSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string): SuperAdminSession | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SuperAdminSession>;
    if (parsed.role !== "super_admin" || typeof parsed.username !== "string" || typeof parsed.expiresAt !== "number") {
      return null;
    }

    if (Date.now() > parsed.expiresAt) return null;

    return {
      role: "super_admin",
      username: parsed.username,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = scryptSync(password, salt, 64).toString("base64url");
  return `${hashPrefix}:${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [prefix, salt, hash] = storedHash.split(":");
  if (prefix !== hashPrefix || !salt || !hash) return false;

  const expected = Buffer.from(hash, "base64url");
  const derived = scryptSync(password, salt, expected.length);

  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function verifySuperAdminCredentials(username: string, password: string) {
  const expectedUsername = configuredUsername();
  const usernameMatches = username.trim() === expectedUsername;
  const passwordMatches = verifyPassword(password, configuredPasswordHash());

  return usernameMatches && passwordMatches;
}

export async function createSuperAdminSession(username: string) {
  const cookieStore = await cookies();
  const session: SuperAdminSession = {
    role: "super_admin",
    username,
    expiresAt: Date.now() + sessionMaxAgeSeconds * 1000,
  };

  cookieStore.set(sessionCookieName, encodeSession(session), {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSuperAdminSession() {
  if (isLocalAuthBypassed()) {
    return {
      role: "super_admin",
      username: "local-dev",
      expiresAt: Date.now() + sessionMaxAgeSeconds * 1000,
    } satisfies SuperAdminSession;
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(sessionCookieName)?.value;
  return cookie ? decodeSession(cookie) : null;
}

export async function clearSuperAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function requireSuperAdminApiSession() {
  const session = await getSuperAdminSession().catch(() => null);
  if (session) return null;

  return Response.json(
    {
      ok: false,
      error: "Unauthorized",
    },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

export { sessionCookieName };
