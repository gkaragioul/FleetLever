import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createAccountSession, upsertGoogleAccount } from "@/lib/auth/account";
import { safeRedirectPath } from "@/lib/auth/account-core.mjs";
import { clientIpFromHeaders } from "@/lib/security/client-ip.mjs";

export const dynamic = "force-dynamic";

function appUrl(request: NextRequest) {
  return (process.env.FLEETLEVER_APP_URL ?? request.nextUrl.origin).replace(/\/$/, "");
}

function loginError(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?oauth=${encodeURIComponent(error)}`, request.url));
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = cookieStore.get("fleetlever_google_state")?.value;
  const verifier = cookieStore.get("fleetlever_google_verifier")?.value;
  const next = safeRedirectPath(cookieStore.get("fleetlever_google_next")?.value);
  ["fleetlever_google_state", "fleetlever_google_verifier", "fleetlever_google_next"].forEach((name) => cookieStore.delete(name));
  const code = request.nextUrl.searchParams.get("code");
  if (!state || !expectedState || state !== expectedState || !verifier || !code) return loginError(request, "invalid_state");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${appUrl(request)}/api/auth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return loginError(request, "token_exchange");
    const token = await tokenResponse.json() as { access_token?: string };
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token ?? ""}` },
      cache: "no-store",
    });
    if (!profileResponse.ok) return loginError(request, "profile");
    const profile = await profileResponse.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string };
    if (!profile.sub || !profile.email || profile.email_verified !== true) return loginError(request, "unverified_email");
    const account = await upsertGoogleAccount({ subject: profile.sub, email: profile.email, fullName: profile.name ?? profile.email.split("@")[0] });
    if (!account) return loginError(request, "account");
    const requestHeaders = await headers();
    await createAccountSession(account, {
      ipAddress: clientIpFromHeaders(requestHeaders),
      userAgent: requestHeaders.get("user-agent"),
    });
    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return loginError(request, "unexpected");
  }
}
