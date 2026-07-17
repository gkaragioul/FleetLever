"use server";

import { headers } from "next/headers";
import { requestPasswordReset } from "@/lib/auth/account";
import { accountActionUrl, sendAccountEmail } from "@/lib/auth/email";
import { takeAuthRateLimit } from "@/lib/auth/rate-limit";

export type ForgotPasswordState = { sent?: boolean; previewUrl?: string; error?: string };

export async function forgotPasswordAction(_state: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? requestHeaders.get("x-real-ip") ?? "unknown";
  if (!(await takeAuthRateLimit(`forgot:${ip}`))) return { error: "Too many attempts. Try again in a few minutes." };
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your account email." };
  const token = await requestPasswordReset(email).catch(() => null);
  if (!token) return { sent: true };
  const resetUrl = accountActionUrl("/reset-password", token);
  const delivery = await sendAccountEmail({
    email,
    subject: "Reset your FleetLever password",
    html: `<p>A password reset was requested for your FleetLever account.</p><p><a href="${resetUrl}">Choose a new password</a>. This link expires in 60 minutes.</p><p>If you did not request this, you can ignore this email.</p>`,
  });
  return { sent: true, previewUrl: process.env.NODE_ENV !== "production" && !delivery.delivered ? resetUrl : undefined };
}
