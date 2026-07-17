import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/auth/account-core.mjs";

export const dynamic = "force-dynamic";

const maxAge = 10 * 60;

function secure() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL);
}

function appUrl(request: NextRequest) {
  return (process.env.FLEETLEVER_APP_URL ?? request.nextUrl.origin).replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) return NextResponse.redirect(new URL("/login?oauth=unavailable", request.url));

  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const cookieStore = await cookies();
  const options = { httpOnly: true, secure: secure(), sameSite: "lax" as const, path: "/", maxAge };
  cookieStore.set("fleetlever_google_state", state, options);
  cookieStore.set("fleetlever_google_verifier", verifier, options);
  cookieStore.set("fleetlever_google_next", safeRedirectPath(request.nextUrl.searchParams.get("next")), options);

  const redirectUri = `${appUrl(request)}/api/auth/google/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return NextResponse.redirect(url);
}
