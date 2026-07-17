"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(forgotPasswordAction, {});
  return (
    <div className="mt-7">
      {state.sent ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
          <strong>Check your inbox.</strong><br />If an account exists for that address, a one-time reset link has been sent.
          {state.previewUrl ? <><br /><a className="font-bold underline" href={state.previewUrl}>Open local development reset link</a></> : null}
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <label className="block text-xs font-bold uppercase text-[#64746f]">Account email<input name="email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full rounded-md border border-[#cdd8d3] bg-white px-4 text-base font-semibold outline-none focus:border-[#007C89] focus:ring-2 focus:ring-[#bdeff3]" placeholder="you@company.com" /></label>
          {state.error ? <p role="alert" className="text-sm font-bold text-red-700">{state.error}</p> : null}
          <button disabled={pending} className="min-h-12 w-full rounded-md bg-[#102b27] px-5 text-sm font-bold text-white hover:bg-[#007C89] disabled:opacity-60">{pending ? "Sending..." : "Send reset link"}</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-bold text-[#007C89] hover:underline">Back to sign in</Link></p>
    </div>
  );
}
