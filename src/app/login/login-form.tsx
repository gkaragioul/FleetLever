"use client";

import { useActionState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="username" className="text-xs font-bold uppercase text-[#64746f]">
          Χρήστης
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          className="mt-2 min-h-12 w-full rounded-lg border border-[#cdd8d3] bg-white px-4 text-base font-semibold text-[#13211f] outline-none transition placeholder:text-[#9aa7a2] focus:border-[#007C89] focus:ring-2 focus:ring-[#bdeff3]"
          placeholder="Πληκτρολογήστε χρήστη"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-xs font-bold uppercase text-[#64746f]">
          Κωδικός πρόσβασης
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-2 min-h-12 w-full rounded-lg border border-[#cdd8d3] bg-white px-4 text-base font-semibold text-[#13211f] outline-none transition placeholder:text-[#9aa7a2] focus:border-[#007C89] focus:ring-2 focus:ring-[#bdeff3]"
          placeholder="Πληκτρολογήστε κωδικό"
        />
      </div>
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {state.error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#102b27] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        {pending ? "Γίνεται σύνδεση..." : "Σύνδεση"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
