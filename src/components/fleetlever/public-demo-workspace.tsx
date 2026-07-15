"use client";

import { ArrowLeft, Check, Clock3, Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConstructionPrototype } from "@/components/fleetlever/construction-prototype";
import {
  demoSessionStorageKey,
  formatDemoTimeRemaining,
} from "@/lib/commercial/demo-session-client";

type PublicDemoWorkspaceProps = {
  sessionId: string;
  expiresAt: string;
  embedded: boolean;
};

async function copyShareLink(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function PublicDemoWorkspace({ sessionId, expiresAt, embedded }: PublicDemoWorkspaceProps) {
  const [now, setNow] = useState(() => Date.parse(expiresAt) - 36_000_000);
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(
    () => (typeof window === "undefined" ? "/try/" + sessionId : window.location.origin + "/try/" + sessionId),
    [sessionId],
  );
  const expired = Date.parse(expiresAt) <= now;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!expired) return;
    window.localStorage.removeItem(demoSessionStorageKey(sessionId));
  }, [expired, sessionId]);

  if (expired) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#eef3e9] p-6 text-center">
        <div className="max-w-lg">
          <p className="text-xs font-bold uppercase text-[#007c89]">Demo workspace</p>
          <h1 className="mt-3 text-4xl font-bold text-[#103d37]">This workspace has expired.</h1>
          <p className="mt-4 leading-7 text-[#60736d]">
            The temporary data has been removed after 10 hours. Return to FleetLever to start a new demo.
          </p>
          <Link href="/" className="mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-[#103d37] px-5 text-sm font-bold text-white hover:bg-[#007c89]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to FleetLever
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-[#eef3e9]">
      {!embedded ? (
        <header className="sticky top-0 z-[80] flex min-h-16 items-center gap-3 border-b border-[#cad7d1] bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm font-bold text-[#103d37] hover:bg-[#eef4f1]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">FleetLever</span>
          </Link>
          <div className="h-6 w-px bg-[#d6dfdb]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#103d37]">Demo workspace</p>
            <p className="hidden text-xs font-medium text-[#6a7c76] sm:block">Changes are shared and automatically removed after 10 hours.</p>
          </div>
          <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#cfdbd6] bg-[#f7faf8] px-2.5 text-xs font-bold text-[#38534d] sm:px-3">
            <Clock3 className="h-3.5 w-3.5 text-[#007c89]" aria-hidden="true" />
            <span className="hidden md:inline">This workspace expires in</span>
            {formatDemoTimeRemaining(expiresAt, now)}
          </span>
          <button
            type="button"
            onClick={async () => {
              await copyShareLink(shareUrl);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2_000);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#bfcfc8] bg-white px-3 text-xs font-bold text-[#103d37] hover:border-[#007c89] hover:text-[#007c89]"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy share link"}</span>
          </button>
        </header>
      ) : null}
      <ConstructionPrototype />
    </div>
  );
}
