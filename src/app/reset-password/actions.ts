"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { consumePasswordReset } from "@/lib/auth/account";
import { takeAuthRateLimit } from "@/lib/auth/rate-limit";
import { clientRateLimitKey } from "@/lib/security/client-ip.mjs";

export type ResetPasswordState = { error?: string };

export async function resetPasswordAction(_state: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const requestHeaders = await headers();
  const ip = clientRateLimitKey(requestHeaders);
  if (!(await takeAuthRateLimit(`reset:${ip}`))) return { error: "Too many attempts. Try again in a few minutes." };
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("passwordConfirmation") ?? "")) return { error: "The passwords do not match." };
  try {
    const consumed = await consumePasswordReset(String(formData.get("token") ?? ""), password);
    if (!consumed) return { error: "This reset link is invalid or has expired." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The password could not be updated." };
  }
  redirect("/login?reset=1");
}
