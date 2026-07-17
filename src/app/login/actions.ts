"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateEmailAccount, createAccountSession } from "@/lib/auth/account";
import { safeRedirectPath } from "@/lib/auth/account-core.mjs";
import { takeAuthRateLimit } from "@/lib/auth/rate-limit";

export type LoginState = { error?: string };

async function requestMetadata() {
  const requestHeaders = await headers();
  return {
    ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? requestHeaders.get("x-real-ip"),
    userAgent: requestHeaders.get("user-agent"),
  };
}

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(formData.get("next"));
  const metadata = await requestMetadata();
  if (!takeAuthRateLimit(`login:${metadata.ipAddress ?? "unknown"}`)) return { error: "Too many sign-in attempts. Try again in a few minutes." };
  if (!email.trim() || !password) return { error: "Enter your email and password." };

  const account = await authenticateEmailAccount(email, password).catch(() => null);
  if (!account) return { error: "Those details do not match a FleetLever account." };
  await createAccountSession(account, metadata);
  redirect(next);
}
