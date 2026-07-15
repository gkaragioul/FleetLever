export const PUBLIC_DEMO_ROUTE_PREFIX = "/try/";

const demoSessionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPublicDemoSessionId(value: string) {
  return demoSessionPattern.test(value);
}

export function publicDemoSessionIdFromLocation() {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/^\/try\/([^/]+)\/?$/);
  const sessionId = match?.[1] ?? "";
  return isPublicDemoSessionId(sessionId) ? sessionId : null;
}

export function demoSessionStorageKey(sessionId: string) {
  return `fleetlever-public-demo-${sessionId}-state-v1`;
}

export function currentDemoSessionStorageKey() {
  const sessionId = publicDemoSessionIdFromLocation();
  return sessionId ? demoSessionStorageKey(sessionId) : null;
}

export function demoSessionStateEndpoint(sessionId: string) {
  return `/api/commercial/demo-sessions/${sessionId}/state`;
}

export function formatDemoTimeRemaining(expiresAt: string, now = Date.now()) {
  const remaining = Math.max(0, Date.parse(expiresAt) - now);
  if (remaining === 0) return "Expired";

  const totalMinutes = Math.ceil(remaining / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}
