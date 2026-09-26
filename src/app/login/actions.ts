"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateAccount, createAccountSession } from "@/lib/auth/account";
import { normalizeAccountIdentifier, safeRedirectPath } from "@/lib/auth/account-core.mjs";
import { takeAuthRateLimit } from "@/lib/auth/rate-limit";
import { clientIpFromHeaders } from "@/lib/security/client-ip.mjs";

export type LoginState = { error?: string };

async function requestMetadata() {
  const requestHeaders = await headers();
  return {
    ipAddress: clientIpFromHeaders(requestHeaders),
    userAgent: requestHeaders.get("user-agent"),
  };
}

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(formData.get("next"));
  const metadata = await requestMetadata();
  const normalizedIdentifier = normalizeAccountIdentifier(identifier);
  const allowedByIp = await takeAuthRateLimit(`login:ip:${metadata.ipAddress ?? "unknown"}`);
  const allowedByAccount = await takeAuthRateLimit(`login:account:${normalizedIdentifier || "empty"}`);
  if (!allowedByIp || !allowedByAccount) return { error: "Too many sign-in attempts. Try again in a few minutes." };
  if (!normalizedIdentifier || !password) return { error: "Enter your email or username and password." };

  const account = await authenticateAccount(normalizedIdentifier, password).catch(() => null);
  if (!account) return { error: "Those details do not match a FleetLever account." };
  await createAccountSession(account, metadata);
  redirect(next);
}
