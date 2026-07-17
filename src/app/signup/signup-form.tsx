"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { signupAction, type SignupState } from "./actions";

const inputClass = "mt-2 min-h-12 w-full rounded-md border border-[#cdd8d3] bg-white px-4 text-base font-semibold outline-none focus:border-[#007C89] focus:ring-2 focus:ring-[#bdeff3]";

export function SignupForm({ googleConfigured, next }: { googleConfigured: boolean; next: string }) {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signupAction, {});
  return (
    <div className="mt-7">
      <a href={`/api/auth/google/start?next=${encodeURIComponent(next)}`} aria-disabled={!googleConfigured} className={`flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-[#C9D8D3] bg-white px-5 text-sm font-bold text-[#123C38] transition hover:border-[#008C95] hover:bg-[#F4FAF8] ${googleConfigured ? "" : "pointer-events-none opacity-50"}`}>
        <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full border border-[#C9D8D3] text-xs font-black text-[#4285F4]">G</span> Start with Google
      </a>
      <div className="my-5 flex items-center gap-3 text-[10px] font-black uppercase text-[#8A9A96]"><span className="h-px flex-1 bg-[#DDE6E2]" />or use email<span className="h-px flex-1 bg-[#DDE6E2]" /></div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className="block text-xs font-bold uppercase text-[#64746f]">Full name<input className={inputClass} name="fullName" autoComplete="name" required /></label>
        <label className="block text-xs font-bold uppercase text-[#64746f]">Organization<input className={inputClass} name="organizationName" autoComplete="organization" required /></label>
        <label className="block text-xs font-bold uppercase text-[#64746f]">Work email<input className={inputClass} name="email" type="email" autoComplete="email" required placeholder="you@company.com" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-bold uppercase text-[#64746f]">Password<input className={inputClass} name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
          <label className="block text-xs font-bold uppercase text-[#64746f]">Confirm password<input className={inputClass} name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} required /></label>
        </div>
        <p className="text-xs leading-5 text-[#64746F]">Use at least 12 characters. No card is required and the trial cannot be restarted with the same account.</p>
        {state.error ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{state.error}</div> : null}
        <button disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#102b27] px-5 text-sm font-bold text-white transition hover:bg-[#007C89] disabled:opacity-60">{pending ? "Creating workspace..." : "Start 15-day trial"}<ArrowRight className="h-4 w-4" /></button>
      </form>
      <p className="mt-6 text-center text-sm text-[#64746F]">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-black text-[#007C89] hover:underline">Sign in</Link></p>
    </div>
  );
}
