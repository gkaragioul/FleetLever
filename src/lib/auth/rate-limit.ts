const buckets = new Map<string, { count: number; startedAt: number }>();

export function takeAuthRateLimit(key: string, limit = 8, windowMs = 15 * 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= windowMs) {
    buckets.set(key, { count: 1, startedAt: now });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
