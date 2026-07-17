import type { Metadata } from "next";
import { AccountAuthShell } from "@/components/auth/account-auth-shell";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset password" };
export default function ForgotPasswordPage() {
  return <AccountAuthShell eyebrow="Account recovery" title="Reset your password" description="We will send a one-time link to the email on your account."><ForgotPasswordForm /></AccountAuthShell>;
}
