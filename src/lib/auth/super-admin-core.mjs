import { createHmac, timingSafeEqual } from "node:crypto";

const hostedPlatformVariables = ["RAILWAY_ENVIRONMENT", "VERCEL", "RENDER", "FLY_APP_NAME"];
const developmentSessionSecret = "fleetlever-local-demo-session-secret-only-for-local-runs";
const minimumSecretLength = 32;

export function isHostedDeployment(env = process.env) {
  return hostedPlatformVariables.some((name) => Boolean(env[name]));
}

/**
 * The implicit localhost super admin session is a local development convenience. A hosted
 * deployment must never grant it, even when it was started outside production mode.
 */
export function allowsLocalDevelopmentAccess(env = process.env) {
  return env.NODE_ENV !== "production" && !isHostedDeployment(env);
}

export function sessionSecret(env = process.env) {
  const secret = env.FLEETLEVER_SESSION_SECRET;

  if (!secret || secret.length < minimumSecretLength) {
    if (!isHostedDeployment(env)) {
      return developmentSessionSecret;
    }

    throw new Error(
      `FLEETLEVER_SESSION_SECRET must be set to a random value with at least ${minimumSecretLength} characters.`,
    );
  }

  return secret;
}

function sign(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function encodeSession(session, secret) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function decodeSession(value, secret, now = Date.now()) {
  const [payload, signature] = String(value ?? "").split(".");
  if (!payload || !signature) return null;

  const received = Buffer.from(signature);
  const expected = Buffer.from(sign(payload, secret));

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (parsed.role !== "super_admin" || typeof parsed.username !== "string" || typeof parsed.expiresAt !== "number") {
      return null;
    }

    if (now > parsed.expiresAt) return null;

    return { role: "super_admin", username: parsed.username, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}
