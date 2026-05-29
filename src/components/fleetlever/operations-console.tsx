"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  Bot,
  Building2,
  ClipboardList,
  Command,
  Download,
  FileText,
  Gauge,
  HardHat,
  MoreHorizontal,
  QrCode,
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-teal-300 hover:bg-[#f2f7f2] hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d9e2dc] bg-[#fbfaf6] text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-teal-300 hover:bg-[#f2f7f2] hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
        type="button"
        aria-label="Περισσότερες ενέργειες. Import και Export δεδομένων."
      >
        <MoreHorizontal size={18} />
      </button>
      <div className="absolute right-0 top-11 z-40 hidden w-64 rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-2 text-left shadow-xl ring-1 ring-slate-950/5 group-hover:block group-focus-within:block">
        <button
          type="button"
          className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition hover:bg-[#eef7f2] focus:bg-[#eef7f2] focus:outline-none"
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
          className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition hover:bg-[#eef7f2] focus:bg-[#eef7f2] focus:outline-none"
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
      className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#11685f] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f5c55] focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-white/15 bg-white/10 px-3 text-sm font-semibold text-[#f7faf4] transition hover:border-[#aee5d8] hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#aee5d8]"
          >
            Copilot
          </button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {[
            ["B-12", "Κλείσε ανανέωση KTEO πριν ανατεθεί σε διαδρομή.", "issues"],
            ["CR-04", "Ζήτησε ενημέρωση για το πιστοποιητικό ανύψωσης.", "documents"],
            ["FL-02", "Ανάθεσε το εκπρόθεσμο service και έλεγξε το έγγραφο.", "maintenance"],
          ].map(([title, detail, tab]) => (
            <button
              key={title}
              type="button"
              onClick={() => setActiveTab(tab as TabId)}
              className="min-h-[96px] rounded-md border border-white/10 bg-white/[0.06] p-4 text-left transition hover:border-[#aee5d8] hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-[#aee5d8]"
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

function CommandPanel() {
  return (
    <div className="space-y-5">
      <PanelHeader
        eyebrow="Εντολές"
        title="Γρήγορη αναζήτηση και βασικές ενέργειες"
        description="Ένα σημείο για να βρεις πάγιο, έγγραφο, χειριστή, βλάβη ή εργασία συντήρησης χωρίς να αλλάζεις οθόνες."
        action={<ActionButton icon={Command}>Άνοιγμα εντολών</ActionButton>}
      />
      <DataCard title="Αναζήτηση">
        <div className="rounded-lg border border-[#d9e2dc] bg-[#f2f5ef] p-4">
          <div className="flex items-center gap-3 rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <Search className="text-slate-400" size={20} />
            <span className="text-sm text-slate-500">Δοκίμασε: Ποιοι γερανοί δεν είναι inspection-ready;</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {["Νέο πάγιο", "Ανέβασμα εγγράφου", "Νέα βλάβη", "Νέα εργασία συντήρησης"].map((command) => (
              <button
                key={command}
                type="button"
                className="rounded-md border border-[#d9e2dc] bg-[#fbfaf6] px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:bg-[#eef7f2] hover:text-teal-900"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      </DataCard>
      <DataCard title="Import lane">
        <p className="text-sm leading-7 text-slate-600">
          Το onboarding ξεκινά από Excel, CSV ή φακέλους με αρχεία. Το σύστημα προτείνει αντιστοίχιση πεδίων, εντοπίζει
          χαμηλή εμπιστοσύνη και κρατά audit event πριν δημοσιευθούν τα δεδομένα.
        </p>
      </DataCard>
    </div>
  );
}

function AssetsPanel() {
  return (
    <div className="space-y-5">
      <PanelHeader
        eyebrow="Πάγια"
        title="Μητρώο παγίων"
        description="Κατάσταση, τοποθεσία, χειριστής και ελλείψεις εγγράφων για κάθε πάγιο."
        action={<ActionButton icon={Truck}>Νέο πάγιο</ActionButton>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={Truck} label="Έτοιμα" value={String(readyAssets.length)} detail="Μπορούν να ανατεθούν" tone="teal" />
        <MetricTile icon={AlertTriangle} label="Blocked" value={String(blockedAssets.length)} detail="Δεν μπαίνουν σε δουλειά" tone="red" />
        <MetricTile
          icon={FileText}
          label="Με ελλείψεις"
          value={String(assets.filter((asset) => getMissingDocumentCategories(asset).length > 0).length)}
          detail="Λείπουν απαιτούμενα έγγραφα"
          tone="amber"
        />
      </div>
      <DataCard title="Πάγια">
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
    <div className="space-y-5">
      <PanelHeader
        eyebrow="Έγγραφα"
        title="Έλεγχος εγγράφων"
        description="Κάθε έγγραφο έχει κατηγορία, σύνδεση με πάγιο ή χειριστή, κατάσταση λήξης και κατάσταση ελέγχου."
        action={<ActionButton icon={FileText}>Ανέβασμα εγγράφου</ActionButton>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={FileText} label="Σύνολο" value={String(documents.length)} detail="Καταχωρημένα έγγραφα" tone="slate" />
        <MetricTile icon={AlertTriangle} label="Σε προθεσμία" value={String(expiringDocuments.length)} detail="Λήγουν ή έχουν λήξει" tone="amber" />
        <MetricTile
          icon={ShieldCheck}
          label="Σε έλεγχο"
          value={String(documents.filter((document) => document.reviewState === "under review").length)}
          detail="Θέλουν επιβεβαίωση"
          tone="teal"
        />
      </div>
      <DataCard title="Έγγραφα">
        <div className="grid gap-3">
          {documents.map((document) => {
            const asset = document.assetId ? getAsset(document.assetId) : undefined;
            const status = documentStatus(document);

            return (
              <div
                key={document.id}
                className="grid gap-3 rounded-lg border border-[#d9e2dc] bg-[#fdfbf7] p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div>
                  <p className="font-semibold text-[#13211f]">{document.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {categoryLabels[document.category]} · {asset?.code ?? document.operator} · AI confidence{" "}
                    {Math.round(document.confidence * 100)}%
                  </p>
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
    <div className="space-y-5">
      <PanelHeader
        eyebrow="Συμμόρφωση"
        title="Required Document Matrix"
        description="Οι κανόνες δεν παρουσιάζονται ως νομική συμβουλή. Είναι templates που βασίζονται στα records και στις ρυθμίσεις της εταιρείας."
        action={<ActionButton icon={ShieldCheck}>Νέο Template</ActionButton>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {complianceTemplates.map((template) => (
          <DataCard key={template.assetType} title={template.assetType}>
            <div className="flex flex-wrap gap-2">
              {template.requiredCategories.map((category) => (
                <span key={category} className="rounded-full bg-[#e7ece8] px-2.5 py-1 text-xs text-slate-700">
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
    <div className="space-y-5">
      <PanelHeader
        eyebrow="Συντήρηση"
        title="Συντήρηση και service"
        description="Προτεραιότητα σε εκπρόθεσμες εργασίες, ανάθεση υπευθύνου και καθαρή εικόνα κόστους."
        action={<ActionButton icon={Wrench}>Νέα εργασία</ActionButton>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={Wrench} label="Ανοιχτές" value={String(maintenanceTasks.length)} detail="Εργασίες συντήρησης" tone="slate" />
        <MetricTile icon={AlertTriangle} label="Εκπρόθεσμες" value={String(overdueMaintenance.length)} detail="Θέλουν ανάθεση" tone="red" />
        <MetricTile icon={ClipboardList} label="Κόστος" value={formatCurrency(totalMaintenanceCost)} detail="Καταγεγραμμένο κόστος" tone="teal" />
      </div>
      <DataCard title="Εργασίες">
        <div className="space-y-3">
          {maintenanceTasks.map((task) => (
            <div key={task.id} className="rounded-lg border border-[#d9e2dc] bg-[#fdfbf7] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#13211f]">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {getAsset(task.assetId)?.code} · {task.owner} · προθεσμία {formatDate(task.dueAt)}
                  </p>
                </div>
                <StatusPill label={statusLabels[task.status]} tone={task.status} />
              </div>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  );
}

function IssuesPanel() {
  return (
    <div className="space-y-5">
      <PanelHeader
        eyebrow="Βλάβες"
        title="Βλάβες πεδίου"
        description="Οι βλάβες δείχνουν τι εμποδίζει εργασία, ποιος το έχει αναλάβει και πόσο επείγον είναι."
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
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="rounded-lg border border-[#d9e2dc] bg-[#fdfbf7] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#13211f]">{issue.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {getAsset(issue.assetId)?.code} · {issue.assignee} · άνοιξε {formatDate(issue.openedAt)}
                  </p>
                </div>
                <StatusPill
                  label={issue.blocking ? "blocked" : statusLabels[issue.severity]}
                  tone={issue.blocking ? "blocked" : issue.severity === "critical" ? "criticalIssue" : issue.severity}
                />
              </div>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  );
}

function OperatorsPanel() {
  return (
    <div className="space-y-5">
      <PanelHeader
        eyebrow="Χειριστές"
        title="Operator readiness"
        description="Άδειες, αναθέσεις παγίων και βασικά στοιχεία ανθρώπων χωρίς περιττή πολυπλοκότητα."
        action={<ActionButton icon={Users}>Νέος Operator</ActionButton>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {operators.map((operator) => (
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
            <p className="mt-4 text-sm text-slate-600">Η άδεια λήγει {formatDate(operator.licenseExpiresAt)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {operator.assignedAssetIds.map((assetId) => (
                <StatusPill key={assetId} label={getAsset(assetId)?.code ?? "Asset"} tone="scheduled" />
              ))}
            </div>
          </DataCard>
        ))}
      </div>
    </div>
  );
}

function CopilotPanel() {
  return (
    <div className="space-y-5">
      <PanelHeader
        eyebrow="Copilot"
        title="AI Operations Assistant"
        description="Το Copilot απαντά μόνο με βάση τα διαθέσιμα records, δείχνει citations και δηλώνει όταν λείπουν δεδομένα."
        action={<StatusPill label="cited answers" tone="valid" />}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <DataCard title="Απάντηση">
          <div className="rounded-lg border border-[#29473f] bg-[#203832] p-5 text-[#f7faf4]">
            <p className="text-sm font-semibold text-[#aee5d8]">AI Summary</p>
            <p className="mt-3 text-sm leading-6 text-[#d8e4de]">
              Αυτή την εβδομάδα προτεραιότητα έχουν: ανανέωση KTEO για B-12, επισκευή EX-01, follow-up για CR-04 και
              ολοκλήρωση service στο FL-02.
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
    <div className="space-y-5">
      <PanelHeader
        eyebrow="Αναφορές"
        title="Αναφορές διοίκησης"
        description="Αναφορές για weekly meeting, audit prep και operational follow-up."
        action={<ActionButton icon={Download}>Export αναφοράς</ActionButton>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Attention Report", "Κρίσιμα, προειδοποιήσεις, ελλείψεις και blocked records"],
          ["Expiration Report", "Ημερομηνίες λήξης ανά πάγιο και κατηγορία"],
          ["Maintenance Overdue", "Due work, κόστος και υπεύθυνοι"],
          ["Readiness Report", "Readiness scores με αιτίες και citations"],
        ].map(([title, detail]) => (
          <button
            key={title}
            type="button"
            className="rounded-lg border border-[#d9e2dc] bg-[#fbfaf6] p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:border-teal-300 hover:bg-[#eef7f2]"
          >
            <ClipboardList className="text-teal-800" size={20} />
            <p className="mt-3 font-semibold text-[#13211f]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="space-y-5">
      <PanelHeader
        eyebrow="Ρυθμίσεις"
        title="Company controls και trust layer"
        description="Ρυθμίσεις για χρήστες, notifications, imports, billing, audit logs και AI guardrails."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Users & Roles", "Owner, Admin, Operations, Compliance, Mechanic, Operator, Auditor"],
          ["Notifications", "60, 30, 14, 7, day-of και expired reminder windows"],
          ["Audit Logs", "Sensitive changes, overrides, imports και operational AI use"],
          ["Billing", "Manual invoice mode πρώτα, Stripe-ready αργότερα"],
          ["Imports", "CSV, Excel, folder upload, review queue και publish approval"],
          ["AI Settings", "Citations, missing-data disclosure και no legal advice"],
        ].map(([title, detail]) => (
          <DataCard key={title} title={title}>
            <p className="text-sm leading-6 text-slate-600">{detail}</p>
          </DataCard>
        ))}
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
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${
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
              className="hidden h-10 min-w-[150px] shrink-0 items-center gap-2 rounded-md border border-[#cfe3da] bg-[#eaf5ef] px-3 text-left text-[#123d37] transition hover:border-teal-200 hover:bg-[#e2f0ea] focus:outline-none focus:ring-2 focus:ring-teal-500 md:inline-flex"
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

        <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <section
            id={`${activeMeta.id}-panel`}
            role="tabpanel"
            aria-label={activeMeta.label}
            className="min-w-0"
          >
            {activeTab === "dashboard" && <DashboardPanel setActiveTab={setActiveTab} />}
            {activeTab === "command" && <CommandPanel />}
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
            <TodayPanel setActiveTab={setActiveTab} />
          </aside>
        </main>
      </div>
    </div>
  );
}
