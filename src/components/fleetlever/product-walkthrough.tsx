"use client";

import { ClipboardCheck, History, IdCard } from "lucide-react";
import { useState } from "react";
import { ScreenshotMagnifier } from "./screenshot-magnifier";

const views = [
  {
    id: "queue",
    label: "Action queue",
    eyebrow: "Act before the shift",
    title: "Every blocker has an owner and a next move.",
    body: "The queue separates what stops the next assignment from what can wait. Teams see the reason, impact, owner and deadline without chasing updates across calls and spreadsheets.",
    src: "/fleetlever/site/stop-list.png",
    alt: "FleetLever action queue showing release blockers, owners and next actions",
    Icon: ClipboardCheck,
  },
  {
    id: "passport",
    label: "Asset passport",
    eyebrow: "One operational record",
    title: "The asset, its evidence and next assignment stay together.",
    body: "Documents, maintenance, assigned people and release evidence live in one asset record, so the decision is based on the same facts for everyone.",
    src: "/fleetlever/site/machine-passport-drawer.png",
    alt: "FleetLever asset passport with documents, maintenance and release evidence",
    Icon: IdCard,
  },
  {
    id: "history",
    label: "Decision history",
    eyebrow: "A defensible decision",
    title: "See who released, blocked or changed an asset - and why.",
    body: "FleetLever keeps the decision, timestamp, note and supporting evidence together. The audit trail is useful during the shift and still clear months later.",
    src: "/fleetlever/site/decision-history-audit-trail.png",
    alt: "FleetLever decision history with release decisions and supporting evidence",
    Icon: History,
  },
] as const;

export function ProductWalkthrough() {
  const [activeId, setActiveId] = useState<(typeof views)[number]["id"]>("queue");
  const active = views.find((view) => view.id === activeId) ?? views[0];
  const ActiveIcon = active.Icon;

  return (
    <div className="mt-10 border border-[#c7d3ce] bg-[#f8faf7] shadow-[0_24px_70px_rgba(16,61,55,0.10)]">
      <div className="grid border-b border-[#c7d3ce] sm:grid-cols-3" role="tablist" aria-label="FleetLever product views">
        {views.map((view) => {
          const Icon = view.Icon;
          const selected = activeId === view.id;
          return (
            <button
              key={view.id}
              id={`tab-${view.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${view.id}`}
              onClick={() => setActiveId(view.id)}
              className={`flex min-h-16 items-center gap-3 border-b px-4 text-left text-sm font-bold transition sm:border-b-0 sm:border-r sm:last:border-r-0 ${
                selected
                  ? "border-[#007c89] bg-[#103d37] text-white"
                  : "border-[#c7d3ce] text-[#435650] hover:bg-[#eaf2ee] hover:text-[#103d37]"
              }`}
            >
              <Icon className={`h-5 w-5 ${selected ? "text-[#73dce3]" : "text-[#007c89]"}`} aria-hidden="true" />
              {view.label}
            </button>
          );
        })}
      </div>

      <div
        id={`panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${active.id}`}
        className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]"
      >
        <div className="flex flex-col justify-center border-b border-[#c7d3ce] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <ActiveIcon className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
          <p className="mt-6 text-xs font-bold uppercase text-[#007c89]">{active.eyebrow}</p>
          <h3 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f]">{active.title}</h3>
          <p className="mt-5 text-base font-medium leading-7 text-[#53635f]">{active.body}</p>
          <p className="mt-6 text-xs font-bold uppercase text-[#65766f]">Select the image to inspect the product</p>
        </div>
        <div className="min-w-0 bg-[#e8efeb] p-3 sm:p-5">
          <ScreenshotMagnifier
            src={active.src}
            alt={active.alt}
            width={1920}
            height={1200}
            sizes="(min-width: 1024px) 58vw, 100vw"
            imageClassName="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
