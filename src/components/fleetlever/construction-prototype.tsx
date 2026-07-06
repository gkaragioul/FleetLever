"use client";

import type { ChangeEvent, ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  Gauge,
  HelpCircle,
  ListChecks,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Truck,
  UserCheck,
  X,
} from "lucide-react";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import { createFleetLeverEvent } from "@/lib/fleetlever/events";
import {
  buildFleetReleaseProofPack,
  getOperationalAlerts,
  getReleaseGate,
  getSupervisorQueue,
} from "@/lib/fleetlever/release-control";
import { buildFleetLeverReportText, getReportBuckets } from "@/lib/fleetlever/report";
import { resolveMachineStatus } from "@/lib/fleetlever/rules";
import { useFleetLeverStore } from "@/lib/fleetlever/store";
import type { CaptureMode, ChecklistAnswer, FleetLeverEvent, Machine, ProofPhoto, ReleaseStatus } from "@/lib/fleetlever/types";

type RoleView = "today" | "capture" | "review" | "machines" | "report" | "settings";
type DecisionKind = "release" | "block" | "note" | "review";

type CheckItem = {
  id: string;
  label: string;
  cleanLabel: string;
  riskLabel: string;
  skipLabel: string;
};

const requiredPhotoSlots = [
  "Front view",
  "Rear view",
  "Left side",
  "Right side",
  "Hour meter",
  "Attachment",
  "Visible damage",
  "Fuel / battery",
  "Yard context",
];

const checkItems: CheckItem[] = [
  { id: "start", label: "Machine start", cleanLabel: "Starts normally", riskLabel: "Problem starting", skipLabel: "Not checked" },
  { id: "leaks", label: "Fluid leaks", cleanLabel: "No leaks", riskLabel: "Leak found", skipLabel: "Not checked" },
  { id: "damage", label: "Visible damage", cleanLabel: "No new damage", riskLabel: "Damage found", skipLabel: "Not checked" },
  { id: "attachment", label: "Attachment", cleanLabel: "Present", riskLabel: "Missing", skipLabel: "Not needed" },
  { id: "tracks", label: "Tires / tracks", cleanLabel: "Looks okay", riskLabel: "Issue found", skipLabel: "Not checked" },
  { id: "meter", label: "Hour meter", cleanLabel: "Captured", riskLabel: "Missing", skipLabel: "Unreadable" },
  { id: "operator", label: "Operator opinion", cleanLabel: "Ready", riskLabel: "Not ready", skipLabel: "Needs review" },
];

const proofDescriptions: Record<string, string> = {
  "Front view": "Shows machine identity and visible damage.",
  "Rear view": "Records condition before tomorrow starts.",
  "Left side": "Checks panels, tires or tracks, and leaks.",
  "Right side": "Confirms the other side is clear.",
  "Hour meter": "Locks usage before dispatch.",
  Attachment: "Shows the right bucket, forks, blade, or tool.",
  "Visible damage": "Creates a clear damage note if needed.",
  "Fuel / battery": "Confirms the machine is ready to start.",
  "Yard context": "Shows where the machine was handed over.",
};

const captureModeCopy: Record<CaptureMode, { label: string; detail: string }> = {
  release: {
    label: "Before release",
    detail: "Lock condition before the machine leaves for tomorrow.",
  },
  return: {
    label: "Return check",
    detail: "Compare returned condition against the release proof pack.",
  },
};

const demoMachines: Machine[] = [
  {
    id: "cat-320",
    fleetNumber: "EX-320",
    name: "CAT 320 Excavator",
    type: "Excavator",
    brand: "CAT",
    model: "320",
    serialNumber: "CAT0320-FL-901",
    currentSite: "North yard -> Metro Line 4",
    status: "Ready",
    operator: "Kostas Antoniou",
    supervisor: "Maria Sotiropoulou",
    reason: "Complete proof set and checklist passed.",
    nextAction: "Ready for 06:30 dispatch",
    requiredPhotoSlots,
    completedPhotoSlots: requiredPhotoSlots,
    checklistPassed: 7,
    checklistTotal: 7,
    riskScore: 8,
    flags: [],
    defects: [],
    history: [
      { time: "Today 18:12", actor: "Kostas", event: "Uploaded all required proof photos." },
      { time: "Today 18:16", actor: "Maria", event: "Marked ready for tomorrow morning." },
    ],
  },
  {
    id: "jcb-3cx",
    fleetNumber: "BL-3CX",
    name: "JCB 3CX Backhoe Loader",
    type: "Backhoe loader",
    brand: "JCB",
    model: "3CX",
    serialNumber: "JCB3CX-FL-118",
    currentSite: "Rental bay -> Road crew",
    status: "Needs review",
    operator: "Nikos Papadakis",
    supervisor: "Dimitris",
    reason: "Attachment photo is missing.",
    nextAction: "Capture proof or supervisor review",
    requiredPhotoSlots,
    completedPhotoSlots: requiredPhotoSlots.filter((slot) => slot !== "Attachment"),
    checklistPassed: 6,
    checklistTotal: 7,
    riskScore: 42,
    flags: ["Attachment required but no attachment photo", "Supervisor needs to decide"],
    defects: [],
    history: [
      { time: "Today 17:44", actor: "Nikos", event: "Submitted handover without attachment photo." },
      { time: "Today 17:45", actor: "Checks", event: "Held the machine for review." },
    ],
  },
  {
    id: "volvo-l120",
    fleetNumber: "LD-120",
    name: "Volvo L120 Wheel Loader",
    type: "Wheel loader",
    brand: "Volvo",
    model: "L120",
    serialNumber: "VOL120-FL-507",
    currentSite: "Quarry face",
    status: "Blocked",
    operator: "Giorgos Rallis",
    supervisor: "Workshop lead",
    reason: "Hydraulic leak reported.",
    nextAction: "Workshop owner must clear the issue",
    requiredPhotoSlots,
    completedPhotoSlots: requiredPhotoSlots,
    checklistPassed: 5,
    checklistTotal: 7,
    riskScore: 91,
    flags: ["Open issue needs supervisor review", "Unresolved issue from previous handover"],
    defects: [{ title: "Hydraulic leak under left lift arm", severity: "critical", status: "open" }],
    history: [
      { time: "Today 16:50", actor: "Giorgos", event: "Reported visible hydraulic leak." },
      { time: "Today 16:52", actor: "Checks", event: "Blocked the machine until action is complete." },
    ],
  },
  {
    id: "bobcat-s650",
    fleetNumber: "SS-650",
    name: "Bobcat S650 Skid Steer",
    type: "Skid steer",
    brand: "Bobcat",
    model: "S650",
    serialNumber: "BOB650-FL-332",
    currentSite: "Small works bay",
    status: "Released with exception",
    operator: "Eleni Mavrou",
    supervisor: "Maria Sotiropoulou",
    reason: "Minor cosmetic damage accepted with a written note.",
    nextAction: "Ready with supervisor note",
    requiredPhotoSlots,
    completedPhotoSlots: requiredPhotoSlots,
    checklistPassed: 7,
    checklistTotal: 7,
    riskScore: 21,
    flags: ["Damage photo exists while checklist says no new damage"],
    defects: [{ title: "Cosmetic scrape on rear panel", severity: "low", status: "acknowledged" }],
    history: [
      { time: "Today 15:30", actor: "Eleni", event: "Uploaded damage photo and note." },
      { time: "Today 15:42", actor: "Maria", event: "Released with written note." },
    ],
  },
  {
    id: "manitou-mt1840",
    fleetNumber: "TH-1840",
    name: "Manitou MT 1840 Telehandler",
    type: "Telehandler",
    brand: "Manitou",
    model: "MT 1840",
    serialNumber: "DEM0006-FL-411",
    currentSite: "Yard stand-by",
    status: "Proof missing",
    operator: "Antonis Markou",
    supervisor: "Dimitris",
    reason: "Hour meter photo is missing.",
    nextAction: "Operator must add proof",
    requiredPhotoSlots,
    completedPhotoSlots: requiredPhotoSlots.filter((slot) => slot !== "Hour meter"),
    checklistPassed: 6,
    checklistTotal: 7,
    riskScore: 56,
    flags: ["Hour meter photo missing"],
    defects: [],
    history: [
      { time: "Today 14:18", actor: "Antonis", event: "Started handover." },
      { time: "Today 14:22", actor: "Checks", event: "Held the machine because proof is missing." },
    ],
  },
  {
    id: "hamm-roller",
    fleetNumber: "RL-90",
    name: "Hamm Roller",
    type: "Roller",
    brand: "Hamm",
    model: "HD 90",
    serialNumber: "HAM90-FL-772",
    currentSite: "Road crew staging",
    status: "Defect reported",
    operator: "Petros Ioannou",
    supervisor: "Workshop lead",
    reason: "Open vibration issue from previous handover.",
    nextAction: "Supervisor must review the issue",
    requiredPhotoSlots,
    completedPhotoSlots: requiredPhotoSlots.slice(0, 7),
    checklistPassed: 5,
    checklistTotal: 7,
    riskScore: 73,
    flags: ["Open issue from previous handover", "Submission completed unusually fast"],
    defects: [{ title: "Excessive vibration at high idle", severity: "high", status: "open" }],
    history: [
      { time: "Yesterday 18:05", actor: "Petros", event: "Reported vibration issue." },
      { time: "Today 13:20", actor: "Checks", event: "Carried the issue into tomorrow readiness." },
    ],
  },
  {
    id: "komatsu-d65",
    fleetNumber: "DZ-65",
    name: "Komatsu D65 Dozer",
    type: "Dozer",
    brand: "Komatsu",
    model: "D65",
    serialNumber: "KOMD65-FL-093",
    currentSite: "Earthworks lane",
    status: "Ready",
    operator: "Maria Kontou",
    supervisor: "Dimitris",
    reason: "Checklist, proof photos, and documents complete.",
    nextAction: "Ready for 07:00 dispatch",
    requiredPhotoSlots,
    completedPhotoSlots: requiredPhotoSlots,
    checklistPassed: 7,
    checklistTotal: 7,
    riskScore: 12,
    flags: [],
    defects: [],
    history: [
      { time: "Today 16:00", actor: "Maria", event: "Completed readiness handover." },
      { time: "Today 16:10", actor: "Dimitris", event: "Marked ready." },
    ],
  },
];

const navItems: Array<{ id: RoleView; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "today", label: "Tomorrow", icon: Gauge },
  { id: "capture", label: "Capture", icon: Smartphone },
  { id: "review", label: "Review", icon: UserCheck },
  { id: "machines", label: "Machines", icon: Truck },
  { id: "report", label: "Report", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

const reviewTabs: Array<{ id: "review" | "proof" | "blocked" | "note" | "all"; label: string }> = [
  { id: "review", label: "Needs decision" },
  { id: "proof", label: "Missing proof" },
  { id: "blocked", label: "Blocked" },
  { id: "note", label: "Notes" },
  { id: "all", label: "All" },
];

const statusStyles: Record<ReleaseStatus, string> = {
  Ready: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100",
  Blocked: "bg-red-50 text-red-800 ring-1 ring-red-100",
  "Needs review": "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  "Released with exception": "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  "Defect reported": "bg-red-50 text-red-800 ring-1 ring-red-100",
  "Proof missing": "bg-sky-50 text-sky-800 ring-1 ring-sky-100",
};

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-[22px] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40 ${className}`}>
      {children}
    </section>
  );
}

function PrimaryButton({
  children,
  onClick,
  tone = "dark",
  disabled = false,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "dark" | "light" | "green" | "red";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const toneClass = {
    dark: "bg-[#10201e] text-white hover:bg-[#19332f]",
    light: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    green: "bg-emerald-700 text-white hover:bg-emerald-800",
    red: "bg-red-700 text-white hover:bg-red-800",
  }[tone];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className}`}
    >
      {children}
    </button>
  );
}

function missingSlots(machine: Machine) {
  const completed = new Set(machine.completedPhotoSlots);
  return machine.requiredPhotoSlots.filter((slot) => !completed.has(slot));
}

function proofPercent(machine: Machine) {
  if (!machine.requiredPhotoSlots.length) return 100;
  return Math.round((machine.completedPhotoSlots.length / machine.requiredPhotoSlots.length) * 100);
}

function displayStatus(status: ReleaseStatus) {
  if (status === "Released with exception") return "Released with note";
  if (status === "Defect reported") return "Issue reported";
  if (status === "Proof missing") return "Missing proof";
  return status;
}

function canWorkAnswer(machine: Machine) {
  if (machine.status === "Ready") return "Yes";
  if (machine.status === "Released with exception") return "Yes, with note";
  if (machine.status === "Proof missing") return "Waiting for proof";
  if (machine.status === "Needs review") return "Needs review";
  return "No";
}

function shortReason(machine: Machine) {
  const missing = missingSlots(machine);
  const issue = machine.defects.find((defect) => defect.status !== "resolved");

  if (machine.id === "jcb-3cx") return "Missing attachment photo";
  if (machine.id === "manitou-mt1840") return "Missing hour meter";
  if (machine.id === "hamm-roller") return "Open vibration issue";
  if (machine.id === "volvo-l120") return "Hydraulic leak reported";
  if (missing.length) return `Missing ${missing[0].toLowerCase()} photo`;
  if (issue) return issue.title;
  if (machine.status === "Released with exception") return "Released with note";
  return "Ready";
}

function rowActionLabel(machine: Machine) {
  if (machine.status === "Proof missing") return "Capture";
  if (machine.status === "Blocked") return "View";
  if (machine.status === "Ready" || machine.status === "Released with exception") return "View";
  return "Review";
}

function isClear(machine: Machine) {
  return machine.status === "Ready" || machine.status === "Released with exception";
}

function needsAction(machine: Machine) {
  return machine.status === "Needs review" || machine.status === "Proof missing" || machine.status === "Defect reported";
}

function hasCriticalIssue(machine: Machine) {
  return machine.defects.some((defect) => defect.status !== "resolved" && defect.severity === "critical");
}

function openIssueCount(machine: Machine) {
  return machine.defects.filter((defect) => defect.status !== "resolved").length;
}

function capturePrediction({
  missingCount,
  warningCount,
  criticalIssue,
}: {
  missingCount: number;
  warningCount: number;
  criticalIssue: boolean;
}) {
  if (criticalIssue) {
    return {
      title: "This machine should be blocked.",
      subtext: "A critical issue was reported. Supervisor review is required.",
      button: "Submit issue",
    };
  }

  if (missingCount > 0) {
    return {
      title: "This machine is missing proof.",
      subtext: "Add the missing proof before it can be cleared.",
      button: "Submit for review",
    };
  }

  if (warningCount > 0) {
    return {
      title: "This machine needs review.",
      subtext: "Proof is complete, but one or more checks need supervisor review.",
      button: "Submit for review",
    };
  }

  return {
    title: "This machine looks ready for tomorrow.",
    subtext: "All required proof is complete and no issues were reported.",
    button: "Submit as ready",
  };
}

function StatusPill({ status }: { status: ReleaseStatus }) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold ${statusStyles[status]}`}>
      {displayStatus(status)}
    </span>
  );
}

function ProofBar({ machine }: { machine: Machine }) {
  const percent = proofPercent(machine);

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
        <span>{machine.completedPhotoSlots.length} of {machine.requiredPhotoSlots.length}</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#10201e]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function TomorrowMachineRow({
  machine,
  onOpen,
  onCapture,
  onReview,
}: {
  machine: Machine;
  onOpen: () => void;
  onCapture: () => void;
  onReview: () => void;
}) {
  const label = rowActionLabel(machine);
  const gate = getReleaseGate(machine);
  const action =
    label === "Capture"
      ? onCapture
      : label === "Review"
        ? onReview
        : onOpen;

  return (
    <div className="grid gap-3 rounded-[18px] bg-white px-4 py-4 shadow-sm shadow-slate-200/50 sm:grid-cols-[1fr_auto] sm:items-center">
      <button type="button" onClick={onOpen} className="min-w-0 text-left">
        <h3 className="text-base font-semibold text-slate-950">{machine.name}</h3>
        <p className="mt-1 text-sm font-medium leading-5 text-slate-500">{shortReason(machine)}</p>
        <p className={`mt-2 text-xs font-semibold ${gate.canRelease ? "text-emerald-700" : "text-red-700"}`}>
          {gate.label}
        </p>
      </button>
      <PrimaryButton onClick={action} tone={label === "View" ? "light" : "dark"} className="min-w-28 sm:w-auto">
        {label}
      </PrimaryButton>
    </div>
  );
}

function MachineDetailDrawer({
  machine,
  events,
  onClose,
  onCapture,
  onReview,
}: {
  machine: Machine | null;
  events: FleetLeverEvent[];
  onClose: () => void;
  onCapture: (id: string) => void;
  onReview: (id: string) => void;
}) {
  if (!machine) return null;

  const missing = missingSlots(machine);
  const gate = getReleaseGate(machine);
  const openIssues = machine.defects.filter((defect) => defect.status !== "resolved");
  const recentEvents = events.filter((event) => event.machineId === machine.id).slice(-5).reverse();
  const drawerActions =
    machine.status === "Ready"
      ? [
          { label: "Update proof", tone: "dark" as const, onClick: () => onCapture(machine.id) },
          { label: "View history", tone: "light" as const, onClick: undefined },
        ]
      : machine.status === "Proof missing"
        ? [
            { label: "Capture proof", tone: "dark" as const, onClick: () => onCapture(machine.id) },
            { label: "Request proof", tone: "light" as const, onClick: () => onCapture(machine.id) },
          ]
        : machine.status === "Blocked" || machine.status === "Defect reported"
          ? [
              { label: "View issue", tone: "light" as const, onClick: undefined },
              { label: "Review", tone: "dark" as const, onClick: () => onReview(machine.id) },
            ]
          : machine.status === "Released with exception"
            ? [
                { label: "View note", tone: "light" as const, onClick: undefined },
                { label: "Update proof", tone: "dark" as const, onClick: () => onCapture(machine.id) },
              ]
            : [
                { label: "Review", tone: "dark" as const, onClick: () => onReview(machine.id) },
                { label: "Capture proof", tone: "light" as const, onClick: () => onCapture(machine.id) },
              ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30">
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:h-full md:max-h-none md:w-[440px] md:rounded-none md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Machine details</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{machine.name}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{machine.fleetNumber} / {machine.currentSite}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close machine details"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 rounded-[22px] bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-500">Can it work tomorrow?</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{canWorkAnswer(machine)}</p>
          <p className={`mt-3 text-sm font-semibold ${gate.canRelease ? "text-emerald-700" : "text-red-700"}`}>{gate.label}</p>
        </div>

        <div className="mt-6 grid gap-5">
          <div>
            <p className="text-sm font-semibold text-slate-950">Reason</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{shortReason(machine)}.</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-950">Proof</p>
            {missing.length ? (
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                Missing {missing.join(", ")}
              </p>
            ) : (
              <p className="mt-2 text-sm font-medium text-emerald-700">Complete</p>
            )}
          </div>

          {openIssues.length ? (
            <div>
              <p className="text-sm font-semibold text-slate-950">Issue</p>
              <div className="mt-2 grid gap-2">
                {openIssues.map((issue) => (
                  <div key={issue.title} className="rounded-[18px] bg-red-50 px-4 py-3">
                    <p className="text-sm font-semibold text-red-900">{issue.title}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {recentEvents.length ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-950">Recent events</p>
            <div className="mt-2 grid gap-2">
              {recentEvents.map((event) => (
                <div key={event.id} className="rounded-[18px] bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{event.type.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{event.note ?? event.reason ?? event.user}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-7 grid gap-2">
          {drawerActions.map((action) => (
            <PrimaryButton key={action.label} onClick={action.onClick} tone={action.tone} className="w-full">
              {action.label.includes("proof") ? <Camera className="h-4 w-4" aria-hidden="true" /> : null}
              {action.label.includes("Review") ? <UserCheck className="h-4 w-4" aria-hidden="true" /> : null}
              {action.label}
            </PrimaryButton>
          ))}
        </div>
      </div>
    </div>
  );
}

function TodayView({
  machines,
  onOpenMachine,
  onReview,
  onCapture,
}: {
  machines: Machine[];
  onOpenMachine: (id: string) => void;
  onReview: (id?: string) => void;
  onCapture: (id?: string) => void;
}) {
  const [readyExpanded, setReadyExpanded] = useState(false);
  const ready = machines.filter(isClear);
  const blocked = machines.filter((machine) => machine.status === "Blocked");
  const action = machines.filter(needsAction);
  const alerts = getOperationalAlerts(machines);
  const locked = machines.filter((machine) => getReleaseGate(machine).state === "locked");
  const decision = machines.filter((machine) => getReleaseGate(machine).state === "decision");

  return (
    <div className="mx-auto grid max-w-[860px] gap-4 md:gap-5">
      <Panel className="p-4 md:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Tomorrow Release Board</h2>
            <p className="mt-2 text-sm font-semibold text-red-700">No proof. No release.</p>
            <p className="text-xl font-semibold tracking-tight text-slate-950">
              {ready.length} ready <span aria-hidden="true">&middot;</span> {action.length} need action <span aria-hidden="true">&middot;</span> {blocked.length} blocked
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">Every machine is cleared, locked, or blocked before the morning starts.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <PrimaryButton onClick={onReview} className="w-full">
              Review action needed
            </PrimaryButton>
            <PrimaryButton onClick={onCapture} tone="light" className="w-full">
              Capture proof
            </PrimaryButton>
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-3">
        {alerts.map((alert) => (
          <Panel key={alert.label} className="p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                <Bell className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950">{alert.label}</p>
                <p className="mt-1 text-sm font-medium leading-5 text-slate-500">{alert.message}</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Needs proof", locked.length, "Operator must add photos."],
          ["Supervisor decision", decision.length, "Proof exists, risk remains."],
          ["Blocked", blocked.length, "Cannot move tomorrow."],
        ].map(([label, value, detail]) => (
          <Panel key={label as string} className="p-4">
            <p className="text-sm font-semibold text-slate-500">{label as string}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value as number}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{detail as string}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-4 md:p-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Needs action</h2>
        </div>

        <div className="mt-4 grid gap-3">
          {action.map((machine) => (
            <TomorrowMachineRow
              key={machine.id}
              machine={machine}
              onOpen={() => onOpenMachine(machine.id)}
              onCapture={() => onCapture(machine.id)}
              onReview={() => onReview(machine.id)}
            />
          ))}
        </div>

        <div className="mt-7">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Blocked</h2>
          <div className="mt-4 grid gap-3">
            {blocked.map((machine) => (
              <TomorrowMachineRow
                key={machine.id}
                machine={machine}
                onOpen={() => onOpenMachine(machine.id)}
                onCapture={() => onCapture(machine.id)}
                onReview={() => onReview(machine.id)}
              />
            ))}
          </div>
        </div>

        <div className="mt-7 border-t border-slate-100 pt-4">
          <button
            type="button"
            aria-expanded={readyExpanded}
            onClick={() => setReadyExpanded((current) => !current)}
            className="flex w-full items-center justify-between gap-3 rounded-[16px] px-1 py-2 text-left text-base font-semibold text-slate-950"
          >
            <span>Ready machines {ready.length}</span>
            <span className="ml-auto text-sm font-semibold text-slate-500">{readyExpanded ? "Hide" : "Show"}</span>
            <ChevronRight className={`h-4 w-4 text-slate-400 transition ${readyExpanded ? "rotate-90" : ""}`} aria-hidden="true" />
          </button>

          {readyExpanded ? (
            <div className="mt-3 grid gap-2">
              {ready.map((machine) => (
                <button
                  key={machine.id}
                  type="button"
                  onClick={() => onOpenMachine(machine.id)}
                  className="rounded-[16px] bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800"
                >
                  {machine.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function CaptureView({
  machine,
  machines,
  proofPhotos,
  onSelectMachine,
  onProofAdded,
  onSubmit,
  onGoToday,
}: {
  machine: Machine;
  machines: Machine[];
  proofPhotos: ProofPhoto[];
	  onSelectMachine: (id: string) => void;
	  onProofAdded: (photo: ProofPhoto) => void;
	  onSubmit: (machineId: string, completedSlots: string[], checklistPassed: number, warningCount: number, mode: CaptureMode) => void;
	  onGoToday: () => void;
	}) {
	  const [step, setStep] = useState(1);
	  const [captureMode, setCaptureMode] = useState<CaptureMode>("release");
	  const [completedSlots, setCompletedSlots] = useState<string[]>(machine.completedPhotoSlots);
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>(() =>
    Object.fromEntries(checkItems.map((item, index) => [item.id, index < machine.checklistPassed ? "clean" : "skip"])),
  );
  const [addedPhotosExpanded, setAddedPhotosExpanded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [qrMessage, setQrMessage] = useState("");

  const missing = requiredPhotoSlots.filter((slot) => !completedSlots.includes(slot));
  const added = requiredPhotoSlots.filter((slot) => completedSlots.includes(slot));
  const proofPhotoBySlot = new Map(proofPhotos.map((photo) => [photo.proofSlot, photo]));
  const cleanCount = checkItems.filter((item) => answers[item.id] === "clean").length;
  const warningItems = checkItems.filter((item) => answers[item.id] === "risk");
  const skippedItems = checkItems.filter((item) => answers[item.id] === "skip");
  const criticalIssue = hasCriticalIssue(machine);
  const prediction = capturePrediction({
    missingCount: missing.length,
    warningCount: warningItems.length + openIssueCount(machine),
    criticalIssue,
  });
  const willNeedReview = prediction.button !== "Submit as ready";

  async function addProofPhoto(slot: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    const photo: ProofPhoto = {
      id: `proof-${machine.id}-${slot.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      machineId: machine.id,
      proofSlot: slot,
      fileName: file.name,
	      mimeType: file.type || "application/octet-stream",
	      dataUrl: await readFileAsDataUrl(file),
	      timestamp: new Date().toISOString(),
	      operator: machine.operator,
	      captureMode,
	      qualityStatus: file.size > 0 ? "accepted" : "needs retake",
	    };
	
	    setCompletedSlots((current) => current.includes(slot) ? current : [...current, slot]);
	    setPhotoMessage(`Photo added for ${slot}. Quality checked.`);
    onProofAdded(photo);
    setSubmitted(false);
  }

  function selectQrMachine() {
    const normalized = qrInput.trim().toLowerCase().replace("fleetlever://machine/", "");
    const match = machines.find((item) =>
      item.fleetNumber.toLowerCase() === normalized ||
      item.qrValue?.toLowerCase() === qrInput.trim().toLowerCase(),
    );

    if (!match) {
      setQrMessage("No machine found for that code.");
      return;
    }

    onSelectMachine(match.id);
    setQrMessage(`${match.name} selected.`);
    setStep(2);
  }

  function setAnswer(itemId: string, answer: ChecklistAnswer) {
    setAnswers((current) => ({ ...current, [itemId]: answer }));
    setSubmitted(false);
  }

	  function submitHandover() {
	    onSubmit(machine.id, completedSlots, cleanCount, warningItems.length + skippedItems.length, captureMode);
	    setSubmitted(true);
    setStep(4);
  }

  if (submitted) {
    return (
      <Panel className="mx-auto max-w-3xl p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">Submitted</h2>
        <p className="mt-4 text-lg font-medium leading-8 text-slate-600">
          {machine.name} {willNeedReview ? "needs review before it can work tomorrow." : "looks ready for tomorrow."}
        </p>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
          Next: {willNeedReview ? "A supervisor must review the missing proof, warning, or issue." : "It now appears as ready on Tomorrow."}
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <PrimaryButton onClick={() => setSubmitted(false)} tone="light">Capture another machine</PrimaryButton>
          <PrimaryButton onClick={onGoToday}>Go to Tomorrow</PrimaryButton>
        </div>
      </Panel>
    );
  }

  const stepLabels = ["1 Machine", "2 Photos", "3 Checks", "4 Submit"];

  return (
    <div className="mx-auto grid max-w-[760px] gap-5 pb-28 md:pb-0">
      <Panel className="p-6 md:p-7">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {step === 1 ? "Choose machine" : step === 2 ? "Add photos" : step === 3 ? "Run checks" : "Review submission"}
            </h2>
	            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-600">
	              Add what this machine is missing.
	            </p>
	            <p className="mt-2 text-sm font-semibold text-slate-500">Only missing proof is requested.</p>
	          </div>
          {step === 1 ? (
            <PrimaryButton onClick={() => setQrMessage("Enter a machine QR value below.")}>
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Scan QR code
            </PrimaryButton>
          ) : null}
        </div>

	        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {stepLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index + 1)}
              className={`rounded-[18px] px-4 py-3 text-left text-sm font-semibold ${step === index + 1 ? "bg-[#10201e] text-white" : "bg-slate-50 text-slate-600"}`}
            >
              {label}
            </button>
          ))}
	        </div>
	
	        <div className="mt-6 grid gap-3 rounded-[20px] bg-slate-50 p-3 sm:grid-cols-2">
	          {(Object.keys(captureModeCopy) as CaptureMode[]).map((mode) => (
	            <button
	              key={mode}
	              type="button"
	              aria-label={captureModeCopy[mode].label}
	              onClick={() => setCaptureMode(mode)}
	              className={`rounded-[16px] px-4 py-3 text-left transition ${captureMode === mode ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
	            >
	              <span className="block text-sm font-semibold">{captureModeCopy[mode].label}</span>
	              <span className="mt-1 block text-xs font-medium leading-5">{captureModeCopy[mode].detail}</span>
	            </button>
	          ))}
	        </div>
	      </Panel>

      <Panel className="p-4 md:p-5">
        <h2 className="text-lg font-semibold text-slate-950">{machine.name}</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {missing.length ? `Missing: ${missing.join(", ")}` : "Required proof complete"}
        </p>
      </Panel>

      <div className="min-w-0">
          {step === 1 ? (
            <Panel className="p-6">
              <div className="mx-auto max-w-2xl">
                <div className="rounded-[24px] bg-slate-50 p-6 text-center">
                  <QrCode className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">Scan machine</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">Scan the QR code on the machine or choose from recent machines.</p>
                  <PrimaryButton className="mt-5" onClick={() => setQrMessage("Enter a machine QR value below.")}>
                    <QrCode className="h-4 w-4" aria-hidden="true" />
                    Scan QR code
                  </PrimaryButton>
                  <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      value={qrInput}
                      onChange={(event) => setQrInput(event.target.value)}
                      placeholder="fleetlever://machine/EX-320 or EX-320"
                      className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                    />
                    <PrimaryButton onClick={selectQrMachine} tone="light">Use code</PrimaryButton>
                  </div>
                  {qrMessage ? <p className="mt-3 text-sm font-semibold text-slate-600">{qrMessage}</p> : null}
                </div>

                <h3 className="mt-7 text-lg font-semibold text-slate-950">Or choose machine</h3>
                <div className="mt-3 grid gap-2">
                  {machines.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectMachine(item.id)}
                      className={`flex min-h-14 items-center justify-between rounded-[18px] px-4 text-left text-sm font-semibold ${item.id === machine.id ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"}`}
                    >
                      <span>
                        <span className="block">{item.name}</span>
                        <span className="mt-1 block text-xs opacity-70">{item.fleetNumber}</span>
                      </span>
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-[20px] bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Selected machine</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{machine.name}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{machine.currentSite}</p>
                </div>
              </div>
            </Panel>
          ) : null}

          {step === 2 ? (
            <Panel className="p-6">
              <h2 className="text-2xl font-semibold text-slate-950">Photos</h2>
              <div className="mt-5 grid gap-4">
                {missing.length ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Missing photo</p>
                    <div className="mt-3 grid gap-3">
                      {missing.map((slot) => (
                        <div key={slot} className="rounded-[18px] bg-sky-50 p-4">
	                          <p className="text-base font-semibold text-slate-950">{slot}</p>
	                          <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{proofDescriptions[slot]}</p>
                            <input
                              id={`proof-${machine.id}-${slot}`}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="sr-only"
                              onChange={(event) => {
                                void addProofPhoto(slot, event);
                              }}
                            />
	                          <button
	                            type="button"
	                            onClick={() => document.getElementById(`proof-${machine.id}-${slot}`)?.click()}
	                            className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
	                          >
	                            Add photo for {slot}
	                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
	                ) : (
	                  <p className="rounded-[18px] bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Required proof complete.</p>
	                )}
                  {photoMessage ? (
                    <p className="rounded-[18px] bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{photoMessage}</p>
                  ) : null}

                <div className="border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    aria-expanded={addedPhotosExpanded}
                    onClick={() => setAddedPhotosExpanded((current) => !current)}
                    className="flex w-full items-center justify-between gap-3 rounded-[16px] py-2 text-left text-sm font-semibold text-slate-700"
                  >
                    <span>Added photos {added.length}. {addedPhotosExpanded ? "Hide" : "Show"}</span>
                    <ChevronRight className={`h-4 w-4 text-slate-400 transition ${addedPhotosExpanded ? "rotate-90" : ""}`} aria-hidden="true" />
                  </button>

	                  {addedPhotosExpanded ? (
	                    <div className="mt-3 grid gap-2">
	                      {added.map((slot) => (
	                        <div
	                          key={slot}
	                          className="flex min-h-11 items-center justify-between rounded-[16px] bg-slate-50 px-4 text-sm font-semibold text-slate-700"
	                        >
	                          <span>{slot}</span>
	                          <span className="text-xs text-slate-400">{proofPhotoBySlot.get(slot)?.fileName ?? "Added"}</span>
	                        </div>
	                      ))}
	                    </div>
	                  ) : null}
                </div>
              </div>
            </Panel>
          ) : null}

          {step === 3 ? (
            <Panel className="p-6">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-slate-500" aria-hidden="true" />
                <h2 className="text-2xl font-semibold text-slate-950">Checks</h2>
              </div>
              <div className="mt-5 grid gap-2">
                {checkItems.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-[16px] bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                      {answers[item.id] === "risk" ? (
                        <p className="mt-1 text-xs font-semibold text-amber-700">This will require supervisor review.</p>
                      ) : null}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {([
                        ["clean", item.cleanLabel],
                        ["risk", item.riskLabel],
                        ["skip", item.skipLabel],
                      ] as Array<[ChecklistAnswer, string]>).map(([answer, label]) => (
                        <button
                          key={answer}
                          type="button"
                          onClick={() => setAnswer(item.id, answer)}
                          className={`min-h-10 rounded-full px-3 text-sm font-semibold ${answers[item.id] === answer ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {step === 4 ? (
            <Panel className="p-6">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{prediction.title}</h2>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-600">{prediction.subtext}</p>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-[18px] bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Proof</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{completedSlots.length} of {requiredPhotoSlots.length}</p>
                </div>
                <div className="rounded-[18px] bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Check warnings</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{warningItems.length + skippedItems.length}</p>
                </div>
                <div className="rounded-[18px] bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Missing proof</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{missing.length}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {missing.length ? <p className="rounded-[18px] bg-sky-50 p-4 text-sm font-semibold text-sky-800">Missing: {missing.join(", ")}</p> : null}
                {warningItems.length ? <p className="rounded-[18px] bg-amber-50 p-4 text-sm font-semibold text-amber-800">Needs review: {warningItems.map((item) => item.label).join(", ")}</p> : null}
                {criticalIssue ? <p className="rounded-[18px] bg-red-50 p-4 text-sm font-semibold text-red-800">Critical issue: supervisor should block this machine.</p> : null}
              </div>
            </Panel>
          ) : null}

          <Panel className="sticky bottom-28 z-10 mt-5 p-4 md:static md:bottom-auto md:z-auto">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-base font-semibold text-slate-950">{prediction.title}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{prediction.subtext}</p>
              </div>
              {step < 4 ? (
                <PrimaryButton onClick={() => setStep(step + 1)} className="w-full sm:w-auto">
                  {step === 1 ? "Continue to photos" : step === 2 ? "Continue to checks" : "Review submission"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
              ) : (
                <PrimaryButton onClick={submitHandover} className="w-full sm:w-auto">
                  {prediction.button}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
              )}
            </div>
          </Panel>
        </div>
    </div>
  );
}

function DecisionModal({
  machine,
  decision,
  onClose,
  onConfirm,
  onRequestProof,
  onChangeDecision,
}: {
  machine: Machine;
  decision: DecisionKind;
  onClose: () => void;
  onConfirm: (status: ReleaseStatus, note: string) => void;
  onRequestProof?: (id: string) => void;
  onChangeDecision?: (decision: Exclude<DecisionKind, "review">) => void;
}) {
  const [note, setNote] = useState("");
  const [owner, setOwner] = useState(machine.supervisor);
  const [supervisor, setSupervisor] = useState(machine.supervisor);
  const [neededBy, setNeededBy] = useState("Tomorrow 06:00");
  const isBlock = decision === "block";
  const isNote = decision === "note";
  const isReview = decision === "review";
  const canConfirm = isBlock
    ? note.trim().length > 5 && owner.trim().length > 1
    : isNote
      ? note.trim().length > 5 && supervisor.trim().length > 1
      : true;
  const title = decision === "release" ? "Release this machine for tomorrow?" : isBlock ? "Block this machine?" : isReview ? "Review decision" : "Release with note?";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 md:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="decision-title" className="w-full max-w-lg rounded-[24px] bg-white p-5 shadow-2xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="decision-title" className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">{machine.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close decision" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {isReview ? (
            <>
              <p className="rounded-[18px] bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
                Proof is complete, but this machine has warnings. Choose the outcome deliberately.
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <PrimaryButton onClick={() => onChangeDecision?.("note")} tone="light">Release with note</PrimaryButton>
                <PrimaryButton onClick={() => onChangeDecision?.("block")} tone="red">Block</PrimaryButton>
                <PrimaryButton
                  onClick={() => {
                    onRequestProof?.(machine.id);
                    onClose();
                  }}
                  tone="light"
                >
                  Request proof
                </PrimaryButton>
              </div>
            </>
          ) : null}

          {isNote ? (
            <>
              <p className="rounded-[18px] bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
                This machine has warnings. It can only move if you accept the issue and record why.
              </p>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-800">Supervisor note</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Example: cosmetic scrape photographed, safe to send."
                  className="min-h-28 rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-slate-400"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-800">Supervisor name</span>
                <input
                  value={supervisor}
                  onChange={(event) => setSupervisor(event.target.value)}
                  className="min-h-11 rounded-[18px] border border-slate-200 px-4 text-sm font-medium outline-none focus:border-slate-400"
                />
              </label>
              <p className="text-xs font-semibold text-slate-500">Timestamp: Just now</p>
            </>
          ) : null}

          {isBlock ? (
            <>
              <p className="rounded-[18px] bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
                This machine will not be allowed to work tomorrow.
              </p>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-800">Reason</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Why this machine cannot work tomorrow"
                  className="min-h-24 rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-slate-400"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-800">Owner</span>
                <input
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  className="min-h-11 rounded-[18px] border border-slate-200 px-4 text-sm font-medium outline-none focus:border-slate-400"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-800">Needed by</span>
                <input
                  value={neededBy}
                  onChange={(event) => setNeededBy(event.target.value)}
                  className="min-h-11 rounded-[18px] border border-slate-200 px-4 text-sm font-medium outline-none focus:border-slate-400"
                />
              </label>
            </>
          ) : null}

          {decision === "release" ? (
            <p className="rounded-[18px] bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-600">
              This marks the machine ready for tomorrow and records your review.
            </p>
          ) : null}
        </div>

        {isReview ? null : (
          <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-xs font-semibold text-slate-500">
              {isBlock ? "Block requires a reason and owner." : isNote ? "Release with note requires a written note." : "Release records supervisor approval."}
            </p>
            <PrimaryButton
              disabled={!canConfirm}
              tone={isBlock ? "red" : "dark"}
              onClick={() => {
                const cleanNote = note.trim();
                if (decision === "release") onConfirm("Ready", "Supervisor released machine for tomorrow.");
                if (decision === "block") onConfirm("Blocked", `${cleanNote} Owner: ${owner.trim()}. Needed by: ${neededBy.trim()}.`);
                if (decision === "note") onConfirm("Released with exception", `${cleanNote} Supervisor: ${supervisor.trim()}. Time: Just now.`);
              }}
            >
              {decision === "release" ? "Release machine" : isBlock ? "Block machine" : "Release with note"}
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewView({
  machines,
  onDecision,
  onRequestProof,
}: {
  machines: Machine[];
  onDecision: (machineId: string, status: ReleaseStatus, note: string) => void;
  onRequestProof: (id: string) => void;
}) {
	  const [tab, setTab] = useState<(typeof reviewTabs)[number]["id"]>("review");
	  const [modal, setModal] = useState<{ machine: Machine; decision: DecisionKind } | null>(null);
	  const supervisorQueue = getSupervisorQueue(machines);
	  const supervisorQueueIds = new Set(supervisorQueue.map((machine) => machine.id));
	  const queue = machines.filter((machine) => supervisorQueueIds.has(machine.id) || machine.status === "Released with exception");
	  const decisionCount = supervisorQueue.length;
  const visible = queue.filter((machine) => {
    if (tab === "review") return machine.status === "Needs review" || machine.status === "Defect reported";
    if (tab === "proof") return machine.status === "Proof missing";
    if (tab === "blocked") return machine.status === "Blocked";
    if (tab === "note") return machine.status === "Released with exception";
    return true;
  });

	  return (
	    <div className="mx-auto grid w-full max-w-[900px] min-w-0 gap-5">
	      <div className="min-w-0 overflow-hidden">
	        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Supervisor Release Queue</h2>
	        <p className="mt-2 text-sm font-semibold text-red-700">No proof. No release.</p>
	        <p className="mt-3 text-lg font-semibold text-slate-950">{decisionCount} machines need a decision.</p>
	        <p className="mt-1 text-sm font-semibold text-slate-500">Missing proof cannot be released with note.</p>
        <div className="mt-4 flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1">
          {reviewTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${tab === item.id ? "bg-[#10201e] text-white" : "bg-slate-50 text-slate-600"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-3">
        {visible.map((machine) => {
	          const missing = missingSlots(machine);
	          const critical = hasCriticalIssue(machine) || machine.status === "Blocked";
	          const warnings = machine.flags.length + openIssueCount(machine);
	          const proofComplete = missing.length === 0;
	          const gate = getReleaseGate(machine);
          const summary = critical
            ? `${machine.completedPhotoSlots.length} of ${machine.requiredPhotoSlots.length} proof items · blocked`
            : proofComplete && warnings > 0
              ? `Proof complete · ${warnings} warning${warnings === 1 ? "" : "s"}`
              : proofComplete
                ? "Proof complete · clean"
                : `${machine.completedPhotoSlots.length} of ${machine.requiredPhotoSlots.length} proof items · ${warnings} warning${warnings === 1 ? "" : "s"}`;
          return (
            <Panel key={machine.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950">{machine.name}</h3>
                  <p className="mt-2 text-sm font-medium text-slate-500">{summary}</p>
                </div>
                <StatusPill status={machine.status} />
              </div>

	              <p className="mt-4 text-sm font-medium leading-6 text-slate-600">{shortReason(machine)}.</p>
	              <p className={`mt-2 text-sm font-semibold ${gate.canRelease ? "text-emerald-700" : "text-red-700"}`}>{gate.label}</p>
	
	              <div className="mt-5 grid gap-2 sm:grid-cols-3">
	                {critical ? (
	                  <>
	                    <PrimaryButton onClick={() => setModal({ machine, decision: "block" })} tone="red">Block</PrimaryButton>
	                    <PrimaryButton onClick={() => onRequestProof(machine.id)} tone="light">Request proof</PrimaryButton>
	                  </>
	                ) : !proofComplete ? (
	                  <>
	                    <PrimaryButton onClick={() => onRequestProof(machine.id)} tone="dark">Request proof</PrimaryButton>
	                    <PrimaryButton onClick={() => setModal({ machine, decision: "block" })} tone="red">Block</PrimaryButton>
	                  </>
                ) : warnings > 0 ? (
                  <>
                    <PrimaryButton onClick={() => setModal({ machine, decision: "review" })} tone="dark">Review decision</PrimaryButton>
                    <PrimaryButton onClick={() => setModal({ machine, decision: "block" })} tone="red">Block</PrimaryButton>
                    <PrimaryButton onClick={() => onRequestProof(machine.id)} tone="light">Request proof</PrimaryButton>
                  </>
                ) : (
                  <>
                    <PrimaryButton onClick={() => setModal({ machine, decision: "release" })} tone="dark">Release</PrimaryButton>
                    <PrimaryButton onClick={() => setModal({ machine, decision: "block" })} tone="red">Block</PrimaryButton>
                    <PrimaryButton onClick={() => setModal({ machine, decision: "note" })} tone="light">Release with note</PrimaryButton>
                  </>
                )}
              </div>
            </Panel>
          );
        })}
      </div>

      {modal ? (
        <DecisionModal
          machine={modal.machine}
          decision={modal.decision}
          onClose={() => setModal(null)}
          onConfirm={(status, note) => {
            onDecision(modal.machine.id, status, note);
            setModal(null);
          }}
          onRequestProof={onRequestProof}
          onChangeDecision={(decision) => setModal((current) => (current ? { ...current, decision } : current))}
        />
      ) : null}
    </div>
  );
}

function MachinesView({
  machines,
  onOpenMachine,
}: {
  machines: Machine[];
  onOpenMachine: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "action" | "ready" | "blocked">("all");
  const visible = machines.filter((machine) => {
    if (filter === "action") return needsAction(machine);
    if (filter === "ready") return isClear(machine);
    if (filter === "blocked") return machine.status === "Blocked";
    return true;
  });

  return (
    <div className="mx-auto grid max-w-[1100px] gap-5">
      <Panel className="p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Asset list and proof requirements.</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <PrimaryButton>
              <Truck className="h-4 w-4" aria-hidden="true" />
              Add machine
            </PrimaryButton>
            <PrimaryButton tone="light">
              <QrCode className="h-4 w-4" aria-hidden="true" />
              QR codes
            </PrimaryButton>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["all", "All"],
            ["action", "Needs action"],
            ["ready", "Ready"],
            ["blocked", "Blocked"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id as typeof filter)}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold ${filter === id ? "bg-[#10201e] text-white" : "bg-slate-50 text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="min-w-0 max-w-full overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 text-sm font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-4">Machine</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Proof</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Issues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((machine) => (
                <tr key={machine.id} className="bg-white hover:bg-slate-50">
                  <td className="px-5 py-4">
	                    <button type="button" onClick={() => onOpenMachine(machine.id)} className="block text-left">
	                      <span className="block text-sm font-semibold text-slate-950">{machine.fleetNumber} / {machine.name}</span>
	                      <span className="mt-1 block text-xs font-medium text-slate-500">{machine.brand} {machine.model}</span>
                        <span className="mt-1 block text-xs font-medium text-slate-400">QR: {machine.qrValue ?? machine.fleetNumber}</span>
	                    </button>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-600">{machine.currentSite}</td>
                  <td className="px-5 py-4"><ProofBar machine={machine} /></td>
                  <td className="px-5 py-4"><StatusPill status={machine.status} /></td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{machine.defects.filter((defect) => defect.status !== "resolved").length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function buildReportText(machines: Machine[], events: FleetLeverEvent[]) {
  return buildFleetLeverReportText(machines, events);
}

function ReportView({ machines, events, proofPhotos }: { machines: Machine[]; events: FleetLeverEvent[]; proofPhotos: ProofPhoto[] }) {
  const [copied, setCopied] = useState(false);
  const [proofCopied, setProofCopied] = useState(false);
  const { ready: clear, blocked, action, notes } = getReportBuckets(machines);
  const noteEvents = events.filter((event) => event.type === "RELEASED_WITH_NOTE" || event.type === "MACHINE_BLOCKED" || event.type === "ISSUE_CREATED").slice(-6).reverse();
  const proofPack = buildFleetReleaseProofPack(machines, proofPhotos, events);

  async function copySummary() {
    await navigator.clipboard?.writeText(buildReportText(machines, events)).catch(() => undefined);
    setCopied(true);
  }

  async function copyProofPack() {
    await navigator.clipboard?.writeText(proofPack).catch(() => undefined);
    setProofCopied(true);
  }

  return (
    <div className="mx-auto grid max-w-[900px] gap-5">
      <Panel className="p-5 md:p-6">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Tomorrow summary</h2>
            <div className="mt-4 grid gap-1 text-lg font-semibold leading-7 text-slate-700">
              <p>{clear.length} ready.</p>
              <p>{action.length} need action.</p>
              <p>{blocked.length} blocked.</p>
              <p>{notes.length} released with note.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-1">
            <PrimaryButton onClick={copySummary}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? "Copied" : "Copy summary"}
            </PrimaryButton>
	            <PrimaryButton tone="light">
	              <Download className="h-4 w-4" aria-hidden="true" />
	              Export PDF
	            </PrimaryButton>
	            <PrimaryButton onClick={copyProofPack} tone="light">
	              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
	              {proofCopied ? "Proof copied" : "Copy proof pack"}
	            </PrimaryButton>
	          </div>
	        </div>
	      </Panel>

	      <Panel className="p-5 md:p-6">
	        <div className="flex items-start gap-3">
	          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
	            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
	          </span>
	          <div>
	            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Machine release proof pack</h2>
	            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
	              A shareable evidence trail with machine, proof photos, release gate, supervisor decision, and recent events.
	            </p>
	            <div className="mt-4 grid gap-2 sm:grid-cols-2">
	              {machines.slice(0, 4).map((machine) => {
	                const gate = getReleaseGate(machine);
	                return (
	                  <div key={machine.id} className="rounded-[16px] bg-slate-50 px-4 py-3">
	                    <p className="text-sm font-semibold text-slate-950">{machine.fleetNumber} / {machine.name}</p>
	                    <p className="mt-1 text-xs font-semibold text-slate-500">{gate.label}</p>
	                  </div>
	                );
	              })}
	            </div>
	          </div>
	        </div>
	      </Panel>

      <div className="grid gap-4">
        {[
          ["Needs action", action, "Needs review or missing proof"],
          ["Blocked", blocked, "Cannot work tomorrow"],
          ["Ready", clear, "Ready for tomorrow"],
        ].map(([title, list, detail]) => (
          <Panel key={title as string} className="p-5">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title as string}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{detail as string}</p>
            <div className="mt-4 grid gap-2">
              {(list as Machine[]).map((machine) => (
                <div key={machine.id} className="rounded-[16px] bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">{machine.name}</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                    {shortReason(machine)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">Notes and issues</h2>
        <div className="mt-4 grid gap-2">
          {noteEvents.length ? (
            noteEvents.map((event) => {
              const machine = machines.find((item) => item.id === event.machineId);
              return (
                <div key={event.id} className="rounded-[16px] bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">{machine?.name ?? event.machineId}</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{event.note ?? event.reason ?? event.type.replaceAll("_", " ")}</p>
                </div>
              );
            })
          ) : (
            <p className="rounded-[16px] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">No release notes or open issue events yet.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}

function SettingsView({ machines }: { machines: Machine[] }) {
  const sections = [
    ["Machine templates", "Excavator, loader, telehandler, roller, dozer."],
    ["Required proof", "Required photos for each machine type."],
    ["Checks", "Missing proof, open issues, fast submissions, conflicts."],
    ["Users", "Operators, supervisors, workshop, owners."],
    ["QR codes", "Tags for fast machine capture."],
  ];

  return (
    <div className="mx-auto grid max-w-[1000px] gap-5">
      <Panel className="p-6 md:p-7">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Templates, proof, checks, QR codes, and users.</h2>
        <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-600">
          Settings keep FleetLever simple for everyday users while still letting admins define the rules behind the scenes.
        </p>
      </Panel>

      <Panel className="p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Upload CSV -&gt; print QR -&gt; start tomorrow</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Import the machine list, generate labels, assign users, and use FleetLever as the release board the next day.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([title, detail]) => (
          <Panel key={title} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{detail}</p>
              </div>
              <ClipboardCheck className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-6">
        <h2 className="text-xl font-semibold text-slate-950">Required proof</h2>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {requiredPhotoSlots.map((slot) => (
            <div key={slot} className="flex min-h-12 items-center justify-between rounded-[18px] bg-slate-50 px-4 text-sm font-semibold text-slate-700">
              {slot}
              <BadgeCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-xl font-semibold text-slate-950">QR code values</h2>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {machines.map((machine) => (
            <div key={machine.id} className="rounded-[18px] bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-950">{machine.name}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{machine.qrValue ?? machine.fleetNumber}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function ConstructionPrototype() {
  const [activeView, setActiveView] = useState<RoleView>("today");
  const { state, setState } = useFleetLeverStore(demoMachines);
  const machines = state.machines;
  const [selectedMachineId, setSelectedMachineId] = useState(demoMachines[0].id);
  const [detailMachineId, setDetailMachineId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) ?? machines[0];
  const detailMachine = detailMachineId ? machines.find((machine) => machine.id === detailMachineId) ?? null : null;

  const filteredMachines = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return machines;
    return machines.filter((machine) =>
      [
        machine.fleetNumber,
        machine.name,
        machine.type,
        machine.currentSite,
        machine.status,
        displayStatus(machine.status),
        machine.reason,
        machine.flags.join(" "),
        machine.defects.map((defect) => defect.title).join(" "),
        missingSlots(machine).join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [machines, query]);

  function changeView(view: RoleView) {
    setActiveView(view);
    setQuery("");
  }

  function openMachine(id: string) {
    setSelectedMachineId(id);
    setDetailMachineId(id);
  }

  function goCapture(id?: string) {
    if (id) setSelectedMachineId(id);
    setDetailMachineId(null);
    changeView("capture");
  }

  function goReview(id?: string) {
    if (id) setSelectedMachineId(id);
    setDetailMachineId(null);
    changeView("review");
  }

  function addProofPhoto(photo: ProofPhoto) {
    setState((current) => {
      const machine = current.machines.find((item) => item.id === photo.machineId);
      if (!machine) return current;

      const completedSlots = machine.completedPhotoSlots.includes(photo.proofSlot)
        ? machine.completedPhotoSlots
        : [...machine.completedPhotoSlots, photo.proofSlot];
      const missing = machine.requiredPhotoSlots.filter((slot) => !completedSlots.includes(slot));
      const warningCount = machine.checklistPassed < machine.checklistTotal || machine.flags.some((flag) => !flag.toLowerCase().includes("photo")) ? 1 : 0;
      const nextStatus = resolveMachineStatus({ machine, completedSlots, warningCount });
      const proofPhotos = [
        ...current.proofPhotos.filter((item) => !(item.machineId === photo.machineId && item.proofSlot === photo.proofSlot)),
        photo,
      ];
      const event = createFleetLeverEvent({
        type: "PROOF_ADDED",
        machineId: machine.id,
        user: machine.operator,
        beforeStatus: machine.status,
        afterStatus: nextStatus,
        relatedProofSlot: photo.proofSlot,
        note: `${photo.proofSlot} photo added.`,
      });

      return {
        ...current,
        proofPhotos,
        machines: current.machines.map((item) =>
          item.id === photo.machineId
            ? {
                ...item,
                completedPhotoSlots: completedSlots,
                proofPhotos: proofPhotos.filter((proof) => proof.machineId === item.id),
                status: nextStatus,
                reason: missing.length ? `${missing[0]} photo is missing.` : nextStatus === "Needs review" ? "Proof is complete, but one or more checks need supervisor review." : "All required proof is complete.",
                flags: missing.length ? [`${missing[0]} photo missing`] : nextStatus === "Needs review" ? ["Proof complete, needs review"] : [],
                history: [{ time: "Just now", actor: machine.operator, event: `${photo.proofSlot} proof photo added.` }, ...item.history],
              }
            : item,
        ),
        events: [...current.events, event],
      };
    });
  }

	  function updateHandover(machineId: string, completedSlots: string[], checklistPassed: number, warningCount: number, mode: CaptureMode) {
    setState((current) => {
      const machine = current.machines.find((item) => item.id === machineId);
      if (!machine) return current;
      const nextStatus = resolveMachineStatus({ machine, completedSlots, warningCount });
      const missing = machine.requiredPhotoSlots.filter((slot) => !completedSlots.includes(slot));
      const reason =
        nextStatus === "Blocked"
          ? "A critical or blocking issue was reported. Supervisor review is required."
          : missing.length
            ? `${missing[0]} photo is missing.`
            : warningCount > 0
              ? "Proof is complete, but one or more checks need supervisor review."
              : "All required proof is complete and no issues were reported.";
      const event = createFleetLeverEvent({
        type: "HANDOVER_SUBMITTED",
        machineId,
        user: machine.operator,
        beforeStatus: machine.status,
        afterStatus: nextStatus,
	        note: `${reason} Mode: ${captureModeCopy[mode].label}.`,
      });
      const reviewEvent = nextStatus === "Needs review"
        ? createFleetLeverEvent({
            type: "REVIEW_REQUESTED",
            machineId,
            user: machine.operator,
            beforeStatus: machine.status,
            afterStatus: nextStatus,
            note: reason,
          })
        : null;

      return {
        ...current,
        handovers: [
          ...current.handovers,
          {
            id: `handover-${machineId}-${Date.now()}`,
            machineId,
	            submittedAt: new Date().toISOString(),
	            operator: machine.operator,
	            mode,
	            completedSlots,
            warningCount,
            beforeStatus: machine.status,
            afterStatus: nextStatus,
          },
        ],
        machines: current.machines.map((item) => {
          if (item.id !== machineId) return item;
          return {
            ...item,
            completedPhotoSlots: completedSlots,
            checklistPassed,
            status: nextStatus,
            reason,
            flags: missing.length
              ? [`${missing[0]} photo missing`]
              : warningCount > 0
                ? [`${warningCount} check warning${warningCount === 1 ? "" : "s"}`]
                : item.defects.length
                  ? item.flags
                  : [],
            history: [
              { time: "Just now", actor: item.operator, event: "Submitted proof for tomorrow." },
              ...item.history,
            ],
          };
        }),
        events: reviewEvent ? [...current.events, event, reviewEvent] : [...current.events, event],
      };
    });
  }

  function applyReviewDecision(machineId: string, status: ReleaseStatus, note: string) {
    setState((current) => {
      const machine = current.machines.find((item) => item.id === machineId);
      if (!machine) return current;
      const eventType = status === "Released with exception" ? "RELEASED_WITH_NOTE" : status === "Blocked" ? "MACHINE_BLOCKED" : "MACHINE_RELEASED";
      const event = createFleetLeverEvent({
        type: eventType,
        machineId,
        user: machine.supervisor,
        beforeStatus: machine.status,
        afterStatus: status,
        note,
        reason: note,
      });
      const issueEvent = status === "Blocked"
        ? createFleetLeverEvent({
            type: "ISSUE_CREATED",
            machineId,
            user: machine.supervisor,
            beforeStatus: machine.status,
            afterStatus: status,
            reason: note,
          })
        : null;

      return {
        ...current,
        releaseNotes: status === "Released with exception"
          ? [
              ...current.releaseNotes,
              { id: `release-note-${machineId}-${Date.now()}`, machineId, note, supervisor: machine.supervisor, timestamp: new Date().toISOString() },
            ]
          : current.releaseNotes,
        blockDecisions: status === "Blocked"
          ? [
              ...current.blockDecisions,
              { id: `block-${machineId}-${Date.now()}`, machineId, reason: note, owner: machine.supervisor, timestamp: new Date().toISOString() },
            ]
          : current.blockDecisions,
        machines: current.machines.map((item) =>
          item.id === machineId
            ? {
                ...item,
                status,
                reason: note,
                releaseNote: status === "Released with exception" ? note : item.releaseNote,
                blockReason: status === "Blocked" ? note : item.blockReason,
                defects: status === "Blocked"
                  ? [
                      ...item.defects,
                      {
                        id: `issue-${machineId}-${Date.now()}`,
                        title: note.split("Owner:")[0]?.trim() || "Machine blocked by supervisor",
                        severity: "critical",
                        status: "open",
                        blocking: true,
                        owner: machine.supervisor,
                      },
                    ]
                  : item.defects,
                nextAction: status === "Blocked" ? "Do not move tomorrow" : "Decision saved for tomorrow",
                history: [{ time: "Just now", actor: item.supervisor, event: note }, ...item.history],
              }
            : item,
        ),
        events: issueEvent ? [...current.events, event, issueEvent] : [...current.events, event],
      };
    });
    setSelectedMachineId(machineId);
    changeView("today");
  }

  function requestProof(machineId: string) {
    setState((current) => {
      const machine = current.machines.find((item) => item.id === machineId);
      if (!machine) return current;
      const missing = missingSlots(machine);
      const nextStatus: ReleaseStatus = missing.length ? "Proof missing" : "Needs review";
      const event = createFleetLeverEvent({
        type: "PROOF_REQUESTED",
        machineId,
        user: machine.supervisor,
        beforeStatus: machine.status,
        afterStatus: nextStatus,
        relatedProofSlot: missing[0],
        note: missing.length ? `Requested ${missing[0]} proof.` : "Requested additional proof.",
      });

      return {
        ...current,
        machines: current.machines.map((item) =>
          item.id === machineId
            ? {
                ...item,
                status: nextStatus,
                reason: missing.length ? `Missing proof: ${missing[0]} photo` : "Additional proof requested.",
                flags: missing.length ? [`${missing[0]} photo missing`] : item.flags,
                history: [{ time: "Just now", actor: item.supervisor, event: event.note ?? "Proof requested." }, ...item.history],
              }
            : item,
        ),
        events: [...current.events, event],
      };
    });
    goCapture(machineId);
  }

  const activeLabel = navItems.find((item) => item.id === activeView)?.label ?? "Tomorrow";

  return (
	    <main className="min-h-screen bg-[#f5f7f8] text-slate-950 max-lg:h-dvh max-lg:overflow-hidden">
	      <div className="flex min-h-screen max-lg:min-h-0">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 lg:flex lg:flex-col">
          <div className="rounded-[18px] px-2 py-3">
            <FleetLeverLogo />
          </div>
          <nav className="mt-8 grid gap-1" aria-label="FleetLever console navigation">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeView(item.id)}
                  className={`flex min-h-11 items-center gap-3 rounded-full px-4 text-left text-sm font-semibold transition ${
                    active ? "bg-[#10201e] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-1">
            <button
              type="button"
              onClick={() => changeView("settings")}
              className={`flex min-h-10 items-center gap-3 rounded-full px-4 text-left text-xs font-semibold transition ${
                activeView === "settings" ? "bg-[#10201e] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Settings
            </button>
            <button type="button" className="flex min-h-10 items-center gap-3 rounded-full px-4 text-left text-xs font-semibold text-slate-500 hover:bg-slate-100">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Help
            </button>
          </div>
        </aside>

	        <section className="min-w-0 flex-1 pb-40 max-lg:h-[calc(100dvh-5rem)] max-lg:overflow-y-auto lg:pb-0">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f5f7f8]/95 px-4 py-4 backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="lg:hidden">
                  <FleetLeverLogo />
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 lg:mt-0">{activeLabel}</h1>
                <p className="mt-2 text-base font-medium text-slate-600">
                  {activeView === "today" ? "What can work tomorrow?" : null}
                  {activeView === "capture" ? "Add proof for tomorrow." : null}
                  {activeView === "review" ? "Machines that need a decision." : null}
                  {activeView === "machines" ? "Asset list and proof requirements." : null}
                  {activeView === "report" ? "Tomorrow summary." : null}
                  {activeView === "settings" ? "Templates, proof, checks, QR codes, and users." : null}
                </p>
              </div>

              {activeView !== "capture" ? (
                <div className={`grid w-full gap-2 sm:w-auto sm:items-center ${activeView === "machines" ? "sm:grid-cols-[minmax(12rem,19rem)_auto]" : ""}`}>
                  {activeView === "machines" ? (
                    <div className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4">
                      <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search machine, status, proof..."
                        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  ) : null}
                  <PrimaryButton onClick={() => goCapture()} className="w-full sm:w-auto">
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    Capture proof
                  </PrimaryButton>
                </div>
              ) : null}
            </div>
          </header>

	          <div className="p-4 pb-8 sm:p-6 lg:pb-6">
            {activeView === "today" ? (
              <TodayView
                machines={machines}
                onOpenMachine={openMachine}
                onReview={goReview}
                onCapture={goCapture}
              />
            ) : null}
            {activeView === "capture" ? (
	              <CaptureView
	                key={selectedMachine.id}
	                machine={selectedMachine}
	                machines={machines}
                  proofPhotos={state.proofPhotos.filter((photo) => photo.machineId === selectedMachine.id)}
	                onSelectMachine={setSelectedMachineId}
                  onProofAdded={addProofPhoto}
	                onSubmit={updateHandover}
	                onGoToday={() => changeView("today")}
	              />
	            ) : null}
	            {activeView === "review" ? (
	              <ReviewView machines={machines} onDecision={applyReviewDecision} onRequestProof={requestProof} />
	            ) : null}
            {activeView === "machines" ? (
              <MachinesView machines={filteredMachines} onOpenMachine={openMachine} />
            ) : null}
		            {activeView === "report" ? <ReportView machines={machines} events={state.events} proofPhotos={state.proofPhotos} /> : null}
	            {activeView === "settings" ? <SettingsView machines={machines} /> : null}
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid min-h-20 grid-cols-5 border-t border-slate-200 bg-white px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 lg:hidden" aria-label="Mobile FleetLever console navigation">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => changeView(item.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[14px] px-1 text-[11px] font-semibold ${active ? "bg-[#10201e] text-white" : "text-slate-500"}`}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

	      <MachineDetailDrawer
	        machine={detailMachine}
          events={state.events}
	        onClose={() => setDetailMachineId(null)}
	        onCapture={goCapture}
	        onReview={goReview}
      />
    </main>
  );
}
