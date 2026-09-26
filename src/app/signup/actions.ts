"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAccountSession, registerEmailAccount } from "@/lib/auth/account";
import { safeRedirectPath } from "@/lib/auth/account-core.mjs";
import { accountActionUrl, sendAccountEmail } from "@/lib/auth/email";
import { takeAuthRateLimit } from "@/lib/auth/rate-limit";
import { clientIpFromHeaders, clientRateLimitKey } from "@/lib/security/client-ip.mjs";

export type SignupState = { error?: string };

export async function signupAction(_state: SignupState, formData: FormData): Promise<SignupState> {
  const requestHeaders = await headers();
  const ipAddress = clientIpFromHeaders(requestHeaders);
  if (!(await takeAuthRateLimit(`signup:${clientRateLimitKey(requestHeaders)}`))) return { error: "Too many attempts. Try again in a few minutes." };
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("passwordConfirmation") ?? "")) return { error: "The passwords do not match." };

  try {
    const email = String(formData.get("email") ?? "");
    const result = await registerEmailAccount({
      email,
      fullName: String(formData.get("fullName") ?? ""),
      organizationName: String(formData.get("organizationName") ?? ""),
      password,
    });
    await createAccountSession(result.account, { ipAddress, userAgent: requestHeaders.get("user-agent") });
    const verificationUrl = accountActionUrl("/verify-email", result.verificationToken);
    await sendAccountEmail({
      email,
      subject: "Verify your FleetLever account",
      html: `<p>Welcome to FleetLever.</p><p><a href="${verificationUrl}">Verify your email address</a> to finish setting up your account.</p><p>Your unrestricted 15-day trial has started.</p>`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The account could not be created.";
    return { error: message.includes("already exists") || message.includes("duplicate") ? "An account already exists for this email. Sign in or reset your password." : message };
  }
  redirect(safeRedirectPath(formData.get("next")));
}
