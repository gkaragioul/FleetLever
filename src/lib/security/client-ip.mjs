// The one place FleetLever decides which client address a request came from. Rate limits and
// session records use it, so it must never trust a value the client can choose.
//
// Every proxy appends the address it received the request from to X-Forwarded-For, but the
// client can send any X-Forwarded-For it likes and proxies keep that part. Only the entries added
// by proxies we operate can be trusted, and those are the right-most ones. With
// FLEETLEVER_TRUSTED_PROXY_HOPS = n (default 1: one platform proxy in front of the app, e.g. the
// Railway or Vercel edge), the client address is the n-th entry from the right.
//
// A platform that sets a dedicated header it overwrites on every request (for example
// x-vercel-forwarded-for or x-real-ip at a trusted edge) can be named in
// FLEETLEVER_CLIENT_IP_HEADER instead; its first value is then used as is.

const defaultTrustedProxyHops = 1;
const maximumTrustedProxyHops = 10;
const addressPattern = /^[0-9a-f.:]{2,45}$/i;

export function trustedProxyHops(env = process.env) {
  const raw = String(env.FLEETLEVER_TRUSTED_PROXY_HOPS ?? "").trim();
  if (!raw) return defaultTrustedProxyHops;
  const hops = Number(raw);
  return Number.isInteger(hops) && hops >= 0 && hops <= maximumTrustedProxyHops ? hops : defaultTrustedProxyHops;
}

function normalizeAddress(value) {
  const candidate = String(value ?? "").trim().toLowerCase();
  return addressPattern.test(candidate) ? candidate : null;
}

/**
 * @param {{ get(name: string): string | null }} headers request headers
 * @returns {string | null} the client address, or null when it cannot be determined safely
 */
export function clientIpFromHeaders(headers, env = process.env) {
  const trustedHeader = String(env.FLEETLEVER_CLIENT_IP_HEADER ?? "").trim().toLowerCase();
  if (trustedHeader) {
    return normalizeAddress(headers.get(trustedHeader)?.split(",")[0]);
  }

  const hops = trustedProxyHops(env);
  if (hops === 0) return null;

  const entries = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  // Fewer entries than trusted proxies means the chain is not the one we expect; guessing would
  // let the client pick its own bucket.
  if (entries.length < hops) return null;
  return normalizeAddress(entries[entries.length - hops]);
}

/** A rate-limit key for the client; requests whose address is unknown share one bucket. */
export function clientRateLimitKey(headers, env = process.env) {
  return clientIpFromHeaders(headers, env) ?? "unknown";
}
