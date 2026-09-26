export class BodyTooLargeError extends Error {
  constructor(maxBytes: number);
}

export function readBodyText(request: Request, maxBytes: number): Promise<string>;
export function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<{ status: "ok"; value: unknown } | { status: "too_large" } | { status: "invalid" }>;
