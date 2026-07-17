export type RelayStatus = "connected" | "unavailable";
export type RelayPublicEvent = {
  event: "status" | "message" | "error" | "done";
  data: { status?: string; detail?: string; text?: string };
  terminal: boolean;
};

export function classifyRelayConfig(options: { enabled: boolean; baseUrl: string; secret: string }): "disabled" | "misconfigured" | "connected";
export function relayRequestIsAuthorized(authorization: string | null | undefined, secret: string): boolean;
export function sanitizeRelayEvent(value: unknown): RelayPublicEvent | null;
export function relayConnectionStatus(lastHeartbeatAt: Date | null, now?: Date, maxAgeMs?: number): RelayStatus;
