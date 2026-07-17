export function originMatches(request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!origin) return fetchSite !== "cross-site";

  try {
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const expectedHost = forwardedHost || request.headers.get("host") || requestUrl.host;
    const expectedProtocol = forwardedProtocol || requestUrl.protocol.replace(":", "");
    const expectedOrigin = new URL(`${expectedProtocol}://${expectedHost}`).origin;

    return new URL(origin).origin === expectedOrigin;
  } catch {
    return false;
  }
}

export function originErrorResponse() {
  return Response.json(
    { ok: false, error: "Origin does not match." },
    {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
