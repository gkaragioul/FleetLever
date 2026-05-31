"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardList,
  Command,
  Database,
  Download,
  Eye,
  FileUp,
  FileText,
  Filter,
  Gauge,
  HardHat,
  ListChecks,
  MoreHorizontal,
  Plus,
  QrCode,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  UploadCloud,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import {
  assets,
  complianceTemplates,
  documentStatus,
  documents,
  daysUntil,
  formatCurrency,
  formatDate,
  getAsset,
  getAttentionItems,
  getMissingDocumentCategories,
  getReadinessScore,
  issues,
  maintenanceTasks,
  operators,
} from "@/lib/fleetlever";

type TabId =
  | "dashboard"
  | "command"
  | "assets"
  | "documents"
  | "compliance"
  | "maintenance"
  | "issues"
  | "operators"
  | "copilot"
  | "reports"
  | "settings";

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Πίνακας", icon: Gauge },
  { id: "assets", label: "Πάγια", icon: Truck },
  { id: "documents", label: "Έγγραφα", icon: FileText },
  { id: "compliance", label: "Συμμόρφωση", icon: ShieldCheck },
  { id: "maintenance", label: "Συντήρηση", icon: Wrench },
  { id: "issues", label: "Βλάβες", icon: AlertTriangle },
  { id: "operators", label: "Χειριστές", icon: Users },
  { id: "copilot", label: "Copilot", icon: Bot },
  { id: "reports", label: "Αναφορές", icon: ClipboardList },
  { id: "settings", label: "Ρυθμίσεις", icon: Settings },
];

const attentionItems = getAttentionItems();
const blockedAssets = assets.filter((asset) => asset.status === "blocked");
const readyAssets = assets.filter((asset) => asset.status === "ready");
const expiringDocuments = documents.filter((document) =>
  ["expired", "critical", "warning"].includes(documentStatus(document)),
);
const overdueMaintenance = maintenanceTasks.filter((task) => task.status === "overdue");
const blockingIssues = issues.filter((issue) => issue.blocking);
const totalMaintenanceCost = maintenanceTasks.reduce((sum, task) => sum + (task.cost ?? 0), 0);

const statusLabels: Record<string, string> = {
  ready: "έτοιμο",
  attention: "προσοχή",
  blocked: "μη διαθέσιμο",
  inactive: "ανενεργό",
  valid: "έγκυρο",
  warning: "προειδοποίηση",
  critical: "κρίσιμο",
  expired: "ληγμένο",
  missing: "λείπει",
  overdue: "εκπρόθεσμο",
  open: "ανοιχτό",
  "in progress": "σε εξέλιξη",
  completed: "ολοκληρωμένο",
  triaged: "triaged",
  waiting: "σε αναμονή",
  resolved: "κλειστό",
  scheduled: "προγραμματισμένο",
  approved: "εγκεκριμένο",
  "under review": "σε έλεγχο",
  high: "υψηλό",
  criticalIssue: "κρίσιμο",
  medium: "μεσαίο",
  low: "χαμηλό",
};

const categoryLabels: Record<string, string> = {
  KTEO: "KTEO",
  Insurance: "Ασφάλεια",
  Permit: "Άδεια",
  "Lifting certificate": "Πιστοποιητικό ανύψωσης",
  "Periodic inspection": "Περιοδικός έλεγχος",
  "Operator license": "Άδεια χειριστή",
  "Maintenance invoice": "Τιμολόγιο συντήρησης",
  "Safety document": "Έγγραφο ασφαλείας",
};

function toneClass(tone: string) {
  const tones: Record<string, string> = {
    ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    attention: "border-amber-200 bg-amber-50 text-amber-800",
    blocked: "border-red-200 bg-red-50 text-red-800",
    inactive: "border-[#d9e2dc] bg-[#e7ece8] text-slate-600",
    valid: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    critical: "border-orange-200 bg-orange-50 text-orange-800",
    expired: "border-red-200 bg-red-50 text-red-800",
    missing: "border-red-200 bg-red-50 text-red-800",
    overdue: "border-red-200 bg-red-50 text-red-800",
    open: "border-sky-200 bg-sky-50 text-sky-800",
    scheduled: "border-[#d9e2dc] bg-[#f2f5ef] text-slate-700",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
    "under review": "border-amber-200 bg-amber-50 text-amber-800",
    high: "border-orange-200 bg-orange-50 text-orange-800",
    criticalIssue: "border-red-200 bg-red-50 text-red-800",
    medium: "border-amber-200 bg-amber-50 text-amber-800",
    low: "border-[#d9e2dc] bg-[#f2f5ef] text-slate-700",
  };

  return tones[tone] ?? "border-[#d9e2dc] bg-[#f2f5ef] text-slate-700";
}

function StatusPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`inline-flex min-w-[92px] items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass(tone)}`}
    >
      {label}
    </span>
  );
}

function PanelHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#d9e2dc] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117064]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#13211f]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

function IconButton({ icon: Icon, label, description }: { icon: LucideIcon; label: string; description: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-teal-300 hover:bg-[#f2f7f2] hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        type="button"
        aria-label={`${label}. ${description}`}
      >
        <Icon size={18} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-11 z-40 hidden w-48 rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-3 py-2 text-left text-xs leading-5 text-slate-700 shadow-lg ring-1 ring-slate-950/5 group-hover:block group-focus-within:block"
      >
        <span className="block font-semibold text-[#13211f]">{label}</span>
        <span className="mt-1 block">{description}</span>
      </span>
    </span>
  );
}

function ToolbarMenu() {
  return (
    <span className="group relative inline-flex">
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-teal-300 hover:bg-[#f2f7f2] hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        type="button"
        aria-label="Περισσότερες ενέργειες. Import και Export δεδομένων."
      >
        <MoreHorizontal size={18} />
      </button>
      <div className="absolute right-0 top-11 z-40 hidden w-64 rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-2 text-left shadow-xl ring-1 ring-slate-950/5 group-hover:block group-focus-within:block">
        <button
          type="button"
          className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition hover:bg-[#eef7f2] focus-visible:bg-[#eef7f2] focus-visible:outline-none"
          aria-label="Import δεδομένων. Μαζική εισαγωγή από Excel, CSV ή φάκελο αρχείων."
        >
          <UploadCloud className="mt-0.5 shrink-0 text-slate-500" size={17} />
          <span>
            <span className="block text-sm font-semibold text-[#13211f]">Import δεδομένων</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-600">Excel, CSV ή φάκελος αρχείων.</span>
          </span>
        </button>
        <button
          type="button"
          className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition hover:bg-[#eef7f2] focus-visible:bg-[#eef7f2] focus-visible:outline-none"
          aria-label="Export αναφοράς. Εξαγωγή αναφορών και δεδομένων για έλεγχο."
        >
          <Download className="mt-0.5 shrink-0 text-slate-500" size={17} />
          <span>
            <span className="block text-sm font-semibold text-[#13211f]">Export αναφοράς</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-600">Αναφορές και δεδομένα για έλεγχο.</span>
          </span>
        </button>
      </div>
    </span>
  );
}

function ActionButton({ icon: Icon, children, onClick }: { icon: LucideIcon; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#11685f] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f5c55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

type MetricTone = "teal" | "amber" | "red" | "slate";

function metricAccentClass(tone: MetricTone) {
  const accents: Record<MetricTone, string> = {
    teal: "bg-[#e3f2ec] text-[#11685f] ring-[#c7e2d6]",
    amber: "bg-[#fff4d7] text-[#8b5d16] ring-[#efd99a]",
    red: "bg-[#fdeceb] text-[#b23838] ring-[#f0c4c0]",
    slate: "bg-[#e7ece8] text-slate-700 ring-[#d2dbd5]",
  };

  return accents[tone];
}

type MetricStripItem = {
  label: string;
  value: string | number;
  detail: string;
  icon?: LucideIcon;
  tone?: MetricTone;
  active?: boolean;
  onClick?: () => void;
};

function metricStripGridClass(count: number) {
  if (count >= 5) return "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
  if (count === 4) return "sm:grid-cols-2 lg:grid-cols-4";
  if (count === 3) return "sm:grid-cols-3";
  return "sm:grid-cols-2";
}

function MetricStrip({ items, ariaLabel }: { items: MetricStripItem[]; ariaLabel?: string }) {
  return (
    <div
      className={`grid overflow-hidden rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:divide-x sm:divide-[#d9e2dc] ${metricStripGridClass(items.length)}`}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const content = (
          <>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-slate-500">{item.label}</span>
              <span className="mt-1 block text-2xl font-semibold text-[#13211f]">{item.value}</span>
              <span className="mt-1 block truncate text-sm text-slate-600">{item.detail}</span>
            </span>
            {Icon ? (
              <span className={`shrink-0 rounded-md p-2 ring-1 ${metricAccentClass(item.tone ?? "slate")}`}>
                <Icon size={18} />
              </span>
            ) : null}
          </>
        );
        const className = `flex min-h-[92px] items-center justify-between gap-4 border-b border-[#d9e2dc] p-4 text-left last:border-b-0 sm:border-b-0 ${
          item.active ? "bg-[#e2f0ea]" : "bg-[#fbfaf6]"
        }`;

        if (item.onClick) {
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              aria-pressed={item.active}
              className={`${className} transition hover:bg-[#f7faf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500`}
            >
              {content}
            </button>
          );
        }

        return (
          <div key={item.label} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="w-full min-w-[120px]">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Ετοιμότητα</span>
        <span className="font-mono text-slate-700">{score}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e7ece8]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function AssignmentReadinessCell({ score, missing }: { score: number; missing: string[] }) {
  return (
    <span className="flex h-full min-h-[72px] w-full flex-col justify-center">
      <span className="block w-full max-w-[190px]">
        <ReadinessBar score={score} />
      </span>
      <span className="mt-2 block min-h-6 max-w-[190px] truncate text-sm text-slate-600">
        <MissingDocumentSummary missing={missing} />
      </span>
    </span>
  );
}

function DataCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <h2 className="text-base font-semibold text-[#13211f]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextButton({
  icon: Icon,
  children,
  onClick,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-3 text-sm font-semibold text-[#123d37] transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
    >
      <Icon size={15} />
      {children}
    </button>
  );
}

function FilterChip({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
        active
          ? "border-[#11685f] bg-[#e2f0ea] text-[#123d37]"
          : "border-[#d9e2dc] bg-[#fbfaf6] text-slate-600 hover:border-teal-300 hover:bg-[#eef7f2]"
      }`}
    >
      {children}
    </button>
  );
}

function DashboardPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Πίνακας"
        title="Σήμερα στον στόλο"
        description="Τα σημεία που χρειάζονται κλείσιμο πριν βγει το πρόγραμμα."
        action={<ActionButton icon={Bot} onClick={() => setActiveTab("copilot")}>Copilot</ActionButton>}
      />

      <MetricStrip
        ariaLabel="Σύνοψη ημέρας"
        items={[
          { icon: Truck, label: "Έτοιμα", value: readyAssets.length, detail: "Πάγια για ανάθεση", tone: "teal" },
          { icon: AlertTriangle, label: "Μη διαθέσιμα", value: blockedAssets.length, detail: "Μένουν εκτός", tone: "red" },
          { icon: FileText, label: "Λήξεις", value: expiringDocuments.length, detail: "Έγγραφα με προθεσμία", tone: "amber" },
          { icon: Wrench, label: "Service", value: overdueMaintenance.length, detail: "Εκπρόθεσμες εργασίες", tone: "red" },
        ]}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_340px]">
        <DataCard title="Προτεραιότητες">
          <div className="divide-y divide-[#e3e9e2]">
            {[
              { title: "B-12 KTEO", detail: "Κλείσε ανανέωση πριν μπει σε διαδρομή.", tab: "issues" as TabId, tone: "blocked" },
              { title: "CR-04 πιστοποιητικό", detail: "Έλεγξε τη λήξη ανύψωσης στις 03 Ιουν.", tab: "documents" as TabId, tone: "critical" },
              { title: "FL-02 συντήρηση", detail: "Ανάθεσε την εκπρόθεσμη εργασία και κράτησε κόστος.", tab: "maintenance" as TabId, tone: "overdue" },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className="grid w-full gap-3 py-4 text-left transition hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#13211f]">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{item.detail}</span>
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#11685f]">
                  Άνοιγμα
                  <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>
        </DataCard>

        <TodayPanel setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

type AssetFilter = "all" | "ready" | "blocked" | "missing";
type DocumentFilter = "attention" | "expired" | "upcoming" | "review" | "valid" | "all";

function assetAction(asset: (typeof assets)[number]): { label: string; tab: TabId } {
  if (asset.status === "ready") {
    return { label: "Ανάθεση", tab: "operators" };
  }

  if (asset.status === "blocked") {
    return { label: "Δες εμπόδια", tab: "issues" };
  }

  return { label: "Συμπλήρωση", tab: "documents" };
}

function assetStatusLabel(status: string) {
  if (status === "ready") return "έτοιμο";
  if (status === "blocked") return "μη διαθέσιμο";
  return statusLabels[status] ?? status;
}

function MissingDocumentChips({ missing, limit = 3 }: { missing: string[]; limit?: number }) {
  if (!missing.length) {
    return <span className="text-sm font-medium text-emerald-700">Πλήρες</span>;
  }

  const visible = missing.slice(0, limit);
  const hidden = missing.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((item) => (
        <span
          key={item}
          className="rounded-full border border-[#d9e2dc] bg-[#f7faf4] px-2 py-1 text-xs font-medium text-slate-600"
        >
          {categoryLabels[item] ?? item}
        </span>
      ))}
      {hidden > 0 ? (
        <span className="rounded-full border border-[#d9e2dc] bg-[#fbfaf6] px-2 py-1 text-xs font-semibold text-slate-500">
          +{hidden}
        </span>
      ) : null}
    </div>
  );
}

function MissingDocumentSummary({ missing }: { missing: string[] }) {
  if (!missing.length) {
    return <span className="text-sm font-medium text-emerald-700">Δεν λείπει κάτι κρίσιμο</span>;
  }

  const [first, ...rest] = missing;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
      <span>{categoryLabels[first] ?? first}</span>
      {rest.length ? (
        <span className="rounded-full border border-[#d9e2dc] bg-[#f7faf4] px-2 py-0.5 text-xs font-semibold text-slate-500">
          +{rest.length}
        </span>
      ) : null}
    </span>
  );
}

function assetBlockerText(asset: (typeof assets)[number], missing: string[]) {
  const linkedBlockingIssue = issues.find((issue) => issue.assetId === asset.id && issue.blocking);

  if (linkedBlockingIssue) {
    return linkedBlockingIssue.title;
  }

  if (missing.length) {
    const [first, ...rest] = missing;
    return rest.length
      ? `Λείπει ${categoryLabels[first] ?? first} και ${rest.length} ακόμη`
      : `Λείπει ${categoryLabels[first] ?? first}`;
  }

  return "Έτοιμο για ανάθεση.";
}

function documentTarget(document: (typeof documents)[number]) {
  const asset = document.assetId ? getAsset(document.assetId) : undefined;

  if (asset) {
    return `${asset.code} · ${asset.name}`;
  }

  return document.operator ?? "Χωρίς σύνδεση";
}

function documentDueText(document: (typeof documents)[number]) {
  if (!document.expiresAt) {
    return "Χωρίς λήξη";
  }

  const days = daysUntil(document.expiresAt);

  if (days < 0) {
    return `Έληξε πριν ${Math.abs(days)} ημέρες`;
  }

  if (days === 0) {
    return "Λήγει σήμερα";
  }

  return `Λήγει σε ${days} ημέρες`;
}

function documentAction(document: (typeof documents)[number]) {
  const status = documentStatus(document);

  if (document.reviewState === "under review") {
    return "Έγκριση";
  }

  if (status === "expired" || status === "critical" || status === "warning") {
    return "Ανανέωση";
  }

  return "Άνοιγμα";
}

function isDocumentAttention(document: (typeof documents)[number]) {
  return document.reviewState === "under review" || ["expired", "critical", "warning"].includes(documentStatus(document));
}

function filterDocuments(filter: DocumentFilter) {
  return documents.filter((document) => {
    const status = documentStatus(document);

    if (filter === "attention") return isDocumentAttention(document);
    if (filter === "expired") return status === "expired";
    if (filter === "upcoming") return status === "critical" || status === "warning";
    if (filter === "review") return document.reviewState === "under review";
    if (filter === "valid") return status === "valid";
    return true;
  });
}

function AssetDrawer({
  asset,
  onClose,
  setActiveTab,
}: {
  asset: (typeof assets)[number];
  onClose: () => void;
  setActiveTab: (tab: TabId) => void;
}) {
  const missing = getMissingDocumentCategories(asset);
  const score = getReadinessScore(asset);
  const linkedDocuments = documents.filter((document) => document.assetId === asset.id);
  const linkedIssues = issues.filter((issue) => issue.assetId === asset.id && issue.status !== "resolved");
  const linkedMaintenance = maintenanceTasks.filter((task) => task.assetId === asset.id);
  const operator = operators.find((item) => item.name === asset.operator);
  const action = assetAction(asset);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="asset-drawer-title">
      <button
        type="button"
        aria-label="Κλείσιμο λεπτομερειών παγίου"
        className="absolute inset-0 bg-slate-950/30"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-[#d9e2dc] bg-[#fbfaf6] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-[#d9e2dc] bg-[#fbfaf6]/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117064]">{asset.type}</p>
              <h2 id="asset-drawer-title" className="mt-2 break-words text-2xl font-semibold leading-tight text-[#13211f]">
                {asset.code} · {asset.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{asset.plate ?? asset.serial} · {asset.location}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] text-slate-600 transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label="Κλείσιμο"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
              <p className="text-xs font-semibold text-slate-500">Κατάσταση</p>
              <div className="mt-2">
                <StatusPill label={assetStatusLabel(asset.status)} tone={asset.status} />
              </div>
            </div>
            <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
              <p className="text-xs font-semibold text-slate-500">Ετοιμότητα</p>
              <p className="mt-2 text-2xl font-semibold text-[#13211f]">{score}%</p>
            </div>
            <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
              <p className="text-xs font-semibold text-slate-500">Ιδιοκτησία</p>
              <p className="mt-2 text-sm font-semibold text-[#13211f]">{asset.ownership}</p>
            </div>
          </div>

          <DataCard title="Λείπουν">
            <MissingDocumentChips missing={missing} limit={6} />
          </DataCard>

          <DataCard title="Συνδεδεμένα έγγραφα">
            <div className="space-y-2">
              {linkedDocuments.length ? (
                linkedDocuments.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => setActiveTab("documents")}
                    className="grid min-h-12 w-full gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#13211f]">{document.title}</span>
                      <span className="text-xs text-slate-500">
                        {categoryLabels[document.category]} · {document.expiresAt ? formatDate(document.expiresAt) : "χωρίς λήξη"}
                      </span>
                    </span>
                    <StatusPill label={statusLabels[documentStatus(document)]} tone={documentStatus(document)} />
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500">Δεν υπάρχουν συνδεδεμένα έγγραφα.</p>
              )}
            </div>
          </DataCard>

          <DataCard title="Βλάβες και συντήρηση">
            <div className="space-y-2">
              {[...linkedIssues, ...linkedMaintenance].length ? (
                <>
                  {linkedIssues.map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => setActiveTab("issues")}
                      className="w-full rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-[#13211f]">{issue.title}</p>
                        <StatusPill label={issue.blocking ? "μη διαθέσιμο" : statusLabels[issue.severity]} tone={issue.blocking ? "blocked" : issue.severity} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{issue.assignee}</p>
                    </button>
                  ))}
                  {linkedMaintenance.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setActiveTab("maintenance")}
                      className="w-full rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-[#13211f]">{task.title}</p>
                        <StatusPill label={statusLabels[task.status]} tone={task.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Υπεύθυνος: {task.owner} · {formatDate(task.dueAt)}</p>
                    </button>
                  ))}
                </>
              ) : (
                <p className="text-sm text-slate-500">Δεν υπάρχουν ανοιχτές βλάβες ή εργασίες συντήρησης.</p>
              )}
            </div>
          </DataCard>

          <DataCard title="Χειριστής">
            <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
              <p className="text-sm font-semibold text-[#13211f]">{asset.operator}</p>
              <p className="mt-1 text-sm text-slate-600">{operator?.role ?? "Χειριστής"}</p>
              <p className="mt-1 text-xs text-slate-500">
                Άδεια έως {operator ? formatDate(operator.licenseExpiresAt) : "άγνωστο"}
              </p>
            </div>
          </DataCard>
        </div>

        <div className="sticky bottom-0 border-t border-[#d9e2dc] bg-[#fbfaf6]/95 p-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <UploadCloud size={15} />
                Έγγραφο
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("issues")}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <QrCode size={15} />
                Βλάβη
              </button>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab(action.tab)}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#11685f] px-3 text-sm font-semibold text-white transition hover:bg-[#0f5c55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <ArrowRight size={15} />
              {action.label}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function CommandPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  const [showImportSteps, setShowImportSteps] = useState(false);
  const commandActions: {
    label: string;
    detail: string;
    actionLabel: string;
    icon: LucideIcon;
    tab: TabId;
    tone: string;
  }[] = [
    {
      label: "Νέο πάγιο",
      detail: "Καταχώριση οχήματος, μηχανήματος ή εξοπλισμού.",
      actionLabel: "Καταχώριση",
      icon: Plus,
      tab: "assets",
      tone: "bg-[#e3f2ec] text-[#11685f] ring-[#c7e2d6]",
    },
    {
      label: "Ανέβασμα εγγράφου",
      detail: "Προσθήκη KTEO, άδειας ή πιστοποιητικού σε υπάρχον πάγιο.",
      actionLabel: "Ανέβασμα",
      icon: FileUp,
      tab: "documents",
      tone: "bg-[#fff4d7] text-[#8b5d16] ring-[#efd99a]",
    },
    {
      label: "Νέα βλάβη",
      detail: "Άμεση αναφορά προβλήματος που μπλοκάρει ανάθεση.",
      actionLabel: "Αναφορά",
      icon: AlertTriangle,
      tab: "issues",
      tone: "bg-[#fdeceb] text-[#b23838] ring-[#f0c4c0]",
    },
    {
      label: "Εργασία συντήρησης",
      detail: "Νέα εργασία συντήρησης με υπεύθυνο και προθεσμία.",
      actionLabel: "Ανάθεση",
      icon: Wrench,
      tab: "maintenance",
      tone: "bg-[#e7ece8] text-slate-700 ring-[#d2dbd5]",
    },
  ];

  const suggestedSearches: { query: string; target: string; tab: TabId }[] = [
    { query: "B-12 μη διαθέσιμο", target: "Βλάβες", tab: "issues" },
    { query: "Έγγραφα επόμενων 30 ημερών", target: "Έγγραφα", tab: "documents" },
    { query: "Εκπρόθεσμη συντήρηση", target: "Συντήρηση", tab: "maintenance" },
  ];

  const importSteps: { label: string; detail: string; status: string; icon: LucideIcon }[] = [
    { label: "Ανέβασμα", detail: "Excel, CSV ή φάκελος", status: "έτοιμο", icon: UploadCloud },
    { label: "Αντιστοίχιση", detail: "Πεδία και τύποι εγγράφων", status: "πρόταση AI", icon: Database },
    { label: "Έλεγχος", detail: "Χαμηλή εμπιστοσύνη", status: "σε έλεγχο", icon: ListChecks },
    { label: "Δημοσίευση", detail: "Καταγραφή πριν δημοσιευθεί", status: "έγκριση", icon: CheckCircle2 },
  ];

  const commandResults: {
    code: string;
    title: string;
    detail: string;
    actionLabel: string;
    statusLabel: string;
    tone: string;
    tab: TabId;
  }[] = [
    {
      code: "B-12",
      title: "μη διαθέσιμο · KTEO",
      detail: "Ληγμένο KTEO. Μην ανατεθεί σε διαδρομή.",
      actionLabel: "Άνοιγμα βλάβης",
      statusLabel: "μη διαθέσιμο",
      tone: "blocked",
      tab: "issues",
    },
    {
      code: "CR-04",
      title: "πιστοποιητικό · κοντινή λήξη",
      detail: "Πιστοποιητικό ανύψωσης λήγει στις 03 Ιουν.",
      actionLabel: "Έλεγχος εγγράφου",
      statusLabel: "κρίσιμο",
      tone: "critical",
      tab: "documents",
    },
    {
      code: "FL-02",
      title: "συντήρηση · εκπρόθεσμη",
      detail: "Χρειάζεται ανάθεση εργασίας συντήρησης.",
      actionLabel: "Ανάθεση εργασίας",
      statusLabel: "εκπρόθεσμο",
      tone: "overdue",
      tab: "maintenance",
    },
  ];

  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Εντολές"
        title="Βρες την επόμενη ενέργεια"
        description="Το κέντρο εντολών βρίσκει πάγια, έγγραφα, βλάβες και εργασίες συντήρησης και προτείνει το επόμενο βήμα."
      />

      <section className="rounded-lg border border-[#cfe3da] bg-[#fbfaf6] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#13211f]">Αναζήτηση</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Κωδικός παγίου, όνομα χειριστή, KTEO, πιστοποιητικό ή βλάβη.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#d9e2dc] bg-[#f2f5ef] px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Command size={14} />
            Ctrl K
          </span>
        </div>

        <label className="mt-4 flex min-h-[82px] w-full items-center gap-4 rounded-lg border border-[#c9ded6] bg-[#f2f8f4] px-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:border-[#8fd5c6] focus-within:border-[#8fd5c6] focus-within:ring-1 focus-within:ring-[#8fd5c6]">
          <Search className="shrink-0 text-[#117064]" size={26} />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-[#13211f]">Αναζήτηση σε όλα</span>
            <input
              aria-label="Αναζήτηση σε πάγια, έγγραφα, χειριστές, βλάβες και εργασίες συντήρησης"
              className="mt-1 block w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none"
              placeholder="Δοκίμασε: B-12, KTEO, Νίκος, υδραυλικά ή συντήρηση"
              type="search"
            />
          </span>
        </label>

        <div className="mt-3 grid gap-2">
          {commandResults.map((result) => (
            <button
              key={result.code}
              type="button"
              onClick={() => setActiveTab(result.tab)}
              className="grid min-h-[68px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-left transition hover:border-[#c9ded6] hover:bg-[#f7faf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="rounded-md bg-[#e7ece8] px-2.5 py-1 text-xs font-semibold text-[#13211f]">{result.code}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#13211f]">{result.title}</span>
                <span className="mt-0.5 block truncate text-sm text-slate-600">{result.detail}</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <StatusPill label={result.statusLabel} tone={result.tone} />
                <span className="hidden text-xs font-semibold text-[#11685f] sm:block">{result.actionLabel}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {suggestedSearches.map((item) => (
            <button
              key={item.query}
              type="button"
              onClick={() => setActiveTab(item.tab)}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#d9e2dc] bg-[#fbfaf6] px-3 text-sm text-slate-600 transition hover:border-teal-300 hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Filter size={14} />
              <span>{item.query}</span>
              <span className="text-xs font-semibold text-[#117064]">{item.target}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4">
        <DataCard title="Γρήγορες ενέργειες">
          <div className="grid gap-3 sm:grid-cols-2">
            {commandActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => setActiveTab(action.tab)}
                  className="group flex min-h-[116px] flex-col justify-between rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-4 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold text-[#13211f]">{action.label}</span>
                      <span className="mt-2 block text-sm leading-6 text-slate-600">{action.detail}</span>
                    </span>
                    <span className={`shrink-0 rounded-md p-2 ring-1 ${action.tone}`}>
                      <Icon size={18} />
                    </span>
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#11685f]">
                    {action.actionLabel}
                    <ArrowRight className="transition group-hover:translate-x-0.5" size={15} />
                  </span>
                </button>
              );
            })}
          </div>
        </DataCard>
      </div>

      <section className="rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <span>
            <span className="block text-base font-semibold text-[#13211f]">Αρχική εισαγωγή</span>
            <span className="mt-1 block text-sm text-slate-600">Για Excel, CSV ή φακέλους στην αρχική ρύθμιση.</span>
          </span>
          <button
            type="button"
            onClick={() => setShowImportSteps((value) => !value)}
            aria-expanded={showImportSteps}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-3 text-sm font-semibold text-[#123d37] transition hover:border-[#c9ded6] hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <UploadCloud size={15} />
            {showImportSteps ? "Κρύψε τα βήματα" : "Δες τα βήματα"}
          </button>
        </div>
        {showImportSteps ? (
          <div className="mt-4 grid gap-2 border-t border-[#e3e9e2] pt-4 md:grid-cols-4">
            {importSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.label}
                  className="relative rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#e3f2ec] text-[#11685f] ring-1 ring-[#c7e2d6]">
                      <Icon size={15} />
                    </span>
                    <span className="rounded-full border border-[#d9e2dc] bg-[#fbfaf6] px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {index + 1}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#13211f]">{step.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{step.detail}</p>
                  <p className="mt-2 text-xs font-semibold text-[#117064]">{step.status}</p>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AssetsPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  const [assetFilter, setAssetFilter] = useState<AssetFilter>("all");
  const [assetQuery, setAssetQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showFullRegistry, setShowFullRegistry] = useState(false);
  const assetsWithMissing = assets.filter((asset) => getMissingDocumentCategories(asset).length > 0);
  const selectedAsset = selectedAssetId ? assets.find((asset) => asset.id === selectedAssetId) : undefined;
  const normalizedQuery = assetQuery.trim().toLocaleLowerCase("el-GR");
  const filteredAssets = assets.filter((asset) => {
    const missing = getMissingDocumentCategories(asset);
    const matchesFilter =
      assetFilter === "all" ||
      (assetFilter === "ready" && asset.status === "ready") ||
      (assetFilter === "blocked" && asset.status === "blocked") ||
      (assetFilter === "missing" && missing.length > 0);

    if (!matchesFilter) return false;
    if (!normalizedQuery) return true;

    const searchable = [
      asset.code,
      asset.name,
      asset.plate,
      asset.serial,
      asset.location,
      asset.operator,
      assetStatusLabel(asset.status),
      ...missing.map((item) => categoryLabels[item] ?? item),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("el-GR");

    return searchable.includes(normalizedQuery);
  });

  const filters: { id: AssetFilter; label: string }[] = [
    { id: "all", label: "Όλα" },
    { id: "ready", label: "Έτοιμα" },
    { id: "blocked", label: "Δεν ανατίθενται" },
    { id: "missing", label: "Θέλουν έλεγχο" },
  ];

  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Πάγια"
        title="Τι μπορεί να ανατεθεί σήμερα;"
        description="Δες τα πάγια που είναι έτοιμα, ποια μπλοκάρονται και ποια ενέργεια λείπει."
        action={<ActionButton icon={Truck}>Νέο πάγιο</ActionButton>}
      />

      <MetricStrip
        ariaLabel="Σύνοψη παγίων"
        items={[
          {
            icon: Truck,
            label: "Έτοιμα",
            value: readyAssets.length,
            detail: "Μπορούν να ανατεθούν",
            tone: "teal",
            active: assetFilter === "ready",
            onClick: () => setAssetFilter(assetFilter === "ready" ? "all" : "ready"),
          },
          {
            icon: AlertTriangle,
            label: "Μη διαθέσιμα",
            value: blockedAssets.length,
            detail: blockedAssets.map((asset) => asset.code).join(", "),
            tone: "red",
            active: assetFilter === "blocked",
            onClick: () => setAssetFilter(assetFilter === "blocked" ? "all" : "blocked"),
          },
          {
            icon: FileText,
            label: "Θέλουν έλεγχο",
            value: assetsWithMissing.length,
            detail: "Λείπουν έγγραφα ή έλεγχοι",
            tone: "amber",
            active: assetFilter === "missing",
            onClick: () => setAssetFilter(assetFilter === "missing" ? "all" : "missing"),
          },
          {
            icon: ListChecks,
            label: "Σύνολο",
            value: assets.length,
            detail: `${filteredAssets.length} στην ουρά`,
            tone: "slate",
            active: assetFilter === "all",
            onClick: () => setAssetFilter("all"),
          },
        ]}
      />

      <DataCard title="Ουρά ανάθεσης">
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="flex min-h-10 items-center gap-2 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 focus-within:border-[#8fd5c6] focus-within:ring-1 focus-within:ring-[#8fd5c6]">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              type="search"
              value={assetQuery}
              onChange={(event) => setAssetQuery(event.target.value)}
              aria-label="Αναζήτηση σε πάγια"
              placeholder="Αναζήτηση σε πάγια, πινακίδα, χειριστή ή τοποθεσία..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <TextButton icon={Eye} onClick={() => setShowFullRegistry((value) => !value)}>
              {showFullRegistry ? "Κρύψε πίνακα" : "Πλήρης πίνακας"}
            </TextButton>
            <TextButton icon={Download}>Εξαγωγή</TextButton>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <FilterChip key={filter.id} active={assetFilter === filter.id} onClick={() => setAssetFilter(filter.id)}>
                {filter.label}
              </FilterChip>
            ))}
            {blockedAssets.map((asset) => (
              <FilterChip key={asset.id} active={assetFilter === "blocked"} onClick={() => setAssetFilter("blocked")}>
                {asset.code}
              </FilterChip>
            ))}
          </div>
          <p className="text-sm text-slate-500">{filteredAssets.length} από {assets.length} πάγια</p>
        </div>

        <div className={showFullRegistry ? "hidden" : "space-y-2"}>
          {filteredAssets.map((asset) => {
            const missing = getMissingDocumentCategories(asset);
            const action = assetAction(asset);
            const score = getReadinessScore(asset);

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedAssetId(asset.id)}
                className="grid min-h-[104px] w-full gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-4 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 xl:grid-cols-[180px_minmax(0,1fr)_200px_112px] xl:items-stretch"
              >
                <span className="flex min-w-0 flex-col justify-center">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-[#13211f]">{asset.code}</span>
                    <StatusPill label={assetStatusLabel(asset.status)} tone={asset.status} />
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-600">{asset.name}</span>
                  <span className="mt-1 block truncate font-mono text-xs text-slate-400">{asset.plate ?? asset.serial}</span>
                </span>

                <span className="flex min-w-0 flex-col justify-center">
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Εμπόδιο</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600 xl:line-clamp-2">{assetBlockerText(asset, missing)}</span>
                </span>

                <AssignmentReadinessCell score={score} missing={missing} />

                <span className="flex min-h-[72px] items-center justify-between gap-3 xl:justify-end">
                  <span className="text-sm font-semibold text-[#11685f]">{action.label}</span>
                  <ArrowRight size={16} className="text-[#11685f]" />
                </span>
              </button>
            );
          })}
          {!filteredAssets.length ? (
            <div className="rounded-md border border-dashed border-[#d9e2dc] bg-[#fdfbf7] p-6 text-center text-sm text-slate-500">
              Δεν βρέθηκαν πάγια για αυτό το φίλτρο.
            </div>
          ) : null}
        </div>

        {showFullRegistry ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col className="w-[21%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#d9e2dc] text-xs uppercase tracking-[0.14em] text-slate-500">
                  <th className="w-[210px] py-3 pr-4 font-semibold">Πάγιο</th>
                  <th className="py-3 pr-4 font-semibold">Τοποθεσία</th>
                  <th className="py-3 pr-4 font-semibold">Χειριστής</th>
                  <th className="py-3 pr-4 font-semibold">Κατάσταση</th>
                  <th className="py-3 pr-4 font-semibold">Ετοιμότητα</th>
                  <th className="py-3 font-semibold">Λείπουν</th>
                  <th className="py-3 pl-4 text-right font-semibold">Ενέργεια</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => {
                  const missing = getMissingDocumentCategories(asset);
                  const action = assetAction(asset);

                  return (
                    <tr key={asset.id} className="border-b border-[#e3e9e2] align-top last:border-0">
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-[#13211f]">{asset.code}</p>
                        <p className="truncate text-slate-600">{asset.name}</p>
                        <p className="mt-1 font-mono text-xs text-slate-400">{asset.plate ?? asset.serial}</p>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        <span className="block truncate">{asset.location}</span>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        <span className="block truncate">{asset.operator}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <StatusPill label={assetStatusLabel(asset.status)} tone={asset.status} />
                      </td>
                      <td className="py-4 pr-4">
                        <ReadinessBar score={getReadinessScore(asset)} />
                      </td>
                      <td className="py-4 text-slate-600">
                        <div className="max-w-[260px]">
                          <MissingDocumentChips missing={missing} limit={3} />
                        </div>
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <TextButton icon={Eye} onClick={() => setSelectedAssetId(asset.id)}>{action.label}</TextButton>
                      </td>
                    </tr>
                  );
                })}
                {!filteredAssets.length ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                      Δεν βρέθηκαν πάγια για αυτό το φίλτρο.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </DataCard>
      {selectedAsset ? (
        <AssetDrawer asset={selectedAsset} onClose={() => setSelectedAssetId(null)} setActiveTab={setActiveTab} />
      ) : null}
    </div>
  );
}

function DocumentDrawer({
  document,
  onClose,
  setActiveTab,
}: {
  document: (typeof documents)[number];
  onClose: () => void;
  setActiveTab: (tab: TabId) => void;
}) {
  const asset = document.assetId ? getAsset(document.assetId) : undefined;
  const linkedIssue = asset ? issues.find((issue) => issue.assetId === asset.id && issue.blocking) : undefined;
  const linkedTask = asset ? maintenanceTasks.find((task) => task.assetId === asset.id && task.status !== "completed") : undefined;
  const status = documentStatus(document);
  const primaryAction = documentAction(document);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="document-drawer-title">
      <button
        type="button"
        aria-label="Κλείσιμο λεπτομερειών εγγράφου"
        className="absolute inset-0 bg-slate-950/30"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-[#d9e2dc] bg-[#fbfaf6] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-[#d9e2dc] bg-[#fbfaf6]/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117064]">
                {categoryLabels[document.category]}
              </p>
              <h2 id="document-drawer-title" className="mt-2 break-words text-2xl font-semibold leading-tight text-[#13211f]">
                {document.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{documentTarget(document)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] text-slate-600 transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label="Κλείσιμο"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
              <p className="text-xs font-semibold text-slate-500">Προθεσμία</p>
              <p className="mt-2 text-sm font-semibold text-[#13211f]">
                {document.expiresAt ? formatDate(document.expiresAt) : "Χωρίς λήξη"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{documentDueText(document)}</p>
            </div>
            <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
              <p className="text-xs font-semibold text-slate-500">Κατάσταση</p>
              <div className="mt-2">
                <StatusPill label={statusLabels[status]} tone={status} />
              </div>
            </div>
            <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
              <p className="text-xs font-semibold text-slate-500">Έλεγχος</p>
              <p className="mt-2 text-sm font-semibold text-[#13211f]">{statusLabels[document.reviewState]}</p>
              <p className="mt-1 text-xs text-slate-500">AI {Math.round(document.confidence * 100)}%</p>
            </div>
          </div>

          <DataCard title={asset ? "Συνδεδεμένο πάγιο" : "Συνδεδεμένη εγγραφή"}>
            <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
              {asset ? (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      <span className="block text-sm font-semibold text-[#13211f]">{asset.code} · {asset.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{asset.plate ?? asset.serial} · {asset.location}</span>
                    </span>
                    <StatusPill label={assetStatusLabel(asset.status)} tone={asset.status} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#13211f]">{document.operator}</p>
                  <p className="mt-1 text-xs text-slate-500">Έγγραφο χειριστή</p>
                </>
              )}
            </div>
          </DataCard>

          <DataCard title="Σχετική δουλειά">
            <div className="space-y-2">
              {linkedIssue ? (
                <button
                  type="button"
                  onClick={() => setActiveTab("issues")}
                  className="w-full rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-[#13211f]">{linkedIssue.title}</p>
                    <StatusPill label="μη διαθέσιμο" tone="blocked" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{linkedIssue.assignee}</p>
                </button>
              ) : null}
              {linkedTask ? (
                <button
                  type="button"
                  onClick={() => setActiveTab("maintenance")}
                  className="w-full rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-[#13211f]">{linkedTask.title}</p>
                    <StatusPill label={statusLabels[linkedTask.status]} tone={linkedTask.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{linkedTask.owner} · {formatDate(linkedTask.dueAt)}</p>
                </button>
              ) : null}
              {!linkedIssue && !linkedTask ? (
                <p className="text-sm text-slate-500">Δεν υπάρχει ανοιχτή βλάβη ή εργασία συντήρησης για αυτό το έγγραφο.</p>
              ) : null}
            </div>
          </DataCard>
        </div>

        <div className="sticky bottom-0 border-t border-[#d9e2dc] bg-[#fbfaf6]/95 p-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("assets")}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <Truck size={15} />
                Πάγιο
              </button>
              <button
                type="button"
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <UploadCloud size={15} />
                Ανέβασμα
              </button>
            </div>
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#11685f] px-3 text-sm font-semibold text-white transition hover:bg-[#0f5c55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <ArrowRight size={15} />
              {primaryAction}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DocumentsPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>("attention");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const filteredDocuments = filterDocuments(documentFilter);
  const selectedDocument = selectedDocumentId ? documents.find((document) => document.id === selectedDocumentId) : undefined;
  const documentsInReview = documents.filter((document) => document.reviewState === "under review");
  const validDocuments = documents.filter((document) => documentStatus(document) === "valid");
  const expiredDocuments = filterDocuments("expired");
  const upcomingDocuments = filterDocuments("upcoming");
  const attentionDocuments = filterDocuments("attention");
  const filterCounts: Record<DocumentFilter, number> = {
    attention: attentionDocuments.length,
    expired: expiredDocuments.length,
    upcoming: upcomingDocuments.length,
    review: documentsInReview.length,
    valid: validDocuments.length,
    all: documents.length,
  };
  const filters: { id: DocumentFilter; label: string }[] = [
    { id: "attention", label: "Θέλουν ενέργεια" },
    { id: "expired", label: "Ληγμένα" },
    { id: "upcoming", label: "Επόμενες 30 ημέρες" },
    { id: "review", label: "Σε έλεγχο" },
    { id: "valid", label: "Έγκυρα" },
    { id: "all", label: "Όλα" },
  ];

  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Έγγραφα"
        title="Έγγραφα που θέλουν ενέργεια"
        description="Λήξεις, έλεγχοι και εγκρίσεις σε μία ουρά για το γραφείο."
        action={<ActionButton icon={FileText}>Ανέβασμα εγγράφου</ActionButton>}
      />
      <MetricStrip
        ariaLabel="Σύνοψη εγγράφων"
        items={[
          {
            icon: AlertTriangle,
            label: "Ενέργειες",
            value: attentionDocuments.length,
            detail: "Ανανέωση ή έγκριση",
            tone: "amber",
            active: documentFilter === "attention",
            onClick: () => setDocumentFilter("attention"),
          },
          {
            icon: FileText,
            label: "Ληγμένα",
            value: expiredDocuments.length,
            detail: "Δεν μπαίνουν σε πρόγραμμα",
            tone: "red",
            active: documentFilter === "expired",
            onClick: () => setDocumentFilter("expired"),
          },
          {
            icon: ShieldCheck,
            label: "Σε έλεγχο",
            value: documentsInReview.length,
            detail: "Θέλουν επιβεβαίωση",
            tone: "teal",
            active: documentFilter === "review",
            onClick: () => setDocumentFilter("review"),
          },
          {
            icon: CheckCircle2,
            label: "Έγκυρα",
            value: validDocuments.length,
            detail: "Χωρίς άμεση ενέργεια",
            tone: "slate",
            active: documentFilter === "valid",
            onClick: () => setDocumentFilter("valid"),
          },
        ]}
      />
      <DataCard title="Ουρά εγγράφων">
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <FilterChip key={filter.id} active={documentFilter === filter.id} onClick={() => setDocumentFilter(filter.id)}>
                <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
                  <span>{filter.label}</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#fdfbf7] px-1.5 text-[11px] font-semibold leading-none text-slate-500 ring-1 ring-[#d9e2dc]">
                    {filterCounts[filter.id]}
                  </span>
                </span>
              </FilterChip>
            ))}
          </div>
          <TextButton icon={UploadCloud}>Μαζικό ανέβασμα</TextButton>
        </div>
        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-500">
          <span>{filteredDocuments.length} από {documents.length} έγγραφα</span>
        </div>
        <div className="space-y-2">
          {filteredDocuments.map((document) => {
            const asset = document.assetId ? getAsset(document.assetId) : undefined;
            const status = documentStatus(document);
            const action = documentAction(document);

            return (
              <button
                key={document.id}
                type="button"
                onClick={() => setSelectedDocumentId(document.id)}
                className="grid min-h-[80px] w-full gap-2.5 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-4 py-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 xl:grid-cols-[minmax(220px,1fr)_170px_220px] xl:items-center"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#13211f]">{document.title}</span>
                  <span className="mt-1 block truncate text-sm text-slate-600">
                    {categoryLabels[document.category]} · {asset?.code ?? document.operator}
                  </span>
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-5 text-slate-700">{documentDueText(document)}</span>
                  <span className="mt-1 block text-xs text-slate-500">{document.expiresAt ? formatDate(document.expiresAt) : "χωρίς ημερομηνία"}</span>
                </span>

                <span className="flex min-w-0 flex-col gap-2 xl:items-end">
                  <span className="flex max-w-full flex-wrap gap-2 xl:justify-end">
                    <StatusPill label={statusLabels[status]} tone={status} />
                    {document.reviewState === "under review" ? (
                      <StatusPill label="σε έλεγχο" tone="under review" />
                    ) : null}
                  </span>
                  <span className="inline-flex min-h-[28px] items-center gap-2 text-sm font-semibold text-[#11685f]">
                    {action}
                    <ArrowRight size={16} className="shrink-0 text-[#11685f]" />
                  </span>
                </span>
              </button>
            );
          })}
          {!filteredDocuments.length ? (
            <div className="rounded-md border border-dashed border-[#d9e2dc] bg-[#fdfbf7] p-6 text-center text-sm text-slate-500">
              Δεν υπάρχουν έγγραφα σε αυτό το φίλτρο.
            </div>
          ) : null}
        </div>
      </DataCard>
      {selectedDocument ? (
        <DocumentDrawer document={selectedDocument} onClose={() => setSelectedDocumentId(null)} setActiveTab={setActiveTab} />
      ) : null}
    </div>
  );
}

function CompliancePanel() {
  const assetsWithGaps = assets.filter((asset) => getMissingDocumentCategories(asset).length > 0);
  const requiredCategories = Array.from(new Set(complianceTemplates.flatMap((template) => template.requiredCategories)));
  const assetGapSummary = (assetCount: number, gapCount: number) =>
    `${assetCount} ${assetCount === 1 ? "πάγιο" : "πάγια"} · ${gapCount} ${gapCount === 1 ? "κενό" : "κενά"}`;
  const gapCountLabel = (gapCount: number) => `${gapCount} ${gapCount === 1 ? "κενό" : "κενά"}`;
  const assetTypeLabels: Record<string, string> = {
    Crane: "Γερανός",
    Bus: "Λεωφορείο",
    Forklift: "Κλαρκ",
    Van: "Βαν",
    Excavator: "Εκσκαφέας",
  };
  const assetsWithGapsByType = complianceTemplates.map((template) => {
    const matchingAssets = assets.filter((asset) => asset.type === template.assetType);
    const blockedByRule = matchingAssets.filter((asset) => getMissingDocumentCategories(asset).length > 0);
    const missingCount = blockedByRule.reduce((sum, asset) => sum + getMissingDocumentCategories(asset).length, 0);

    return {
      ...template,
      blockedByRule,
      missingCount,
    };
  });

  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Συμμόρφωση"
        title="Κανόνες συμμόρφωσης"
        description="Τι πρέπει να έχει κάθε τύπος παγίου και ποια πάγια έχουν κενά."
        action={<ActionButton icon={ShieldCheck}>Νέος κανόνας</ActionButton>}
      />
      <MetricStrip
        ariaLabel="Σύνοψη συμμόρφωσης"
        items={[
          { icon: ShieldCheck, label: "Τύποι παγίων", value: complianceTemplates.length, detail: "Με κανόνες εγγράφων", tone: "teal" },
          { icon: FileText, label: "Κατηγορίες", value: requiredCategories.length, detail: "KTEO, άδειες, ασφάλειες", tone: "slate" },
          { icon: AlertTriangle, label: "Πάγια με κενά", value: assetsWithGaps.length, detail: "Θέλουν συμπλήρωση", tone: "amber" },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <DataCard title="Ελλείψεις συμμόρφωσης">
          <div className="divide-y divide-[#e3e9e2]">
            {assetsWithGaps.map((asset) => {
              const missing = getMissingDocumentCategories(asset);

              return (
                <button
                  key={asset.id}
                  type="button"
                  className="grid w-full gap-3 py-4 text-left transition hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[#13211f]">{asset.code}</span>
                      <StatusPill label={gapCountLabel(missing.length)} tone="warning" />
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{asset.name}</span>
                    <span className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                      {missing.map((category) => (
                        <span key={category} className="rounded-full border border-[#d9e2dc] bg-[#fbfaf6] px-2 py-0.5 text-xs font-medium text-slate-600">
                          {categoryLabels[category] ?? category}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="inline-flex min-h-9 items-center justify-start gap-1.5 text-sm font-semibold text-[#11685f] sm:justify-end">
                    Συμπλήρωση
                    <ArrowRight size={15} className="shrink-0" />
                  </span>
                </button>
              );
            })}
          </div>
        </DataCard>
        <DataCard title="Κανόνες εγγράφων">
          <div className="divide-y divide-[#e3e9e2]">
            {assetsWithGapsByType.map((template) => (
              <div key={template.assetType} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-[#13211f]">{assetTypeLabels[template.assetType] ?? template.assetType}</h3>
                    <span className="text-xs font-medium text-slate-500">
                      {template.blockedByRule.length
                        ? assetGapSummary(template.blockedByRule.length, template.missingCount)
                        : "Χωρίς τρέχοντα κενά"}
                    </span>
                  </div>
                  <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                    {template.requiredCategories.map((category) => (
                      <span key={category} className="rounded-full border border-[#d9e2dc] bg-[#fbfaf6] px-2 py-0.5 text-xs font-medium text-slate-600">
                        {categoryLabels[category] ?? category}
                      </span>
                    ))}
                  </div>
                </div>
                <TextButton icon={Eye}>Άνοιγμα</TextButton>
              </div>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  );
}

function MaintenancePanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Συντήρηση"
        title="Τι service πρέπει να γίνει και από ποιον"
        description="Εκπρόθεσμες εργασίες, επόμενα service και κόστος σε μία ουρά εργασίας."
        action={<ActionButton icon={Wrench}>Νέα εργασία</ActionButton>}
      />
      <MetricStrip
        ariaLabel="Σύνοψη συντήρησης"
        items={[
          { icon: Wrench, label: "Ανοιχτές", value: maintenanceTasks.length, detail: "Εργασίες συντήρησης", tone: "slate" },
          { icon: AlertTriangle, label: "Εκπρόθεσμες", value: overdueMaintenance.length, detail: "Θέλουν ανάθεση", tone: "red" },
          { icon: ClipboardList, label: "Κόστος", value: formatCurrency(totalMaintenanceCost), detail: "Καταγεγραμμένο κόστος", tone: "teal" },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_340px]">
        <DataCard title="Ουρά εργασιών">
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip active>Όλες</FilterChip>
            <FilterChip>Εκπρόθεσμες</FilterChip>
            <FilterChip>Προγραμματισμένες</FilterChip>
            <FilterChip>Με κόστος</FilterChip>
          </div>
          <div className="space-y-2">
            {maintenanceTasks.map((task) => {
              const days = daysUntil(task.dueAt);

              return (
                <div key={task.id} className="grid gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#13211f]">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {getAsset(task.assetId)?.code} · {task.owner} · {formatDate(task.dueAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {days < 0 ? `Καθυστέρηση ${Math.abs(days)} ημερών` : `Σε ${days} ημέρες`}
                      {task.cost ? ` · ${formatCurrency(task.cost)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusPill label={statusLabels[task.status]} tone={task.status} />
                    <TextButton icon={Users}>Ανάθεση</TextButton>
                  </div>
                </div>
              );
            })}
          </div>
        </DataCard>
        <TodayPanel setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

function IssuesPanel() {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Βλάβες"
        title="Τι κρατάει πάγια εκτός δουλειάς"
        description="Blocking βλάβες, υπεύθυνοι και επόμενη ενέργεια για να μη μπει λάθος πάγιο στο πρόγραμμα."
        action={<ActionButton icon={QrCode}>Νέα βλάβη</ActionButton>}
      />
      <MetricStrip
        ariaLabel="Σύνοψη βλαβών"
        items={[
          { icon: AlertTriangle, label: "Ανοιχτές", value: issues.length, detail: "Χρειάζονται παρακολούθηση", tone: "slate" },
          { icon: Truck, label: "Blocking", value: blockingIssues.length, detail: "Μπλοκάρουν ανάθεση", tone: "red" },
          { icon: Users, label: "Με υπεύθυνο", value: issues.filter((issue) => issue.assignee).length, detail: "Έχουν ανάθεση", tone: "teal" },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_340px]">
        <DataCard title="Ανοιχτές βλάβες">
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip active>Όλες</FilterChip>
            <FilterChip>Blocking</FilterChip>
            <FilterChip>High/Critical</FilterChip>
            <FilterChip>Σε εξέλιξη</FilterChip>
          </div>
          <div className="space-y-2">
            {issues.map((issue) => {
              const asset = getAsset(issue.assetId);

              return (
                <div key={issue.id} className="grid gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#13211f]">{issue.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {asset?.code} · {asset?.location} · άνοιξε {formatDate(issue.openedAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Υπεύθυνος: {issue.assignee}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusPill
                      label={issue.blocking ? "μη διαθέσιμο" : statusLabels[issue.severity]}
                      tone={issue.blocking ? "blocked" : issue.severity === "critical" ? "criticalIssue" : issue.severity}
                    />
                    <StatusPill label={statusLabels[issue.status]} tone={issue.status} />
                    <TextButton icon={Eye}>Άνοιγμα</TextButton>
                  </div>
                </div>
              );
            })}
          </div>
        </DataCard>
        <DataCard title="Μπλοκάρουν ανάθεση">
          <div className="space-y-2">
            {blockingIssues.map((issue) => {
              const asset = getAsset(issue.assetId);

              return (
                <div key={issue.id} className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#13211f]">{asset?.code}</p>
                    <StatusPill label="μη διαθέσιμο" tone="blocked" />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{asset?.name}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{issue.title}</p>
                </div>
              );
            })}
          </div>
        </DataCard>
      </div>
    </div>
  );
}

function OperatorsPanel() {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Χειριστές"
        title="Άδειες και αναθέσεις χειριστών"
        description="Ποιος είναι διαθέσιμος, ποια άδεια λήγει και σε ποιο πάγιο είναι συνδεδεμένος."
        action={<ActionButton icon={Users}>Νέος χειριστής</ActionButton>}
      />
      <MetricStrip
        ariaLabel="Σύνοψη χειριστών"
        items={[
          { icon: Users, label: "Χειριστές", value: operators.length, detail: "Ενεργοί άνθρωποι", tone: "slate" },
          {
            icon: Truck,
            label: "Αναθέσεις",
            value: operators.reduce((sum, operator) => sum + operator.assignedAssetIds.length, 0),
            detail: "Συνδεδεμένα πάγια",
            tone: "teal",
          },
          { icon: AlertTriangle, label: "Κοντινές λήξεις", value: "1", detail: "Άδειες στις 30 ημέρες", tone: "amber" },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_340px]">
        <DataCard title="Ομάδα χειριστών">
          <div className="divide-y divide-[#e3e9e2]">
            {operators.map((operator) => {
              const days = daysUntil(operator.licenseExpiresAt);

              return (
                <div key={operator.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e7ece8] text-slate-700">
                      <HardHat size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#13211f]">{operator.name}</p>
                      <p className="mt-1 truncate text-sm text-slate-600">{operator.role} · {operator.phone}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Άδεια {formatDate(operator.licenseExpiresAt)} · {days <= 30 ? `λήγει σε ${days} ημέρες` : "εντός ορίου"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {operator.assignedAssetIds.map((assetId) => (
                      <StatusPill key={assetId} label={getAsset(assetId)?.code ?? "Asset"} tone="scheduled" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DataCard>
        <DataCard title="Άδειες">
          <div className="space-y-2">
            {operators.map((operator) => {
              const days = daysUntil(operator.licenseExpiresAt);
              const urgent = days <= 30;

              return (
                <div key={operator.id} className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-[#13211f]">{operator.name}</p>
                    <StatusPill label={urgent ? "προειδοποίηση" : "έγκυρο"} tone={urgent ? "warning" : "valid"} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(operator.licenseExpiresAt)}</p>
                </div>
              );
            })}
          </div>
        </DataCard>
      </div>
    </div>
  );
}

function CopilotPanel() {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Copilot"
        title="Ρώτα για στόλο, έγγραφα και βλάβες"
        description="Το Copilot απαντά μόνο με δεδομένα της εταιρείας, δείχνει πηγές και σταματά όταν λείπουν στοιχεία."
        action={<StatusPill label="πηγές ενεργές" tone="valid" />}
      />
      <MetricStrip
        ariaLabel="Σύνοψη Copilot"
        items={[
          { icon: Bot, label: "Λειτουργία", value: "Ops", detail: "Μόνο εταιρικές εγγραφές", tone: "teal" },
          { icon: ClipboardList, label: "Πηγές", value: attentionItems.slice(0, 5).length, detail: "Ορατές αναφορές", tone: "slate" },
          { icon: ShieldCheck, label: "Κανόνες", value: "On", detail: "Χωρίς νομική συμβουλή", tone: "amber" },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <DataCard title="Ερώτηση">
          <div className="rounded-lg border border-[#d9e2dc] bg-[#f7faf4] p-4">
            <div className="flex items-center gap-3 rounded-md border border-[#cfe3da] bg-[#fbfaf6] px-4 py-3">
              <Bot className="text-[#117064]" size={20} />
              <span className="text-sm text-slate-600">Τι πρέπει να προλάβουμε πριν βγει το πρόγραμμα;</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Ποια πάγια δεν ανατίθενται;", "Τι λήγει σε 30 ημέρες;", "Τι service έχει καθυστερήσει;"].map((prompt) => (
                <FilterChip key={prompt}>{prompt}</FilterChip>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-[#29473f] bg-[#203832] p-5 text-[#f7faf4]">
            <p className="text-sm font-semibold text-[#aee5d8]">Απάντηση</p>
            <p className="mt-3 text-sm leading-6 text-[#d8e4de]">
              Πρώτα κλείσε το KTEO του B-12, μετά την επισκευή του EX-01 και στη συνέχεια τον έλεγχο για το CR-04.
              Το FL-02 χρειάζεται εκπρόθεσμο service πριν θεωρηθεί καθαρό για ανάθεση.
            </p>
          </div>
        </DataCard>
        <DataCard title="Πηγές">
          <div className="space-y-2">
            {attentionItems.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#13211f]">{item.source}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{item.label}</p>
                  </div>
                  <StatusPill label={statusLabels[item.kind] ?? item.kind} tone={item.kind} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  );
}

function ReportsPanel() {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Αναφορές"
        title="Έτοιμες αναφορές για διοίκηση και audit"
        description="Καθαρές εξαγωγές για προσοχή, λήξεις, συντήρηση και ετοιμότητα χωρίς χειροκίνητο καθάρισμα."
        action={<ActionButton icon={Download}>Export αναφοράς</ActionButton>}
      />
      <MetricStrip
        ariaLabel="Σύνοψη αναφορών"
        items={[
          { icon: ClipboardList, label: "Πρότυπα", value: "4", detail: "Έτοιμες αναφορές", tone: "slate" },
          { icon: FileText, label: "Πηγές", value: "5", detail: "Πάγια, έγγραφα, service", tone: "teal" },
          { icon: Download, label: "Μορφή", value: "PDF/CSV", detail: "Για έλεγχο και αποστολή", tone: "amber" },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Αναφορά προσοχής", "Κρίσιμα, προειδοποιήσεις, ελλείψεις και μη διαθέσιμες εγγραφές", "Για πρωινό meeting"],
          ["Λήξεις εγγράφων", "Ημερομηνίες λήξης ανά πάγιο και κατηγορία", "Για compliance follow-up"],
          ["Εκπρόθεσμο service", "Εργασίες, κόστος και υπεύθυνοι", "Για συνεργείο"],
          ["Αναφορά ετοιμότητας", "Scores με αιτίες και πηγές", "Για ανάθεση στόλου"],
        ].map(([title, detail, meta]) => (
          <button
            key={title}
            type="button"
            className="group flex min-h-[188px] flex-col justify-between rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <span>
              <ClipboardList className="text-teal-800" size={20} />
              <p className="mt-3 font-semibold text-[#13211f]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{meta}</p>
            </span>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#11685f]">
              Export
              <ArrowRight className="transition group-hover:translate-x-0.5" size={15} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Ρυθμίσεις"
        title="Ρυθμίσεις εταιρείας"
        description="Ρόλοι, ειδοποιήσεις, εισαγωγές, χρέωση, audit και κανόνες AI σε καθαρές ομάδες."
      />
      <MetricStrip
        ariaLabel="Σύνοψη ρυθμίσεων"
        items={[
          { icon: Users, label: "Ρόλοι", value: "7", detail: "Owner έως Auditor", tone: "slate" },
          { icon: Bell, label: "Υπενθυμίσεις", value: "6", detail: "60 ημέρες έως λήξη", tone: "teal" },
          { icon: ShieldCheck, label: "Audit", value: "On", detail: "Αλλαγές και AI χρήση", tone: "amber" },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { title: "Χρήστες και ρόλοι", detail: "Owner, Admin, Operations, Compliance, Mechanic, Operator, Auditor", icon: Users },
          { title: "Ειδοποιήσεις", detail: "Παράθυρα 60, 30, 14, 7 ημερών και υπενθύμιση στη λήξη", icon: Bell },
          { title: "Καταγραφές audit", detail: "Αλλαγές, overrides, εισαγωγές και χρήση AI στην ομάδα", icon: ClipboardList },
          { title: "Χρέωση", detail: "Χειροκίνητο τιμολόγιο πρώτα, Stripe-ready αργότερα", icon: Save },
          { title: "Εισαγωγές", detail: "CSV, Excel, φάκελοι, ουρά ελέγχου και έγκριση δημοσίευσης", icon: UploadCloud },
          { title: "Κανόνες AI", detail: "Πηγές, δήλωση ελλιπών δεδομένων και χωρίς νομική συμβουλή", icon: Bot },
        ].map((item) => {
          const Icon = item.icon;

          return (
          <DataCard key={item.title} title={item.title}>
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#e7ece8] text-slate-700 ring-1 ring-[#d2dbd5]">
                <Icon size={18} />
              </span>
              <p className="text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#e3e9e2] pt-3">
              <StatusPill label="ρυθμισμένο" tone="valid" />
              <TextButton icon={Settings}>Άνοιγμα</TextButton>
            </div>
          </DataCard>
          );
        })}
      </div>
    </div>
  );
}

function TodayPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  return (
    <DataCard title="Σήμερα">
      <div className="space-y-5">
        <section aria-labelledby="today-deadlines-title">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 id="today-deadlines-title" className="text-sm font-semibold text-[#13211f]">
              Προθεσμίες
            </h3>
            <TextButton icon={FileText} onClick={() => setActiveTab("documents")}>
              Έγγραφα
            </TextButton>
          </div>
          <div className="space-y-0">
            {expiringDocuments.slice(0, 4).map((document) => (
              <button
                key={document.id}
                type="button"
                onClick={() => setActiveTab("documents")}
                className="grid min-h-[58px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#e3e9e2] py-3 text-left transition hover:text-teal-900 first:pt-0 last:border-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-5 text-[#13211f]">{document.title}</p>
                  <p className="text-xs text-slate-500">
                    {document.expiresAt ? formatDate(document.expiresAt) : "Χωρίς λήξη"}
                  </p>
                </div>
                <StatusPill label={statusLabels[documentStatus(document)]} tone={documentStatus(document)} />
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="today-assignments-title" className="border-t border-[#e3e9e2] pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 id="today-assignments-title" className="text-sm font-semibold text-[#13211f]">
              Αναθέσεις
            </h3>
            <TextButton icon={AlertTriangle} onClick={() => setActiveTab("issues")}>
              Βλάβες
            </TextButton>
          </div>
          <div className="space-y-2">
            {issues.slice(0, 2).map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => setActiveTab("issues")}
                className="grid min-h-[68px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#13211f]">{getAsset(issue.assetId)?.code}</span>
                  <span className="mt-1 block truncate text-sm text-slate-600">{issue.assignee}</span>
                  <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">{issue.title}</span>
                </span>
                <ArrowRight className="text-[#11685f]" size={15} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </DataCard>
  );
}

export function OperationsConsole() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const activeMeta = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab]);

  return (
    <div className="min-h-screen bg-[#edf1ee] text-[#13211f]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[#d9e2dc] bg-[#f8f7f2]/95 px-4 py-5 backdrop-blur xl:block">
        <div>
          <FleetLeverLogo />
        </div>

        <nav className="mt-8" aria-label="FleetLever sections">
          <div className="space-y-1" role="tablist" aria-orientation="vertical">
            {tabs.map((item) => {
              const Icon = item.icon;
              const selected = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${item.id}-panel`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    selected ? "bg-[#e2f0ea] text-[#123d37]" : "text-slate-600 hover:bg-[#eef3ed] hover:text-[#123d37]"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#d9e2dc] bg-[#f8f7f2]/92 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="shrink-0 xl:hidden">
              <FleetLeverLogo compact />
            </div>
            <button
              type="button"
              className="hidden h-10 min-w-[150px] shrink-0 items-center gap-2 rounded-md border border-[#cfe3da] bg-[#eaf5ef] px-3 text-left text-[#123d37] transition hover:border-teal-200 hover:bg-[#e2f0ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 md:inline-flex"
              aria-label="Τρέχουσα τοποθεσία: Athens Depot"
            >
              <Building2 size={17} className="text-teal-700" />
              <span>
                <span className="block text-sm font-semibold leading-4">Athens Depot</span>
                <span className="block text-xs leading-5 text-[#117064]">5 πάγια · 3 χειριστές</span>
              </span>
            </button>
            <div className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-md border border-[#d9e2dc] bg-[#f3f5f0] px-3">
              <Search className="shrink-0 text-slate-400" size={18} />
              <span className="truncate text-sm text-slate-500">Αναζήτηση παγίου, KTEO, χειριστή ή βλάβης...</span>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="hidden items-center gap-2 2xl:inline-flex">
                <IconButton icon={Truck} label="Νέο πάγιο" description="Καταχώριση οχήματος, μηχανήματος ή εξοπλισμού." />
                <IconButton
                  icon={FileText}
                  label="Ανέβασμα εγγράφου"
                  description="Προσθήκη άδειας, KTEO, πιστοποιητικού ή άλλου αρχείου."
                />
                <IconButton icon={QrCode} label="Νέα βλάβη" description="Γρήγορη αναφορά προβλήματος από πεδίο ή γραφείο." />
                <IconButton icon={Bell} label="Ειδοποιήσεις" description="Έλεγχος υπενθυμίσεων, προθεσμιών και αναθέσεων." />
              </span>
              <ToolbarMenu />
            </div>
          </div>
          <div className="border-t border-[#d9e2dc] px-4 py-2 xl:hidden">
            <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="FleetLever sections">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={item.id === activeTab}
                  onClick={() => setActiveTab(item.id)}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                    item.id === activeTab ? "bg-[#11685f] text-white" : "bg-[#fbfaf6] text-slate-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main
          className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-1 lg:px-8"
        >
          <section
            id={`${activeMeta.id}-panel`}
            role="tabpanel"
            aria-label={activeMeta.label}
            className="min-w-0"
          >
            {activeTab === "dashboard" && <DashboardPanel setActiveTab={setActiveTab} />}
            {activeTab === "command" && <CommandPanel setActiveTab={setActiveTab} />}
            {activeTab === "assets" && <AssetsPanel setActiveTab={setActiveTab} />}
            {activeTab === "documents" && <DocumentsPanel setActiveTab={setActiveTab} />}
            {activeTab === "compliance" && <CompliancePanel />}
            {activeTab === "maintenance" && <MaintenancePanel setActiveTab={setActiveTab} />}
            {activeTab === "issues" && <IssuesPanel />}
            {activeTab === "operators" && <OperatorsPanel />}
            {activeTab === "copilot" && <CopilotPanel />}
            {activeTab === "reports" && <ReportsPanel />}
            {activeTab === "settings" && <SettingsPanel />}
          </section>
        </main>
      </div>
    </div>
  );
}
