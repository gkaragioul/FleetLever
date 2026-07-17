import "server-only";

import { hashOpaqueToken } from "@/lib/auth/account-core.mjs";
import { getDbPool } from "@/lib/db/client";

const localBuckets = new Map<string, { count: number; startedAt: number }>();

function takeLocalRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = localBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= windowMs) {
    localBuckets.set(key, { count: 1, startedAt: now });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export async function takeAuthRateLimit(key: string, limit = 8, windowMs = 15 * 60_000) {
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

export async function takeLisaRateLimit(profileId: string, limit = 12, windowMs = 60_000) {
  return takeAuthRateLimit(`lisa:${profileId}`, limit, windowMs);
}
