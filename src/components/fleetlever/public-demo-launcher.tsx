"use client";

import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  LoaderCircle,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatDemoTimeRemaining } from "@/lib/commercial/demo-session-client";

type DemoSessionPayload = {
  id: string;
  createdAt: string;
  expiresAt: string;
  shareUrl: string;
};

type PublicDemoLauncherProps = {
  triggerClassName?: string;
  analytics?: string;
  onBeforeOpen?: () => void;
  label?: string;
};

async function copyText(value: string) {
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

export function PublicDemoLauncher({
  triggerClassName,
  analytics,
  onBeforeOpen,
  label = "Try the app",
}: PublicDemoLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [session, setSession] = useState<DemoSessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);


  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !session) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [isOpen, session]);

  async function createWorkspace() {
    onBeforeOpen?.();
    setError(null);
    setCopied(false);
    setNow(Date.now());

    if (session && Date.parse(session.expiresAt) > Date.now()) {
      setIsOpen(true);
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/commercial/demo-sessions", {
        method: "POST",
      });
      if (!response.ok) throw new Error("The demo could not be started.");
      const nextSession = (await response.json()) as DemoSessionPayload;
      setSession(nextSession);
      setIsOpen(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The demo could not be started.");
    } finally {
      setIsCreating(false);
    }
  }

  const expired = session ? Date.parse(session.expiresAt) <= now : false;

  const dialog = isOpen && session ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071d1a]/60 p-2 backdrop-blur-md sm:p-4 lg:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Your 10-hour FleetLever workspace"
        className="flex h-[min(94dvh,1040px)] w-[min(97vw,1680px)] flex-col overflow-hidden rounded-lg border border-white/20 bg-[#f5f8f3] shadow-[0_32px_100px_rgba(0,0,0,0.38)]"
      >
        <div className="flex min-h-[4.75rem] flex-none items-center gap-3 border-b border-[#cedad5] bg-white px-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="hidden h-2 w-2 rounded-full bg-[#18a65b] sm:block" aria-hidden="true" />
              <h2 className="truncate text-base font-bold text-[#103d37] sm:text-lg">
                <span className="sm:hidden">Demo workspace</span>
                <span className="hidden sm:inline">Your 10-hour FleetLever workspace</span>
              </h2>
            </div>
            <p className="mt-0.5 hidden text-xs font-medium text-[#687b75] md:block">
              Changes sync to this share link and disappear after 10 hours.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#cfdbd6] bg-[#f7faf8] px-2.5 text-xs font-bold text-[#38534d] sm:px-3">
              <Clock3 className="h-3.5 w-3.5 text-[#007c89]" aria-hidden="true" />
              {formatDemoTimeRemaining(session.expiresAt, now)}
            </span>
            <button
              type="button"
              onClick={async () => {
                await copyText(session.shareUrl);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2_000);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#bfcfc8] bg-white px-3 text-xs font-bold text-[#103d37] transition hover:border-[#007c89] hover:text-[#007c89]"
              title="Copy share link"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy share link"}</span>
            </button>
            <a
              href={session.shareUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden h-10 items-center justify-center gap-2 rounded-md border border-[#bfcfc8] bg-white px-3 text-xs font-bold text-[#103d37] transition hover:border-[#007c89] hover:text-[#007c89] md:inline-flex"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open full screen
            </a>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close interactive demo"
              title="Close demo"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#bfcfc8] bg-white text-[#103d37] transition hover:border-[#007c89] hover:text-[#007c89]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-[#eaf0e7]">
          {expired ? (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div className="max-w-md">
                <p className="text-xs font-bold uppercase text-[#007c89]">Temporary workspace</p>
                <h3 className="mt-2 text-3xl font-bold text-[#103d37]">This demo has expired.</h3>
                <p className="mt-3 text-sm leading-6 text-[#5d706a]">
                  Its shared data has been removed. Start a fresh workspace to keep exploring.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSession(null);
                    setIsOpen(false);
                    window.setTimeout(() => void createWorkspace(), 0);
                  }}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#103d37] px-5 text-sm font-bold text-white transition hover:bg-[#007c89]"
                >
                  Create demo workspace
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <iframe
              title="FleetLever interactive demo"
              src={"/try/" + session.id + "?embed=1"}
              className="h-full w-full border-0 bg-[#eef3e9]"
              allow="clipboard-write"
            />
          )}
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        data-analytics={analytics}
        onClick={() => void createWorkspace()}
        disabled={isCreating}
        className={triggerClassName}
      >
        {isCreating ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : null}
        <span>{isCreating ? "Starting..." : label}</span>
        {!isCreating ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
      </button>
      {error ? <span className="sr-only" role="alert">{error}</span> : null}
      {dialog ? createPortal(dialog, document.body) : null}
    </>
  );
}
