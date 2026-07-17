import type { Metadata } from "next";
import { AccountAuthShell } from "@/components/auth/account-auth-shell";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return <AccountAuthShell eyebrow="Account recovery" title="Choose a new password" description="This one-time link expires 60 minutes after it was requested."><ResetPasswordForm token={token} /></AccountAuthShell>;
}
