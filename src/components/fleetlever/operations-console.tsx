"use client";

import { createContext, useContext, useEffect, useMemo, useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Command,
  Copy,
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
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UploadCloud,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import {
  type Asset,
  type FleetDocument,
  type FleetLeverData,
  type Issue,
  type MaintenanceTask,
  fallbackFleetData,
  documentStatus,
  daysUntil,
  formatCurrency,
  formatDate,
} from "@/lib/fleetlever";
import {
  approveDocument,
  archiveAsset,
  archiveDocument,
  archiveOperator,
  askCopilot,
  assignMaintenanceTask,
  completeMaintenanceTask,
  createAsset,
  createComplianceRule,
  createDocument,
  createIssue,
  createMaintenanceTask,
  createOperator,
  importFleetRows,
  recordReport,
  renewDocument,
  resolveIssue,
  switchWorkspace,
  updateAsset,
  updateDocument,
  updateIssue,
  updateMaintenanceTask,
  updateOperator,
  type ActionResult,
} from "@/app/actions";

type TabId =
  | "dashboard"
  | "command"
  | "assets"
  | "documents"
  | "compliance"
  | "maintenance"
  | "issues"
  | "operators"
  | "calendar"
  | "reports";

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Κέντρο στόλου", icon: Gauge },
  { id: "assets", label: "Πάγια", icon: Truck },
  { id: "documents", label: "Έγγραφα", icon: FileText },
  { id: "compliance", label: "Συμμόρφωση", icon: ShieldCheck },
  { id: "maintenance", label: "Συντήρηση", icon: Wrench },
  { id: "issues", label: "Βλάβες", icon: AlertTriangle },
  { id: "operators", label: "Χειριστές", icon: Users },
  { id: "calendar", label: "Ημερολόγιο", icon: CalendarDays },
  { id: "reports", label: "Αναφορές", icon: BarChart3 },
];

type ActionModalKind = "asset" | "document" | "issue" | "maintenance" | "operator" | "rule" | "workspace" | "import" | null;

type OperationsActions = {
  openAction: (kind: Exclude<ActionModalKind, null>, defaults?: Record<string, string>) => void;
  runAction: (action: (formData: FormData) => Promise<ActionResult>, formData: FormData) => Promise<ActionResult>;
  isPending: boolean;
};

type CopilotResponse = {
  answer: string;
  conversationId?: string;
  citations: {
    table: string;
    id: string;
    title: string;
    excerpt: string;
  }[];
  suggestions: string[];
};

type SearchResult = {
  id: string;
  kind: "asset" | "document" | "issue" | "maintenance" | "operator";
  title: string;
  detail: string;
  meta: string;
  tone: string;
  tab: TabId;
  actionLabel: string;
  assetId?: string;
  documentId?: string;
  issueId?: string;
  taskId?: string;
  operatorId?: string;
};

type FocusRecord = (tab: TabId, recordId?: string) => void;

type FocusTarget = {
  tab: TabId;
  recordId: string;
};

type InsightItem = {
  id: string;
  title: string;
  detail: string;
  tone: string;
  tab: TabId;
  actionLabel: string;
  recordId?: string;
};

type TimelineItem = {
  id: string;
  date: string;
  title: string;
  detail: string;
  tone: string;
};

type CalendarItem = {
  id: string;
  date: string;
  title: string;
  detail: string;
  tone: string;
  tab: TabId;
};

type ReportType = "readiness" | "documents" | "maintenance" | "blockers";

type ImportPreviewRow = {
  rowNumber: number;
  data: Record<string, string>;
  status: "ready" | "duplicate" | "needs_review";
  note: string;
};

const FleetDataContext = createContext<FleetLeverData>(fallbackFleetData);
const OperationsActionsContext = createContext<OperationsActions>({
  openAction: () => {},
  runAction: async () => ({ ok: false, message: "Η ενέργεια δεν είναι διαθέσιμη." }),
  isPending: false,
});

function useFleetData() {
  return useContext(FleetDataContext);
}

function useOperationsActions() {
  return useContext(OperationsActionsContext);
}

function searchResultRecordId(result?: SearchResult) {
  if (!result) return undefined;

  return result.documentId ?? result.issueId ?? result.taskId ?? result.operatorId ?? result.assetId;
}

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
  triaged: "σε αξιολόγηση",
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
      className={`inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass(tone)}`}
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
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-[#13211f] sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 self-start lg:self-auto">{action}</div> : null}
    </div>
  );
}

function IconButton({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        onClick={onClick}
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
  const { openAction } = useOperationsActions();
  const data = useFleetData();

  function exportSnapshot() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fleetlever-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <span className="group relative inline-flex">
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-teal-300 hover:bg-[#f2f7f2] hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        type="button"
        aria-label="Περισσότερες ενέργειες. Import και Export δεδομένων."
        aria-haspopup="menu"
      >
        <MoreHorizontal size={18} />
      </button>
      <div role="menu" className="absolute right-0 top-11 z-40 hidden w-64 rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-2 text-left shadow-xl ring-1 ring-slate-950/5 group-hover:block group-focus-within:block">
        <button
          type="button"
          role="menuitem"
          onClick={() => openAction("import")}
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
          role="menuitem"
          onClick={exportSnapshot}
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
  if (count === 4) return "grid-cols-2 lg:grid-cols-4";
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
              <span className="block truncate text-xs font-medium text-slate-500 sm:text-sm">{item.label}</span>
              <span className="mt-1 block text-xl font-semibold text-[#13211f] sm:text-2xl">{item.value}</span>
              <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600 sm:text-sm">{item.detail}</span>
            </span>
            {Icon ? (
              <span className={`shrink-0 rounded-md p-1.5 ring-1 sm:p-2 ${metricAccentClass(item.tone ?? "slate")}`}>
                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </span>
            ) : null}
          </>
        );
        const className = `flex min-h-[80px] items-center justify-between gap-3 border-b border-[#d9e2dc] p-3 text-left last:border-b-0 sm:min-h-[88px] sm:gap-4 sm:border-b-0 sm:p-4 ${
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

function OperationsPage({
  eyebrow,
  title,
  description,
  action,
  metrics,
  metricAriaLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  metrics?: MetricStripItem[];
  metricAriaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <PanelHeader eyebrow={eyebrow} title={title} description={description} action={action} />
      {metrics ? <MetricStrip ariaLabel={metricAriaLabel} items={metrics} /> : null}
      {children}
    </div>
  );
}

function SectionGrid({
  children,
  variant = "single",
}: {
  children: React.ReactNode;
  variant?: "single" | "two";
}) {
  const className = variant === "two" ? "grid items-stretch gap-4 xl:grid-cols-2" : "grid gap-4";

  return <div className={className}>{children}</div>;
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

function DataCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5 ${className}`}>
      <h2 className="text-base font-semibold text-[#13211f]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ title, detail, className = "" }: { title: string; detail?: string; className?: string }) {
  return (
    <div className={`rounded-md border border-dashed border-[#d9e2dc] bg-[#fdfbf7] p-6 text-center ${className}`}>
      <p className="text-sm font-semibold text-[#13211f]">{title}</p>
      {detail ? <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p> : null}
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d9e2dc] bg-[#fdfbf7] p-4">
      <h3 className="text-base font-semibold text-[#13211f]">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InspectorDrawer({
  titleId,
  eyebrow,
  title,
  description,
  closeLabel,
  onClose,
  children,
  footer,
}: {
  titleId: string;
  eyebrow: string;
  title: string;
  description: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-slate-950/30"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-[#d9e2dc] bg-[#fbfaf6] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-[#d9e2dc] bg-[#fbfaf6]/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117064]">{eyebrow}</p>
              <h2 id={titleId} className="mt-2 break-words text-2xl font-semibold leading-tight text-[#13211f]">
                {title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] text-slate-600 transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label={closeLabel}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">{children}</div>

        <div className="sticky bottom-0 border-t border-[#d9e2dc] bg-[#fbfaf6]/95 p-3 backdrop-blur">
          {footer}
        </div>
      </aside>
    </div>
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
      className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-3 text-sm font-semibold text-[#123d37] transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
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
      className={`inline-flex min-h-9 max-w-full items-center whitespace-nowrap rounded-full border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
        active
          ? "border-[#11685f] bg-[#e2f0ea] text-[#123d37]"
          : "border-[#d9e2dc] bg-[#fbfaf6] text-slate-600 hover:border-teal-300 hover:bg-[#eef7f2]"
      }`}
    >
      {children}
    </button>
  );
}

function GlobalSearchBox({
  query,
  onQueryChange,
  onNavigate,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onNavigate: (tab: TabId, result?: SearchResult) => void;
}) {
  const data = useFleetData();
  const { openAction, runAction } = useOperationsActions();
  const results = buildSearchResults(data, query);
  const [focused, setFocused] = useState(false);

  async function handleSecondary(result: SearchResult, event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (result.kind === "document" && result.documentId) {
      const document = data.documents.find((item) => item.id === result.documentId);
      if (document?.reviewState === "under review") {
        const formData = new FormData();
        formData.set("documentId", result.documentId);
        await runAction(approveDocument, formData);
        return;
      }
    }

    if (result.kind === "issue" && result.issueId) {
      const formData = new FormData();
      formData.set("issueId", result.issueId);
      await runAction(resolveIssue, formData);
      return;
    }

    if (result.assetId) {
      openAction(result.kind === "issue" ? "issue" : "document", { assetId: result.assetId });
    }
  }

  return (
    <div className="relative flex min-w-0 flex-1">
      <label className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-md border border-[#d9e2dc] bg-[#f3f5f0] px-3 transition focus-within:border-teal-200 focus-within:bg-[#eef7f2] focus-within:ring-2 focus-within:ring-teal-500/20">
        <Search className="shrink-0 text-slate-400" size={18} />
        <input
          type="search"
          value={query}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 160)}
          onChange={(event) => onQueryChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
          placeholder="Αναζήτηση παγίου, KTEO, χειριστή ή βλάβης..."
          aria-label="Αναζήτηση σε όλα τα δεδομένα FleetLever"
        />
      </label>
      {focused && query.trim() ? (
        <div className="absolute left-0 right-0 top-12 z-50 rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-2 shadow-xl ring-1 ring-slate-950/5">
          {results.length ? (
            <div className="max-h-[420px] space-y-1 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="grid w-full gap-3 rounded-md px-3 py-2.5 transition hover:bg-[#eef7f2] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <button
                    type="button"
                    onClick={() => onNavigate(result.tab, result)}
                    className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[#13211f]">{result.title}</span>
                      <StatusPill label={statusLabels[result.tone] ?? result.tone} tone={result.tone} />
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{result.meta}</span>
                    <span className="mt-1 block truncate text-sm text-slate-600">{result.detail}</span>
                  </button>
                  <span className="flex items-center justify-end gap-2">
                    {result.kind === "document" || result.kind === "issue" || result.assetId ? (
                      <button
                        type="button"
                        onClick={(event) => handleSecondary(result, event)}
                        className="hidden min-h-8 items-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-2.5 text-xs font-semibold text-[#123d37] transition hover:border-teal-300 hover:bg-[#f7faf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:inline-flex"
                      >
                        {result.kind === "issue" ? "Κλείσιμο" : "Ενέργεια"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onNavigate(result.tab, result)}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-[#11685f] transition hover:bg-[#f7faf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      {result.actionLabel}
                      <ArrowRight size={15} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Δεν βρέθηκαν αποτελέσματα" detail="Δοκίμασε κωδικό παγίου, χειριστή, KTEO ή περιγραφή βλάβης." />
          )}
        </div>
      ) : null}
    </div>
  );
}

function NotificationsDrawer({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: FocusRecord;
}) {
  const data = useFleetData();
  const notifications = buildNotifications(data);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="notifications-title">
      <button type="button" aria-label="Κλείσιμο ειδοποιήσεων" className="absolute inset-0 bg-slate-950/25" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[#d9e2dc] bg-[#fbfaf6] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#d9e2dc] bg-[#fbfaf6]/95 p-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117064]">Σήμερα</p>
            <h2 id="notifications-title" className="mt-1 text-xl font-semibold text-[#13211f]">Ειδοποιήσεις</h2>
            <p className="mt-1 text-sm text-slate-600">Μόνο όσα χρειάζονται ενέργεια ή προσοχή.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] text-slate-600 transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label="Κλείσιμο"
          >
            <X size={17} />
          </button>
        </div>
        <div className="space-y-2 p-5">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => {
                onNavigate(notification.tab, notification.recordId);
                onClose();
              }}
              className="grid w-full gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-[#13211f]">{notification.title}</span>
                <StatusPill label={statusLabels[notification.tone] ?? notification.tone} tone={notification.tone} />
              </span>
              <span className="line-clamp-2 text-sm leading-6 text-slate-600">{notification.detail}</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#11685f]">
                {notification.actionLabel}
                <ArrowRight size={15} />
              </span>
            </button>
          ))}
          {!notifications.length ? <EmptyState title="Δεν υπάρχουν ανοιχτές ειδοποιήσεις" detail="Οι άμεσες προθεσμίες και αναθέσεις είναι καθαρές." /> : null}
        </div>
      </aside>
    </div>
  );
}

function DashboardPanel({ setActiveTab, focusRecord }: { setActiveTab: (tab: TabId) => void; focusRecord: FocusRecord }) {
  const data = useFleetData();
  const { assets, documents, maintenanceTasks } = data;
  const readyAssets = assets.filter((asset) => asset.status === "ready");
  const blockedAssets = assets.filter((asset) => asset.status === "blocked");
  const expiringDocuments = documents.filter((document) =>
    ["expired", "critical", "warning"].includes(documentStatus(document)),
  );
  const overdueMaintenance = maintenanceTasks.filter((task) => task.status === "overdue");
  const readinessPercent = assets.length ? Math.round((readyAssets.length / assets.length) * 100) : 0;
  const overviewItems = [
    { icon: Truck, label: "Έτοιμα", value: readyAssets.length, detail: "Μπορούν να ανατεθούν", tab: "assets" as TabId },
    { icon: AlertTriangle, label: "Μη διαθέσιμα", value: blockedAssets.length, detail: "Μένουν εκτός", tab: "issues" as TabId },
    { icon: FileText, label: "Λήξεις", value: expiringDocuments.length, detail: "Έγγραφα με προθεσμία", tab: "documents" as TabId },
    { icon: Wrench, label: "Service", value: overdueMaintenance.length, detail: "Εκπρόθεσμες εργασίες", tab: "maintenance" as TabId },
  ];
  const b12KteoDocument = documents.find((document) => document.title.includes("B-12") && document.title.toLowerCase().includes("kteo"));
  const cr04Certificate = documents.find((document) => document.title.includes("CR-04") && document.title.includes("πιστοποιητικό"));
  const fl02Maintenance = maintenanceTasks.find((task) => findAsset(assets, task.assetId)?.code === "FL-02");
  const fl02InspectionDocument = documents.find((document) => document.title.includes("FL-02") && document.title.includes("περιοδικός"));
  const priorityItems = [
    b12KteoDocument
      ? { title: "B-12 KTEO", detail: "Κλείσε ανανέωση πριν μπει σε διαδρομή.", tab: "documents" as TabId, recordId: b12KteoDocument.id }
      : null,
    cr04Certificate
      ? { title: "CR-04 πιστοποιητικό", detail: "Έλεγξε τη λήξη ανύψωσης στις 03 Ιουν.", tab: "documents" as TabId, recordId: cr04Certificate.id }
      : null,
    fl02Maintenance
      ? { title: "FL-02 συντήρηση", detail: "Ανάθεσε την εκπρόθεσμη εργασία και κράτησε κόστος.", tab: "maintenance" as TabId, recordId: fl02Maintenance.id }
      : fl02InspectionDocument
        ? { title: "FL-02 περιοδικός έλεγχος", detail: "Ολοκλήρωσε τον έλεγχο πριν μπει σε πρόγραμμα.", tab: "documents" as TabId, recordId: fl02InspectionDocument.id }
        : null,
  ].filter((item): item is { title: string; detail: string; tab: TabId; recordId: string } => Boolean(item));

  return (
    <div className="space-y-4">
      <section
        className="overflow-hidden rounded-lg border border-[#bfd7ce] bg-[#fbfaf6] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
        aria-labelledby="fleet-overview-title"
      >
        <div className="grid gap-5 border-b border-[#d9e2dc] p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117064]">Κέντρο στόλου</p>
            <h1 id="fleet-overview-title" className="mt-2 max-w-3xl text-2xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Σήμερα στον στόλο
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Τι είναι έτοιμο, τι μπλοκάρει και τι χρειάζεται κλείσιμο πριν βγει το πρόγραμμα.
            </p>
          </div>
          <div className="self-start">
            <ActionButton icon={Command} onClick={() => setActiveTab("command")}>Copilot</ActionButton>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
          <div className="border-b border-[#d9e2dc] bg-[#edf7f2] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#11685f]">Ετοιμότητα ανάθεσης</p>
                <p className="mt-1 text-3xl font-semibold text-[#13211f]">
                  {readyAssets.length}/{assets.length}
                </p>
              </div>
              <span className="rounded-md bg-[#d6efe6] p-2 text-[#11685f] ring-1 ring-[#bde0d4]">
                <Truck size={20} />
              </span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Έτοιμα πάγια</span>
                <span className="font-semibold text-[#13211f]">{readinessPercent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#d8e4de]">
                <div className="h-full rounded-full bg-[#11685f]" style={{ width: `${readinessPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4">
            {overviewItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className="grid min-h-[112px] grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-r border-[#d9e2dc] p-4 text-left transition hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 [&:nth-child(2n)]:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(4n)]:border-r-0"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-500">{item.label}</span>
                    <span className="mt-2 block text-3xl font-semibold text-[#13211f]">{item.value}</span>
                    <span className="mt-1 block line-clamp-2 text-sm leading-5 text-slate-600">{item.detail}</span>
                  </span>
                  <span className="rounded-md bg-[#f2f5ef] p-2 text-slate-700 ring-1 ring-[#d9e2dc]">
                    <Icon size={18} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <DataCard title="Προτεραιότητες">
          <div className="divide-y divide-[#e3e9e2]">
            {priorityItems.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => focusRecord(item.tab, item.recordId)}
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

        <DeadlinesCard setActiveTab={setActiveTab} focusRecord={focusRecord} />
        <AssignmentsCard setActiveTab={setActiveTab} focusRecord={focusRecord} />
      </div>
    </div>
  );
}

type AssetFilter = "all" | "ready" | "blocked" | "missing";
type DocumentFilter = "attention" | "expired" | "upcoming" | "review" | "valid" | "all";
type MaintenanceFilter = "all" | "overdue" | "scheduled" | "cost";
type IssueFilter = "all" | "blocking" | "high" | "progress";

function findAsset(assets: Asset[], assetId?: string) {
  return assetId ? assets.find((asset) => asset.id === assetId) : undefined;
}

function getDocumentsForAsset(documents: FleetDocument[], assetId: string) {
  return documents.filter((document) => document.assetId === assetId);
}

function getTemplateForAsset(asset: Asset, complianceTemplates: FleetLeverData["complianceTemplates"]) {
  return complianceTemplates.find((template) => template.assetType === asset.type);
}

function getMissingDocumentCategoriesForAsset(
  asset: Asset,
  documents: FleetDocument[],
  complianceTemplates: FleetLeverData["complianceTemplates"],
) {
  const template = getTemplateForAsset(asset, complianceTemplates);
  if (!template) return [];

  const present = new Set(getDocumentsForAsset(documents, asset.id).map((document) => document.category));
  return template.requiredCategories.filter((category) => !present.has(category));
}

function getReadinessScoreForAsset(asset: Asset, data: FleetLeverData) {
  const assetDocuments = getDocumentsForAsset(data.documents, asset.id);
  const missing = getMissingDocumentCategoriesForAsset(asset, data.documents, data.complianceTemplates).length;
  const expired = assetDocuments.filter((document) => documentStatus(document) === "expired").length;
  const critical = assetDocuments.filter((document) => documentStatus(document) === "critical").length;
  const overdueMaintenance = data.maintenanceTasks.filter(
    (task) => task.assetId === asset.id && task.status === "overdue",
  ).length;
  const blockingIssues = data.issues.filter((issue) => issue.assetId === asset.id && issue.blocking).length;

  return Math.max(0, 100 - missing * 18 - expired * 25 - critical * 12 - overdueMaintenance * 18 - blockingIssues * 25);
}

function assetAction(asset: Asset): { label: string; tab: TabId } {
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

function assetBlockerText(asset: Asset, missing: string[], issues: Issue[]) {
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

function documentTarget(document: FleetDocument, assets: Asset[]) {
  const asset = findAsset(assets, document.assetId);

  if (asset) {
    return `${asset.code} · ${asset.name}`;
  }

  return document.operator ?? "Χωρίς σύνδεση";
}

function documentDueText(document: FleetDocument) {
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

function formatFileSize(bytes?: number) {
  if (!bytes) return "Χωρίς αρχείο";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function documentAction(document: FleetDocument) {
  const status = documentStatus(document);

  if (document.reviewState === "under review") {
    return "Έγκριση";
  }

  if (status === "expired" || status === "critical" || status === "warning") {
    return "Ανανέωση";
  }

  return "Άνοιγμα";
}

function isDocumentAttention(document: FleetDocument) {
  return document.reviewState === "under review" || ["expired", "critical", "warning"].includes(documentStatus(document));
}

function filterDocuments(documents: FleetDocument[], filter: DocumentFilter) {
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

function assetReadinessInsights(asset: Asset, data: FleetLeverData): InsightItem[] {
  const missing = getMissingDocumentCategoriesForAsset(asset, data.documents, data.complianceTemplates);
  const assetDocuments = data.documents.filter((document) => document.assetId === asset.id);
  const expiredOrUrgent = assetDocuments.filter((document) =>
    ["expired", "critical", "warning"].includes(documentStatus(document)) || document.reviewState === "under review",
  );
  const blockingIssues = data.issues.filter((issue) => issue.assetId === asset.id && issue.blocking);
  const overdueTasks = data.maintenanceTasks.filter((task) => task.assetId === asset.id && task.status === "overdue");
  const insights: InsightItem[] = [];

  for (const issue of blockingIssues) {
    insights.push({
      id: `issue-${issue.id}`,
      title: "Blocking βλάβη",
      detail: issue.title,
      tone: "blocked",
      tab: "issues",
      actionLabel: "Δες βλάβη",
      recordId: issue.id,
    });
  }

  for (const document of expiredOrUrgent.slice(0, 3)) {
    insights.push({
      id: `document-${document.id}`,
      title: document.reviewState === "under review" ? "Έγγραφο σε έλεγχο" : "Λήξη εγγράφου",
      detail: `${document.title} · ${documentDueText(document)}`,
      tone: document.reviewState === "under review" ? "under review" : documentStatus(document),
      tab: "documents",
      actionLabel: documentAction(document),
      recordId: document.id,
    });
  }

  for (const task of overdueTasks) {
    insights.push({
      id: `task-${task.id}`,
      title: "Εκπρόθεσμη συντήρηση",
      detail: `${task.title} · ${formatDate(task.dueAt)}`,
      tone: "overdue",
      tab: "maintenance",
      actionLabel: "Ανάθεση",
      recordId: task.id,
    });
  }

  for (const category of missing.slice(0, 4)) {
    insights.push({
      id: `missing-${asset.id}-${category}`,
      title: "Λείπει απαιτούμενο έγγραφο",
      detail: categoryLabels[category] ?? category,
      tone: "warning",
      tab: "documents",
      actionLabel: "Συμπλήρωση",
      recordId: asset.id,
    });
  }

  if (!insights.length) {
    return [
      {
        id: `ready-${asset.id}`,
        title: "Έτοιμο για ανάθεση",
        detail: "Δεν υπάρχουν blocking βλάβες ή άμεσες ελλείψεις.",
        tone: "valid",
        tab: "operators",
        actionLabel: "Ανάθεση",
      },
    ];
  }

  return insights;
}

function assetTimeline(asset: Asset, data: FleetLeverData): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const document of data.documents.filter((item) => item.assetId === asset.id)) {
    if (document.issuedAt) {
      items.push({
        id: `doc-issued-${document.id}`,
        date: document.issuedAt,
        title: `${categoryLabels[document.category] ?? document.category} καταχωρήθηκε`,
        detail: document.title,
        tone: document.reviewState === "under review" ? "under review" : "valid",
      });
    }
    if (document.expiresAt) {
      items.push({
        id: `doc-expiry-${document.id}`,
        date: document.expiresAt,
        title: documentDueText(document),
        detail: document.title,
        tone: documentStatus(document),
      });
    }
  }

  for (const issue of data.issues.filter((item) => item.assetId === asset.id)) {
    items.push({
      id: `issue-${issue.id}`,
      date: issue.openedAt,
      title: issue.blocking ? "Blocking βλάβη" : "Βλάβη",
      detail: issue.title,
      tone: issue.blocking ? "blocked" : issue.severity,
    });
  }

  for (const task of data.maintenanceTasks.filter((item) => item.assetId === asset.id)) {
    items.push({
      id: `task-${task.id}`,
      date: task.dueAt,
      title: task.status === "overdue" ? "Εκπρόθεσμη εργασία" : "Προγραμματισμένη εργασία",
      detail: task.title,
      tone: task.status,
    });
  }

  return items.sort((a, b) => new Date(`${a.date}T12:00:00+03:00`).getTime() - new Date(`${b.date}T12:00:00+03:00`).getTime());
}

function buildNotifications(data: FleetLeverData): InsightItem[] {
  const documentItems = data.documents
    .filter(isDocumentAttention)
    .map((document) => ({
      id: `notification-document-${document.id}`,
      title: documentAction(document),
      detail: `${document.title} · ${documentDueText(document)}`,
      tone: document.reviewState === "under review" ? "under review" : documentStatus(document),
      tab: "documents" as TabId,
      actionLabel: "Άνοιγμα",
      recordId: document.id,
    }));
  const issueItems = data.issues
    .filter((issue) => issue.blocking)
    .map((issue) => ({
      id: `notification-issue-${issue.id}`,
      title: "Πάγιο εκτός ανάθεσης",
      detail: issue.title,
      tone: "blocked",
      tab: "issues" as TabId,
      actionLabel: "Δες εμπόδια",
      recordId: issue.id,
    }));
  const taskItems = data.maintenanceTasks
    .filter((task) => task.status === "overdue")
    .map((task) => ({
      id: `notification-task-${task.id}`,
      title: "Εκπρόθεσμη συντήρηση",
      detail: `${task.title} · ${formatDate(task.dueAt)}`,
      tone: "overdue",
      tab: "maintenance" as TabId,
      actionLabel: "Ανάθεση",
      recordId: task.id,
    }));
  const operatorItems = data.operators
    .filter((operator) => daysUntil(operator.licenseExpiresAt) <= 30)
    .map((operator) => ({
      id: `notification-operator-${operator.id}`,
      title: "Άδεια χειριστή",
      detail: `${operator.name} · ${formatDate(operator.licenseExpiresAt)}`,
      tone: "warning",
      tab: "operators" as TabId,
      actionLabel: "Ανανέωση",
      recordId: operator.id,
    }));

  return [...issueItems, ...documentItems, ...taskItems, ...operatorItems].slice(0, 12);
}

function buildCalendarItems(data: FleetLeverData): CalendarItem[] {
  const documentItems = data.documents
    .filter((document) => document.expiresAt)
    .map((document) => ({
      id: `calendar-document-${document.id}`,
      date: document.expiresAt ?? "",
      title: document.title,
      detail: `${categoryLabels[document.category] ?? document.category} · ${document.assetCode ?? document.operator ?? "Record"}`,
      tone: documentStatus(document),
      tab: "documents" as TabId,
    }));
  const taskItems = data.maintenanceTasks.map((task) => ({
    id: `calendar-task-${task.id}`,
    date: task.dueAt,
    title: task.title,
    detail: `Συντήρηση · ${task.owner}`,
    tone: task.status,
    tab: "maintenance" as TabId,
  }));
  const operatorItems = data.operators.map((operator) => ({
    id: `calendar-operator-${operator.id}`,
    date: operator.licenseExpiresAt,
    title: `Άδεια ${operator.name}`,
    detail: operator.role,
    tone: daysUntil(operator.licenseExpiresAt) <= 30 ? "warning" : "valid",
    tab: "operators" as TabId,
  }));

  return [...documentItems, ...taskItems, ...operatorItems].sort(
    (a, b) => new Date(`${a.date}T12:00:00+03:00`).getTime() - new Date(`${b.date}T12:00:00+03:00`).getTime(),
  );
}

function buildSearchResults(data: FleetLeverData, query: string): SearchResult[] {
  const normalized = query.trim().toLocaleLowerCase("el-GR");
  if (!normalized) return [];

  const contains = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(" ").toLocaleLowerCase("el-GR").includes(normalized);
  const results: SearchResult[] = [];

  for (const asset of data.assets) {
    const missing = getMissingDocumentCategoriesForAsset(asset, data.documents, data.complianceTemplates);
    if (contains(asset.code, asset.name, asset.plate, asset.serial, asset.location, asset.operator, ...missing)) {
      results.push({
        id: `asset-${asset.id}`,
        kind: "asset",
        title: `${asset.code} · ${asset.name}`,
        detail: assetBlockerText(asset, missing, data.issues),
        meta: `Πάγιο · ${asset.location}`,
        tone: asset.status,
        tab: "assets",
        actionLabel: asset.status === "ready" ? "Ανάθεση" : "Άνοιγμα",
        assetId: asset.id,
      });
    }
  }

  for (const document of data.documents) {
    const asset = findAsset(data.assets, document.assetId);
    if (contains(document.title, document.category, asset?.code, asset?.name, document.operator)) {
      results.push({
        id: `document-${document.id}`,
        kind: "document",
        title: document.title,
        detail: documentDueText(document),
        meta: `Έγγραφο · ${asset?.code ?? document.operator ?? "Record"}`,
        tone: document.reviewState === "under review" ? "under review" : documentStatus(document),
        tab: "documents",
        actionLabel: documentAction(document),
        assetId: document.assetId,
        documentId: document.id,
      });
    }
  }

  for (const issue of data.issues) {
    const asset = findAsset(data.assets, issue.assetId);
    if (contains(issue.title, issue.assignee, asset?.code, asset?.name, issue.severity, issue.status)) {
      results.push({
        id: `issue-${issue.id}`,
        kind: "issue",
        title: issue.title,
        detail: `${asset?.code ?? "Πάγιο"} · ${issue.assignee}`,
        meta: issue.blocking ? "Βλάβη · μπλοκάρει" : "Βλάβη",
        tone: issue.blocking ? "blocked" : issue.severity,
        tab: "issues",
        actionLabel: issue.blocking ? "Δες εμπόδια" : "Άνοιγμα",
        assetId: issue.assetId,
        issueId: issue.id,
      });
    }
  }

  for (const task of data.maintenanceTasks) {
    const asset = findAsset(data.assets, task.assetId);
    if (contains(task.title, task.owner, asset?.code, asset?.name, task.status)) {
      results.push({
        id: `task-${task.id}`,
        kind: "maintenance",
        title: task.title,
        detail: `${asset?.code ?? "Πάγιο"} · ${formatDate(task.dueAt)}`,
        meta: "Συντήρηση",
        tone: task.status,
        tab: "maintenance",
        actionLabel: task.status === "overdue" ? "Ανάθεση" : "Άνοιγμα",
        assetId: task.assetId,
        taskId: task.id,
      });
    }
  }

  for (const operator of data.operators) {
    if (contains(operator.name, operator.role, operator.phone, ...operator.licenseCategories)) {
      results.push({
        id: `operator-${operator.id}`,
        kind: "operator",
        title: operator.name,
        detail: `${operator.role} · Άδεια έως ${formatDate(operator.licenseExpiresAt)}`,
        meta: "Χειριστής",
        tone: daysUntil(operator.licenseExpiresAt) <= 30 ? "warning" : "valid",
        tab: "operators",
        actionLabel: "Άνοιγμα",
        operatorId: operator.id,
      });
    }
  }

  return results.slice(0, 8);
}

function csvEscape(value: unknown) {
  const textValue = String(value ?? "");
  return /[",\n]/.test(textValue) ? `"${textValue.replaceAll("\"", "\"\"")}"` : textValue;
}

function downloadTextFile(fileName: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string) {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((cell) => cell.trim()));
  const headers = rows.shift() ?? [];

  return rows
    .filter((row) => row.some(Boolean))
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header || `field_${index + 1}`, row[index] ?? ""])),
    );
}

function inferDocumentDraft(value: string, data: FleetLeverData) {
  const normalized = value.toLocaleLowerCase("el-GR");
  const asset = data.assets.find((item) => normalized.includes(item.code.toLocaleLowerCase("el-GR")));
  const category =
    normalized.includes("kteo") || normalized.includes("κτεο")
      ? "KTEO"
      : normalized.includes("ασφαλ") || normalized.includes("insurance")
        ? "Insurance"
        : normalized.includes("ανύψ") || normalized.includes("lift")
          ? "Lifting certificate"
          : normalized.includes("περιοδ") || normalized.includes("inspection")
            ? "Periodic inspection"
            : normalized.includes("χειρισ") || normalized.includes("license")
              ? "Operator license"
              : normalized.includes("ασφαλείας") || normalized.includes("safety")
                ? "Safety document"
                : "";
  const dateMatch = value.match(/(20\d{2})[-_./ ]?(0[1-9]|1[0-2])[-_./ ]?([0-2]\d|3[01])/);
  const expiresAt = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : "";

  return { assetId: asset?.id ?? "", category, expiresAt };
}

function buildReportRows(data: FleetLeverData, reportType: ReportType): Record<string, string | number>[] {
  if (reportType === "documents") {
    return data.documents.map((document) => ({
      title: document.title,
      category: categoryLabels[document.category] ?? document.category,
      target: findAsset(data.assets, document.assetId)?.code ?? document.operator ?? "",
      due: document.expiresAt ? formatDate(document.expiresAt) : "Χωρίς λήξη",
      status: statusLabels[documentStatus(document)] ?? documentStatus(document),
      review: statusLabels[document.reviewState] ?? document.reviewState,
    }));
  }

  if (reportType === "maintenance") {
    return data.maintenanceTasks.map((task) => ({
      task: task.title,
      asset: findAsset(data.assets, task.assetId)?.code ?? "",
      owner: task.owner,
      due: formatDate(task.dueAt),
      status: statusLabels[task.status] ?? task.status,
      cost: task.cost ? formatCurrency(task.cost) : "",
    }));
  }

  if (reportType === "blockers") {
    return data.issues
      .filter((issue) => issue.blocking)
      .map((issue) => ({
        asset: findAsset(data.assets, issue.assetId)?.code ?? "",
        issue: issue.title,
        assignee: issue.assignee,
        severity: statusLabels[issue.severity] ?? issue.severity,
        opened: formatDate(issue.openedAt),
      }));
  }

  return data.assets.map((asset) => {
    const missing = getMissingDocumentCategoriesForAsset(asset, data.documents, data.complianceTemplates);
    return {
      code: asset.code,
      asset: asset.name,
      status: assetStatusLabel(asset.status),
      readiness: `${getReadinessScoreForAsset(asset, data)}%`,
      missing: missing.map((item) => categoryLabels[item] ?? item).join(" | "),
      blocker: assetBlockerText(asset, missing, data.issues),
    };
  });
}

function reportTypeLabel(reportType: ReportType) {
  const labels: Record<ReportType, string> = {
    readiness: "Ετοιμότητα παγίων",
    documents: "Έγγραφα και λήξεις",
    maintenance: "Συντήρηση",
    blockers: "Blocking βλάβες",
  };

  return labels[reportType];
}

function rowsToCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

function AssetDrawer({
  asset,
  onClose,
  setActiveTab,
}: {
  asset: Asset;
  onClose: () => void;
  setActiveTab: (tab: TabId) => void;
}) {
  const data = useFleetData();
  const { documents, issues, maintenanceTasks, operators, complianceTemplates } = data;
  const { openAction, runAction, isPending } = useOperationsActions();
  const missing = getMissingDocumentCategoriesForAsset(asset, documents, complianceTemplates);
  const score = getReadinessScoreForAsset(asset, data);
  const linkedDocuments = documents.filter((document) => document.assetId === asset.id);
  const linkedIssues = issues.filter((issue) => issue.assetId === asset.id && issue.status !== "resolved");
  const linkedMaintenance = maintenanceTasks.filter((task) => task.assetId === asset.id);
  const operator = operators.find((item) => item.name === asset.operator);
  const action = assetAction(asset);
  const readinessInsights = assetReadinessInsights(asset, data);
  const timeline = assetTimeline(asset, data);
  const fieldUrl = `/field/${asset.id}`;

  async function handleArchive() {
    const formData = new FormData();
    formData.set("assetId", asset.id);
    await runAction(archiveAsset, formData);
    onClose();
  }

  return (
    <InspectorDrawer
      titleId="asset-drawer-title"
      eyebrow={asset.type}
      title={`${asset.code} · ${asset.name}`}
      description={`${asset.plate ?? asset.serial} · ${asset.location}`}
      closeLabel="Κλείσιμο λεπτομερειών παγίου"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => openAction("document", { assetId: asset.id })}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <UploadCloud size={15} />
              Έγγραφο
            </button>
            <button
              type="button"
              onClick={() => openAction("issue", { assetId: asset.id })}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <QrCode size={15} />
              Βλάβη
            </button>
            <a
              href={fieldUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <QrCode size={15} />
              Field
            </a>
            <button
              type="button"
              onClick={() =>
                openAction("asset", {
                  assetId: asset.id,
                  code: asset.code,
                  name: asset.name,
                  assetType: asset.type,
                  ownership: asset.ownership,
                  plate: asset.plate ?? "",
                  serial: asset.serial ?? "",
                  department: asset.department,
                  operatorId: asset.operatorId ?? "",
                })
              }
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Eye size={15} />
              Επεξεργασία
            </button>
            <button
              type="button"
              onClick={handleArchive}
              disabled={isPending}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
            >
              <X size={15} />
              Αρχειοθέτηση
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
      }
    >
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

      <DrawerSection title="Λείπουν">
        <MissingDocumentChips missing={missing} limit={6} />
      </DrawerSection>

      <DrawerSection title="Γιατί έχει αυτή την ετοιμότητα">
        <div className="space-y-2">
          {readinessInsights.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.tab)}
              className="grid w-full gap-2 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#13211f]">{item.title}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{item.detail}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#11685f]">
                {item.actionLabel}
                <ArrowRight size={15} />
              </span>
            </button>
          ))}
        </div>
      </DrawerSection>

      <DrawerSection title="Field mode">
        <div className="grid gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#e3f2ec] text-[#11685f] ring-1 ring-[#c7e2d6]">
            <QrCode size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[#13211f]">Σύνδεσμος πεδίου για {asset.code}</span>
            <span className="mt-1 block truncate text-xs text-slate-500">{fieldUrl}</span>
          </span>
          <span className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${fieldUrl}`)}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-3 text-sm font-semibold text-[#123d37] transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Copy size={15} />
              Copy
            </button>
            <a
              href={fieldUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-3 text-sm font-semibold text-[#123d37] transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              Άνοιγμα
              <ArrowRight size={15} />
            </a>
          </span>
        </div>
      </DrawerSection>

      <DrawerSection title="Συνδεδεμένα έγγραφα">
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
      </DrawerSection>

      <DrawerSection title="Βλάβες και συντήρηση">
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
      </DrawerSection>

      <DrawerSection title="Timeline">
        <div className="space-y-3">
          {timeline.slice(0, 8).map((item) => (
            <div key={item.id} className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
              <span className="text-xs font-semibold text-slate-500">{formatDate(item.date)}</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[#13211f]">{item.title}</span>
                  <StatusPill label={statusLabels[item.tone] ?? item.tone} tone={item.tone} />
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{item.detail}</span>
              </span>
            </div>
          ))}
          {!timeline.length ? <p className="text-sm text-slate-500">Δεν υπάρχει ακόμη ιστορικό για αυτό το πάγιο.</p> : null}
        </div>
      </DrawerSection>

      <DrawerSection title="Χειριστής">
        <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
          <p className="text-sm font-semibold text-[#13211f]">{asset.operator}</p>
          <p className="mt-1 text-sm text-slate-600">{operator?.role ?? "Χειριστής"}</p>
          <p className="mt-1 text-xs text-slate-500">
            Άδεια έως {operator ? formatDate(operator.licenseExpiresAt) : "άγνωστο"}
          </p>
        </div>
      </DrawerSection>
    </InspectorDrawer>
  );
}

function CommandPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  const { openAction, runAction, isPending } = useOperationsActions();
  const [showImportSteps, setShowImportSteps] = useState(false);
  const [question, setQuestion] = useState("Τι πρέπει να κλείσει σήμερα πριν βγει το πρόγραμμα;");
  const [conversationId, setConversationId] = useState("");
  const [copilotResult, setCopilotResult] = useState<CopilotResponse | null>(null);
  const [copilotMessage, setCopilotMessage] = useState("");
  const commandActions: {
    label: string;
    detail: string;
	    actionLabel: string;
	    icon: LucideIcon;
	    tab: TabId;
	    modalKind: Exclude<ActionModalKind, null>;
	    tone: string;
	  }[] = [
    {
      label: "Νέο πάγιο",
      detail: "Καταχώριση οχήματος, μηχανήματος ή εξοπλισμού.",
      actionLabel: "Καταχώριση",
	      icon: Plus,
	      tab: "assets",
	      modalKind: "asset",
	      tone: "bg-[#e3f2ec] text-[#11685f] ring-[#c7e2d6]",
	    },
    {
      label: "Ανέβασμα εγγράφου",
      detail: "Προσθήκη KTEO, άδειας ή πιστοποιητικού σε υπάρχον πάγιο.",
      actionLabel: "Ανέβασμα",
	      icon: FileUp,
	      tab: "documents",
	      modalKind: "document",
	      tone: "bg-[#fff4d7] text-[#8b5d16] ring-[#efd99a]",
	    },
    {
      label: "Νέα βλάβη",
      detail: "Άμεση αναφορά προβλήματος που μπλοκάρει ανάθεση.",
      actionLabel: "Αναφορά",
	      icon: AlertTriangle,
	      tab: "issues",
	      modalKind: "issue",
	      tone: "bg-[#fdeceb] text-[#b23838] ring-[#f0c4c0]",
	    },
    {
      label: "Εργασία συντήρησης",
      detail: "Νέα εργασία συντήρησης με υπεύθυνο και προθεσμία.",
      actionLabel: "Ανάθεση",
	      icon: Wrench,
	      tab: "maintenance",
	      modalKind: "maintenance",
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

  async function handleCopilotSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (conversationId) {
      formData.set("conversationId", conversationId);
    }

    const result = await runAction(askCopilot, formData);
    setCopilotMessage(result.message);

    if (result.ok && result.data && typeof result.data === "object") {
      const response = result.data as CopilotResponse;
      setCopilotResult(response);
      setConversationId(response.conversationId ?? conversationId);
    }
  }

  return (
    <div className="space-y-4">
      <PanelHeader
        eyebrow="Εντολές"
        title="Βρες την επόμενη ενέργεια"
        description="Το κέντρο εντολών βρίσκει πάγια, έγγραφα, βλάβες και εργασίες συντήρησης και προτείνει το επόμενο βήμα."
      />

      <DataCard title="Copilot">
        <form onSubmit={handleCopilotSubmit} className="grid gap-3">
          <label className="grid gap-2 text-sm font-medium text-[#13211f]">
            Ερώτηση
            <textarea
              name="question"
              rows={3}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="min-h-[92px] resize-y rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-6 text-slate-600">
              Απαντά από τα live πάγια, έγγραφα, βλάβες και εργασίες και κρατάει ιστορικό συνομιλίας.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#11685f] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f5c55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60"
            >
              <Command size={16} />
              {isPending ? "Σκέφτεται..." : "Ρώτησε"}
            </button>
          </div>
          {copilotMessage && !copilotResult ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{copilotMessage}</p>
          ) : null}
        </form>
        {copilotResult ? (
          <div className="mt-4 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-4">
            <p className="text-sm leading-6 text-slate-700">{copilotResult.answer}</p>
            {copilotResult.citations.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {copilotResult.citations.map((citation) => (
                  <span
                    key={`${citation.table}-${citation.id}`}
                    className="max-w-full rounded-full border border-[#d9e2dc] bg-[#fbfaf6] px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {citation.title}: {citation.excerpt}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </DataCard>

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
	                  onClick={() => openAction(action.modalKind)}
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
            onClick={() => {
              setShowImportSteps(true);
              openAction("import");
            }}
            aria-expanded={showImportSteps}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-3 text-sm font-semibold text-[#123d37] transition hover:border-[#c9ded6] hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <UploadCloud size={15} />
            Άνοιγμα import
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
  const data = useFleetData();
  const { assets, documents, complianceTemplates, issues } = data;
  const { openAction } = useOperationsActions();
  const [assetFilter, setAssetFilter] = useState<AssetFilter>("all");
  const [assetQuery, setAssetQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [showFullRegistry, setShowFullRegistry] = useState(false);
  const readyAssets = assets.filter((asset) => asset.status === "ready");
  const blockedAssets = assets.filter((asset) => asset.status === "blocked");
  const assetsWithMissing = assets.filter((asset) => getMissingDocumentCategoriesForAsset(asset, documents, complianceTemplates).length > 0);
  const selectedAsset = selectedAssetId ? assets.find((asset) => asset.id === selectedAssetId) : undefined;
  const normalizedQuery = assetQuery.trim().toLocaleLowerCase("el-GR");
  const filteredAssets = assets.filter((asset) => {
    const missing = getMissingDocumentCategoriesForAsset(asset, documents, complianceTemplates);
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

  function exportAssets() {
    const selected = selectedAssetIds.length ? filteredAssets.filter((asset) => selectedAssetIds.includes(asset.id)) : filteredAssets;
    downloadTextFile(`fleetlever-assets-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(selected, null, 2), "application/json");
  }

  return (
    <OperationsPage
      eyebrow="Πάγια"
      title="Τι μπορεί να ανατεθεί σήμερα;"
      description="Δες τα πάγια που είναι έτοιμα, ποια μπλοκάρονται και ποια ενέργεια λείπει."
      action={<ActionButton icon={Truck} onClick={() => openAction("asset")}>Νέο πάγιο</ActionButton>}
      metricAriaLabel="Σύνοψη παγίων"
      metrics={[
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
    >

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
            <TextButton icon={Download} onClick={exportAssets}>Εξαγωγή</TextButton>
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2">
          <span className="text-sm text-slate-600">
            Bulk: {selectedAssetIds.length ? `${selectedAssetIds.length} επιλεγμένα` : "χρησιμοποίησε το τρέχον φίλτρο"}
          </span>
          <span className="flex flex-wrap gap-2">
            <TextButton icon={CheckCircle2} onClick={() => setSelectedAssetIds(filteredAssets.map((asset) => asset.id))}>
              Επιλογή ορατών
            </TextButton>
            <TextButton icon={UploadCloud} onClick={() => openAction("document", selectedAssetIds[0] ? { assetId: selectedAssetIds[0] } : {})}>
              Έγγραφο
            </TextButton>
            <TextButton icon={Download} onClick={exportAssets}>Εξαγωγή</TextButton>
            {selectedAssetIds.length ? (
              <TextButton icon={X} onClick={() => setSelectedAssetIds([])}>Καθαρισμός</TextButton>
            ) : null}
          </span>
        </div>

        <div className={showFullRegistry ? "hidden" : "space-y-2"}>
          {filteredAssets.map((asset) => {
            const missing = getMissingDocumentCategoriesForAsset(asset, documents, complianceTemplates);
            const action = assetAction(asset);
            const score = getReadinessScoreForAsset(asset, data);

            return (
              <button
                key={asset.id}
                type="button"
                data-fleet-record={`assets:${asset.id}`}
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
                  <span className="mt-1 block text-sm leading-6 text-slate-600 xl:line-clamp-2">{assetBlockerText(asset, missing, issues)}</span>
                </span>

                <AssignmentReadinessCell score={score} missing={missing} />

                <span className="flex min-h-[72px] items-center justify-between gap-3 xl:justify-end">
                  <span className="text-sm font-semibold text-[#11685f]">{action.label}</span>
                  <ArrowRight size={16} className="text-[#11685f]" />
                </span>
              </button>
            );
          })}
          {!filteredAssets.length ? <EmptyState title="Δεν βρέθηκαν πάγια" detail="Άλλαξε φίλτρο ή αναζήτηση για να δεις περισσότερα πάγια." /> : null}
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
                  const missing = getMissingDocumentCategoriesForAsset(asset, documents, complianceTemplates);
                  const action = assetAction(asset);

                  return (
                    <tr key={asset.id} data-fleet-record={`assets:${asset.id}`} tabIndex={-1} className="border-b border-[#e3e9e2] align-top last:border-0">
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
                        <ReadinessBar score={getReadinessScoreForAsset(asset, data)} />
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
    </OperationsPage>
  );
}

function DocumentDrawer({
  document,
  onClose,
  setActiveTab,
}: {
  document: FleetDocument;
  onClose: () => void;
  setActiveTab: (tab: TabId) => void;
}) {
  const data = useFleetData();
  const { assets, issues, maintenanceTasks } = data;
  const { openAction, runAction, isPending } = useOperationsActions();
  const asset = findAsset(assets, document.assetId);
  const linkedIssue = asset ? issues.find((issue) => issue.assetId === asset.id && issue.blocking) : undefined;
  const linkedTask = asset ? maintenanceTasks.find((task) => task.assetId === asset.id && task.status !== "completed") : undefined;
  const status = documentStatus(document);
  const primaryAction = documentAction(document);

  async function handlePrimaryAction() {
    const formData = new FormData();
    formData.set("documentId", document.id);

    if (primaryAction === "Έγκριση") {
      await runAction(approveDocument, formData);
      return;
    }

    if (primaryAction === "Ανανέωση") {
      const current = document.expiresAt ? new Date(`${document.expiresAt}T12:00:00+03:00`) : new Date();
      current.setFullYear(current.getFullYear() + 1);
      formData.set("expiresAt", current.toISOString().slice(0, 10));
      await runAction(renewDocument, formData);
    }
  }

  async function handleArchive() {
    const formData = new FormData();
    formData.set("documentId", document.id);
    await runAction(archiveDocument, formData);
    onClose();
  }

  return (
    <InspectorDrawer
      titleId="document-drawer-title"
      eyebrow={categoryLabels[document.category]}
      title={document.title}
      description={documentTarget(document, assets)}
      closeLabel="Κλείσιμο λεπτομερειών εγγράφου"
      onClose={onClose}
      footer={
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
              onClick={() => openAction("document", asset ? { assetId: asset.id } : {})}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <UploadCloud size={15} />
              Ανέβασμα
            </button>
            {document.hasFile ? (
              <a
                href={`/api/fleetlever/documents/${document.id}/file`}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <Download size={15} />
                Λήψη
              </a>
            ) : null}
            <button
              type="button"
              onClick={() =>
                openAction("document", {
                  documentId: document.id,
                  title: document.title,
                  category: document.category,
                  assetId: document.assetId ?? "",
                  issuedAt: document.issuedAt ?? "",
                  expiresAt: document.expiresAt ?? "",
                })
              }
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2] hover:text-[#123d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Eye size={15} />
              Επεξεργασία
            </button>
            <button
              type="button"
              onClick={handleArchive}
              disabled={isPending}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
            >
              <X size={15} />
              Αρχείο
            </button>
          </div>
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={isPending || primaryAction === "Άνοιγμα"}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-[#11685f] px-3 text-sm font-semibold text-white transition hover:bg-[#0f5c55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <ArrowRight size={15} />
            {primaryAction}
          </button>
        </div>
      }
    >
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

      <DrawerSection title="Αρχείο">
        <div className="flex flex-col gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[#13211f]">
              {document.fileName ?? "Δεν έχει ανέβει αρχείο"}
            </span>
            <span className="mt-1 block text-xs text-slate-500">{formatFileSize(document.fileSize)}</span>
          </span>
          {document.hasFile ? (
            <a
              href={`/api/fleetlever/documents/${document.id}/file`}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-3 text-sm font-semibold text-[#123d37] transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Download size={15} />
              Λήψη
            </a>
          ) : null}
        </div>
      </DrawerSection>

      <DrawerSection title={asset ? "Συνδεδεμένο πάγιο" : "Συνδεδεμένη εγγραφή"}>
        <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
          {asset ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="block text-sm font-semibold text-[#13211f]">{asset.code} · {asset.name}</span>
                <span className="mt-1 block text-xs text-slate-500">{asset.plate ?? asset.serial} · {asset.location}</span>
              </span>
              <StatusPill label={assetStatusLabel(asset.status)} tone={asset.status} />
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-[#13211f]">{document.operator}</p>
              <p className="mt-1 text-xs text-slate-500">Έγγραφο χειριστή</p>
            </>
          )}
        </div>
      </DrawerSection>

      <DrawerSection title="Σχετική δουλειά">
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
      </DrawerSection>
    </InspectorDrawer>
  );
}

function DocumentsPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  const { documents, assets } = useFleetData();
  const { openAction, runAction, isPending } = useOperationsActions();
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>("attention");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const filteredDocuments = filterDocuments(documents, documentFilter);
  const selectedDocument = selectedDocumentId ? documents.find((document) => document.id === selectedDocumentId) : undefined;
  const documentsInReview = documents.filter((document) => document.reviewState === "under review");
  const validDocuments = documents.filter((document) => documentStatus(document) === "valid");
  const expiredDocuments = filterDocuments(documents, "expired");
  const upcomingDocuments = filterDocuments(documents, "upcoming");
  const attentionDocuments = filterDocuments(documents, "attention");
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

  async function bulkApprove() {
    for (const documentId of selectedDocumentIds.length ? selectedDocumentIds : filteredDocuments.map((document) => document.id)) {
      const formData = new FormData();
      formData.set("documentId", documentId);
      await runAction(approveDocument, formData);
    }
    setSelectedDocumentIds([]);
  }

  async function bulkRenew() {
    const targetDocuments = selectedDocumentIds.length
      ? filteredDocuments.filter((document) => selectedDocumentIds.includes(document.id))
      : filteredDocuments;

    for (const document of targetDocuments) {
      const current = document.expiresAt ? new Date(`${document.expiresAt}T12:00:00+03:00`) : new Date();
      current.setFullYear(current.getFullYear() + 1);
      const formData = new FormData();
      formData.set("documentId", document.id);
      formData.set("expiresAt", current.toISOString().slice(0, 10));
      await runAction(renewDocument, formData);
    }
    setSelectedDocumentIds([]);
  }

  function exportDocuments() {
    const selected = selectedDocumentIds.length
      ? filteredDocuments.filter((document) => selectedDocumentIds.includes(document.id))
      : filteredDocuments;
    const csv = [
      ["title", "category", "target", "expiresAt", "status", "reviewState"].join(","),
      ...selected.map((document) =>
        [
          document.title,
          categoryLabels[document.category] ?? document.category,
          findAsset(assets, document.assetId)?.code ?? document.operator ?? "",
          document.expiresAt ?? "",
          statusLabels[documentStatus(document)] ?? documentStatus(document),
          statusLabels[document.reviewState] ?? document.reviewState,
        ].map(csvEscape).join(","),
      ),
    ].join("\n");
    downloadTextFile(`fleetlever-documents-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <OperationsPage
      eyebrow="Έγγραφα"
      title="Έγγραφα που θέλουν ενέργεια"
      description="Λήξεις, έλεγχοι και εγκρίσεις σε μία ουρά για το γραφείο."
      action={<ActionButton icon={FileText} onClick={() => openAction("document")}>Ανέβασμα εγγράφου</ActionButton>}
      metricAriaLabel="Σύνοψη εγγράφων"
      metrics={[
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
    >
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
          <TextButton icon={UploadCloud} onClick={() => openAction("import", { importType: "documents_csv" })}>Μαζικό ανέβασμα</TextButton>
        </div>
        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-500">
          <span>{filteredDocuments.length} από {documents.length} έγγραφα</span>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2">
          <span className="text-sm text-slate-600">
            Bulk: {selectedDocumentIds.length ? `${selectedDocumentIds.length} επιλεγμένα` : "χρησιμοποίησε το τρέχον φίλτρο"}
          </span>
          <span className="flex flex-wrap gap-2">
            <TextButton icon={CheckCircle2} onClick={() => setSelectedDocumentIds(filteredDocuments.map((document) => document.id))}>
              Επιλογή ορατών
            </TextButton>
            <TextButton icon={ShieldCheck} onClick={bulkApprove}>
              {isPending ? "Γίνεται..." : "Έγκριση"}
            </TextButton>
            <TextButton icon={CalendarDays} onClick={bulkRenew}>+1 έτος</TextButton>
            <TextButton icon={Download} onClick={exportDocuments}>Εξαγωγή</TextButton>
            {selectedDocumentIds.length ? <TextButton icon={X} onClick={() => setSelectedDocumentIds([])}>Καθαρισμός</TextButton> : null}
          </span>
        </div>
        <div className="space-y-2">
          {filteredDocuments.map((document) => {
            const asset = findAsset(assets, document.assetId);
            const status = documentStatus(document);
            const action = documentAction(document);

            return (
              <button
                key={document.id}
                type="button"
                data-fleet-record={`documents:${document.id}`}
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
          {!filteredDocuments.length ? <EmptyState title="Δεν υπάρχουν έγγραφα" detail="Η τρέχουσα ουρά δεν έχει στοιχεία για αυτό το φίλτρο." /> : null}
        </div>
      </DataCard>
      {selectedDocument ? (
        <DocumentDrawer document={selectedDocument} onClose={() => setSelectedDocumentId(null)} setActiveTab={setActiveTab} />
      ) : null}
    </OperationsPage>
  );
}

function CompliancePanel() {
  const data = useFleetData();
  const { assets, documents, complianceTemplates } = data;
  const { openAction } = useOperationsActions();
  const assetsWithGaps = assets.filter((asset) => getMissingDocumentCategoriesForAsset(asset, documents, complianceTemplates).length > 0);
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
    const blockedByRule = matchingAssets.filter((asset) => getMissingDocumentCategoriesForAsset(asset, documents, complianceTemplates).length > 0);
    const missingCount = blockedByRule.reduce((sum, asset) => sum + getMissingDocumentCategoriesForAsset(asset, documents, complianceTemplates).length, 0);

    return {
      ...template,
      blockedByRule,
      missingCount,
    };
  });

  return (
    <OperationsPage
      eyebrow="Συμμόρφωση"
      title="Κανόνες συμμόρφωσης"
      description="Τι πρέπει να έχει κάθε τύπος παγίου και ποια πάγια έχουν κενά."
      action={<ActionButton icon={ShieldCheck} onClick={() => openAction("rule")}>Νέος κανόνας</ActionButton>}
      metricAriaLabel="Σύνοψη συμμόρφωσης"
      metrics={[
          { icon: ShieldCheck, label: "Τύποι παγίων", value: complianceTemplates.length, detail: "Με κανόνες εγγράφων", tone: "teal" },
          { icon: FileText, label: "Κατηγορίες", value: requiredCategories.length, detail: "KTEO, άδειες, ασφάλειες", tone: "slate" },
          { icon: AlertTriangle, label: "Πάγια με κενά", value: assetsWithGaps.length, detail: "Θέλουν συμπλήρωση", tone: "amber" },
        ]}
    >
      <SectionGrid variant="two">
        <DataCard title="Πάγια με κενά">
          <div className="divide-y divide-[#e3e9e2]">
            {assetsWithGaps.map((asset) => {
              const missing = getMissingDocumentCategoriesForAsset(asset, documents, complianceTemplates);

              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => openAction("document", { assetId: asset.id })}
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
        <DataCard title="Κανόνες ανά τύπο">
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
                <TextButton icon={Eye} onClick={() => openAction("rule", { assetType: template.assetType })}>Άνοιγμα</TextButton>
              </div>
            ))}
          </div>
        </DataCard>
      </SectionGrid>
    </OperationsPage>
  );
}

function MaintenancePanel() {
  const data = useFleetData();
  const { assets, maintenanceTasks } = data;
  const { openAction, runAction, isPending } = useOperationsActions();
  const [maintenanceFilter, setMaintenanceFilter] = useState<MaintenanceFilter>("all");
  const overdueMaintenance = maintenanceTasks.filter((task) => task.status === "overdue");
  const totalMaintenanceCost = maintenanceTasks.reduce((sum, task) => sum + (task.cost ?? 0), 0);
  const filteredTasks = maintenanceTasks.filter((task) => {
    if (maintenanceFilter === "overdue") return task.status === "overdue";
    if (maintenanceFilter === "scheduled") return task.status === "scheduled";
    if (maintenanceFilter === "cost") return Boolean(task.cost);
    return true;
  });

  async function handleAssign(task: MaintenanceTask) {
    const formData = new FormData();
    formData.set("taskId", task.id);
    await runAction(assignMaintenanceTask, formData);
  }

  async function handleComplete(task: MaintenanceTask) {
    const formData = new FormData();
    formData.set("taskId", task.id);
    await runAction(completeMaintenanceTask, formData);
  }

  return (
    <OperationsPage
      eyebrow="Συντήρηση"
      title="Τι service πρέπει να γίνει και από ποιον"
      description="Εκπρόθεσμες εργασίες, επόμενα service και κόστος σε μία ουρά εργασίας."
      action={<ActionButton icon={Wrench} onClick={() => openAction("maintenance")}>Νέα εργασία</ActionButton>}
      metricAriaLabel="Σύνοψη συντήρησης"
      metrics={[
          { icon: Wrench, label: "Ανοιχτές", value: maintenanceTasks.length, detail: "Εργασίες συντήρησης", tone: "slate" },
          { icon: AlertTriangle, label: "Εκπρόθεσμες", value: overdueMaintenance.length, detail: "Θέλουν ανάθεση", tone: "red" },
          { icon: ClipboardList, label: "Κόστος", value: formatCurrency(totalMaintenanceCost), detail: "Καταγεγραμμένο κόστος", tone: "teal" },
        ]}
    >
      <SectionGrid>
        <DataCard title="Ουρά εργασιών">
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip active={maintenanceFilter === "all"} onClick={() => setMaintenanceFilter("all")}>Όλες</FilterChip>
            <FilterChip active={maintenanceFilter === "overdue"} onClick={() => setMaintenanceFilter("overdue")}>Εκπρόθεσμες</FilterChip>
            <FilterChip active={maintenanceFilter === "scheduled"} onClick={() => setMaintenanceFilter("scheduled")}>Προγραμματισμένες</FilterChip>
            <FilterChip active={maintenanceFilter === "cost"} onClick={() => setMaintenanceFilter("cost")}>Με κόστος</FilterChip>
          </div>
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const days = daysUntil(task.dueAt);
              const asset = findAsset(assets, task.assetId);
              const isOverdue = task.status === "overdue" || days < 0;

              return (
                <article
                  key={task.id}
                  data-fleet-record={`maintenance:${task.id}`}
                  tabIndex={-1}
                  className={`grid min-h-[88px] min-w-0 gap-3 rounded-md border p-4 xl:grid-cols-[minmax(260px,1fr)_170px_150px_auto] xl:items-center ${
                    isOverdue ? "border-red-200 bg-red-50/40" : "border-[#d9e2dc] bg-[#fdfbf7]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#13211f]">{task.title}</p>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {asset?.code} · {asset?.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">Υπεύθυνος: {task.owner}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Προθεσμία</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(task.dueAt)}</p>
                    <p className={isOverdue ? "mt-1 text-xs font-semibold text-red-700" : "mt-1 text-xs text-slate-500"}>
                      {days < 0 ? `${Math.abs(days)} ημέρες καθυστέρηση` : `Σε ${days} ημέρες`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:flex-col xl:items-start">
                    <StatusPill label={statusLabels[task.status]} tone={task.status} />
                    <span className="text-sm font-semibold text-[#11685f]">
                      {task.cost ? formatCurrency(task.cost) : "Χωρίς κόστος"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <TextButton
                      icon={Eye}
                      onClick={() =>
                        openAction("maintenance", {
                          taskId: task.id,
                          assetId: task.assetId,
                          title: task.title,
                          dueAt: task.dueAt,
                          cost: task.cost ? String(task.cost) : "",
                        })
                      }
                    >
                      Επεξεργασία
                    </TextButton>
                    <TextButton icon={Users} onClick={() => handleAssign(task)}>
                      {isPending ? "Γίνεται..." : "Ανάθεση"}
                    </TextButton>
                    <TextButton icon={CheckCircle2} onClick={() => handleComplete(task)}>
                      Ολοκλήρωση
                    </TextButton>
                  </div>
                </article>
              );
            })}
            {!filteredTasks.length ? <EmptyState title="Δεν υπάρχουν εργασίες" detail="Η ουρά είναι καθαρή για αυτό το φίλτρο." /> : null}
          </div>
        </DataCard>
      </SectionGrid>
    </OperationsPage>
  );
}

function IssuesPanel() {
  const { assets, issues } = useFleetData();
  const { openAction, runAction, isPending } = useOperationsActions();
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("all");
  const blockingIssues = issues.filter((issue) => issue.blocking);
  const filteredIssues = issues.filter((issue) => {
    if (issueFilter === "blocking") return issue.blocking;
    if (issueFilter === "high") return issue.severity === "high" || issue.severity === "critical";
    if (issueFilter === "progress") return issue.status === "in progress" || issue.status === "triaged";
    return true;
  });

  async function handleResolve(issue: Issue) {
    const formData = new FormData();
    formData.set("issueId", issue.id);
    await runAction(resolveIssue, formData);
  }

  return (
    <OperationsPage
      eyebrow="Βλάβες"
      title="Τι κρατάει πάγια εκτός δουλειάς"
      description="Βλάβες που μπλοκάρουν ανάθεση, υπεύθυνοι και επόμενη ενέργεια για να μη μπει λάθος πάγιο στο πρόγραμμα."
      action={<ActionButton icon={QrCode} onClick={() => openAction("issue")}>Νέα βλάβη</ActionButton>}
      metricAriaLabel="Σύνοψη βλαβών"
      metrics={[
          { icon: AlertTriangle, label: "Ανοιχτές", value: issues.length, detail: "Χρειάζονται παρακολούθηση", tone: "slate" },
          { icon: Truck, label: "Μπλοκάρουν", value: blockingIssues.length, detail: "Δεν μπαίνουν σε πρόγραμμα", tone: "red" },
          { icon: Users, label: "Με υπεύθυνο", value: issues.filter((issue) => issue.assignee).length, detail: "Έχουν ανάθεση", tone: "teal" },
        ]}
    >
      <SectionGrid>
        <DataCard title="Ανοιχτές βλάβες">
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip active={issueFilter === "all"} onClick={() => setIssueFilter("all")}>Όλες</FilterChip>
            <FilterChip active={issueFilter === "blocking"} onClick={() => setIssueFilter("blocking")}>Μπλοκάρουν</FilterChip>
            <FilterChip active={issueFilter === "high"} onClick={() => setIssueFilter("high")}>Υψηλές/κρίσιμες</FilterChip>
            <FilterChip active={issueFilter === "progress"} onClick={() => setIssueFilter("progress")}>Σε εξέλιξη</FilterChip>
          </div>
          <div className="space-y-2">
            {filteredIssues.map((issue) => {
              const asset = findAsset(assets, issue.assetId);

              return (
                <div
                  key={issue.id}
                  data-fleet-record={`issues:${issue.id}`}
                  tabIndex={-1}
                  className="grid gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
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
                    <TextButton
                      icon={Eye}
                      onClick={() =>
                        openAction("issue", {
                          issueId: issue.id,
                          assetId: issue.assetId,
                          title: issue.title,
                          severity: issue.severity,
                          blocking: issue.blocking ? "true" : "",
                        })
                      }
                    >
                      Επεξεργασία
                    </TextButton>
                    <TextButton icon={Wrench} onClick={() => openAction("maintenance", { assetId: issue.assetId })}>
                      Εργασία
                    </TextButton>
                    <TextButton icon={CheckCircle2} onClick={() => handleResolve(issue)}>
                      {isPending ? "Γίνεται..." : "Κλείσιμο"}
                    </TextButton>
                  </div>
                </div>
              );
            })}
            {!filteredIssues.length ? <EmptyState title="Δεν υπάρχουν βλάβες" detail="Η ουρά βλαβών είναι καθαρή για αυτό το φίλτρο." /> : null}
          </div>
        </DataCard>
      </SectionGrid>
    </OperationsPage>
  );
}

function OperatorsPanel() {
  const { assets, operators } = useFleetData();
  const { openAction, runAction, isPending } = useOperationsActions();
  const totalAssignments = operators.reduce((sum, operator) => sum + operator.assignedAssetIds.length, 0);
  const expiringLicenses = operators.filter((operator) => daysUntil(operator.licenseExpiresAt) <= 30);

  async function handleArchive(operator: FleetLeverData["operators"][number]) {
    const formData = new FormData();
    formData.set("operatorId", operator.id);
    await runAction(archiveOperator, formData);
  }

  return (
    <OperationsPage
      eyebrow="Χειριστές"
      title="Άδειες και αναθέσεις χειριστών"
      description="Ποιος είναι διαθέσιμος, ποια άδεια λήγει και σε ποιο πάγιο είναι συνδεδεμένος."
      action={<ActionButton icon={Users} onClick={() => openAction("operator")}>Νέος χειριστής</ActionButton>}
      metricAriaLabel="Σύνοψη χειριστών"
      metrics={[
          { icon: Users, label: "Χειριστές", value: operators.length, detail: "Ενεργοί άνθρωποι", tone: "slate" },
          { icon: Truck, label: "Αναθέσεις", value: totalAssignments, detail: "Συνδεδεμένα πάγια", tone: "teal" },
          { icon: AlertTriangle, label: "Κοντινές λήξεις", value: expiringLicenses.length, detail: "Άδειες στις 30 ημέρες", tone: "amber" },
        ]}
    >
      <DataCard title="Ομάδα χειριστών">
        <div className="divide-y divide-[#e3e9e2]">
          {operators.map((operator) => {
            const days = daysUntil(operator.licenseExpiresAt);
            const urgent = days <= 30;

            return (
              <div
                key={operator.id}
                data-fleet-record={`operators:${operator.id}`}
                tabIndex={-1}
                className="grid gap-4 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1.4fr)_minmax(150px,0.75fr)_minmax(150px,0.85fr)_auto] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e7ece8] text-slate-700">
                    <HardHat size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#13211f]">{operator.name}</p>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {operator.role} · {operator.phone}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Άδεια</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusPill label={urgent ? "προειδοποίηση" : "έγκυρο"} tone={urgent ? "warning" : "valid"} />
                    <span className="text-xs text-slate-500">{formatDate(operator.licenseExpiresAt)}</span>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Πάγια</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {operator.assignedAssetIds.map((assetId) => (
                      <span
                        key={assetId}
                        className="rounded-full border border-[#d9e2dc] bg-[#f7faf4] px-2 py-1 text-xs font-semibold text-slate-600"
                      >
                        {findAsset(assets, assetId)?.code ?? "Asset"}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <TextButton
                    icon={Eye}
                    onClick={() =>
                      openAction("operator", {
                        operatorId: operator.id,
                        name: operator.name,
                        role: operator.role,
                        phone: operator.phone,
                        licenseCategories: operator.licenseCategories.join(", "),
                        licenseExpiresAt: operator.licenseExpiresAt,
                      })
                    }
                  >
                    Επεξεργασία
                  </TextButton>
                  <TextButton
                    icon={FileText}
                    onClick={() =>
                      openAction("document", {
                        operatorId: operator.id,
                        category: "Operator license",
                        title: `Άδεια χειριστή ${operator.name}`,
                      })
                    }
                  >
                    Άδεια
                  </TextButton>
                  <TextButton icon={X} onClick={() => handleArchive(operator)}>
                    {isPending ? "Γίνεται..." : "Αρχείο"}
                  </TextButton>
                </div>
              </div>
            );
          })}
          {!operators.length ? <EmptyState title="Δεν υπάρχουν χειριστές" detail="Πρόσθεσε χειριστή για να ξεκινήσουν αναθέσεις παγίων." /> : null}
        </div>
      </DataCard>
    </OperationsPage>
  );
}

function CalendarBucket({
  title,
  items,
  empty,
  setActiveTab,
}: {
  title: string;
  items: CalendarItem[];
  empty: string;
  setActiveTab: (tab: TabId) => void;
}) {
  return (
    <DataCard title={title}>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.tab)}
            className="grid w-full gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="text-xs font-semibold text-slate-500">{formatDate(item.date)}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#13211f]">{item.title}</span>
              <span className="mt-1 block truncate text-xs text-slate-500">{item.detail}</span>
            </span>
            <StatusPill label={statusLabels[item.tone] ?? item.tone} tone={item.tone} />
          </button>
        ))}
        {!items.length ? <EmptyState title={empty} /> : null}
      </div>
    </DataCard>
  );
}

function CalendarPanel({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  const data = useFleetData();
  const items = buildCalendarItems(data);
  const overdue = items.filter((item) => daysUntil(item.date) < 0);
  const next7 = items.filter((item) => {
    const days = daysUntil(item.date);
    return days >= 0 && days <= 7;
  });
  const next30 = items.filter((item) => {
    const days = daysUntil(item.date);
    return days > 7 && days <= 30;
  });

  return (
    <OperationsPage
      eyebrow="Ημερολόγιο"
      title="Προθεσμίες και εργασίες"
      description="Όλες οι λήξεις εγγράφων, άδειες χειριστών και εργασίες service σε μία ήρεμη ημερολογιακή ουρά."
      metricAriaLabel="Σύνοψη ημερολογίου"
      metrics={[
        { icon: AlertTriangle, label: "Εκπρόθεσμα", value: overdue.length, detail: "Θέλουν κλείσιμο τώρα", tone: "red" },
        { icon: CalendarDays, label: "7 ημέρες", value: next7.length, detail: "Πολύ κοντινές προθεσμίες", tone: "amber" },
        { icon: ListChecks, label: "30 ημέρες", value: next30.length, detail: "Προγραμματισμός μήνα", tone: "teal" },
      ]}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <CalendarBucket title="Εκπρόθεσμα" items={overdue} empty="Δεν υπάρχουν εκπρόθεσμες εγγραφές." setActiveTab={setActiveTab} />
        <CalendarBucket title="Επόμενες 7 ημέρες" items={next7} empty="Καμία προθεσμία στις επόμενες 7 ημέρες." setActiveTab={setActiveTab} />
        <CalendarBucket title="Επόμενες 30 ημέρες" items={next30} empty="Δεν υπάρχουν άλλες κοντινές προθεσμίες." setActiveTab={setActiveTab} />
      </div>
    </OperationsPage>
  );
}

function ReportsPanel() {
  const data = useFleetData();
  const { openAction, runAction, isPending } = useOperationsActions();
  const [reportType, setReportType] = useState<ReportType>("readiness");
  const rows = buildReportRows(data, reportType);
  const rowsPreview = rows.slice(0, 6);

  function downloadReport() {
    downloadTextFile(
      `fleetlever-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`,
      rowsToCsv(rows),
    );
  }

  async function saveReport() {
    const formData = new FormData();
    formData.set("reportType", reportType);
    formData.set("title", reportTypeLabel(reportType));
    await runAction(recordReport, formData);
  }

  return (
    <OperationsPage
      eyebrow="Αναφορές"
      title="Exports και εισαγωγές"
      description="Κατέβασε καθαρά CSV, κράτησε report history και φόρτωσε μαζικά πάγια ή έγγραφα χωρίς έξτρα οθόνες."
      action={<ActionButton icon={UploadCloud} onClick={() => openAction("import")}>Import</ActionButton>}
      metricAriaLabel="Σύνοψη αναφορών"
      metrics={[
        { icon: BarChart3, label: "Readiness", value: data.assets.length, detail: "Πάγια στο report", tone: "teal" },
        { icon: FileText, label: "Έγγραφα", value: data.documents.length, detail: "Λήξεις και review", tone: "amber" },
        { icon: Wrench, label: "Service", value: data.maintenanceTasks.length, detail: "Εργασίες και κόστος", tone: "slate" },
      ]}
    >
      <SectionGrid variant="two">
        <DataCard title="Report builder">
          <div className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
              Τύπος αναφοράς
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value as ReportType)}
                className="h-10 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-sm text-slate-700 outline-none transition focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
              >
                <option value="readiness">Ετοιμότητα παγίων</option>
                <option value="documents">Έγγραφα και λήξεις</option>
                <option value="maintenance">Συντήρηση</option>
                <option value="blockers">Blocking βλάβες</option>
              </select>
            </label>
            <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7]">
              <div className="flex items-center justify-between border-b border-[#e3e9e2] px-3 py-2">
                <span className="text-sm font-semibold text-[#13211f]">{reportTypeLabel(reportType)}</span>
                <span className="text-xs text-slate-500">{rows.length} γραμμές</span>
              </div>
              <div className="max-h-64 divide-y divide-[#e3e9e2] overflow-y-auto">
                {rowsPreview.map((row, index) => (
                  <div key={`${reportType}-${index}`} className="grid gap-1 px-3 py-2 text-sm">
                    <span className="font-semibold text-[#13211f]">{Object.values(row)[0]}</span>
                    <span className="truncate text-xs text-slate-500">{Object.values(row).slice(1).join(" · ")}</span>
                  </div>
                ))}
                {!rowsPreview.length ? (
                  <p className="px-3 py-5 text-sm text-slate-500">Δεν υπάρχουν δεδομένα για αυτή την αναφορά.</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <TextButton icon={CheckCircle2} onClick={saveReport}>
                {isPending ? "Γίνεται..." : "Καταγραφή"}
              </TextButton>
              <TextButton icon={Download} onClick={downloadReport}>CSV</TextButton>
            </div>
          </div>
        </DataCard>

        <DataCard title="Import και έλεγχος">
          <div className="grid gap-3">
            {[
              { title: "Πάγια CSV", detail: "code, name, type, plate" },
              { title: "Έγγραφα CSV", detail: "title, category, assetCode, expiresAt" },
              { title: "Ασφαλής εισαγωγή", detail: "Κρατά import log και παραλείπει διπλά πάγια." },
            ].map((item) => (
              <div key={item.title} className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3">
                <p className="text-sm font-semibold text-[#13211f]">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
            <div className="flex justify-end">
              <TextButton icon={UploadCloud} onClick={() => openAction("import")}>Άνοιγμα import</TextButton>
            </div>
          </div>
        </DataCard>
      </SectionGrid>
    </OperationsPage>
  );
}

function DeadlinesCard({ setActiveTab, focusRecord }: { setActiveTab: (tab: TabId) => void; focusRecord: FocusRecord }) {
  const { documents } = useFleetData();
  const expiringDocuments = documents.filter((document) =>
    ["expired", "critical", "warning"].includes(documentStatus(document)),
  );

  return (
    <DataCard title="Προθεσμίες">
      <div className="mb-3 flex justify-end">
        <TextButton icon={FileText} onClick={() => setActiveTab("documents")}>
          Έγγραφα
        </TextButton>
      </div>
      <div className="space-y-0">
        {expiringDocuments.slice(0, 4).map((document) => (
          <button
            key={document.id}
            type="button"
            onClick={() => focusRecord("documents", document.id)}
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
    </DataCard>
  );
}

function AssignmentsCard({ setActiveTab, focusRecord }: { setActiveTab: (tab: TabId) => void; focusRecord: FocusRecord }) {
  const { assets, issues } = useFleetData();

  return (
    <DataCard title="Αναθέσεις">
      <div className="mb-3 flex justify-end">
        <TextButton icon={AlertTriangle} onClick={() => setActiveTab("issues")}>
          Βλάβες
        </TextButton>
      </div>
      <div className="space-y-2">
        {issues.slice(0, 2).map((issue) => (
          <button
            key={issue.id}
            type="button"
            onClick={() => focusRecord("issues", issue.id)}
            className="grid min-h-[82px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] p-3.5 text-left transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[#13211f]">{findAsset(assets, issue.assetId)?.code}</span>
              <span className="mt-1 block truncate text-sm text-slate-600">{issue.assignee}</span>
              <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">{issue.title}</span>
            </span>
            <ArrowRight className="text-[#11685f]" size={15} />
          </button>
        ))}
      </div>
    </DataCard>
  );
}

const documentCategories = Object.keys(categoryLabels);
const assetTypes = ["Crane", "Bus", "Forklift", "Van", "Excavator"];

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-10 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
      {label}
      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="h-10 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-sm text-slate-700 outline-none transition focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
      >
        <option value="">Επίλεξε</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionModal({
  kind,
  defaults,
  onClose,
}: {
  kind: Exclude<ActionModalKind, null>;
  defaults: Record<string, string>;
  onClose: () => void;
}) {
  const data = useFleetData();
  const { runAction, isPending } = useOperationsActions();
  const [message, setMessage] = useState("");
  const assetOptions = data.assets.map((asset) => ({ value: asset.id, label: `${asset.code} · ${asset.name}` }));
  const operatorOptions = data.operators.map((operator) => ({ value: operator.id, label: operator.name }));
  const isAssetEdit = kind === "asset" && Boolean(defaults.assetId);
  const isDocumentEdit = kind === "document" && Boolean(defaults.documentId);
  const isIssueEdit = kind === "issue" && Boolean(defaults.issueId);
  const isMaintenanceEdit = kind === "maintenance" && Boolean(defaults.taskId);
  const isOperatorEdit = kind === "operator" && Boolean(defaults.operatorId);
  const [documentTitle, setDocumentTitle] = useState(defaults.title ?? "");
  const [documentCategory, setDocumentCategory] = useState(defaults.category ?? "");
  const [documentAssetId, setDocumentAssetId] = useState(defaults.assetId ?? "");
  const [documentExpiresAt, setDocumentExpiresAt] = useState(defaults.expiresAt ?? "");
  const [documentFileName, setDocumentFileName] = useState("");
  const documentSuggestion = inferDocumentDraft(`${documentTitle} ${documentFileName}`, data);
  const initialImportType = defaults.importType === "documents_csv" ? "documents_csv" : "assets_csv";
  const initialImportText =
    defaults.importText ??
    (initialImportType === "documents_csv"
      ? "title,category,assetCode,expiresAt\nTR-09 KTEO,KTEO,TR-09,2027-06-01"
      : "code,name,type,plate\nTR-09,Ford Transit,Van,DEM-0005");
  const [importType, setImportType] = useState<"assets_csv" | "documents_csv">(initialImportType);
  const [importText, setImportText] = useState(initialImportText);
  const importRows = useMemo<ImportPreviewRow[]>(() => {
    const existingCodes = new Set(data.assets.map((asset) => asset.code.toLocaleUpperCase("el-GR")));
    return parseCsv(importText).slice(0, 30).map((row, index) => {
      const code = String(row.code ?? row.internal_code ?? row.κωδικός ?? row.assetCode ?? row.asset ?? row.πάγιο ?? "").toLocaleUpperCase("el-GR");
      const title = String(row.title ?? row.τίτλος ?? "");
      const name = String(row.name ?? row.όνομα ?? "");
      const duplicate = importType === "assets_csv" && code && existingCodes.has(code);
      const hasMinimum = importType === "documents_csv" ? Boolean(title) : Boolean(code && name);

      return {
        rowNumber: index + 1,
        data: row,
        status: duplicate ? "duplicate" : hasMinimum ? "ready" : "needs_review",
        note: duplicate ? "Υπάρχει ήδη" : hasMinimum ? "Έτοιμο" : "Θέλει πεδία",
      };
    });
  }, [data.assets, importText, importType]);
  const title =
    kind === "asset"
      ? isAssetEdit ? "Επεξεργασία παγίου" : "Νέο πάγιο"
      : kind === "document"
        ? isDocumentEdit ? "Επεξεργασία εγγράφου" : "Ανέβασμα εγγράφου"
        : kind === "issue"
          ? isIssueEdit ? "Επεξεργασία βλάβης" : "Νέα βλάβη"
          : kind === "maintenance"
            ? isMaintenanceEdit ? "Επεξεργασία εργασίας" : "Νέα εργασία"
            : kind === "operator"
              ? isOperatorEdit ? "Επεξεργασία χειριστή" : "Νέος χειριστής"
              : kind === "workspace"
                ? "Workspace"
                : kind === "import"
                  ? "Import δεδομένων"
                  : "Νέος κανόνας";

  function actionForKind() {
    if (kind === "asset") return isAssetEdit ? updateAsset : createAsset;
    if (kind === "document") return isDocumentEdit ? updateDocument : createDocument;
    if (kind === "issue") return isIssueEdit ? updateIssue : createIssue;
    if (kind === "maintenance") return isMaintenanceEdit ? updateMaintenanceTask : createMaintenanceTask;
    if (kind === "operator") return isOperatorEdit ? updateOperator : createOperator;
    if (kind === "workspace") return switchWorkspace;
    if (kind === "import") return importFleetRows;
    return createComplianceRule;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await runAction(actionForKind(), new FormData(event.currentTarget));
    setMessage(result.message);
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="action-modal-title">
      <button type="button" aria-label="Κλείσιμο φόρμας" className="absolute inset-0 bg-slate-950/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#d9e2dc] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117064]">Ενέργεια</p>
            <h2 id="action-modal-title" className="mt-1 text-xl font-semibold text-[#13211f]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] text-slate-600 transition hover:border-teal-300 hover:bg-[#eef7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label="Κλείσιμο"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="grid max-h-[75vh] gap-4 overflow-y-auto p-5">
          {kind === "asset" && defaults.assetId ? <input type="hidden" name="assetId" value={defaults.assetId} /> : null}
          {kind === "document" && defaults.documentId ? <input type="hidden" name="documentId" value={defaults.documentId} /> : null}
          {kind === "issue" && defaults.issueId ? <input type="hidden" name="issueId" value={defaults.issueId} /> : null}
          {kind === "maintenance" && defaults.taskId ? <input type="hidden" name="taskId" value={defaults.taskId} /> : null}
          {kind === "operator" && defaults.operatorId ? <input type="hidden" name="operatorId" value={defaults.operatorId} /> : null}
          {kind === "asset" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Κωδικός" name="code" defaultValue={defaults.code} required placeholder="TR-09" />
                <Field label="Όνομα" name="name" defaultValue={defaults.name} required placeholder="Ford Transit" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Τύπος" name="assetType" defaultValue={defaults.assetType} required options={assetTypes.map((type) => ({ value: type, label: type }))} />
                <SelectField
                  label="Ιδιοκτησία"
                  name="ownership"
                  defaultValue={defaults.ownership ?? "owned"}
                  options={[
                    { value: "owned", label: "owned" },
                    { value: "leased", label: "leased" },
                    { value: "rented", label: "rented" },
                  ]}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Πινακίδα" name="plate" defaultValue={defaults.plate} />
                <Field label="Serial" name="serial" defaultValue={defaults.serial} />
              </div>
              <Field label="Τμήμα" name="department" defaultValue={defaults.department} />
              <SelectField label="Χειριστής" name="operatorId" defaultValue={defaults.operatorId} options={operatorOptions} />
            </>
          ) : null}

          {kind === "document" ? (
            <>
              <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
                Τίτλος
                <input
                  name="title"
                  required
                  value={documentTitle}
                  onChange={(event) => setDocumentTitle(event.target.value)}
                  placeholder="CR-04 νέο πιστοποιητικό"
                  className="h-10 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                />
              </label>
              {documentSuggestion.category || documentSuggestion.assetId || documentSuggestion.expiresAt ? (
                <div className="rounded-md border border-[#cfe3da] bg-[#eef7f2] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-[#13211f]">
                        <Sparkles size={15} className="text-[#117064]" />
                        Πρόταση εγγράφου
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        Από τίτλο/αρχείο βρήκαμε πιθανό τύπο, πάγιο ή λήξη.
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (documentSuggestion.category) setDocumentCategory(documentSuggestion.category);
                        if (documentSuggestion.assetId) setDocumentAssetId(documentSuggestion.assetId);
                        if (documentSuggestion.expiresAt) setDocumentExpiresAt(documentSuggestion.expiresAt);
                      }}
                      className="inline-flex min-h-8 items-center rounded-md border border-[#c9ded6] bg-[#fbfaf6] px-2.5 text-xs font-semibold text-[#123d37] transition hover:bg-white"
                    >
                      Χρήση πρότασης
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
                  Κατηγορία
                  <select
                    name="category"
                    required
                    value={documentCategory}
                    onChange={(event) => setDocumentCategory(event.target.value)}
                    className="h-10 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-sm text-slate-700 outline-none transition focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                  >
                    <option value="">Επίλεξε</option>
                    {documentCategories.map((category) => (
                      <option key={category} value={category}>{categoryLabels[category] ?? category}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
                  Πάγιο
                  <select
                    name="assetId"
                    value={documentAssetId}
                    onChange={(event) => setDocumentAssetId(event.target.value)}
                    className="h-10 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-sm text-slate-700 outline-none transition focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                  >
                    <option value="">Επίλεξε</option>
                    {assetOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <SelectField label="Χειριστής" name="operatorId" defaultValue={defaults.operatorId} options={operatorOptions} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ημερομηνία έκδοσης" name="issuedAt" defaultValue={defaults.issuedAt} type="date" />
                <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
                  Ημερομηνία λήξης
                  <input
                    name="expiresAt"
                    type="date"
                    value={documentExpiresAt}
                    onChange={(event) => setDocumentExpiresAt(event.target.value)}
                    className="h-10 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                  />
                </label>
              </div>
              <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
                {isDocumentEdit ? "Νέο αρχείο (προαιρετικό)" : "Αρχείο"}
                <input
                  name="file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.csv,.xls,.xlsx,.doc,.docx"
                  onChange={(event) => setDocumentFileName(event.target.files?.[0]?.name ?? "")}
                  className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#e2f0ea] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#123d37] focus:border-[#8fd5c6] focus:outline-none focus:ring-1 focus:ring-[#8fd5c6]"
                />
                <span className="text-xs font-normal leading-5 text-slate-500">
                  PDF, εικόνα, CSV, Excel ή Word έως 10MB.
                </span>
              </label>
            </>
          ) : null}

          {kind === "issue" ? (
            <>
              <SelectField label="Πάγιο" name="assetId" defaultValue={defaults.assetId} required options={assetOptions} />
              <Field label="Τίτλος βλάβης" name="title" defaultValue={defaults.title} required placeholder="Πτώση πίεσης..." />
              <SelectField
                label="Σοβαρότητα"
                name="severity"
                defaultValue={defaults.severity ?? "medium"}
                options={[
                  { value: "low", label: "Χαμηλή" },
                  { value: "medium", label: "Μεσαία" },
                  { value: "high", label: "Υψηλή" },
                  { value: "critical", label: "Κρίσιμη" },
                ]}
              />
              <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
                Περιγραφή
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={defaults.description}
                  className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#13211f]">
                <input name="blocking" type="checkbox" defaultChecked={defaults.blocking === "true"} className="h-4 w-4 rounded border-[#d9e2dc]" />
                Μπλοκάρει ανάθεση
              </label>
            </>
          ) : null}

          {kind === "maintenance" ? (
            <>
              <SelectField label="Πάγιο" name="assetId" defaultValue={defaults.assetId} required options={assetOptions} />
              <Field label="Εργασία" name="title" defaultValue={defaults.title} required placeholder="Service 10.000 χλμ." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Προθεσμία" name="dueAt" defaultValue={defaults.dueAt} type="date" />
                <Field label="Κόστος" name="cost" defaultValue={defaults.cost} type="number" />
              </div>
            </>
          ) : null}

          {kind === "operator" ? (
            <>
              <Field label="Όνομα" name="name" defaultValue={defaults.name} required placeholder="Maria Sotiropoulou" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ρόλος" name="role" defaultValue={defaults.role} placeholder="Bus driver" />
                <Field label="Τηλέφωνο" name="phone" defaultValue={defaults.phone} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Κατηγορίες άδειας" name="licenseCategories" defaultValue={defaults.licenseCategories} placeholder="D, Crane" />
                <Field label="Λήξη άδειας" name="licenseExpiresAt" defaultValue={defaults.licenseExpiresAt} type="date" />
              </div>
            </>
          ) : null}

          {kind === "rule" ? (
            <>
              <Field label="Τύπος παγίου" name="assetType" defaultValue={defaults.assetType} required placeholder="Trailer" />
              <Field label="Κατηγορίες εγγράφων" name="categories" required placeholder="KTEO, Insurance" />
            </>
          ) : null}

          {kind === "workspace" ? (
            <>
              <Field label="Organization ID" name="organizationId" defaultValue={defaults.organizationId} required />
              <Field label="Profile ID" name="profileId" defaultValue={defaults.profileId} required />
              <p className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2 text-sm leading-6 text-slate-600">
                Η αλλαγή γίνεται μόνο αν το profile είναι ενεργό μέλος του organization.
              </p>
            </>
          ) : null}

          {kind === "import" ? (
            <>
              <input type="hidden" name="rowsJson" value={JSON.stringify(importRows.filter((row) => row.status === "ready").map((row) => row.data))} />
              <Field label="Όνομα αρχείου" name="sourceName" defaultValue="manual-import.csv" required />
              <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
                Τύπος import
                <select
                  name="importType"
                  value={importType}
                  onChange={(event) => {
                    const next = event.target.value as "assets_csv" | "documents_csv";
                    setImportType(next);
                    setImportText(
                      next === "assets_csv"
                        ? "code,name,type,plate\nTR-09,Ford Transit,Van,DEM-0005"
                        : "title,category,assetCode,expiresAt\nTR-09 KTEO,KTEO,TR-09,2027-06-01",
                    );
                  }}
                  className="h-10 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 text-sm text-slate-700 outline-none transition focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                >
                  <option value="assets_csv">Πάγια CSV</option>
                  <option value="documents_csv">Έγγραφα CSV</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[#13211f]">
                CSV preview
                <textarea
                  rows={7}
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2 font-mono text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#8fd5c6] focus:ring-1 focus:ring-[#8fd5c6]"
                />
              </label>
              <div className="rounded-md border border-[#d9e2dc] bg-[#fdfbf7]">
                <div className="flex items-center justify-between border-b border-[#e3e9e2] px-3 py-2">
                  <span className="text-sm font-semibold text-[#13211f]">Έλεγχος γραμμών</span>
                  <span className="text-xs text-slate-500">{importRows.filter((row) => row.status === "ready").length} έτοιμες</span>
                </div>
                <div className="max-h-52 divide-y divide-[#e3e9e2] overflow-y-auto">
                  {importRows.map((row) => (
                    <div key={row.rowNumber} className="grid gap-2 px-3 py-2 text-sm sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-center">
                      <span className="font-mono text-xs text-slate-500">#{row.rowNumber}</span>
                      <span className="truncate text-slate-700">{Object.values(row.data).filter(Boolean).join(" · ")}</span>
                      <StatusPill
                        label={row.note}
                        tone={row.status === "ready" ? "valid" : row.status === "duplicate" ? "warning" : "blocked"}
                      />
                    </div>
                  ))}
                  {!importRows.length ? (
                    <p className="px-3 py-4 text-sm text-slate-500">Βάλε header row και τουλάχιστον μία γραμμή.</p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {message ? (
            <p className={`rounded-md border px-3 py-2 text-sm ${message.includes("Δεν") || message.includes("Συμπλήρωσε") ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#d9e2dc] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-3 text-sm font-semibold text-slate-600 transition hover:bg-[#eef7f2]"
            >
              Άκυρο
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center rounded-md bg-[#11685f] px-3 text-sm font-semibold text-white transition hover:bg-[#0f5c55] disabled:opacity-60"
            >
              {isPending ? "Αποθήκευση..." : "Αποθήκευση"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RuntimeBanner() {
  const data = useFleetData();

  if (data.runtime?.dataSource !== "demo") return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="inline-flex items-center gap-2 font-semibold">
        <Database size={16} />
        Demo data
      </span>
      <span className="text-amber-800">
        {data.runtime.warning ?? "Οι αλλαγές χρειάζονται ενεργό DATABASE_URL για να αποθηκευτούν."}
      </span>
    </div>
  );
}

export function OperationsConsole({ initialData = fallbackFleetData }: { initialData?: FleetLeverData }) {
  const [data, setData] = useState<FleetLeverData>(initialData);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [actionModal, setActionModal] = useState<{ kind: ActionModalKind; defaults: Record<string, string> }>({
    kind: null,
    defaults: {},
  });
  const [globalQuery, setGlobalQuery] = useState("");
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [isPending, startTransition] = useTransition();
  const activeMeta = useMemo(
    () => (activeTab === "command" ? { id: "command" as const, label: "Copilot", icon: Command } : tabs.find((tab) => tab.id === activeTab) ?? tabs[0]),
    [activeTab],
  );

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!focusTarget || focusTarget.tab !== activeTab) return undefined;

    let highlightTimer: number | undefined;
    const timer = window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`[data-fleet-record="${focusTarget.tab}:${focusTarget.recordId}"]`);

      if (!target) {
        setFocusTarget(null);
        return;
      }

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
      target.classList.add("fleet-record-focus");

      highlightTimer = window.setTimeout(() => {
        target.classList.remove("fleet-record-focus");
        setFocusTarget((current) =>
          current?.tab === focusTarget.tab && current.recordId === focusTarget.recordId ? null : current,
        );
      }, 2600);
    }, 80);

    return () => {
      window.clearTimeout(timer);
      if (highlightTimer) window.clearTimeout(highlightTimer);
    };
  }, [activeTab, focusTarget]);

  const actionContext = useMemo<OperationsActions>(
    () => ({
      openAction: (kind, defaults = {}) => setActionModal({ kind, defaults }),
      isPending,
      runAction: (action, formData) =>
        new Promise<ActionResult>((resolve) => {
          startTransition(async () => {
            try {
              const result = await action(formData);
              setToast(result.message);

              if (result.ok) {
                const response = await fetch("/api/fleetlever/snapshot", { cache: "no-store" });
                if (response.ok) {
                  setData(await response.json());
                }
                setActionModal({ kind: null, defaults: {} });
              }

              resolve(result);
            } catch (error) {
              console.error("FleetLever action failed", error);
              const result = { ok: false, message: "Η ενέργεια απέτυχε. Δοκίμασε ξανά." };
              setToast(result.message);
              resolve(result);
            }
          });
        }),
    }),
    [isPending],
  );
  const notifications = buildNotifications(data);

  function focusRecord(tab: TabId, recordId?: string) {
    setActiveTab(tab);
    setFocusTarget(recordId ? { tab, recordId } : null);
  }

  function handleSearchNavigate(tab: TabId, result?: SearchResult) {
    focusRecord(tab, searchResultRecordId(result));
    setGlobalQuery("");
  }

  return (
    <FleetDataContext.Provider value={data}>
      <OperationsActionsContext.Provider value={actionContext}>
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
              onClick={() =>
                setActionModal({
                  kind: "workspace",
                  defaults: {
                    organizationId: data.session?.organizationId ?? data.organization.id,
                    profileId: data.session?.profileId ?? "",
                  },
                })
              }
              className="hidden h-10 min-w-[150px] shrink-0 items-center gap-2 rounded-md border border-[#cfe3da] bg-[#eaf5ef] px-3 text-left text-[#123d37] transition hover:border-teal-200 hover:bg-[#e2f0ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 md:inline-flex"
              aria-label={`Τρέχουσα τοποθεσία: ${data.location.name}`}
            >
              <Building2 size={17} className="text-teal-700" />
              <span>
                <span className="block text-sm font-semibold leading-4">{data.location.name}</span>
                <span className="block text-xs leading-5 text-[#117064]">
                  {data.location.assetCount} πάγια · {data.location.operatorCount} χειριστές
                </span>
              </span>
            </button>
            <GlobalSearchBox query={globalQuery} onQueryChange={setGlobalQuery} onNavigate={handleSearchNavigate} />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="hidden items-center gap-2 2xl:inline-flex">
                <IconButton
                  icon={Truck}
                  label="Νέο πάγιο"
                  description="Καταχώριση οχήματος, μηχανήματος ή εξοπλισμού."
                  onClick={() => setActionModal({ kind: "asset", defaults: {} })}
                />
                <IconButton
                  icon={FileText}
                  label="Ανέβασμα εγγράφου"
                  description="Προσθήκη άδειας, KTEO, πιστοποιητικού ή άλλου αρχείου."
                  onClick={() => setActionModal({ kind: "document", defaults: {} })}
                />
                <IconButton
                  icon={QrCode}
                  label="Νέα βλάβη"
                  description="Γρήγορη αναφορά προβλήματος από πεδίο ή γραφείο."
                  onClick={() => setActionModal({ kind: "issue", defaults: {} })}
                />
              </span>
              <IconButton
                icon={Bell}
                label="Ειδοποιήσεις"
                description={`${notifications.length} ανοιχτές ειδοποιήσεις για λήξεις, βλάβες και service.`}
                onClick={() => setNotificationsOpen(true)}
              />
              <ToolbarMenu />
            </div>
          </div>
          <div className="border-t border-[#d9e2dc] px-4 py-2 xl:hidden">
            <div
              className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="FleetLever sections"
            >
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
          <RuntimeBanner />
          <section
            id={`${activeMeta.id}-panel`}
            role="tabpanel"
            aria-label={activeMeta.label}
            className="min-w-0"
          >
            {activeTab === "dashboard" && <DashboardPanel setActiveTab={setActiveTab} focusRecord={focusRecord} />}
            {activeTab === "command" && <CommandPanel setActiveTab={setActiveTab} />}
            {activeTab === "assets" && <AssetsPanel setActiveTab={setActiveTab} />}
            {activeTab === "documents" && <DocumentsPanel setActiveTab={setActiveTab} />}
            {activeTab === "compliance" && <CompliancePanel />}
            {activeTab === "maintenance" && <MaintenancePanel />}
            {activeTab === "issues" && <IssuesPanel />}
            {activeTab === "operators" && <OperatorsPanel />}
            {activeTab === "calendar" && <CalendarPanel setActiveTab={setActiveTab} />}
            {activeTab === "reports" && <ReportsPanel />}
          </section>
        </main>
      </div>
      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={focusRecord}
      />
      {toast ? (
        <div role="status" aria-live="polite" className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-[#d9e2dc] bg-[#fbfaf6] px-4 py-2 text-sm font-medium text-[#123d37] shadow-lg">
          {toast}
        </div>
      ) : null}
      {actionModal.kind ? (
        <ActionModal
          kind={actionModal.kind}
          defaults={actionModal.defaults}
          onClose={() => setActionModal({ kind: null, defaults: {} })}
        />
      ) : null}
    </div>
      </OperationsActionsContext.Provider>
    </FleetDataContext.Provider>
  );
}
