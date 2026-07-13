"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Flag,
  Link2,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
  Radar,
  RefreshCw,
  Route,
  ShieldAlert,
  SlidersHorizontal,
  TimerReset,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";

type Severity = "blocking" | "watch" | "clear";

type ExternalBlocker = {
  id: string;
  source: string;
  sourceId: string;
  sourceUrl: string;
  title: string;
  status: string;
  statusColor?: string;
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  description: string;
  photoUrl: string | null;
  worksite: string;
  distance: string;
  owner: string;
  impact: string;
  severity: Severity;
  affectsTomorrow: boolean;
};

type ImportedIssue = Omit<
  ExternalBlocker,
  "worksite" | "distance" | "owner" | "impact" | "severity" | "affectsTomorrow"
>;

const demoBlockers: ExternalBlocker[] = [
  {
    id: "demo-water-leak",
    source: "Public city issue",
    sourceId: "FL-EXT-041",
    sourceUrl: "https://imc.thessaloniki.gr/imc/issue/258032",
    title: "Water running across access road",
    status: "Published",
    category: "Road surface / water",
    address: "Leof. Megalou Alexandrou, Thessaloniki",
    latitude: 40.6082,
    longitude: 22.9509,
    createdAt: "2026-07-06T06:30:00.000Z",
    updatedAt: "2026-07-06T09:40:00.000Z",
    description: "Water on the road beside the morning access route. Check whether heavy vehicles can enter safely.",
    photoUrl: null,
    worksite: "Athens Metro Extension",
    distance: "180 m from gate B",
    owner: "Site foreman",
    impact: "Possible slippery entry for loaded trucks before 08:00.",
    severity: "blocking",
    affectsTomorrow: true,
  },
  {
    id: "demo-bulky",
    source: "Public city issue",
    sourceId: "FL-EXT-044",
    sourceUrl: "https://imc.thessaloniki.gr/imc",
    title: "Bulky waste near turning point",
    status: "Acknowledged",
    category: "Obstruction",
    address: "Workshop approach road",
    latitude: 40.613,
    longitude: 22.944,
    createdAt: "2026-07-05T17:15:00.000Z",
    updatedAt: "2026-07-06T05:20:00.000Z",
    description: "Reported obstruction close to the low-loader turning point.",
    photoUrl: null,
    worksite: "Workshop yard",
    distance: "65 m from loading bay",
    owner: "Transport desk",
    impact: "Low-loader may need alternate route.",
    severity: "watch",
    affectsTomorrow: false,
  },
  {
    id: "demo-lighting",
    source: "Public city issue",
    sourceId: "FL-EXT-047",
    sourceUrl: "https://imc.thessaloniki.gr/imc",
    title: "Street lighting outage on early shift route",
    status: "In progress",
    category: "Lighting",
    address: "North access road",
    latitude: 40.619,
    longitude: 22.956,
    createdAt: "2026-07-05T21:10:00.000Z",
    updatedAt: "2026-07-06T10:00:00.000Z",
    description: "Dark section on the route used by crews and service vehicles.",
    photoUrl: null,
    worksite: "Harbor utilities package",
    distance: "420 m from muster point",
    owner: "Safety lead",
    impact: "Add banksman if movement starts before sunrise.",
    severity: "watch",
    affectsTomorrow: true,
  },
  {
    id: "demo-closed",
    source: "Public city issue",
    sourceId: "FL-EXT-052",
    sourceUrl: "https://imc.thessaloniki.gr/imc",
    title: "Pavement repair completed",
    status: "Closed",
    category: "Pavement",
    address: "South perimeter",
    latitude: 40.604,
    longitude: 22.947,
    createdAt: "2026-07-04T12:00:00.000Z",
    updatedAt: "2026-07-06T07:10:00.000Z",
    description: "Issue resolved. No route change required.",
    photoUrl: null,
    worksite: "Athens Metro Extension",
    distance: "310 m from gate A",
    owner: "No action",
    impact: "Cleared from tomorrow plan.",
    severity: "clear",
    affectsTomorrow: false,
  },
];

const severityCopy: Record<Severity, { label: string; classes: string; icon: typeof AlertTriangle }> = {
  blocking: {
    label: "Blocks tomorrow",
    classes: "border-[#c44f3d]/30 bg-[#fff1ec] text-[#8f2f20]",
    icon: ShieldAlert,
  },
  watch: {
    label: "Watch",
    classes: "border-[#c79a2f]/30 bg-[#fff8dc] text-[#765915]",
    icon: TimerReset,
  },
  clear: {
    label: "Clear",
    classes: "border-[#2f8c6f]/25 bg-[#e8f5ef] text-[#17634d]",
    icon: CheckCircle2,
  },
};

function shortDate(value: string) {
  if (!value) return "Not dated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function issueCoordinates(blockers: ExternalBlocker[]) {
  const coords = blockers.filter(
    (blocker): blocker is ExternalBlocker & { latitude: number; longitude: number } =>
      typeof blocker.latitude === "number" && typeof blocker.longitude === "number",
  );

  const lats = coords.map((blocker) => blocker.latitude);
  const longs = coords.map((blocker) => blocker.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLong = Math.min(...longs);
  const maxLong = Math.max(...longs);

  return coords.map((blocker, index) => {
    const xRange = maxLong - minLong || 1;
    const yRange = maxLat - minLat || 1;
    return {
      blocker,
      x: 12 + ((blocker.longitude - minLong) / xRange) * 76,
      y: 12 + ((maxLat - blocker.latitude) / yRange) * 76,
      index,
    };
  });
}

function impactLabel(blocker: ExternalBlocker) {
  if (blocker.affectsTomorrow && blocker.severity === "blocking") return "Hold release";
  if (blocker.affectsTomorrow) return "Brief crew";
  return "No release impact";
}

function isImportedIssue(value: ImportedIssue | { error?: string }): value is ImportedIssue {
  return (
    typeof (value as ImportedIssue).id === "string" &&
    typeof (value as ImportedIssue).source === "string" &&
    typeof (value as ImportedIssue).sourceUrl === "string"
  );
}

export function ExternalBlockersTool() {
  const [blockers, setBlockers] = useState<ExternalBlocker[]>(demoBlockers);
  const [selectedId, setSelectedId] = useState(demoBlockers[0].id);
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const [importValue, setImportValue] = useState("https://imc.thessaloniki.gr/imc/issue/258032");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const selected = blockers.find((blocker) => blocker.id === selectedId) ?? blockers[0];
  const filtered = blockers.filter((blocker) => filter === "all" || blocker.severity === filter);
  const points = issueCoordinates(blockers);

  const summary = useMemo(
    () => ({
      blocking: blockers.filter((blocker) => blocker.severity === "blocking").length,
      watching: blockers.filter((blocker) => blocker.severity === "watch").length,
      tomorrow: blockers.filter((blocker) => blocker.affectsTomorrow).length,
      clear: blockers.filter((blocker) => blocker.severity === "clear").length,
    }),
    [blockers],
  );

  async function importIssue() {
    setIsImporting(true);
    setImportError("");

    try {
      const response = await fetch(`/api/external-blockers/imc-issue?issue=${encodeURIComponent(importValue)}`);
      const payload = (await response.json()) as ImportedIssue | { error?: string };

      if (!response.ok || !isImportedIssue(payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : "Import failed.");
      }

      const imported: ExternalBlocker = {
        ...payload,
        worksite: "Unassigned worksite",
        distance: payload.latitude && payload.longitude ? "Needs site match" : "No coordinates",
        owner: "Ops coordinator",
        impact: "Imported for review. Mark as blocking only if it affects access, safety, or release.",
        severity: "watch",
        affectsTomorrow: false,
      };

      setBlockers((current) => [imported, ...current.filter((blocker) => blocker.id !== imported.id)]);
      setSelectedId(imported.id);
      setFilter("all");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsImporting(false);
    }
  }

  function updateSelected(update: Partial<ExternalBlocker>) {
    setBlockers((current) =>
      current.map((blocker) => (blocker.id === selected.id ? { ...blocker, ...update } : blocker)),
    );
  }

  const SelectedIcon = severityCopy[selected.severity].icon;

  return (
    <main className="min-h-screen bg-[#f3f0e7] text-[#152320]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 py-4 sm:px-5 lg:px-6">
        <header className="flex flex-col gap-4 border-b border-[#d7d1c4] pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-sm bg-[#073f3a] text-[#f9f4e8] shadow-[inset_0_-2px_0_rgba(255,255,255,0.16)]">
              <Radar className="size-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-[#0d7770]">FleetLever tool</p>
              <h1 className="text-2xl font-black sm:text-3xl">External Blockers</h1>
            </div>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-sm border border-[#cfc7b8] bg-[#faf7ef] text-sm md:w-[440px]">
            <div className="border-r border-[#ded7c9] px-4 py-3">
              <p className="font-black">{summary.blocking}</p>
              <p className="text-xs font-bold text-[#65716d]">blocking</p>
            </div>
            <div className="border-r border-[#ded7c9] px-4 py-3">
              <p className="font-black">{summary.watching}</p>
              <p className="text-xs font-bold text-[#65716d]">watching</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-black">{summary.tomorrow}</p>
              <p className="text-xs font-bold text-[#65716d]">tomorrow</p>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[360px_minmax(0,1fr)_360px]">
          <aside className="flex min-h-[580px] flex-col rounded-sm border border-[#d7d1c4] bg-[#faf7ef]">
            <div className="border-b border-[#ddd6c9] p-4">
              <label className="text-xs font-black uppercase text-[#6a766f]" htmlFor="external-import">
                Import public issue
              </label>
              <div className="mt-2 flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6f7b75]" />
                  <input
                    id="external-import"
                    value={importValue}
                    onChange={(event) => setImportValue(event.target.value)}
                    className="h-11 w-full rounded-sm border border-[#c8d0cc] bg-white pl-9 pr-3 text-sm font-bold outline-none focus:border-[#0d7770] focus:ring-2 focus:ring-[#0d7770]/15"
                    placeholder="Paste issue URL or ID"
                  />
                </div>
                <button
                  type="button"
                  onClick={importIssue}
                  disabled={isImporting}
                  className="inline-flex h-11 items-center gap-2 rounded-sm bg-[#073f3a] px-4 text-sm font-black text-white transition hover:bg-[#0b554e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isImporting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Add
                </button>
              </div>
              {importError ? <p className="mt-2 text-sm font-bold text-[#b13b2b]">{importError}</p> : null}
            </div>

            <div className="flex items-center gap-2 border-b border-[#ddd6c9] p-3">
              <SlidersHorizontal className="size-4 text-[#637069]" />
              {(["all", "blocking", "watch", "clear"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-sm px-3 py-2 text-xs font-black uppercase transition ${
                    filter === option ? "bg-[#152320] text-white" : "text-[#56635e] hover:bg-[#ede8dc]"
                  }`}
                >
                  {option === "watch" ? "watching" : option}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {filtered.map((blocker) => {
                const copy = severityCopy[blocker.severity];
                const Icon = copy.icon;

                return (
                  <button
                    key={blocker.id}
                    type="button"
                    onClick={() => setSelectedId(blocker.id)}
                    className={`w-full rounded-sm border p-3 text-left transition ${
                      selected.id === blocker.id
                        ? "border-[#073f3a] bg-white shadow-[0_10px_28px_rgba(29,39,35,0.11)]"
                        : "border-transparent bg-transparent hover:border-[#d7d1c4] hover:bg-white/70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 grid size-8 shrink-0 place-items-center rounded-sm border ${copy.classes}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-black uppercase text-[#0d7770]">#{blocker.sourceId}</p>
                          <span className="shrink-0 text-xs font-bold text-[#66736d]">{shortDate(blocker.updatedAt)}</span>
                        </div>
                        <h2 className="mt-1 text-base font-black leading-snug">{blocker.title}</h2>
                        <p className="mt-2 text-sm font-bold leading-snug text-[#647069]">{blocker.distance}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="relative min-h-[640px] overflow-hidden rounded-sm border border-[#cfc7b8] bg-[#e7e1d2]">
            <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(#6e756d_1px,transparent_1px),linear-gradient(90deg,#6e756d_1px,transparent_1px)] [background-size:40px_40px]" />
            <div className="absolute left-[8%] top-[20%] h-[62%] w-[76%] rounded-[48%] border-2 border-[#f7f2e8]" />
            <div className="absolute left-[21%] top-[15%] h-[72%] w-[52%] rotate-[-9deg] rounded-[42%] border border-[#837d70]" />
            <div className="absolute left-[18%] top-[56%] h-1 w-[60%] rotate-[-18deg] bg-[#d2bd6f]" />
            <div className="absolute left-[38%] top-[18%] h-[68%] w-1 rotate-[8deg] bg-[#63837d]" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex flex-col gap-3 border-b border-[#d6cdbc]/80 bg-[#f8f3e8]/85 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-[#0d7770]">Worksite radius</p>
                  <h2 className="text-xl font-black">Tomorrow access scan</h2>
                </div>
                <div className="flex items-center gap-2 text-sm font-black text-[#56635e]">
                  <LocateFixed className="size-4 text-[#0d7770]" />
                  Athens Metro Extension · 1.5 km
                </div>
              </div>

              <div className="relative flex-1">
                {points.map(({ blocker, x, y, index }) => {
                  const active = blocker.id === selected.id;
                  const copy = severityCopy[blocker.severity];
                  return (
                    <button
                      key={blocker.id}
                      type="button"
                      onClick={() => setSelectedId(blocker.id)}
                      className={`absolute grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 transition ${
                        active
                          ? "z-20 scale-110 border-[#152320] bg-[#fdfaf2]"
                          : "z-10 border-[#f8f3e8] bg-[#fdfaf2] hover:scale-105"
                      }`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      aria-label={blocker.title}
                    >
                      <span
                        className={`grid size-8 place-items-center rounded-full ${
                          blocker.severity === "blocking"
                            ? "bg-[#c44f3d] text-white"
                            : blocker.severity === "watch"
                              ? "bg-[#d5a93c] text-[#1d241f]"
                              : "bg-[#3b9679] text-white"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="sr-only">{copy.label}</span>
                    </button>
                  );
                })}

                <div className="absolute bottom-5 left-5 max-w-[310px] rounded-sm border border-[#d1c7b5] bg-[#fdfaf2]/92 p-4 shadow-[0_24px_60px_rgba(29,39,35,0.18)] backdrop-blur">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-[#0d7770]">
                    <Route className="size-4" />
                    Release path
                  </div>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-[#42504b]">
                    FleetLever turns public reports into operational decisions: hold, reroute, brief, or ignore.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex min-h-[640px] flex-col rounded-sm border border-[#d7d1c4] bg-[#faf7ef]">
            <div className="border-b border-[#ddd6c9] p-4">
              <div className={`inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-black uppercase ${severityCopy[selected.severity].classes}`}>
                <SelectedIcon className="size-4" />
                {severityCopy[selected.severity].label}
              </div>
              <h2 className="mt-4 text-2xl font-black leading-tight">{selected.title}</h2>
              <p className="mt-3 text-sm font-bold leading-relaxed text-[#59665f]">{selected.description}</p>
            </div>

            {selected.photoUrl ? (
              <img
                src={selected.photoUrl}
                alt=""
                className="h-48 w-full border-b border-[#ddd6c9] object-cover"
                loading="lazy"
              />
            ) : null}

            <div className="grid grid-cols-2 gap-px border-b border-[#ddd6c9] bg-[#ddd6c9] text-sm">
              <div className="bg-[#faf7ef] p-4">
                <p className="text-xs font-black uppercase text-[#6a766f]">Worksite</p>
                <p className="mt-1 font-black">{selected.worksite}</p>
              </div>
              <div className="bg-[#faf7ef] p-4">
                <p className="text-xs font-black uppercase text-[#6a766f]">Source status</p>
                <p className="mt-1 font-black">{selected.status}</p>
              </div>
              <div className="bg-[#faf7ef] p-4">
                <p className="text-xs font-black uppercase text-[#6a766f]">Owner</p>
                <p className="mt-1 font-black">{selected.owner}</p>
              </div>
              <div className="bg-[#faf7ef] p-4">
                <p className="text-xs font-black uppercase text-[#6a766f]">Impact</p>
                <p className="mt-1 font-black">{impactLabel(selected)}</p>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <p className="text-xs font-black uppercase text-[#6a766f]">Address</p>
                <p className="mt-1 flex items-start gap-2 text-sm font-bold leading-relaxed text-[#41504a]">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[#0d7770]" />
                  {selected.address}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-[#6a766f]">Decision</p>
                <div className="mt-2 grid gap-2">
                  <button
                    type="button"
                    onClick={() => updateSelected({ affectsTomorrow: true, severity: "blocking" })}
                    className="flex items-center justify-between rounded-sm border border-[#e3c0b7] bg-[#fff5f1] px-3 py-3 text-left text-sm font-black text-[#832d20] transition hover:border-[#c44f3d]"
                  >
                    Hold release
                    <Flag className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelected({ affectsTomorrow: true, severity: "watch" })}
                    className="flex items-center justify-between rounded-sm border border-[#eadb9e] bg-[#fffbe8] px-3 py-3 text-left text-sm font-black text-[#6d5313] transition hover:border-[#d5a93c]"
                  >
                    Brief crew only
                    <CalendarClock className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelected({ affectsTomorrow: false, severity: "clear" })}
                    className="flex items-center justify-between rounded-sm border border-[#b8d9cc] bg-[#eef8f3] px-3 py-3 text-left text-sm font-black text-[#17634d] transition hover:border-[#3b9679]"
                  >
                    No tomorrow impact
                    <CheckCircle2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-sm border border-[#d7d1c4] bg-white p-4">
                <div className="flex items-start gap-3">
                  <CircleDot className="mt-0.5 size-5 shrink-0 text-[#0d7770]" />
                  <div>
                    <p className="text-sm font-black">Release note</p>
                    <p className="mt-1 text-sm font-bold leading-relaxed text-[#647069]">{selected.impact}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto border-t border-[#ddd6c9] p-4">
              <div className="flex gap-2">
                <a
                  href={selected.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm border border-[#c8d0cc] bg-white px-3 py-3 text-sm font-black text-[#152320] transition hover:border-[#0d7770]"
                >
                  Open source
                  <ExternalLink className="size-4" />
                </a>
                <button
                  type="button"
                  onClick={() => updateSelected({ updatedAt: new Date().toISOString() })}
                  className="inline-flex items-center justify-center rounded-sm bg-[#073f3a] px-4 text-sm font-black text-white transition hover:bg-[#0b554e]"
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>
            </div>
          </aside>
        </section>

        <footer className="flex flex-col gap-3 border-t border-[#d7d1c4] py-4 text-sm font-bold text-[#66736d] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-[#0d7770]" />
            Tomorrow release remains owned by FleetLever. External systems stay as source references.
          </div>
          <div className="flex items-center gap-2 text-[#152320]">
            {summary.clear} clear
            <ArrowRight className="size-4" />
            {summary.blocking + summary.watching} need a decision
          </div>
        </footer>
      </div>
    </main>
  );
}
