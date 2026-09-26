import "server-only";

import { hashOpaqueToken } from "@/lib/auth/account-core.mjs";
import { getDbPool } from "@/lib/db/client";

// Fallback buckets for processes without a database (local development and the stateless
// marketing site). They are pruned so a stream of distinct keys cannot grow memory without bound.
const localBuckets = new Map<string, { count: number; startedAt: number; windowMs: number }>();
const maximumLocalBuckets = 10_000;

function pruneLocalBuckets(now: number) {
  for (const [key, bucket] of localBuckets) {
    if (now - bucket.startedAt >= bucket.windowMs) localBuckets.delete(key);
  }
  // Still full of live buckets: drop the oldest (Map order is insertion order).
  while (localBuckets.size >= maximumLocalBuckets) {
    const [oldest] = localBuckets.keys();
    localBuckets.delete(oldest);
  }
}

function takeLocalRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = localBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= windowMs) {
    if (!bucket && localBuckets.size >= maximumLocalBuckets) pruneLocalBuckets(now);
    localBuckets.set(key, { count: 1, startedAt: now, windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Fixed-window rate limit shared across app instances through Postgres when one is configured. */
export async function takeRateLimit(key: string, limit: number, windowMs: number) {
  if (!process.env.DATABASE_URL) return takeLocalRateLimit(key, limit, windowMs);

  try {
    const result = await getDbPool().query<{ allowed: boolean }>(
      "select app_private.consume_rate_limit($1::char(64), $2::integer, $3::integer) as allowed",
      [hashOpaqueToken(key), limit, Math.max(1, Math.ceil(windowMs / 1000))],
    );
    return Boolean(result.rows[0]?.allowed);
  } catch {
    const hosted = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL);
    return hosted ? false : takeLocalRateLimit(key, limit, windowMs);
  }
}

export async function takeAuthRateLimit(key: string, limit = 8, windowMs = 15 * 60_000) {
  return takeRateLimit(key, limit, windowMs);
}

export async function takeLisaRateLimit(profileId: string, limit = 12, windowMs = 60_000) {
  return takeRateLimit(`lisa:${profileId}`, limit, windowMs);
}

export function rateLimitedResponse(retryAfterSeconds: number) {
  return Response.json(
    { ok: false, error: "Too many requests. Try again later." },
    {
      status: 429,
      headers: { "Cache-Control": "no-store", "Retry-After": String(retryAfterSeconds) },
    },
  );
}
