import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  allowsLocalDevelopmentAccess,
  decodeSession,
  encodeSession,
  isHostedDeployment,
  sessionSecret,
} from "@/lib/auth/super-admin-core.mjs";

const sessionCookieName = "fleetlever_super_admin_session";
const sessionMaxAgeSeconds = 60 * 60 * 12;
const hashPrefix = "scrypt";

export type SuperAdminSession = {
  role: "super_admin";
  username: string;
  expiresAt: number;
};

function localDevelopmentSession(): SuperAdminSession {
  return {
    role: "super_admin",
    username: "localhost",
    expiresAt: Date.now() + sessionMaxAgeSeconds * 1000,
  };
}

function configuredUsername() {
  return process.env.FLEETLEVER_SUPER_ADMIN_USERNAME?.trim() || null;
}

function configuredPasswordHash() {
  const hash = process.env.FLEETLEVER_SUPER_ADMIN_PASSWORD_HASH;

  if (!hash) {
    throw new Error("FLEETLEVER_SUPER_ADMIN_PASSWORD_HASH is required for super admin login.");
  }

  return hash;
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
  if (!expectedUsername) return false;
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

  cookieStore.set(sessionCookieName, encodeSession(session, sessionSecret()), {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: isHostedDeployment(),
  });
}

export async function getSuperAdminSession() {
  if (allowsLocalDevelopmentAccess()) {
    return localDevelopmentSession();
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(sessionCookieName)?.value;
  return cookie ? decodeSession(cookie, sessionSecret()) : null;
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
