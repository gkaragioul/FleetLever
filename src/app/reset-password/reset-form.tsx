"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const inputClass = "mt-2 min-h-12 w-full rounded-md border border-[#cdd8d3] bg-white px-4 text-base font-semibold outline-none focus:border-[#007C89] focus:ring-2 focus:ring-[#bdeff3]";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(resetPasswordAction, {});
  return (
    <form action={formAction} className="mt-7 space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block text-xs font-bold uppercase text-[#64746f]">New password<input name="password" type="password" autoComplete="new-password" minLength={12} required className={inputClass} /></label>
      <label className="block text-xs font-bold uppercase text-[#64746f]">Confirm password<input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} required className={inputClass} /></label>
      <p className="text-xs text-[#64746F]">Use at least 12 characters.</p>
      {state.error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{state.error}</p> : null}
      <button disabled={pending || !token} className="min-h-12 w-full rounded-md bg-[#102b27] px-5 text-sm font-bold text-white hover:bg-[#007C89] disabled:opacity-60">{pending ? "Updating..." : "Update password"}</button>
    </form>
  );
}
