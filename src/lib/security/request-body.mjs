// Read a request body without ever holding more than a fixed number of bytes. A Content-Length
// header is only a claim, so the stream itself is counted and abandoned once it goes over.

export class BodyTooLargeError extends Error {
  constructor(maxBytes) {
    super(`Request body exceeds ${maxBytes} bytes.`);
    this.name = "BodyTooLargeError";
  }
}

export async function readBodyText(request, maxBytes) {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) throw new BodyTooLargeError(maxBytes);
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new BodyTooLargeError(maxBytes);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** @returns {Promise<{ status: "ok", value: unknown } | { status: "too_large" } | { status: "invalid" }>} */
export async function readJsonBody(request, maxBytes) {
  let text;
  try {
    text = await readBodyText(request, maxBytes);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return { status: "too_large" };
    return { status: "invalid" };
  }
  try {
    return { status: "ok", value: JSON.parse(text) };
  } catch {
    return { status: "invalid" };
  }
}
