import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const passwordHashPrefix = "scrypt-v1";

export function normalizeEmail(value) {
  return normalizeAccountIdentifier(value);
}

export function normalizeAccountIdentifier(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function createPasswordHash(password) {
  const salt = randomBytes(16).toString("base64url");
  const derived = scryptSync(password, salt, 64).toString("base64url");
  return `${passwordHashPrefix}:${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  const [prefix, salt, hash] = String(storedHash ?? "").split(":");
  if (prefix !== passwordHashPrefix || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const derived = scryptSync(password, salt, expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function hashOpaqueToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeRedirectPath(value, fallback = "/fleet-management") {
  const candidate = String(value ?? "");
  // Browsers treat "\" as "/", so "/\evil.example" leaves the site just like "//evil.example".
  // URL parsers also drop tabs and newlines, which can hide either form.
  if (!candidate.startsWith("/") || candidate.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(candidate)) {
    return fallback;
  }
  return candidate;
}

export function trialAccessState(startedAt, endsAt, now = Date.now()) {
  const start = Date.parse(startedAt);
  const end = Date.parse(endsAt);
  const validWindow = Number.isFinite(start) && Number.isFinite(end) && end > start;
  const clockSkewTolerance = 5 * 60 * 1000;
  const active = validWindow && now + clockSkewTolerance >= start && now < end;
  const effectiveNow = active ? Math.max(now, start) : now;
  return {
    active,
    daysRemaining: active ? Math.max(1, Math.ceil((end - effectiveNow) / 86_400_000)) : 0,
    expired: Number.isFinite(end) && now >= end,
  };
}
