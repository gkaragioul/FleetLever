type HeaderSource = { get(name: string): string | null };
type Environment = Record<string, string | undefined>;

export function trustedProxyHops(env?: Environment): number;
export function clientIpFromHeaders(headers: HeaderSource, env?: Environment): string | null;
export function clientRateLimitKey(headers: HeaderSource, env?: Environment): string;
