import "server-only";
export { originMatches } from "@/lib/security/request-origin.mjs";

export const lisaRequestLimitBytes = 16 * 1024;

export type LisaBridgeStatus = "connected" | "unavailable" | "busy" | "misconfigured" | "disabled";

export function lisaBridgeUrl(pathname: string) {
  const base = process.env.FLEETLEVER_LISA_BRIDGE_URL ?? "http://127.0.0.1:3210";
  return new URL(pathname, base.endsWith("/") ? base : `${base}/`);
}

export function lisaBridgeHeaders() {
  const secret = process.env.FLEETLEVER_LISA_BRIDGE_SECRET;
  if (!secret || secret.length < 32) return null;
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

export function lisaEnabled() {
  return process.env.FLEETLEVER_LISA_ENABLED === "true";
}

export function noStoreJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
