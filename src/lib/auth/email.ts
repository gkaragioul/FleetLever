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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.email], subject: input.subject, html: input.html }),
  });
  if (!response.ok) return { delivered: false as const, reason: "provider_error" as const };
  return { delivered: true as const };
}
