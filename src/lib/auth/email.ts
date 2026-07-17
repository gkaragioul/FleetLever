import "server-only";

function applicationUrl() {
  return (process.env.FLEETLEVER_APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
}

export function accountActionUrl(path: string, token: string) {
  return `${applicationUrl()}${path}?token=${encodeURIComponent(token)}`;
}

export async function sendAccountEmail(input: { email: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FLEETLEVER_EMAIL_FROM;
  if (!apiKey || !from) return { delivered: false as const, reason: "not_configured" as const };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [input.email], subject: input.subject, html: input.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { delivered: false as const, reason: "provider_error" as const };
    return { delivered: true as const };
  } catch (error) {
    console.error("FleetLever account email delivery failed", error instanceof Error ? error.message : error);
    return { delivered: false as const, reason: "provider_unavailable" as const };
  }
}
