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
  { id: "command", label: "Εντολές", icon: Command },
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
  blocked: "blocked",
  inactive: "ανενεργό",
  valid: "valid",
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

function ActionButton({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#11685f] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f5c55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: "teal" | "amber" | "red" | "slate";
}) {
  const accents = {
    teal: "bg-[#e3f2ec] text-[#11685f] ring-[#c7e2d6]",
    amber: "bg-[#fff4d7] text-[#8b5d16] ring-[#efd99a]",
    red: "bg-[#fdeceb] text-[#b23838] ring-[#f0c4c0]",
    slate: "bg-[#e7ece8] text-slate-700 ring-[#d2dbd5]",
  };

  return (
    <div className="flex min-h-[148px] flex-col justify-between rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="min-h-10 text-sm font-medium leading-5 text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-[#13211f]">{value}</p>
        </div>
        <div className={`shrink-0 rounded-md p-2 ring-1 ${accents[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="min-w-[120px]">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Readiness</span>
        <span className="font-mono text-slate-700">{score}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e7ece8]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
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
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
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

function DashboardSignal({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#13211f]">{value}</p>
      <p className="mt-1 text-sm leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function DashboardPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <div className="p-5 sm:p-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#117064]">
              Παρασκευή, 29 Μαΐου 2026
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">Καλημέρα, Γιώργο</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Η εικόνα της ημέρας είναι έτοιμη για έλεγχο πριν κλειδώσει το πρόγραμμα.
            </p>
          </div>
        </div>
        <div className="grid gap-0 border-t border-[#d9e2dc] bg-[#f2f5ef] md:grid-cols-3 md:divide-x md:divide-[#d9e2dc]">
          <div className="border-b border-[#d9e2dc] p-4 md:border-b-0">
            <DashboardSignal
              label="Στόλος"
              value={`${readyAssets.length} έτοιμο · ${blockedAssets.length} blocked`}
              detail="Τα υπόλοιπα θέλουν έλεγχο"
            />
          </div>
          <div className="border-b border-[#d9e2dc] p-4 md:border-b-0">
            <DashboardSignal label="Κοντινή λήξη" value="CR-04 · 03 Ιουν" detail="Πιστοποιητικό ανύψωσης" />
          </div>
          <div className="p-4">
            <DashboardSignal label="Δεδομένα" value="Ενημερώθηκαν σήμερα" detail="Καμία γραμμή σε έλεγχο" />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#29473f] bg-[#203832] p-5 text-[#f7faf4] shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#aee5d8]">
            <Bot size={18} />
            Προτεραιότητες
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("copilot")}
            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-white/15 bg-white/10 px-3 text-sm font-semibold text-[#f7faf4] transition hover:border-[#aee5d8] hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aee5d8]"
          >
            Copilot
          </button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {[
            ["B-12", "Κλείσε ανανέωση KTEO πριν ανατεθεί σε διαδρομή.", "issues"],
            ["CR-04", "Ζήτησε ενημέρωση για το πιστοποιητικό ανύψωσης.", "documents"],
            ["FL-02", "Ανάθεσε την εκπρόθεσμη εργασία συντήρησης και έλεγξε το έγγραφο.", "maintenance"],
          ].map(([title, detail, tab]) => (
            <button
              key={title}
              type="button"
              onClick={() => setActiveTab(tab as TabId)}
              className="min-h-[96px] rounded-md border border-white/10 bg-white/[0.06] p-4 text-left transition hover:border-[#aee5d8] hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aee5d8]"
            >
              <p className="font-semibold text-[#f7faf4]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[#d8e4de]">{detail}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={Truck}
          label="Πάγια"
          value={String(assets.length)}
          detail="Σύνολο ενεργών εγγραφών"
          tone="teal"
        />
        <MetricTile
          icon={FileText}
          label="Έγγραφα"
          value={String(expiringDocuments.length)}
          detail="Λήξεις που θέλουν προσοχή"
          tone="amber"
        />
        <MetricTile
          icon={Wrench}
          label="Εκπρόθεσμη συντήρηση"
          value={String(overdueMaintenance.length)}
          detail={`${formatCurrency(totalMaintenanceCost)} σε κόστος συντήρησης`}
          tone="red"
        />
        <MetricTile
          icon={AlertTriangle}
          label="Βλάβες"
          value={String(blockingIssues.length)}
          detail="Επηρεάζουν ανάθεση παγίων"
          tone="red"
        />
      </div>
    </div>
  );
}

function CommandPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
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
      actionLabel: "Προγραμματισμός",
      icon: Wrench,
      tab: "maintenance",
      tone: "bg-[#e7ece8] text-slate-700 ring-[#d2dbd5]",
    },
  ];

  const searchScopes: { label: string; count: string; tab: TabId }[] = [
    { label: "Πάγια", count: String(assets.length), tab: "assets" },
    { label: "Έγγραφα", count: String(documents.length), tab: "documents" },
    { label: "Βλάβες", count: String(issues.length), tab: "issues" },
    { label: "Χειριστές", count: String(operators.length), tab: "operators" },
  ];

  const suggestedSearches: { query: string; target: string; tab: TabId }[] = [
    { query: "B-12 blocked", target: "Βλάβες", tab: "issues" },
    { query: "Έγγραφα επόμενων 30 ημερών", target: "Έγγραφα", tab: "documents" },
    { query: "Εκπρόθεσμη συντήρηση", target: "Συντήρηση", tab: "maintenance" },
  ];

  const importSteps: { label: string; detail: string; status: string; icon: LucideIcon }[] = [
    { label: "Upload", detail: "Excel, CSV ή φάκελος", status: "έτοιμο", icon: UploadCloud },
    { label: "Αντιστοίχιση", detail: "Πεδία και τύποι εγγράφων", status: "πρόταση AI", icon: Database },
    { label: "Έλεγχος", detail: "Χαμηλή εμπιστοσύνη", status: "σε έλεγχο", icon: ListChecks },
    { label: "Δημοσίευση", detail: "Audit event πριν περάσει live", status: "έγκριση", icon: CheckCircle2 },
  ];

  const commandResults: {
    code: string;
    title: string;
    detail: string;
    actionLabel: string;
    tone: string;
    tab: TabId;
  }[] = [
    {
      code: "B-12",
      title: "blocked · KTEO",
      detail: "Ληγμένο KTEO. Μην ανατεθεί σε διαδρομή.",
      actionLabel: "Άνοιγμα βλάβης",
      tone: "blocked",
      tab: "issues",
    },
    {
      code: "CR-04",
      title: "πιστοποιητικό · κοντινή λήξη",
      detail: "Πιστοποιητικό ανύψωσης λήγει στις 03 Ιουν.",
      actionLabel: "Έλεγχος εγγράφου",
      tone: "critical",
      tab: "documents",
    },
    {
      code: "FL-02",
      title: "συντήρηση · εκπρόθεσμη",
      detail: "Χρειάζεται ανάθεση εργασίας συντήρησης.",
      actionLabel: "Ανάθεση εργασίας",
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
            <span className="block text-base font-semibold text-[#13211f]">Αναζήτηση σε όλα τα records</span>
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
              className="grid min-h-[68px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="rounded-md bg-[#e7ece8] px-2.5 py-1 text-xs font-semibold text-[#13211f]">{result.code}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#13211f]">{result.title}</span>
                <span className="mt-0.5 block truncate text-sm text-slate-600">{result.detail}</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <StatusPill label={statusLabels[result.tone] ?? result.tone} tone={result.tone} />
                <span className="hidden text-xs font-semibold text-[#11685f] sm:block">{result.actionLabel}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {searchScopes.map((scope) => (
            <button
              key={scope.label}
              type="button"
              onClick={() => setActiveTab(scope.tab)}
              className="flex min-h-12 items-center justify-between rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-left text-sm transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="font-medium text-slate-700">{scope.label}</span>
              <span className="rounded-full bg-[#e7ece8] px-2 py-0.5 text-xs font-semibold text-slate-600">{scope.count}</span>
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

        <DataCard title="Συχνές αναζητήσεις">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { code: "B-12", label: "Ληγμένο KTEO", tab: "issues" as TabId },
              { code: "CR-04", label: "Πιστοποιητικό ανύψωσης", tab: "documents" as TabId },
              { code: "FL-02", label: "Εκπρόθεσμη συντήρηση", tab: "maintenance" as TabId },
            ].map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className="grid min-h-[58px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <span className="rounded-md bg-[#e7ece8] px-2 py-1 text-xs font-semibold text-[#13211f]">{item.code}</span>
                <span className="min-w-0 truncate text-sm text-slate-600">{item.label}</span>
                <ArrowRight size={15} className="text-slate-400" />
              </button>
            ))}
          </div>
        </DataCard>
      </div>

      <section className="rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#13211f]">Import onboarding</h2>
            <p className="mt-1 text-sm text-slate-600">Για αρχική φόρτωση Excel, CSV ή φακέλων. Δεν χρειάζεται κάθε μέρα.</p>
          </div>
          <TextButton icon={UploadCloud}>Άνοιγμα Import</TextButton>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
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
      </section>
    </div>
  );
}

function AssetsPanel() {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Πάγια"
        title="Ποια πάγια μπορούν να ανατεθούν σήμερα;"
        description="Κατάσταση στόλου, readiness και ελλείψεις εγγράφων χωρίς να ψάχνεις σε ξεχωριστές λίστες."
        action={<ActionButton icon={Truck}>Νέο πάγιο</ActionButton>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={Truck} label="Ready" value={String(readyAssets.length)} detail="Μπορούν να ανατεθούν" tone="teal" />
        <MetricTile icon={AlertTriangle} label="Blocked" value={String(blockedAssets.length)} detail="Μένουν εκτός δουλειάς" tone="red" />
        <MetricTile
          icon={FileText}
          label="Ελλείψεις"
          value={String(assets.filter((asset) => getMissingDocumentCategories(asset).length > 0).length)}
          detail="Λείπουν απαιτούμενα έγγραφα ή έλεγχοι"
          tone="amber"
        />
      </div>
      <DataCard title="Μητρώο">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <FilterChip active>Όλα</FilterChip>
            <FilterChip>Ready</FilterChip>
            <FilterChip>Blocked</FilterChip>
            <FilterChip>Με ελλείψεις</FilterChip>
          </div>
          <TextButton icon={Download}>Export στόλου</TextButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#d9e2dc] text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="py-3 pr-4 font-semibold">Πάγιο</th>
                <th className="py-3 pr-4 font-semibold">Τοποθεσία</th>
                <th className="py-3 pr-4 font-semibold">Χειριστής</th>
                <th className="py-3 pr-4 font-semibold">Κατάσταση</th>
                <th className="py-3 pr-4 font-semibold">Readiness</th>
                <th className="py-3 font-semibold">Λείπουν</th>
                <th className="py-3 pl-4 text-right font-semibold">Ενέργεια</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                const missing = getMissingDocumentCategories(asset);

                return (
                  <tr key={asset.id} className="border-b border-[#e3e9e2] align-top last:border-0">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-[#13211f]">{asset.code}</p>
                      <p className="text-slate-600">{asset.name}</p>
                      <p className="mt-1 font-mono text-xs text-slate-400">{asset.plate ?? asset.serial}</p>
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{asset.location}</td>
                    <td className="py-4 pr-4 text-slate-600">{asset.operator}</td>
                    <td className="py-4 pr-4">
                      <StatusPill label={statusLabels[asset.status]} tone={asset.status} />
                    </td>
                    <td className="py-4 pr-4">
                      <ReadinessBar score={getReadinessScore(asset)} />
                    </td>
                    <td className="py-4 text-slate-600">
                      {missing.length ? (
                        missing.map((item) => categoryLabels[item] ?? item).join(", ")
                      ) : (
                        <span className="text-emerald-700">Πλήρες</span>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <TextButton icon={Eye}>Άνοιγμα</TextButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DataCard>
    </div>
  );
}

function DocumentsPanel() {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Έγγραφα"
        title="Λήξεις, approvals και έγγραφα σε έλεγχο"
        description="Η ομάδα βλέπει πρώτα ό,τι λήγει, ό,τι είναι under review και τι χρειάζεται σύνδεση με πάγιο ή χειριστή."
        action={<ActionButton icon={FileText}>Ανέβασμα εγγράφου</ActionButton>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={FileText} label="Σύνολο" value={String(documents.length)} detail="Καταχωρημένα έγγραφα" tone="slate" />
        <MetricTile icon={AlertTriangle} label="Προθεσμίες" value={String(expiringDocuments.length)} detail="Ληγμένα ή κοντινές λήξεις" tone="amber" />
        <MetricTile
          icon={ShieldCheck}
          label="Σε έλεγχο"
          value={String(documents.filter((document) => document.reviewState === "under review").length)}
          detail="Χρειάζονται επιβεβαίωση"
          tone="teal"
        />
      </div>
      <DataCard title="Ουρά εγγράφων">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <FilterChip active>Όλα</FilterChip>
            <FilterChip>Ληγμένα</FilterChip>
            <FilterChip>30 ημέρες</FilterChip>
            <FilterChip>Σε έλεγχο</FilterChip>
          </div>
          <TextButton icon={UploadCloud}>Bulk upload</TextButton>
        </div>
        <div className="grid gap-3">
          {documents.map((document) => {
            const asset = document.assetId ? getAsset(document.assetId) : undefined;
            const status = documentStatus(document);
            const days = document.expiresAt ? daysUntil(document.expiresAt) : null;

            return (
              <div
                key={document.id}
                className="grid gap-3 rounded-lg border border-[#d9e2dc] bg-[#fdfbf7] p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
              >
                <div>
                  <p className="font-semibold text-[#13211f]">{document.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {categoryLabels[document.category]} · {asset?.code ?? document.operator} · confidence{" "}
                    {Math.round(document.confidence * 100)}%
                  </p>
                  {days !== null && (
                    <p className="mt-1 text-xs text-slate-500">
                      {days < 0 ? `Έληξε πριν ${Math.abs(days)} ημέρες` : `Λήγει σε ${days} ημέρες`}
                    </p>
                  )}
                </div>
                <StatusPill label={statusLabels[document.reviewState]} tone={document.reviewState} />
                <div className="text-sm text-slate-600">
                  {document.expiresAt ? (
                    <span className="inline-flex items-center gap-2">
                      {formatDate(document.expiresAt)}
                      <StatusPill label={statusLabels[status]} tone={status} />
                    </span>
                  ) : (
                    "Χωρίς λήξη"
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DataCard>
    </div>
  );
}

function CompliancePanel() {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Συμμόρφωση"
        title="Κανόνες εγγράφων ανά τύπο παγίου"
        description="Templates για το τι πρέπει να έχει κάθε τύπος παγίου. Το Copilot τα χρησιμοποιεί ως λειτουργικό checklist, όχι ως νομική συμβουλή."
        action={<ActionButton icon={ShieldCheck}>Νέο template</ActionButton>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={ShieldCheck} label="Templates" value={String(complianceTemplates.length)} detail="Τύποι παγίων" tone="slate" />
        <MetricTile icon={FileText} label="Κατηγορίες" value="7" detail="Ασφάλειες, KTEO, άδειες, certificates" tone="teal" />
        <MetricTile icon={AlertTriangle} label="Ελλείψεις" value={String(assets.filter((asset) => getMissingDocumentCategories(asset).length > 0).length)} detail="Πάγια με κενά" tone="amber" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {complianceTemplates.map((template) => (
          <DataCard key={template.assetType} title={template.assetType}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">{template.requiredCategories.length} απαιτούμενα έγγραφα</p>
              <TextButton icon={Eye}>Έλεγχος</TextButton>
            </div>
            <div className="flex flex-wrap gap-2">
              {template.requiredCategories.map((category) => (
                <span key={category} className="rounded-full border border-[#d9e2dc] bg-[#fdfbf7] px-2.5 py-1 text-xs font-medium text-slate-700">
                  {categoryLabels[category] ?? category}
                </span>
              ))}
            </div>
          </DataCard>
        ))}
      </div>
    </div>
  );
}

function MaintenancePanel() {
  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Συντήρηση"
        title="Τι service πρέπει να γίνει και από ποιον"
        description="Εκπρόθεσμες εργασίες, επόμενα service και κόστος σε μία ουρά εργασίας."
        action={<ActionButton icon={Wrench}>Νέα εργασία</ActionButton>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={Wrench} label="Ανοιχτές" value={String(maintenanceTasks.length)} detail="Εργασίες συντήρησης" tone="slate" />
        <MetricTile icon={AlertTriangle} label="Εκπρόθεσμες" value={String(overdueMaintenance.length)} detail="Θέλουν ανάθεση" tone="red" />
        <MetricTile icon={ClipboardList} label="Κόστος" value={formatCurrency(totalMaintenanceCost)} detail="Καταγεγραμμένο κόστος" tone="teal" />
      </div>
      <DataCard title="Ουρά εργασιών">
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterChip active>Όλες</FilterChip>
          <FilterChip>Εκπρόθεσμες</FilterChip>
          <FilterChip>Προγραμματισμένες</FilterChip>
          <FilterChip>Με κόστος</FilterChip>
        </div>
        <div className="space-y-3">
          {maintenanceTasks.map((task) => {
            const days = daysUntil(task.dueAt);

            return (
            <div key={task.id} className="rounded-lg border border-[#d9e2dc] bg-[#fdfbf7] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#13211f]">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {getAsset(task.assetId)?.code} · {task.owner} · {formatDate(task.dueAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {days < 0 ? `Καθυστέρηση ${Math.abs(days)} ημερών` : `Σε ${days} ημέρες`}
                    {task.cost ? ` · ${formatCurrency(task.cost)}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill label={statusLabels[task.status]} tone={task.status} />
                  <TextButton icon={Users}>Ανάθεση</TextButton>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </DataCard>
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
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={AlertTriangle} label="Ανοιχτές" value={String(issues.length)} detail="Χρειάζονται παρακολούθηση" tone="slate" />
        <MetricTile icon={Truck} label="Blocking" value={String(blockingIssues.length)} detail="Μπλοκάρουν ανάθεση" tone="red" />
        <MetricTile
          icon={Users}
          label="Ανατεθειμένες"
          value={String(issues.filter((issue) => issue.assignee).length)}
          detail="Έχουν υπεύθυνο"
          tone="teal"
        />
      </div>
      <DataCard title="Ανοιχτές βλάβες">
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterChip active>Όλες</FilterChip>
          <FilterChip>Blocking</FilterChip>
          <FilterChip>High/Critical</FilterChip>
          <FilterChip>Σε εξέλιξη</FilterChip>
        </div>
        <div className="space-y-3">
          {issues.map((issue) => {
            const asset = getAsset(issue.assetId);

            return (
            <div key={issue.id} className="rounded-lg border border-[#d9e2dc] bg-[#fdfbf7] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#13211f]">{issue.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {asset?.code} · {asset?.location} · άνοιξε {formatDate(issue.openedAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Υπεύθυνος: {issue.assignee}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill
                    label={issue.blocking ? "blocked" : statusLabels[issue.severity]}
                    tone={issue.blocking ? "blocked" : issue.severity === "critical" ? "criticalIssue" : issue.severity}
                  />
                  <StatusPill label={statusLabels[issue.status]} tone={issue.status} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <TextButton icon={Eye}>Άνοιγμα</TextButton>
                <TextButton icon={Users}>Ανάθεση</TextButton>
              </div>
            </div>
            );
          })}
        </div>
      </DataCard>
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
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={Users} label="Χειριστές" value={String(operators.length)} detail="Ενεργοί άνθρωποι" tone="slate" />
        <MetricTile icon={Truck} label="Αναθέσεις" value={String(operators.reduce((sum, operator) => sum + operator.assignedAssetIds.length, 0))} detail="Συνδεδεμένα πάγια" tone="teal" />
        <MetricTile icon={AlertTriangle} label="Κοντινές λήξεις" value="1" detail="Άδειες στις επόμενες 30 ημέρες" tone="amber" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {operators.map((operator) => {
          const days = daysUntil(operator.licenseExpiresAt);

          return (
          <DataCard key={operator.id} title={operator.name}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7ece8] text-slate-700">
                <HardHat size={20} />
              </div>
              <div>
                <p className="font-medium text-[#13211f]">{operator.role}</p>
                <p className="text-sm text-slate-600">{operator.phone}</p>
              </div>
            </div>
            <div className="mt-4 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
              <p className="text-sm font-semibold text-[#13211f]">Άδεια</p>
              <p className="mt-1 text-sm text-slate-600">{formatDate(operator.licenseExpiresAt)}</p>
              <p className="mt-1 text-xs text-slate-500">{days <= 30 ? `Λήγει σε ${days} ημέρες` : "Εντός ορίου"}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {operator.assignedAssetIds.map((assetId) => (
                <StatusPill key={assetId} label={getAsset(assetId)?.code ?? "Asset"} tone="scheduled" />
              ))}
            </div>
          </DataCard>
          );
        })}
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
        description="Το Copilot απαντά μόνο με records της εταιρείας, δείχνει citations και σταματά όταν λείπουν δεδομένα."
        action={<StatusPill label="citations on" tone="valid" />}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <DataCard title="Ερώτηση">
          <div className="rounded-lg border border-[#d9e2dc] bg-[#f7faf4] p-4">
            <div className="flex items-center gap-3 rounded-md border border-[#cfe3da] bg-[#fbfaf6] px-4 py-3">
              <Bot className="text-[#117064]" size={20} />
              <span className="text-sm text-slate-600">Τι πρέπει να προλάβουμε πριν βγει το πρόγραμμα;</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Ποια πάγια είναι blocked;", "Τι λήγει σε 30 ημέρες;", "Τι service έχει καθυστερήσει;"].map((prompt) => (
                <FilterChip key={prompt}>{prompt}</FilterChip>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-[#29473f] bg-[#203832] p-5 text-[#f7faf4]">
            <p className="text-sm font-semibold text-[#aee5d8]">Απάντηση</p>
            <p className="mt-3 text-sm leading-6 text-[#d8e4de]">
              Πρώτα κλείσε το KTEO του B-12, μετά την επισκευή του EX-01 και στη συνέχεια το follow-up για το CR-04.
              Το FL-02 χρειάζεται overdue service πριν θεωρηθεί καθαρό για ανάθεση.
            </p>
          </div>
        </DataCard>
        <DataCard title="Citations">
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
        description="Καθαρές εξαγωγές για attention, λήξεις, συντήρηση και readiness χωρίς χειροκίνητο καθάρισμα."
        action={<ActionButton icon={Download}>Export αναφοράς</ActionButton>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={ClipboardList} label="Templates" value="4" detail="Έτοιμες αναφορές" tone="slate" />
        <MetricTile icon={FileText} label="Πηγές" value="5" detail="Πάγια, έγγραφα, συντήρηση, βλάβες, χειριστές" tone="teal" />
        <MetricTile icon={Download} label="Format" value="PDF/CSV" detail="Για έλεγχο και αποστολή" tone="amber" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Attention report", "Κρίσιμα, προειδοποιήσεις, ελλείψεις και blocked records", "Για πρωινό meeting"],
          ["Λήξεις εγγράφων", "Ημερομηνίες λήξης ανά πάγιο και κατηγορία", "Για compliance follow-up"],
          ["Overdue service", "Εργασίες, κόστος και υπεύθυνοι", "Για συνεργείο"],
          ["Readiness report", "Scores με αιτίες και citations", "Για ανάθεση στόλου"],
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
        title="Έλεγχος εταιρείας και trust layer"
        description="Ρόλοι, ειδοποιήσεις, imports, billing, audit logs και AI κανόνες σε ομάδες που βγάζουν νόημα."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={Users} label="Ρόλοι" value="7" detail="Owner έως Auditor" tone="slate" />
        <MetricTile icon={Bell} label="Reminders" value="6" detail="60 ημέρες έως expired" tone="teal" />
        <MetricTile icon={ShieldCheck} label="Audit" value="On" detail="Sensitive changes και AI χρήση" tone="amber" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { title: "Χρήστες και ρόλοι", detail: "Owner, Admin, Operations, Compliance, Mechanic, Operator, Auditor", icon: Users },
          { title: "Ειδοποιήσεις", detail: "60, 30, 14, 7, day-of και expired reminder windows", icon: Bell },
          { title: "Audit logs", detail: "Sensitive changes, overrides, imports και operational AI use", icon: ClipboardList },
          { title: "Billing", detail: "Manual invoice mode πρώτα, Stripe-ready αργότερα", icon: Save },
          { title: "Imports", detail: "CSV, Excel, folder upload, review queue και publish approval", icon: UploadCloud },
          { title: "AI settings", detail: "Citations, missing-data disclosure και no legal advice", icon: Bot },
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
              <StatusPill label="configured" tone="valid" />
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
    <div className="space-y-4">
      <DataCard title="Προθεσμίες">
        <div className="space-y-0">
          {expiringDocuments.slice(0, 4).map((document) => (
            <button
              key={document.id}
              type="button"
              onClick={() => setActiveTab("documents")}
              className="grid min-h-[58px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#e3e9e2] py-3 text-left transition hover:text-teal-900 first:pt-0 last:border-0 last:pb-0"
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
      </DataCard>

      <DataCard title="Αναθέσεις">
        <div className="space-y-3">
          {issues.slice(0, 2).map((issue) => (
            <button
              key={issue.id}
              type="button"
              onClick={() => setActiveTab("issues")}
              className="min-h-[92px] w-full rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3.5 text-left transition hover:border-teal-300 hover:bg-[#eef7f2]"
            >
              <p className="text-sm font-semibold text-[#13211f]">{getAsset(issue.assetId)?.code}</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">{issue.assignee}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{issue.title}</p>
            </button>
          ))}
        </div>
      </DataCard>
    </div>
  );
}

function CommandContextPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  return (
    <div className="space-y-4">
      <DataCard title="Πρόσφατες εντολές">
        <div className="space-y-2">
          {[
            { title: "B-12 KTEO", detail: "Άνοιγμα βλάβης", tab: "issues" as TabId },
            { title: "CR-04 πιστοποιητικό", detail: "Έλεγχος εγγράφου", tab: "documents" as TabId },
            { title: "FL-02 συντήρηση", detail: "Ανάθεση εργασίας", tab: "maintenance" as TabId },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setActiveTab(item.tab)}
              className="grid min-h-[58px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#13211f]">{item.title}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">{item.detail}</span>
              </span>
              <ArrowRight size={15} className="text-slate-400" />
            </button>
          ))}
        </div>
      </DataCard>

      <DataCard title="Πρόχειρες ενέργειες">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className="w-full rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <p className="text-sm font-semibold text-[#13211f]">Ανέβασμα εγγράφου</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Σύνδεση νέου πιστοποιητικού με CR-04.</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("maintenance")}
            className="w-full rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <p className="text-sm font-semibold text-[#13211f]">Συντήρηση FL-02</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Ανάθεση στον Γιώργο Ράλλη.</p>
          </button>
        </div>
      </DataCard>

      <DataCard title="Συντομεύσεις">
        <div className="space-y-2 text-sm text-slate-600">
          {[
            ["Ctrl K", "Άνοιγμα αναζήτησης"],
            ["B-12", "Άμεσο φίλτρο παγίου"],
            ["KTEO", "Έγγραφα και λήξεις"],
          ].map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between gap-3 rounded-md border border-[#e3e9e2] bg-[#fdfbf7] px-3 py-2">
              <span>{label}</span>
              <span className="rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-2 py-1 text-xs font-semibold text-slate-500">
                {keys}
              </span>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
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
              <IconButton icon={Truck} label="Νέο πάγιο" description="Καταχώριση οχήματος, μηχανήματος ή εξοπλισμού." />
              <IconButton
                icon={FileText}
                label="Ανέβασμα εγγράφου"
                description="Προσθήκη άδειας, KTEO, πιστοποιητικού ή άλλου αρχείου."
              />
              <IconButton icon={QrCode} label="Νέα βλάβη" description="Γρήγορη αναφορά προβλήματος από πεδίο ή γραφείο." />
              <IconButton icon={Bell} label="Ειδοποιήσεις" description="Έλεγχος υπενθυμίσεων, προθεσμιών και αναθέσεων." />
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
          className={`mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:px-8 ${
            activeTab === "command" ? "lg:grid-cols-[minmax(0,1fr)_300px]" : "lg:grid-cols-[minmax(0,1fr)_340px]"
          }`}
        >
          <section
            id={`${activeMeta.id}-panel`}
            role="tabpanel"
            aria-label={activeMeta.label}
            className="min-w-0"
          >
            {activeTab === "dashboard" && <DashboardPanel setActiveTab={setActiveTab} />}
            {activeTab === "command" && <CommandPanel setActiveTab={setActiveTab} />}
            {activeTab === "assets" && <AssetsPanel />}
            {activeTab === "documents" && <DocumentsPanel />}
            {activeTab === "compliance" && <CompliancePanel />}
            {activeTab === "maintenance" && <MaintenancePanel />}
            {activeTab === "issues" && <IssuesPanel />}
            {activeTab === "operators" && <OperatorsPanel />}
            {activeTab === "copilot" && <CopilotPanel />}
            {activeTab === "reports" && <ReportsPanel />}
            {activeTab === "settings" && <SettingsPanel />}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {activeTab === "command" ? <CommandContextPanel setActiveTab={setActiveTab} /> : <TodayPanel setActiveTab={setActiveTab} />}
          </aside>
        </main>
      </div>
    </div>
  );
}
