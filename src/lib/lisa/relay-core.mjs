import { timingSafeEqual } from "node:crypto";

const allowedEvents = new Set(["status", "message", "error", "done"]);
const terminalEvents = new Set(["error", "done"]);

function secureStringEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function classifyRelayConfig({ enabled, baseUrl, secret }) {
  if (!enabled) return "disabled";
  if (typeof secret !== "string" || secret.length < 32) return "misconfigured";
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:") return "misconfigured";
  } catch {
    return "misconfigured";
  }
  return "connected";
}

export function relayRequestIsAuthorized(authorization, secret) {
  if (!authorization?.startsWith("Bearer ")) return false;
  return secureStringEqual(authorization.slice("Bearer ".length), secret);
}

export function sanitizeRelayEvent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const event = typeof value.event === "string" ? value.event : "";
  if (!allowedEvents.has(event)) return null;
  const rawData = value.data;
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) return null;

  if (event === "message") {
    const text = typeof rawData.text === "string" ? rawData.text.trim() : "";
    if (!text || text.length > 20_000) return null;
    return { event, data: { text }, terminal: false };
  }

  const status = typeof rawData.status === "string" ? rawData.status.slice(0, 80) : "unavailable";
  const detail = typeof rawData.detail === "string" ? rawData.detail.slice(0, 500) : undefined;
  return {
    event,
    data: detail ? { status, detail } : { status },
    terminal: terminalEvents.has(event),
  };
}

export function relayConnectionStatus(lastHeartbeatAt, now = new Date(), maxAgeMs = 45_000) {
  if (!(lastHeartbeatAt instanceof Date) || Number.isNaN(lastHeartbeatAt.getTime())) return "unavailable";
  return now.getTime() - lastHeartbeatAt.getTime() <= maxAgeMs ? "connected" : "unavailable";
}
