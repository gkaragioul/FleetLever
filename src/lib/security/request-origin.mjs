function configuredTrustedOrigins() {
  return (process.env.FLEETLEVER_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizedOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function originMatches(request, trustedOrigins = configuredTrustedOrigins()) {
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
    const receivedOrigin = new URL(origin).origin;

    return receivedOrigin === expectedOrigin
      || trustedOrigins.some((trustedOrigin) => normalizedOrigin(trustedOrigin) === receivedOrigin);
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
