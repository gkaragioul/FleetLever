"use client";

import { ArrowRight, Send, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type MunicipalLisaMessage = {
  id: string;
  role: "lisa" | "user";
  text: string;
  bullets?: string[];
  action?: {
    id: string;
    label: string;
    tone?: "neutral" | "attention";
  };
};

export type MunicipalLisaPrompt = {
  id: string;
  label: string;
};

type MunicipalLisaAssistantProps = {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
  contextKey: string;
  appLabel: string;
  description: string;
  openingMessage: MunicipalLisaMessage;
  quickPrompts: MunicipalLisaPrompt[];
  resolvePrompt: (id: string, label: string) => MunicipalLisaMessage;
  resolveFreeText: (value: string) => MunicipalLisaMessage;
  onNavigate: (actionId: string) => void;
};

export function MunicipalLisaAssistant({
  open,
  onClose,
  onToggle,
  contextKey,
  appLabel,
  description,
  openingMessage,
  quickPrompts,
  resolvePrompt,
  resolveFreeText,
  onNavigate,
}: MunicipalLisaAssistantProps) {
  const [messages, setMessages] = useState<MunicipalLisaMessage[]>([openingMessage]);
  const [draft, setDraft] = useState("");
  const [renderPanel, setRenderPanel] = useState(open);
  const [panelVisible, setPanelVisible] = useState(open);
  const messageIdRef = useRef(1);
  const panelRef = useRef<HTMLElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setMessages([openingMessage]);
      messageIdRef.current = 1;
    });
  }, [contextKey, openingMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    let frame = 0;
    let timeout = 0;

    if (open) {
      queueMicrotask(() => {
        setRenderPanel(true);
        frame = window.requestAnimationFrame(() => setPanelVisible(true));
      });
    } else {
      queueMicrotask(() => {
        setPanelVisible(false);
        timeout = window.setTimeout(() => setRenderPanel(false), 190);
      });
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  function appendExchange(label: string, answer: MunicipalLisaMessage) {
    messageIdRef.current += 1;
    const userMessage: MunicipalLisaMessage = {
      id: `user-${messageIdRef.current}`,
      role: "user",
      text: label,
    };
    messageIdRef.current += 1;
    const lisaMessage = { ...answer, id: `lisa-${messageIdRef.current}` };

    setMessages((current) => [
      ...current.slice(-3).map((message) => ({ ...message, action: undefined })),
      userMessage,
      lisaMessage,
    ]);
  }

  function submitDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    appendExchange(value, resolveFreeText(value));
    setDraft("");
  }

  if (!open && !renderPanel) {
    return (
      <div className="fixed bottom-4 left-4 z-[70] sm:bottom-5 sm:left-5">
        <button
          type="button"
          onClick={onToggle}
          className="group relative inline-flex size-14 items-center justify-center overflow-hidden rounded-full bg-[#20b7c9] shadow-[0_16px_38px_rgba(8,47,73,0.28)] ring-[3px] ring-[#123c36] transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-[#8be4df] sm:size-16"
          aria-label="Άνοιγμα βοηθού Lisa"
        >
          <Image
            src="/fleetlever/assistant/lisa-avatar-clean.png"
            alt=""
            fill
            sizes="64px"
            className="object-cover object-center"
            unoptimized
          />
          <span className="pointer-events-none absolute left-[calc(100%+0.65rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-sm bg-[#123c36] px-3 py-2 text-xs font-black text-white shadow-lg group-hover:sm:block">
            Ρώτα τη Lisa
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 left-3 z-[70] sm:bottom-4 sm:left-4">
      <section
        ref={panelRef}
        data-lisa-panel
        role="dialog"
        aria-modal="true"
        aria-label="Βοηθός Lisa"
        className={`flex max-h-[calc(100dvh-1.5rem)] min-h-[min(34rem,calc(100dvh-1.5rem))] w-[calc(100vw-1.5rem)] max-w-[31rem] origin-bottom-left flex-col overflow-hidden rounded-lg border border-[#cad9cf] bg-[#f8faf8] text-[#163a35] shadow-[0_24px_72px_rgba(15,42,39,0.28)] transition duration-200 ease-out sm:max-h-[min(44rem,calc(100dvh-2rem))] sm:min-h-[35rem] sm:w-[min(31rem,calc(100vw-2rem))] ${
          panelVisible && open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        <header className="flex items-start justify-between gap-4 bg-[#123c36] px-4 py-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative inline-flex size-14 shrink-0 overflow-hidden rounded-full bg-[#20b7c9] ring-2 ring-white/25">
              <Image
                src="/fleetlever/assistant/lisa-avatar-clean.png"
                alt="Lisa"
                fill
                sizes="56px"
                className="object-cover object-center"
                unoptimized
              />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8be4df]">{appLabel}</p>
              <h2 className="mt-0.5 text-xl font-black text-white">Lisa</h2>
              <p className="mt-1 text-sm font-semibold leading-5 text-white/75">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:bg-white/10 hover:text-white"
            aria-label="Κλείσιμο βοηθού Lisa"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[90%] rounded-lg px-4 py-3 text-sm ${
                  message.role === "user"
                    ? "bg-[#20b7c9] font-bold text-[#062321]"
                    : "border border-[#d8e1da] bg-white text-[#273b35]"
                }`}
              >
                <p className="font-semibold leading-6">{message.text}</p>
                {message.bullets?.length ? (
                  <ul className="mt-3 space-y-1.5 text-xs font-semibold leading-5 text-[#5f7069]">
                    {message.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="text-[#008f9a]" aria-hidden="true">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {message.action ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(message.action!.id)}
                    className={`mt-3 flex min-h-10 w-full items-center justify-between gap-3 rounded-sm px-3 text-left text-xs font-black transition ${
                      message.action.tone === "attention"
                        ? "bg-[#fde7e7] text-[#991b1b] hover:bg-[#fbd1d1]"
                        : "bg-[#e6f4f3] text-[#075e67] hover:bg-[#d4eeec]"
                    }`}
                  >
                    <span>{message.action.label}</span>
                    <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        <footer className="space-y-3 border-t border-[#d8e1da] bg-white p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => appendExchange(prompt.label, resolvePrompt(prompt.id, prompt.label))}
                className="min-h-10 rounded-sm border border-[#d8e1da] bg-[#fbfcf9] px-3 text-left text-xs font-black leading-4 text-[#273b35] transition hover:border-[#20b7c9] hover:bg-[#ecfeff]"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          <form onSubmit={submitDraft} className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ρώτα τη Lisa..."
              className="h-11 min-w-0 flex-1 rounded-sm border border-[#cad9cf] bg-white px-3 text-sm font-semibold text-[#163a35] outline-none placeholder:text-[#93a19b] focus:border-[#20b7c9]"
            />
            <button
              type="submit"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm bg-[#123c36] text-white transition hover:bg-[#174a42]"
              aria-label="Αποστολή μηνύματος στη Lisa"
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          </form>
          <p className="text-[10px] font-semibold leading-4 text-[#7b8983]">Η Lisa προτείνει και σας οδηγεί. Οι αλλαγές γίνονται μόνο από εσάς.</p>
        </footer>
      </section>
    </div>
  );
}
