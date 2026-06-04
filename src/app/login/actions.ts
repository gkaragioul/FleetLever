"use server";

import { redirect } from "next/navigation";
import { createSuperAdminSession, verifySuperAdminCredentials } from "@/lib/auth/super-admin";

export type LoginState = {
  error?: string;
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/console");

  if (!username.trim() || !password) {
    return { error: "Συμπλήρωσε όνομα χρήστη και κωδικό." };
  }

  const isValid = await verifySuperAdminCredentials(username, password).catch(() => false);

  if (!isValid) {
    return { error: "Τα στοιχεία σύνδεσης δεν ταιριάζουν με λογαριασμό FleetLever." };
  }

  await createSuperAdminSession(username.trim());
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/console");
}
