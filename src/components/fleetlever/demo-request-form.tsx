"use client";

import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { validateDemoRequest } from "@/lib/commercial/demo-request-validation";

type FieldErrors = Record<string, string>;

const inputClass =
  "mt-2 min-h-12 w-full rounded-md border border-[#bfcfc8] bg-white px-3.5 text-base text-[#13211f] outline-none transition placeholder:text-[#778984] focus:border-[#006c74] focus:ring-2 focus:ring-[#9ce7ea]";

export function DemoRequestForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrors({});

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.source = window.location.href;
    const clientValidation = validateDemoRequest(payload);

    if (!clientValidation.valid) {
      setErrors(clientValidation.errors);
      setStatus("idle");
      return;
    }

    const response = await fetch("/api/commercial/demo-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response) {
      setStatus("error");
      return;
    }

    const body = (await response.json().catch(() => ({}))) as { errors?: FieldErrors };
    if (!response.ok) {
      setErrors(body.errors ?? {});
      setStatus(response.status === 400 ? "idle" : "error");
      return;
    }

    setSubmittedEmail(String(payload.email ?? ""));
    setStatus("success");
    window.dispatchEvent(
      new CustomEvent("fleetlever:track", {
        detail: { event: "form_submit", label: "demo_request" },
      }),
    );
  }

  if (status === "success") {
    return (
      <div className="border-t-4 border-[#16834b] bg-[#eef8f2] px-6 py-8 sm:px-8" role="status">
        <CheckCircle2 className="h-8 w-8 text-[#16834b]" aria-hidden="true" />
        <h2 className="mt-5 text-3xl font-semibold text-[#103d37]">Your request is in.</h2>
        <p className="mt-3 max-w-xl text-base font-medium leading-7 text-[#485d57]">
          We will reply to <strong>{submittedEmail}</strong> within one business day to confirm the fleet, workflow and people to include.
        </p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#006c74] hover:text-[#103d37]">
          Back to FleetLever
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5" aria-label="Request a FleetLever demo">
      {status === "error" && (
        <div className="border-l-4 border-[#bd2e2a] bg-[#fff1f0] px-4 py-3 text-sm font-semibold text-[#91231f]" role="alert">
          We could not send the request. Try again or email hello@fleetlever.com.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold text-[#29443e]">
          Name
          <input name="name" autoComplete="name" className={inputClass} aria-invalid={Boolean(errors.name)} />
          {errors.name && <span className="mt-1 block text-xs text-[#a92320]">{errors.name}</span>}
        </label>
        <label className="text-sm font-bold text-[#29443e]">
          Company
          <input name="company" autoComplete="organization" className={inputClass} aria-invalid={Boolean(errors.company)} />
          {errors.company && <span className="mt-1 block text-xs text-[#a92320]">{errors.company}</span>}
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold text-[#29443e]">
          Work email
          <input name="email" type="email" autoComplete="email" className={inputClass} aria-invalid={Boolean(errors.email)} />
          {errors.email && <span className="mt-1 block text-xs text-[#a92320]">{errors.email}</span>}
        </label>
        <label className="text-sm font-bold text-[#29443e]">
          Phone <span className="font-medium text-[#4d5f59]">(optional)</span>
          <input name="phone" type="tel" autoComplete="tel" className={inputClass} />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold text-[#29443e]">
          Your role
          <select name="role" defaultValue="" className={inputClass} aria-invalid={Boolean(errors.role)}>
            <option value="" disabled>Select one</option>
            <option>Operations or fleet</option>
            <option>Workshop or maintenance</option>
            <option>HSE or compliance</option>
            <option>Project leadership</option>
            <option>Other</option>
          </select>
          {errors.role && <span className="mt-1 block text-xs text-[#a92320]">{errors.role}</span>}
        </label>
        <label className="text-sm font-bold text-[#29443e]">
          Fleet or equipment size
          <select name="fleetSize" defaultValue="" className={inputClass} aria-invalid={Boolean(errors.fleetSize)}>
            <option value="" disabled>Select one</option>
            <option>Up to 30 assets</option>
            <option>31–100 assets</option>
            <option>101–300 assets</option>
            <option>More than 300 assets</option>
          </select>
          {errors.fleetSize && <span className="mt-1 block text-xs text-[#a92320]">{errors.fleetSize}</span>}
        </label>
      </div>

      <label className="text-sm font-bold text-[#29443e]">
        What should FleetLever help you prevent?
        <textarea
          name="challenge"
          rows={4}
          className={`${inputClass} resize-y py-3`}
          placeholder="For example: assets reaching dispatch without documents, an assigned person or completed maintenance."
          aria-invalid={Boolean(errors.challenge)}
        />
        {errors.challenge && <span className="mt-1 block text-xs text-[#a92320]">{errors.challenge}</span>}
      </label>

      <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        Website
        <input name="honeypot" tabIndex={-1} autoComplete="off" />
      </label>

      <button
        type="submit"
        disabled={status === "submitting"}
        data-analytics="demo_form_submit"
        className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-md bg-[#103d37] px-5 text-sm font-bold text-white transition hover:bg-[#006c74] disabled:cursor-wait disabled:opacity-70"
      >
        {status === "submitting" ? (
          <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending request</>
        ) : (
          <>Request demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
        )}
      </button>
      <p className="text-xs font-medium leading-5 text-[#4d5f59]">
        By submitting, you agree that FleetLever may contact you about this request. See our <Link href="/privacy" className="font-bold underline underline-offset-2">Privacy notice</Link>.
      </p>
    </form>
  );
}
