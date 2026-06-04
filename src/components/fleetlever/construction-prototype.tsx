"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  ArrowRight,
  Download,
  FileText,
  GripVertical,
  History,
  Menu,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Smartphone,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

type MachineState = "ready" | "at_risk" | "blocked";
type ViewKey =
  | "tomorrow"
  | "worksites"
  | "machines"
  | "blockers"
  | "certificates"
  | "service"
  | "history";
type DrawerMode = "why" | "passport";
type PassportTab = "overview" | "documents" | "service" | "issues" | "photos" | "history";

type Certificate = {
  name: string;
  status: "Valid" | "Expiring soon" | "Critical" | "Expired" | "Missing";
  expiry: string;
  daysLeft: string;
  owner: string;
  action: string;
  due?: string;
  assignmentStatus?: "Unassigned" | "Assigned" | "Accepted" | "Overdue";
  assignedAt?: string;
};

type ServiceBlocker = {
  issue: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  blocksRelease: boolean;
  owner: string;
  due: string;
  status: "Open" | "In Progress" | "Waiting" | "Resolved";
  assignmentStatus?: "Unassigned" | "Assigned" | "Accepted" | "Overdue";
  assignedAt?: string;
};

type Machine = {
  id: string;
  code: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serial: string;
  ownership: "Owned" | "Rental";
  worksiteId: string;
  state: MachineState;
  reason: string;
  owner: string;
  nextAction: string;
  eta: string;
  lastUpdated: string;
  activeBlockers: string;
  documents: string;
  certificates: Certificate[];
  service: ServiceBlocker[];
  issues: Array<{ title: string; severity: string; owner: string; status: string }>;
  photos: Array<{ title: string; category: string; date: string }>;
};

type Worksite = {
  id: string;
  name: string;
  location: string;
  date: string;
  requiredMachineIds: string[];
};

type ReleaseRecord = {
  date: string;
  worksite: string;
  machine: string;
  result: string;
  reason: string;
  action: string;
  user: string;
  override: "Yes" | "No";
};

type AddItemType = "Machine" | "Worksite" | "Certificate" | "Service Blocker" | "Document";

type Toast = {
  id: number;
  message: string;
};

type TeamMember = {
  name: string;
  role: string;
};

type OperationalNotification = {
  id: number;
  title: string;
  detail: string;
  createdAt: string;
  read: boolean;
};

type ConsoleSnapshot = {
  organizationName?: string;
  schemaVersion: 1;
  machines: Machine[];
  notifications: OperationalNotification[];
  releaseHistory: ReleaseRecord[];
  updatedAt: string;
  worksites: Worksite[];
};

type ServerConsoleSnapshotPayload = {
  dataSource?: "database" | "database-derived" | "server-file" | "empty";
  production?: boolean;
  snapshot?: Partial<ConsoleSnapshot> | null;
};

type BlockerKind = "certificate" | "service";
type UploadSource = "action-queue" | "documents" | "passport";
type WorkshopJobDraft = {
  machineId: string;
  issue: string;
  owner: string;
  due: string;
  blocksRelease: boolean;
};
type LeavyIntent = "morning-check" | "blockers" | "next-action" | "documents" | "workshop" | "history";
type LeavyMessage = {
  id: number;
  role: "leavy" | "user";
  text: string;
  bullets?: string[];
};
type WorkshopDragState = {
  jobId: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

type DrawerAction =
  | { type: "assign-owner"; blockerId?: string }
  | { type: "complete-action"; blockerId?: string }
  | { type: "upload-document"; blockerId?: string; source?: UploadSource }
  | { type: "override" }
  | null;

const defaultClientName = "FleetLever Developer";
const allowDemoConsoleData = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_FLEETLEVER_ALLOW_DEMO_CONSOLE === "true";

const teamMembers: TeamMember[] = [
  { name: "Dimitris", role: "Fleet Coordinator" },
  { name: "Maria", role: "Compliance" },
  { name: "Kostas", role: "Service Lead" },
  { name: "Workshop", role: "Service Team" },
  { name: "George", role: "Operations Manager" },
];

const seedWorksites: Worksite[] = [
  {
    id: "athens-metro",
    name: "Athens Metro Extension",
    location: "Line 4 · Veikou shaft",
    date: "Tomorrow, 07:00",
    requiredMachineIds: ["cr04", "ex12", "tr08", "ld03", "gn02"],
  },
  {
    id: "port-expansion",
    name: "Port Expansion",
    location: "Piraeus · Pier C",
    date: "Tomorrow, 06:30",
    requiredMachineIds: ["cr04", "ld03", "gn02"],
  },
  {
    id: "road-project",
    name: "Road Project A",
    location: "Attiki Odos · Junction 12",
    date: "Tomorrow, 08:00",
    requiredMachineIds: ["ex12", "tr08", "gn02"],
  },
];

const seedMachines: Machine[] = [
  {
    id: "cr04",
    code: "CR-04",
    name: "Liebherr LTM 1040 Crane",
    type: "Mobile Crane",
    manufacturer: "Liebherr",
    model: "LTM 1040",
    serial: "XYZ-123",
    ownership: "Owned",
    worksiteId: "athens-metro",
    state: "blocked",
    reason: "Lifting certificate expired",
    owner: "Dimitris",
    nextAction: "Book inspection / upload renewed certificate",
    eta: "2 days",
    lastUpdated: "1 June 2026, 16:40",
    activeBlockers: "3",
    documents: "18 files",
    certificates: [
      {
        name: "Lifting Certificate",
        status: "Expired",
        expiry: "28 May 2026",
        daysLeft: "-4",
        owner: "Dimitris",
        action: "Upload renewed certificate",
      },
      {
        name: "Periodic Inspection",
        status: "Missing",
        expiry: "Required",
        daysLeft: "-",
        owner: "Maria",
        action: "Book inspection",
      },
      {
        name: "Insurance",
        status: "Valid",
        expiry: "12 September 2026",
        daysLeft: "103",
        owner: "Maria",
        action: "No action",
      },
    ],
    service: [
      {
        issue: "Hydraulic check overdue",
        severity: "High",
        blocksRelease: true,
        owner: "Workshop",
        due: "Today",
        status: "Open",
      },
      {
        issue: "Boom grease points check",
        severity: "Medium",
        blocksRelease: false,
        owner: "Workshop",
        due: "Today",
        status: "Open",
      },
      {
        issue: "Outrigger pad inspection",
        severity: "Medium",
        blocksRelease: false,
        owner: "Workshop",
        due: "Tomorrow morning",
        status: "Open",
      },
    ],
    issues: [
      { title: "Periodic inspection missing", severity: "Critical", owner: "Maria", status: "Open" },
      { title: "Hydraulic check overdue", severity: "High", owner: "Workshop", status: "Open" },
    ],
    photos: [
      { title: "Boom condition", category: "Inspection", date: "30 May" },
      { title: "Site handover", category: "Handover", date: "28 May" },
    ],
  },
  {
    id: "ex12",
    code: "EX-12",
    name: "CAT 330 Excavator",
    type: "Excavator",
    manufacturer: "CAT",
    model: "330",
    serial: "CAT-330-77",
    ownership: "Owned",
    worksiteId: "athens-metro",
    state: "ready",
    reason: "No blocker found",
    owner: "Workshop",
    nextAction: "-",
    eta: "-",
    lastUpdated: "1 June 2026, 15:10",
    activeBlockers: "0",
    documents: "14 files",
    certificates: [
      {
        name: "Inspection Certificate",
        status: "Valid",
        expiry: "21 August 2026",
        daysLeft: "81",
        owner: "Maria",
        action: "No action",
      },
    ],
    service: [
      {
        issue: "Scheduled service completed",
        severity: "Low",
        blocksRelease: false,
        owner: "Workshop",
        due: "Completed",
        status: "Resolved",
      },
      {
        issue: "Bucket teeth wear check",
        severity: "Medium",
        blocksRelease: false,
        owner: "Workshop",
        due: "Today",
        status: "Open",
      },
      {
        issue: "Track tension adjustment",
        severity: "Medium",
        blocksRelease: false,
        owner: "Workshop",
        due: "Tomorrow morning",
        status: "Open",
      },
    ],
    issues: [],
    photos: [{ title: "Service completion", category: "Service", date: "1 June" }],
  },
  {
    id: "tr08",
    code: "TR-08",
    name: "Mercedes Arocs Truck",
    type: "Truck",
    manufacturer: "Mercedes",
    model: "Arocs",
    serial: "TRK-9081",
    ownership: "Rental",
    worksiteId: "athens-metro",
    state: "at_risk",
    reason: "Inspection due in 3 days",
    owner: "Maria",
    nextAction: "Renew inspection",
    eta: "3 days",
    lastUpdated: "1 June 2026, 14:25",
    activeBlockers: "0",
    documents: "11 files",
    certificates: [
      {
        name: "Roadworthiness Inspection",
        status: "Critical",
        expiry: "4 June 2026",
        daysLeft: "3",
        owner: "Maria",
        action: "Renew inspection",
      },
    ],
    service: [
      {
        issue: "Brake pressure test",
        severity: "Medium",
        blocksRelease: false,
        owner: "Workshop",
        due: "Today",
        status: "Open",
      },
      {
        issue: "Tailgate latch repair",
        severity: "Low",
        blocksRelease: false,
        owner: "Workshop",
        due: "Tomorrow noon",
        status: "Open",
      },
    ],
    issues: [{ title: "Inspection due soon", severity: "Medium", owner: "Maria", status: "Open" }],
    photos: [{ title: "Rental handover", category: "Handover", date: "27 May" }],
  },
  {
    id: "ld03",
    code: "LD-03",
    name: "Volvo L90 Wheel Loader",
    type: "Wheel Loader",
    manufacturer: "Volvo",
    model: "L90",
    serial: "V-L90-445",
    ownership: "Owned",
    worksiteId: "athens-metro",
    state: "blocked",
    reason: "Hydraulic service blocker",
    owner: "Kostas",
    nextAction: "Complete hydraulic check",
    eta: "Tomorrow noon",
    lastUpdated: "1 June 2026, 13:05",
    activeBlockers: "1",
    documents: "10 files",
    certificates: [
      {
        name: "Operator Safety Certificate",
        status: "Valid",
        expiry: "18 October 2026",
        daysLeft: "139",
        owner: "Maria",
        action: "No action",
      },
    ],
    service: [
      {
        issue: "Hydraulic leak inspection overdue",
        severity: "High",
        blocksRelease: true,
        owner: "Workshop",
        due: "Today",
        status: "In Progress",
      },
      {
        issue: "Tyre sidewall inspection",
        severity: "Medium",
        blocksRelease: false,
        owner: "Workshop",
        due: "Today",
        status: "Open",
      },
      {
        issue: "Cab steps safety repair",
        severity: "Medium",
        blocksRelease: false,
        owner: "Workshop",
        due: "Tomorrow morning",
        status: "Open",
      },
    ],
    issues: [{ title: "Hydraulic leak reported", severity: "High", owner: "Workshop", status: "Open" }],
    photos: [{ title: "Hydraulic hose", category: "Condition", date: "1 June" }],
  },
  {
    id: "gn02",
    code: "GN-02",
    name: "Atlas Copco Generator",
    type: "Generator",
    manufacturer: "Atlas Copco",
    model: "QAS",
    serial: "GEN-221",
    ownership: "Owned",
    worksiteId: "athens-metro",
    state: "ready",
    reason: "No blocker found",
    owner: "Workshop",
    nextAction: "-",
    eta: "-",
    lastUpdated: "1 June 2026, 12:30",
    activeBlockers: "0",
    documents: "9 files",
    certificates: [
      {
        name: "Electrical Safety Certificate",
        status: "Valid",
        expiry: "3 December 2026",
        daysLeft: "185",
        owner: "Maria",
        action: "No action",
      },
    ],
    service: [
      {
        issue: "Battery terminal inspection",
        severity: "Low",
        blocksRelease: false,
        owner: "Workshop",
        due: "Today",
        status: "Open",
      },
      {
        issue: "Fuel filter replacement",
        severity: "Medium",
        blocksRelease: false,
        owner: "Workshop",
        due: "Tomorrow noon",
        status: "Open",
      },
    ],
    issues: [],
    photos: [{ title: "Condition check", category: "Inspection", date: "31 May" }],
  },
];

const seedReleaseHistory: ReleaseRecord[] = [
  {
    date: "1 June",
    worksite: "Athens Metro Extension",
    machine: "CR-04",
    result: "Cannot Be Released",
    reason: "Certificate expired",
    action: "Assigned inspection",
    user: "George",
    override: "No",
  },
  {
    date: "1 June",
    worksite: "Athens Metro Extension",
    machine: "EX-12",
    result: "Ready For Work",
    reason: "No blocker found",
    action: "Released",
    user: "Dimitris",
    override: "No",
  },
  {
    date: "3 June",
    worksite: "Road Project A",
    machine: "TR-08",
    result: "Needs Attention",
    reason: "Inspection due soon",
    action: "Warning accepted",
    user: "Maria",
    override: "No",
  },
  {
    date: "31 May",
    worksite: "Port Expansion",
    machine: "LD-03",
    result: "Cannot Be Released",
    reason: "Hydraulic service blocker",
    action: "Service assigned",
    user: "Kostas",
    override: "No",
  },
];

const initialNotifications: OperationalNotification[] = [
  {
    id: 1,
    title: "CR-04 certificate could stop work",
    detail: "Dimitris owns the lifting certificate renewal.",
    createdAt: "Today, 07:05",
    read: false,
  },
  {
    id: 2,
    title: "LD-03 service job could stop work",
    detail: "Workshop team must complete the hydraulic check.",
    createdAt: "Today, 07:10",
    read: false,
  },
  {
    id: 3,
    title: "Tomorrow check ready",
    detail: "2 ready, 1 review, 2 blocked for Athens Metro Extension.",
    createdAt: "Today, 07:30",
    read: false,
  },
];

const emptyWorksite: Worksite = {
  id: "no-worksite",
  name: "No work package selected",
  location: "Add assets and work packages to start release planning",
  date: "Not scheduled",
  requiredMachineIds: [],
};

const emptyMachine: Machine = {
  id: "no-machine",
  code: "-",
  name: "No machine selected",
  type: "Machine",
  manufacturer: "FleetLever",
  model: "Not set",
  serial: "Not set",
  ownership: "Owned",
  worksiteId: emptyWorksite.id,
  state: "ready",
  reason: "No machine data loaded",
  owner: "Unassigned",
  nextAction: "-",
  eta: "-",
  lastUpdated: "Not synced",
  activeBlockers: "0",
  documents: "0 files",
  certificates: [],
  service: [],
  issues: [],
  photos: [],
};

const worksites: Worksite[] = allowDemoConsoleData ? cloneConsoleData(seedWorksites) : [];
const machines: Machine[] = allowDemoConsoleData ? cloneConsoleData(seedMachines) : [];
const releaseHistory: ReleaseRecord[] = allowDemoConsoleData ? cloneConsoleData(seedReleaseHistory) : [];

const consoleSnapshotKey = "fleetlever-console-state-v1";
const consoleSnapshotEndpoint = "/api/fleetlever/console-state";

function cloneConsoleData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function replaceConsoleArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...cloneConsoleData(next));
}

function consoleSnapshot(notifications: OperationalNotification[], organizationName = defaultClientName): ConsoleSnapshot {
  return {
    organizationName,
    schemaVersion: 1,
    machines: cloneConsoleData(machines),
    notifications: cloneConsoleData(notifications),
    releaseHistory: cloneConsoleData(releaseHistory),
    updatedAt: new Date().toISOString(),
    worksites: cloneConsoleData(worksites),
  };
}

function saveConsoleSnapshot(notifications: OperationalNotification[]) {
  if (typeof window === "undefined") return;
  if (!allowDemoConsoleData) return;
  window.localStorage.setItem(consoleSnapshotKey, JSON.stringify(consoleSnapshot(notifications)));
}

function loadConsoleSnapshot() {
  if (typeof window === "undefined") return null;
  if (!allowDemoConsoleData) return null;
  const rawSnapshot = window.localStorage.getItem(consoleSnapshotKey);
  if (!rawSnapshot) return null;

  try {
    const parsed = JSON.parse(rawSnapshot) as Partial<ConsoleSnapshot>;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.machines) || !Array.isArray(parsed.worksites) || !Array.isArray(parsed.releaseHistory)) return null;
    return parsed as ConsoleSnapshot;
  } catch {
    return null;
  }
}

async function loadServerConsoleSnapshot() {
  const response = await fetch(consoleSnapshotEndpoint, {
    cache: "no-store",
  });

  if (!response.ok) return null;

  const payload = await response.json() as ServerConsoleSnapshotPayload;
  const snapshot = payload.snapshot;
  if (
    snapshot?.schemaVersion !== 1 ||
    !Array.isArray(snapshot.machines) ||
    !Array.isArray(snapshot.worksites) ||
    !Array.isArray(snapshot.releaseHistory) ||
    !Array.isArray(snapshot.notifications)
  ) {
    return null;
  }

  return snapshot as ConsoleSnapshot;
}

async function saveServerConsoleSnapshot(notifications: OperationalNotification[], organizationName = defaultClientName) {
  await fetch(consoleSnapshotEndpoint, {
    body: JSON.stringify(consoleSnapshot(notifications, organizationName)),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
}

async function recordConsoleAction(payload: {
  action: string;
  detail: string;
  metadata?: Record<string, unknown>;
  recordId?: string;
  recordTable?: string;
  title: string;
}) {
  if (!process.env.NEXT_PUBLIC_FLEETLEVER_RECORD_CONSOLE_ACTIONS && allowDemoConsoleData) return;

  await fetch("/api/fleetlever/console-actions", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

let initialSnapshotRestored = false;
let initialConsoleSnapshot: ConsoleSnapshot | null = null;

function restoreInitialConsoleSnapshot() {
  if (typeof window === "undefined") return null;
  if (initialSnapshotRestored) return initialConsoleSnapshot;

  initialSnapshotRestored = true;
  initialConsoleSnapshot = loadConsoleSnapshot();

  if (initialConsoleSnapshot) {
    replaceConsoleArray(worksites, initialConsoleSnapshot.worksites);
    replaceConsoleArray(machines, initialConsoleSnapshot.machines);
    replaceConsoleArray(releaseHistory, initialConsoleSnapshot.releaseHistory);
  }

  return initialConsoleSnapshot;
}

function todayDecisionDate() {
  return "Today";
}

const navItems: Array<{ key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "tomorrow", label: "Tomorrow's Work", icon: CalendarDays },
  { key: "worksites", label: "Worksites", icon: Building2 },
  { key: "blockers", label: "Stop List", icon: ShieldAlert },
  { key: "machines", label: "Machines", icon: Building2 },
  { key: "certificates", label: "Evidence", icon: BadgeCheck },
  { key: "service", label: "Service Jobs", icon: Wrench },
  { key: "history", label: "Decision History", icon: History },
];

const passportTabs: Array<{ key: PassportTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "documents", label: "Evidence" },
  { key: "service", label: "Service" },
  { key: "issues", label: "Issues" },
  { key: "photos", label: "Photos" },
  { key: "history", label: "Decision History" },
];

const assignmentChannels: Array<{ label: "In-app" | "SMS"; icon: React.ComponentType<{ className?: string }> }> = [
  { label: "In-app", icon: Bell },
  { label: "SMS", icon: Smartphone },
];

function padDate(value: number) {
  return String(value).padStart(2, "0");
}

function localDateInputValue(date: Date) {
  return `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())}`;
}

function localTimeInputValue(date: Date) {
  return `${padDate(date.getHours())}:${padDate(date.getMinutes())}`;
}

function duePresetDate(preset: "today-1700" | "tomorrow-0900" | "tomorrow-1200" | "custom") {
  const date = new Date();
  if (preset === "tomorrow-0900" || preset === "tomorrow-1200") date.setDate(date.getDate() + 1);
  if (preset === "today-1700") date.setHours(17, 0, 0, 0);
  if (preset === "tomorrow-0900") date.setHours(9, 0, 0, 0);
  if (preset === "tomorrow-1200") date.setHours(12, 0, 0, 0);
  return date;
}

function buildDueIso(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) return "";
  return `${dateValue}T${timeValue}`;
}

function formatDueLabel(dueIso: string) {
  if (!dueIso) return "No due time";
  const date = new Date(dueIso);
  if (Number.isNaN(date.getTime())) return dueIso;
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (left: Date, right: Date) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
  if (sameDay(date, today)) return `Today, ${time}`;
  if (sameDay(date, tomorrow)) return `Tomorrow, ${time}`;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function isDueOverdue(dueIso: string) {
  const date = new Date(dueIso);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function emitConsoleToast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>("fleetlever:toast", { detail: message }));
}

function downloadTextFile(filename: string, content: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  emitConsoleToast(`${filename} exported.`);
}

function dateInputFromLabel(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

async function uploadConsoleFile(
  file: File,
  scope: string,
  machine: Pick<Machine, "id" | "code">,
  metadata: { documentCategory?: string; documentTitle?: string; expiresAt?: string } = {},
) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("scope", scope);
  formData.set("assetId", machine.id);
  formData.set("machineCode", machine.code);
  if (metadata.documentTitle) formData.set("documentTitle", metadata.documentTitle);
  if (metadata.documentCategory) formData.set("documentCategory", metadata.documentCategory);
  if (metadata.expiresAt) formData.set("expiresAt", metadata.expiresAt);

  const response = await fetch("/api/fleetlever/uploads", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Upload failed.");
  }

  return response.json();
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function valuesMatchSearch(query: string, values: string[]) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return values.some((value) => value.toLowerCase().includes(normalized));
}

function machineMatchesQuery(machine: Machine, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return valuesMatchSearch(normalized, [
    machine.code,
    machine.name,
    machine.type,
    machine.owner,
    machine.reason,
    machine.serial,
    machine.certificates.map((certificate) => `${certificate.name} ${certificate.status} ${certificate.owner} ${certificate.action} ${certificate.expiry}`).join(" "),
    machine.service.map((service) => service.issue).join(" "),
  ]);
}

function worksiteMatchesQuery(worksite: Worksite, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return valuesMatchSearch(normalized, [worksite.name, worksite.location, worksite.date]);
}

function formatPlannerDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "Custom date";
  return `${day}/${month}/${year}`;
}

function externalStatus(state: MachineState) {
  if (state === "ready") return "READY";
  if (state === "at_risk") return "NEEDS REVIEW";
  return "BLOCKED";
}

function statusClasses(state: MachineState) {
  if (state === "ready") return "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803D]";
  if (state === "at_risk") return "border-[#fde68a] bg-[#fffbeb] text-[#B45309]";
  return "border-[#fecaca] bg-[#fef2f2] text-[#B91C1C]";
}

function certificateClasses(status: Certificate["status"]) {
  if (status === "Valid") return "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803D]";
  if (status === "Expiring soon" || status === "Critical") return "border-[#fde68a] bg-[#fffbeb] text-[#B45309]";
  return "border-[#fecaca] bg-[#fef2f2] text-[#B91C1C]";
}

function StatusPill({ state }: { state: MachineState }) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-bold uppercase ${statusClasses(state)}`}>
      {externalStatus(state)}
    </span>
  );
}

function Surface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`rounded-lg border border-[#E2E8F0] bg-white shadow-sm ${className}`}>{children}</section>;
}

function LeavyAssistant({
  counts,
  machinesList,
  onOpenMachine,
  onToggle,
  onViewOpen,
  open,
  selectedWorksite,
}: {
  counts: { ready: number; attention: number; blocked: number; total: number };
  machinesList: Machine[];
  onOpenMachine: (machine: Machine) => void;
  onToggle: () => void;
  onViewOpen: (view: ViewKey) => void;
  open: boolean;
  selectedWorksite: Worksite;
}) {
  const [messages, setMessages] = useState<LeavyMessage[]>([
    {
      id: 1,
      role: "leavy",
      text: "I can help you know before tomorrow. Pick a question and I’ll use the current FleetLever data.",
      bullets: [`${counts.ready}/${counts.total} ready`, `${counts.blocked} blockers`, `${counts.attention} need review`],
    },
  ]);
  const [draft, setDraft] = useState("");
  const messageIdRef = useRef(1);
  const blockedMachines = machinesForWorksite(selectedWorksite).filter((machine) => machine.state === "blocked");
  const primaryBlockedMachine = blockedMachines[0];
  const quickOptions: Array<{ label: string; intent: LeavyIntent; view?: ViewKey }> = [
    { label: "What stops tomorrow?", intent: "morning-check", view: "tomorrow" },
    { label: "Show blockers", intent: "blockers", view: "blockers" },
    { label: "Best next action", intent: "next-action", view: "blockers" },
    { label: "Evidence risks", intent: "documents", view: "certificates" },
    { label: "Service jobs", intent: "workshop", view: "service" },
  ];

  function askLeavy(label: string, intent: LeavyIntent, view?: ViewKey) {
    messageIdRef.current += 1;
    const userMessage: LeavyMessage = { id: messageIdRef.current, role: "user", text: label };
    messageIdRef.current += 1;
    const answer = { ...leavyAnswerForIntent(intent, selectedWorksite, machinesList), id: messageIdRef.current };
    setMessages((current) => [...current.slice(-5), userMessage, answer]);
    if (view) onViewOpen(view);
  }

  function submitDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    const normalized = value.toLowerCase();
    const intent: LeavyIntent =
      normalized.includes("document") || normalized.includes("certificate") || normalized.includes("inspection")
        ? "documents"
        : normalized.includes("workshop") || normalized.includes("service")
          ? "workshop"
          : normalized.includes("history") || normalized.includes("evidence")
            ? "history"
            : normalized.includes("action") || normalized.includes("owner") || normalized.includes("next")
              ? "next-action"
              : normalized.includes("block")
                ? "blockers"
                : "morning-check";
    askLeavy(value, intent);
    setDraft("");
  }

  if (!open) {
    return (
      <div className="fixed bottom-5 left-5 z-[70]">
        <button
          type="button"
          onClick={onToggle}
          className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#20B7C9] text-[#062321] shadow-[0_18px_45px_rgba(8,47,73,0.35)] ring-4 ring-[#0D2F2D] transition hover:-translate-y-0.5 hover:bg-[#67E8F9] focus:outline-none focus:ring-4 focus:ring-[#B7F5F7]"
          aria-label="Open Leavy assistant"
        >
          <Bot className="h-6 w-6" aria-hidden="true" />
          {counts.blocked ? (
            <span className="absolute -right-1 -top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#0D2F2D] bg-[#FEE2E2] px-1.5 text-[11px] font-black text-[#B91C1C]">
              {counts.blocked}
            </span>
          ) : null}
          <span className="pointer-events-none absolute left-16 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-[#102A27] px-3 py-1.5 text-xs font-bold text-white shadow-xl group-hover:block">
            Ask Leavy
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 left-5 z-[70]">
      <section className="flex max-h-[560px] w-[340px] flex-col overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white text-[#102A27] shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-3 bg-[#0D2F2D] p-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#20B7C9] text-[#062321] ring-2 ring-white/15">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-black text-white">Leavy</h2>
              <p className="mt-0.5 text-xs font-semibold text-white/70">FleetLever assistant preview</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/75 transition hover:bg-white/10 hover:text-white"
            aria-label="Close Leavy assistant"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 space-y-3 overflow-y-auto p-4">
          <div className="rounded-xl bg-[#F6F5F2] p-3">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-[#008C91]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Current account data
            </div>
            <p className="mt-1 text-sm font-bold">{selectedWorksite.name}</p>
            <p className="mt-1 text-xs font-semibold text-[#64748B]">
              {counts.ready} ready · {counts.attention} review · {counts.blocked} blocked
            </p>
          </div>

          <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl px-3 py-2.5 text-sm ${
                  message.role === "user" ? "ml-8 bg-[#20B7C9] text-[#062321]" : "mr-6 bg-[#F8FAFC] text-[#102A27]"
                }`}
              >
                <p className="font-semibold leading-5">{message.text}</p>
                {message.bullets?.length ? (
                  <ul className="mt-2 space-y-1 text-xs font-semibold leading-5 text-[#52616B]">
                    {message.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {quickOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => askLeavy(option.label, option.intent, option.view)}
                className="min-h-10 rounded-xl border border-[#D9E2EC] bg-white px-3 text-left text-xs font-bold leading-4 text-[#102A27] transition hover:border-[#20B7C9] hover:bg-[#ECFEFF]"
              >
                {option.label}
              </button>
            ))}
          </div>

          {primaryBlockedMachine ? (
            <button
              type="button"
              onClick={() => onOpenMachine(primaryBlockedMachine)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-[#FEE2E2] px-3 text-left text-xs font-black text-[#991B1B] transition hover:bg-[#FECACA]"
            >
              <span>Open {primaryBlockedMachine.code} blocker case</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          ) : null}

          <form onSubmit={submitDraft} className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Leavy..."
              className="h-11 min-w-0 flex-1 rounded-xl border border-[#D9E2EC] bg-white px-3 text-sm font-semibold text-[#102A27] outline-none placeholder:text-[#94A3B8] focus:border-[#20B7C9]"
            />
            <button
              type="submit"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0D2F2D] text-white transition hover:bg-[#123C38]"
              aria-label="Send Leavy message"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
          <p className="text-[11px] font-semibold leading-4 text-[#64748B]">Scripted assistant preview. No AI is connected yet.</p>
        </div>
      </section>
    </div>
  );
}

function findWorksite(id: string) {
  return worksites.find((worksite) => worksite.id === id) ?? worksites[0] ?? emptyWorksite;
}

function machineWorksite(machine: Machine) {
  return findWorksite(machine.worksiteId);
}

function machinesForWorksite(worksite: Worksite) {
  return worksite.requiredMachineIds
    .map((id) => machines.find((machine) => machine.id === id))
    .filter((machine): machine is Machine => Boolean(machine));
}

function countsForMachines(machineList: Machine[]) {
  return {
    ready: machineList.filter((machine) => machine.state === "ready").length,
    attention: machineList.filter((machine) => machine.state === "at_risk").length,
    blocked: machineList.filter((machine) => machine.state === "blocked").length,
    total: machineList.length,
  };
}

function leavyAnswerForIntent(intent: LeavyIntent, worksite: Worksite, machineList: Machine[]): LeavyMessage {
  const list = machinesForWorksite(worksite).length ? machinesForWorksite(worksite) : machineList;
  const counts = countsForMachines(list);
  const blocked = list.filter((machine) => machine.state === "blocked");
  const review = list.filter((machine) => machine.state === "at_risk");
  const firstBlocker = blocked[0] ?? review[0];
  const documentActions = list.flatMap((machine) =>
    machine.certificates
      .filter((certificate) => certificate.status !== "Valid")
      .map((certificate) => `${machine.code}: ${certificate.name} ${certificate.status.toLowerCase()} · ${certificate.owner}`),
  );
  const workshopActions = list.flatMap((machine) =>
    machine.service
      .filter((service) => service.status !== "Resolved")
      .map((service) => `${machine.code}: ${service.issue} · ${service.status} · ${service.due}`),
  );

  if (intent === "morning-check") {
    return {
      id: 0,
      role: "leavy",
      text: counts.blocked ? `${worksite.name} will not start cleanly tomorrow.` : `${worksite.name} can start tomorrow.`,
      bullets: [
        `${counts.ready}/${counts.total} machines ready`,
        `${counts.attention} need review`,
        `${counts.blocked} blocked before release`,
      ],
    };
  }

  if (intent === "blockers") {
    return {
      id: 0,
      role: "leavy",
      text: blocked.length ? "These are the blockers I would clear first." : "No hard blockers found for this worksite.",
      bullets: blocked.length ? blocked.map((machine) => `${machine.code}: ${machine.reason} · ${machine.owner} · ${machine.eta}`) : ["Run the final check when you are ready."],
    };
  }

  if (intent === "next-action") {
    return {
      id: 0,
      role: "leavy",
      text: firstBlocker ? `Best next action: ${firstBlocker.nextAction}.` : "Best next action: release the clear machines.",
      bullets: firstBlocker
        ? [`Machine: ${firstBlocker.code}`, `Owner: ${firstBlocker.owner}`, `ETA: ${firstBlocker.eta}`]
        : [`${counts.ready} machines are ready for tomorrow.`],
    };
  }

  if (intent === "documents") {
    return {
      id: 0,
      role: "leavy",
      text: documentActions.length ? "Evidence risks that can affect tomorrow:" : "No evidence item is currently blocking this worksite.",
      bullets: documentActions.length ? documentActions.slice(0, 4) : ["Valid evidence is available for the selected worksite."],
    };
  }

  if (intent === "workshop") {
    return {
      id: 0,
      role: "leavy",
      text: workshopActions.length ? "Service jobs still on the board:" : "No open service jobs for the selected worksite.",
      bullets: workshopActions.length ? workshopActions.slice(0, 4) : ["No service job is stopping tomorrow's work."],
    };
  }

  return {
    id: 0,
    role: "leavy",
    text: "Decision History is where the proof lives.",
    bullets: ["Who decided", "Why the machine was released or blocked", "Evidence packet for audit or dispute"],
  };
}

export function ConstructionPrototype() {
  const bootSnapshot = restoreInitialConsoleSnapshot();
  const [clientName, setClientName] = useState(bootSnapshot?.organizationName ?? defaultClientName);
  const [activeView, setActiveView] = useState<ViewKey>("tomorrow");
  const [worksiteId, setWorksiteId] = useState(worksites[0]?.id ?? emptyWorksite.id);
  const [dateMode, setDateMode] = useState<"Today" | "Tomorrow" | "Custom">("Tomorrow");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id ?? emptyMachine.id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("why");
  const [passportTab, setPassportTab] = useState<PassportTab>("overview");
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<AddItemType | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [drawerAction, setDrawerAction] = useState<DrawerAction>(null);
  const [leavyOpen, setLeavyOpen] = useState(false);
  const [notifications, setNotifications] = useState<OperationalNotification[]>(bootSnapshot?.notifications ?? (allowDemoConsoleData ? initialNotifications : []));
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [version, setVersion] = useState(0);
  const [serverHydrated, setServerHydrated] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveConsoleSnapshot(notifications);
    if (!serverHydrated) return;
    void saveServerConsoleSnapshot(notifications, clientName).catch(() => {
      emitConsoleToast("Saved locally. Server sync will retry on the next change.");
    });
  }, [clientName, notifications, serverHydrated, version]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromServer() {
      try {
        const serverSnapshot = await loadServerConsoleSnapshot();
        if (cancelled) return;

        if (serverSnapshot) {
          replaceConsoleArray(worksites, serverSnapshot.worksites);
          replaceConsoleArray(machines, serverSnapshot.machines);
          replaceConsoleArray(releaseHistory, serverSnapshot.releaseHistory);
          setClientName(serverSnapshot.organizationName ?? defaultClientName);
          setNotifications(serverSnapshot.notifications);
          setWorksiteId(serverSnapshot.worksites[0]?.id ?? worksites[0]?.id ?? emptyWorksite.id);
          setSelectedMachineId(serverSnapshot.machines[0]?.id ?? machines[0]?.id ?? emptyMachine.id);
          setVersion((current) => current + 1);
        }
      } catch {
        if (!cancelled) {
          emitConsoleToast("FleetLever server state is unavailable.");
        }
      } finally {
        if (!cancelled) setServerHydrated(true);
      }
    }

    void hydrateFromServer();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleToast(event: Event) {
      setToast({ id: Date.now(), message: (event as CustomEvent<string>).detail });
    }

    window.addEventListener("fleetlever:toast", handleToast);
    return () => window.removeEventListener("fleetlever:toast", handleToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!searchBoxRef.current?.contains(event.target as Node)) setSearchOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectedWorksite = findWorksite(worksiteId);
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) ?? machines[0] ?? emptyMachine;
  void version;
  const visibleWorksites = worksites.filter((worksite) => worksiteMatchesQuery(worksite, searchTerm));
  const visibleMachines = machines.filter((machine) => machineMatchesQuery(machine, searchTerm));
  const allPlannedMachines = (() => {
    return machinesForWorksite(selectedWorksite);
  })();
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;
  const normalizedGlobalSearch = normalizeSearch(searchTerm);

  const counts = {
    ready: allPlannedMachines.filter((machine) => machine.state === "ready").length,
    attention: allPlannedMachines.filter((machine) => machine.state === "at_risk").length,
    blocked: allPlannedMachines.filter((machine) => machine.state === "blocked").length,
    total: allPlannedMachines.length,
  };

  function openMachine(machine: Machine, mode: DrawerMode = machine.state === "blocked" ? "why" : "passport", tab?: PassportTab) {
    setSelectedMachineId(machine.id);
    setDrawerMode(mode);
    setDrawerOpen(true);
    if (mode === "passport") setPassportTab(tab ?? "overview");
  }

  function openMachineFromSearch(machine: Machine, view: ViewKey = "machines", mode: DrawerMode = machine.state === "blocked" ? "why" : "passport", tab?: PassportTab) {
    setActiveView(view);
    setMobileNavOpen(false);
    setSearchTerm("");
    setSearchOpen(false);
    setDrawerAction(null);
    setSelectedMachineId(machine.id);
    setDrawerMode(mode);
    setDrawerOpen(true);
    if (mode === "passport") setPassportTab(tab ?? "overview");
  }

  function openActionFromSearch(machine: Machine, action: Exclude<DrawerAction, null>) {
    setActiveView("blockers");
    setMobileNavOpen(false);
    setSearchTerm("");
    setSearchOpen(false);
    setDrawerOpen(false);
    setSelectedMachineId(machine.id);
    setDrawerAction(action);
  }

  function openWorksiteFromSearch(worksite: Worksite) {
    setWorksiteId(worksite.id);
    setActiveView("tomorrow");
    setMobileNavOpen(false);
    setSearchTerm("");
    setSearchOpen(false);
    setDrawerOpen(false);
    setDrawerAction(null);
  }

  function startMachineAction(machine: Machine, action: Exclude<DrawerAction, null>) {
    setSelectedMachineId(machine.id);
    setDrawerOpen(false);
    setDrawerAction(action);
  }

  function showView(nextView: ViewKey) {
    setActiveView(nextView);
    setMobileNavOpen(false);
    setDrawerOpen(false);
    setDrawerAction(null);
    setSearchTerm("");
    setSearchOpen(false);
  }

  function refreshConsole(message: string) {
    setVersion((version) => version + 1);
    emitConsoleToast(message);
  }

  function recordDecision(machine: Machine, result: string, reason: string, action: string, user: string, override: "Yes" | "No" = "No") {
    releaseHistory.unshift({
      date: todayDecisionDate(),
      worksite: machineWorksite(machine).name,
      machine: machine.code,
      result,
      reason,
      action,
      user,
      override,
    });
    void recordConsoleAction({
      action: result === "Released With Override" ? "console.override_released" : "console.release_decision",
      detail: `${machine.code}: ${reason} · ${action}`,
      metadata: {
        action,
        machine: machine.code,
        override,
        reason,
        result,
        user,
        worksite: machineWorksite(machine).name,
      },
      recordId: machine.id,
      recordTable: "assets",
      title: `${machine.code} · ${result}`,
    }).catch(() => {});
  }

  function addOperationalNotification(title: string, detail: string) {
    setNotifications((current) => [
      {
        id: Date.now(),
        title,
        detail,
        createdAt: "Just now",
        read: false,
      },
      ...current,
    ]);
    void recordConsoleAction({
      action: "console.notification",
      detail,
      metadata: { source: "construction-console" },
      title,
    }).catch(() => {});
  }

  function syncMachineReleaseState(machine: Machine) {
    const activeCertificates = machine.certificates.filter((certificate) => ["Expired", "Missing", "Critical"].includes(certificate.status));
    const activeServices = machine.service.filter((service) => service.blocksRelease && service.status !== "Resolved");
    const activeCertificate = activeCertificates[0];
    const activeService = activeServices[0];
    const activeIssueCount = machine.issues.filter((issue) => issue.status !== "Resolved").length;
    const activeBlockerCount = activeCertificates.length + activeServices.length;

    machine.activeBlockers = String(activeBlockerCount);
    machine.lastUpdated = "Just now";

    if (activeCertificate) {
      machine.state = "blocked";
      machine.reason = activeCertificate.status === "Missing" ? `${activeCertificate.name} missing` : `${activeCertificate.name} ${activeCertificate.status.toLowerCase()}`;
      machine.owner = activeCertificate.owner;
      machine.nextAction = activeCertificate.action;
      machine.eta = activeCertificate.daysLeft.startsWith("-") ? "Today" : activeCertificate.expiry;
      return;
    }

    if (activeService) {
      machine.state = "blocked";
      machine.reason = activeService.issue;
      machine.owner = activeService.owner;
      machine.nextAction = "Complete service action";
      machine.eta = activeService.due;
      return;
    }

    if (activeIssueCount) {
      const nextIssue = machine.issues.find((issue) => issue.status !== "Resolved");
      machine.state = "at_risk";
      machine.reason = nextIssue?.title ?? "Needs review";
      machine.owner = nextIssue?.owner ?? machine.owner;
      machine.nextAction = "Review open issue";
      machine.eta = "Today";
      return;
    }

    machine.state = "ready";
    machine.reason = "No blocker found";
    machine.nextAction = "-";
    machine.eta = "-";
  }

  function assignOwner(
    machineId: string,
    owner: string,
    blockerId?: string,
    dueIso?: string,
    note?: string,
    assignmentStatus: NonNullable<Certificate["assignmentStatus"]> = "Assigned",
    channels: string[] = ["In-app"],
  ) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    const assignedAt = "Just now";
    const assignmentDue = formatDueLabel(dueIso ?? "");
    const computedStatus: NonNullable<Certificate["assignmentStatus"]> = isDueOverdue(dueIso ?? "") ? "Overdue" : assignmentStatus;
    const assignedBlocker = blockerId ? blockerCardsForMachine(machine).find((blocker) => blocker.id === blockerId) : undefined;
    const assignmentSummary = assignedBlocker?.summary ?? "Open blockers";
    machine.owner = owner;
    machine.certificates = machine.certificates.map((certificate) =>
      blockerId === `certificate:${certificate.name}` || (!blockerId && (certificate.status === "Expired" || certificate.status === "Missing" || certificate.status === "Critical"))
        ? {
            ...certificate,
            owner,
            due: assignmentDue,
            assignmentStatus: computedStatus,
            assignedAt,
          }
        : certificate,
    );
    machine.service = machine.service.map((service) =>
      blockerId === `service:${service.issue}` || (!blockerId && service.blocksRelease && service.status !== "Resolved")
        ? { ...service, owner, due: assignmentDue, assignmentStatus: computedStatus, assignedAt }
        : service,
    );
    machine.issues = machine.issues.map((issue) => (blockerId ? issue : { ...issue, owner }));
    machine.lastUpdated = "Just now";
    recordDecision(machine, "Owner Assigned", assignmentSummary, `${owner} owns next action · Due ${assignmentDue}${note ? ` · ${note}` : ""}`, "FleetLever", "No");
    addOperationalNotification(`${machine.code} ${computedStatus.toLowerCase()} to ${owner}`, `${assignmentSummary} · Due ${assignmentDue} · ${channels.join(", ")}${note ? ` · ${note}` : ""}`);
    refreshConsole(`${machine.code}: ${blockerId ? "blocker" : "open blockers"} ${computedStatus.toLowerCase()} to ${owner}.`);
  }

  function completeBlocker(machineId: string, blockerId: string, note: string) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;

    if (blockerId.startsWith("certificate:")) {
      const certificateName = blockerId.replace("certificate:", "");
      machine.certificates = machine.certificates.map((certificate) =>
        certificate.name === certificateName
          ? { ...certificate, status: "Valid", expiry: "Renewed today", daysLeft: "365", action: "No action" }
          : certificate,
      );
      machine.issues = machine.issues.map((issue) =>
        issue.title.toLowerCase().includes(certificateName.toLowerCase().replace("certificate", "").trim()) ? { ...issue, status: "Resolved" } : issue,
      );
    }

    if (blockerId.startsWith("service:")) {
      const serviceIssue = blockerId.replace("service:", "");
      machine.service = machine.service.map((service) =>
        service.issue === serviceIssue ? { ...service, blocksRelease: false, status: "Resolved", due: "Completed" } : service,
      );
      machine.issues = machine.issues.map((issue) => (issue.title === serviceIssue ? { ...issue, status: "Resolved" } : issue));
    }

    syncMachineReleaseState(machine);
    recordDecision(machine, machine.state === "ready" ? "Ready For Work" : "Action Completed", machine.reason, note || "Owner action completed", "FleetLever", "No");
    addOperationalNotification(`${machine.code} blocker completed`, `${machine.reason} · ${note || "Action completed"}`);
    refreshConsole(`${machine.code}: action completed.`);
  }

  function updateServiceStatus(machineId: string, issue: string, status: ServiceBlocker["status"]) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    const service = machine.service.find((item) => item.issue === issue);
    if (!service) return;
    const nextDue = status === "Resolved" ? "Completed" : status === "Waiting" ? "Waiting parts" : service.due === "Completed" || service.due === "Waiting parts" ? "Today" : service.due;

    machine.service = machine.service.map((item) =>
      item.issue === issue
        ? {
            ...item,
            status,
            due: nextDue,
            blocksRelease: status === "Resolved" ? false : item.blocksRelease,
          }
        : item,
    );

    if (status === "Resolved") {
      machine.issues = machine.issues.map((item) => (item.title === issue || item.title.toLowerCase().includes(issue.toLowerCase()) ? { ...item, status: "Resolved" } : item));
    }

    syncMachineReleaseState(machine);
    recordDecision(machine, status === "Resolved" ? "Service Cleared" : "Service Updated", issue, `Service job marked ${status.toLowerCase()}`, "Workshop", "No");
    addOperationalNotification(`${machine.code} workshop job ${status.toLowerCase()}`, `${issue} · ${machineWorksite(machine).name}`);
    refreshConsole(`${machine.code}: workshop job marked ${status.toLowerCase()}.`);
  }

  function addWorkshopJob(draft: WorkshopJobDraft) {
    const machine = machines.find((item) => item.id === draft.machineId);
    if (!machine) return;
    const issue = draft.issue.trim();
    if (!issue) return;
    const existingJob = machine.service.find((service) => service.issue.toLowerCase() === issue.toLowerCase());

    if (existingJob) {
      emitConsoleToast(`${machine.code}: that workshop job already exists.`);
      return;
    }

    machine.service = [
      {
        issue,
        severity: draft.blocksRelease ? "High" : "Medium",
        blocksRelease: draft.blocksRelease,
        owner: draft.owner,
        due: draft.due,
        status: "Open",
        assignmentStatus: "Assigned",
        assignedAt: "Just now",
      },
      ...machine.service,
    ];
    machine.issues = [
      {
        title: issue,
        severity: draft.blocksRelease ? "High" : "Medium",
        owner: draft.owner,
        status: "Open",
      },
      ...machine.issues,
    ];
    machine.nextAction = "Complete service action";
    machine.owner = draft.owner;
    machine.eta = draft.due;
    syncMachineReleaseState(machine);
    recordDecision(machine, "Service Job Added", issue, `${draft.blocksRelease ? "Blocks tomorrow's work" : "Service follow-up"} · ${draft.owner} · ${draft.due}`, draft.owner, "No");
    addOperationalNotification(`${machine.code} workshop job added`, `${issue} · ${draft.owner} · ${draft.due}`);
    refreshConsole(`${machine.code}: workshop job added.`);
  }

  function uploadDocument(machineId: string, blockerId: string, documentName: string, expiryDate: string) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    const currentCount = Number.parseInt(machine.documents, 10) || 0;
    machine.documents = `${currentCount + 1} files`;
    machine.certificates = machine.certificates.map((certificate) =>
      blockerId === `certificate:${certificate.name}`
        ? { ...certificate, status: "Valid", expiry: expiryDate || "Uploaded today", daysLeft: "365", action: "No action" }
        : certificate,
    );
    machine.photos.push({ title: documentName || "Uploaded evidence", category: "Evidence", date: "Today" });
    syncMachineReleaseState(machine);
    recordDecision(machine, machine.state === "ready" ? "Ready For Work" : "Evidence Uploaded", documentName || "Evidence uploaded", `${expiryDate || "Uploaded today"} · Machine passport updated`, "FleetLever", "No");
    addOperationalNotification(`${machine.code} evidence uploaded`, `${documentName || "Evidence"} updated in Evidence and Machine Passport.`);
    refreshConsole(`${machine.code}: ${documentName || "evidence"} uploaded and synced.`);
  }

  function releaseWithOverride(machineId: string, reason: string, approver: string, acceptedUntil: string) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    recordDecision(machine, "Released With Override", machine.reason, `${reason} · Approved by ${approver} · Accepted until ${acceptedUntil}`, approver, "Yes");
    machine.state = "at_risk";
    machine.reason = "Released with override";
    machine.nextAction = `Resolve override reason: ${reason}`;
    machine.eta = acceptedUntil || "Today";
    machine.lastUpdated = "Just now";
    refreshConsole(`${machine.code}: released with override and logged.`);
  }

  function releaseReadyMachines(releaseMachines: Machine[]) {
    const readyMachines = releaseMachines.filter((machine) => machine.state === "ready");
    readyMachines.forEach((machine) => {
      recordDecision(machine, "Ready For Work", "No blocker found", `Released to ${selectedWorksite.name}`, "Dimitris", "No");
    });
    addOperationalNotification(`${selectedWorksite.name} release updated`, `${readyMachines.length} clear machine${readyMachines.length === 1 ? "" : "s"} released. Decision History updated.`);
    setReleaseModalOpen(false);
    refreshConsole(`${readyMachines.length} ready machines released for ${selectedWorksite.name}.`);
  }

  function addConsoleItem(type: AddItemType, name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;
    if (type === "Worksite") {
      const id = `worksite-${Date.now()}`;
      worksites.push({ id, name: cleanName, location: "New worksite", date: "Tomorrow, 07:00", requiredMachineIds: [] });
      setWorksiteId(id);
      setActiveView("tomorrow");
      addOperationalNotification(`${cleanName} added`, "New worksite is ready for machine assignment.");
      refreshConsole(`${cleanName} added as a worksite.`);
    } else if (type === "Machine") {
      const id = `machine-${Date.now()}`;
      const code = `M-${String(machines.length + 1).padStart(2, "0")}`;
      const newMachine: Machine = {
        id,
        code,
        name: cleanName,
        type: "Machine",
        manufacturer: "FleetLever",
        model: "New",
        serial: `SN-${Date.now()}`,
        ownership: "Owned",
        worksiteId,
        state: "at_risk",
        reason: "New machine needs review",
        owner: "Dimitris",
        nextAction: "Complete Machine Passport",
        eta: "Today",
        lastUpdated: "Just now",
        activeBlockers: "0",
        documents: "0 files",
        certificates: [],
        service: [],
        issues: [{ title: "Passport incomplete", severity: "Medium", owner: "Dimitris", status: "Open" }],
        photos: [],
      };
      machines.push(newMachine);
      selectedWorksite.requiredMachineIds.push(id);
      setSelectedMachineId(id);
      setDrawerMode("passport");
      setDrawerOpen(true);
      recordDecision(newMachine, "Needs Attention", "New machine needs review", "Machine added and passport opened", "FleetLever", "No");
      addOperationalNotification(`${code} added to ${selectedWorksite.name}`, "Complete the machine passport before release.");
      refreshConsole(`${cleanName} added to ${selectedWorksite.name}.`);
    } else if (type === "Certificate") {
      const targetMachine = machines.find((machine) => machine.id === selectedMachineId);
      if (!targetMachine) return;
      targetMachine.certificates.push({ name: cleanName, status: "Expiring soon", expiry: "30 June 2026", daysLeft: "29", owner: "Maria", action: "Review certificate" });
      targetMachine.state = targetMachine.state === "ready" ? "at_risk" : targetMachine.state;
      targetMachine.reason = targetMachine.state === "at_risk" ? "Certificate needs review" : targetMachine.reason;
      targetMachine.lastUpdated = "Just now";
      recordDecision(targetMachine, "Evidence Added", cleanName, "Certificate added for review", "Maria", "No");
      addOperationalNotification(`${targetMachine.code} evidence added`, `${cleanName} needs review.`);
      refreshConsole(`${cleanName} added to ${targetMachine.code}.`);
    } else if (type === "Service Blocker") {
      const targetMachine = machines.find((machine) => machine.id === selectedMachineId);
      if (!targetMachine) return;
      targetMachine.service.push({ issue: cleanName, severity: "High", blocksRelease: true, owner: "Workshop", due: "Today", status: "Open" });
      targetMachine.issues.push({ title: cleanName, severity: "High", owner: "Workshop", status: "Open" });
      syncMachineReleaseState(targetMachine);
      recordDecision(targetMachine, "Service Job Added", cleanName, "Service blocker added from console", "Workshop", "No");
      addOperationalNotification(`${targetMachine.code} service job added`, `${cleanName} could stop tomorrow's work.`);
      refreshConsole(`${cleanName} added as a blocker for ${targetMachine.code}.`);
    } else {
      const targetMachine = machines.find((machine) => machine.id === selectedMachineId);
      const documentBlocker = targetMachine?.certificates.find((certificate) => ["Expired", "Missing", "Critical"].includes(certificate.status));
      if (targetMachine && documentBlocker) {
        uploadDocument(selectedMachineId, `certificate:${documentBlocker.name}`, cleanName, "Uploaded today");
      } else {
        refreshConsole("No document blocker selected.");
      }
    }
    setAddModalType(null);
    setAddMenuOpen(false);
  }

  const globalSearchGroups: GlobalSearchGroup[] = normalizedGlobalSearch.length >= 2
    ? [
        {
          title: "Machines",
          results: machines
            .filter((machine) =>
              valuesMatchSearch(normalizedGlobalSearch, [
                machine.code,
                machine.name,
                machine.type,
                machine.owner,
                machine.reason,
                machine.serial,
                machineWorksite(machine).name,
              ]),
            )
            .slice(0, 4)
            .map((machine) => ({
              id: `machine:${machine.id}`,
              title: machine.code,
              subtitle: machine.name,
              meta: `${machine.type} · ${machineWorksite(machine).name}`,
              label: externalStatus(machine.state),
              tone: machine.state === "ready" ? "ready" as const : machine.state === "at_risk" ? "attention" as const : "blocked" as const,
              imageUrl: machinePhotoPlaceholder(machine),
              onSelect: () => {
                openMachineFromSearch(machine, "machines");
              },
            })),
        },
        {
          title: "Worksites",
          results: worksites
            .filter((worksite) => {
              const siteMachines = machinesForWorksite(worksite);
              return valuesMatchSearch(normalizedGlobalSearch, [
                worksite.name,
                worksite.location,
                worksite.date,
                siteMachines.map((machine) => `${machine.code} ${machine.name} ${machine.reason} ${machine.owner}`).join(" "),
              ]);
            })
            .slice(0, 3)
            .map((worksite) => {
              const siteMachines = machinesForWorksite(worksite);
              const siteCounts = countsForMachines(siteMachines);
              return {
                id: `worksite:${worksite.id}`,
                title: worksite.name,
                subtitle: worksite.location,
                meta: `${siteCounts.ready}/${siteCounts.total} ready · ${siteCounts.blocked} blocked`,
                label: siteCounts.blocked ? "Blocked" : siteCounts.attention ? "Review" : "Ready",
                tone: siteCounts.blocked ? "blocked" as const : siteCounts.attention ? "attention" as const : "ready" as const,
                onSelect: () => {
                  openWorksiteFromSearch(worksite);
                },
              };
            }),
        },
        {
          title: "Evidence",
          results: machines
            .flatMap((machine) => machine.certificates.map((certificate) => ({ certificate, machine })))
            .filter(({ certificate, machine }) =>
              valuesMatchSearch(normalizedGlobalSearch, [
                machine.code,
                machine.name,
                machineWorksite(machine).name,
                certificate.name,
                certificate.status,
                certificate.owner,
                certificate.action,
                certificate.expiry,
              ]),
            )
            .slice(0, 4)
            .map(({ certificate, machine }) => ({
              id: `document:${machine.id}:${certificate.name}`,
              title: certificate.name,
              subtitle: `${machine.code} · ${certificate.action}`,
              meta: `${certificate.owner} · ${certificate.expiry}`,
              label: certificate.status,
              tone: certificate.status === "Valid" ? "ready" as const : certificate.status === "Critical" || certificate.status === "Expiring soon" ? "attention" as const : "blocked" as const,
              onSelect: () => {
                openMachineFromSearch(machine, "certificates", "passport", "documents");
              },
            })),
        },
        {
          title: "Stop List",
          results: actionQueueRows(machines)
            .filter((row) =>
              valuesMatchSearch(normalizedGlobalSearch, [
                row.machine.code,
                row.machine.name,
                row.nextStep,
                row.blocker.summary,
                row.owner,
                row.due,
                row.impact,
                row.actionLabel,
              ]),
            )
            .slice(0, 4)
            .map((row) => ({
              id: `action:${actionQueueRowKey(row)}`,
              title: row.actionLabel,
              subtitle: `${row.machine.code} · ${row.nextStep}`,
              meta: `${row.blocker.summary} · ${row.owner} · ${row.due}`,
              label: row.priority === "blocking" ? "Blocking" : "Review",
              tone: row.priority === "blocking" ? "blocked" as const : "attention" as const,
              onSelect: () => {
                openActionFromSearch(row.machine, row.action);
              },
            })),
        },
        {
          title: "Service Jobs",
          results: machines
            .flatMap((machine) => machine.service.map((service) => ({ machine, service })))
            .filter(({ machine, service }) =>
              valuesMatchSearch(normalizedGlobalSearch, [
                machine.code,
                machine.name,
                machineWorksite(machine).name,
                service.issue,
                service.owner,
                service.due,
                service.status,
              ]),
            )
            .slice(0, 3)
            .map(({ machine, service }) => ({
              id: `service:${machine.id}:${service.issue}`,
              title: service.issue,
              subtitle: `${machine.code} · ${machineWorksite(machine).name}`,
              meta: `${service.owner} · ${service.due}`,
              label: service.blocksRelease ? "Could stop work" : service.status,
              tone: service.blocksRelease ? "blocked" as const : service.status === "Resolved" ? "ready" as const : "attention" as const,
              onSelect: () => {
                openMachineFromSearch(machine, "service", "passport", "service");
              },
            })),
        },
        {
          title: "Decision History",
          results: releaseHistory
            .filter((item) => valuesMatchSearch(normalizedGlobalSearch, [item.date, item.worksite, item.machine, item.result, item.reason, item.action, item.user]))
            .slice(0, 3)
            .map((item) => ({
              id: `history:${item.date}:${item.machine}:${item.reason}`,
              title: `${item.machine} · ${item.result}`,
              subtitle: item.reason,
              meta: `${item.date} · ${item.user}`,
              label: "Decision",
              tone: item.result === "Ready For Work" ? "ready" as const : item.result === "Needs Attention" ? "attention" as const : "neutral" as const,
              onSelect: () => {
                setSearchOpen(false);
                showView("history");
              },
            })),
        },
      ].filter((group) => group.results.length)
    : [];
  const globalSearchResultCount = globalSearchGroups.reduce((total, group) => total + group.results.length, 0);

  return (
    <main className="min-h-screen bg-[#F6F5F2] text-[#0D2F2D]">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#E2E8F0] bg-[#0D2F2D] text-white transition lg:relative lg:flex ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex h-20 items-center border-b border-white/10 px-5">
            <div className="min-w-0">
              <FleetLeverLogo inverse />
              <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide text-white/55">{clientName}</p>
            </div>
          </div>
          <nav aria-label="App navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => showView(item.key)}
                className={`flex min-h-10 w-full items-center gap-3 rounded-md border-l-2 px-3 text-left text-[13px] font-semibold transition ${
                  activeView === item.key
                    ? "border-[#20B7C9] bg-white/12 text-white"
                    : "border-transparent text-white/78 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <LeavyAssistant
          counts={counts}
          machinesList={visibleMachines}
          onOpenMachine={(machine) => {
            setActiveView("machines");
            setMobileNavOpen(false);
            setSearchTerm("");
            setSearchOpen(false);
            setDrawerAction(null);
            openMachine(machine, machine.state === "blocked" ? "why" : "passport");
          }}
          onToggle={() => setLeavyOpen((open) => !open)}
          onViewOpen={showView}
          open={leavyOpen}
          selectedWorksite={selectedWorksite}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E2E8F0] text-[#1F2933] lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div ref={searchBoxRef} className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setSearchOpen(false);
                  }}
                  placeholder="Search machine, worksite, certificate, owner...  ⌘K"
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 text-[13px] text-[#1F2933] outline-none transition placeholder:text-[#64748B] focus:border-[#0D2F2D] focus:bg-white focus:ring-2 focus:ring-[#0D2F2D]/10"
                />
                {searchOpen && normalizedGlobalSearch.length >= 2 ? (
                  <GlobalSearchViewer
                    groups={globalSearchGroups}
                    query={searchTerm}
                    resultCount={globalSearchResultCount}
                    onClear={() => {
                      setSearchTerm("");
                      setSearchOpen(false);
                    }}
                  />
                ) : null}
              </div>
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => {
                    setAddMenuOpen((open) => !open);
                    setNotificationOpen(false);
                    setUserMenuOpen(false);
                  }}
                  className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 text-[13px] font-semibold text-[#1F2933]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add
                  <ChevronDown className="h-4 w-4 text-[#64748B]" aria-hidden="true" />
                </button>
                {addMenuOpen ? (
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-xl">
                    {["Machine", "Worksite", "Certificate", "Service Blocker", "Document"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setAddModalType(item as AddItemType)}
                        className="flex min-h-9 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#1F2933] hover:bg-[#F8FAFC]"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  setAddMenuOpen(false);
                  setUserMenuOpen(false);
                }}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#1F2933]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadNotifications ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white">
                    {unreadNotifications}
                  </span>
                ) : null}
              </button>
              {notificationOpen ? (
                <div className="absolute right-16 top-14 z-50 w-80 rounded-lg border border-[#E2E8F0] bg-white p-3 shadow-xl">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase text-[#64748B]">Notifications</p>
                    <span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-[11px] font-bold text-[#64748B]">{unreadNotifications} unread</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {notifications.slice(0, 5).map((item) => (
                      <div key={item.id} className={`rounded-md border p-3 text-sm ${item.read ? "border-[#E2E8F0] bg-white" : "border-[#CFFAFE] bg-[#ECFEFF]"}`}>
                        <p className="font-bold text-[#1F2933]">{item.title}</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-[#64748B]">{item.detail}</p>
                        <p className="mt-2 text-[11px] font-bold uppercase text-[#94A3B8]">{item.createdAt}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
                      setNotificationOpen(false);
                      refreshConsole("Notifications marked as reviewed.");
                    }}
                    className="mt-3 min-h-9 w-full rounded-md bg-[#0D2F2D] px-3 text-sm font-bold text-white"
                  >
                    Mark reviewed
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((open) => !open);
                  setAddMenuOpen(false);
                  setNotificationOpen(false);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#1F2933]"
                aria-label="User menu"
              >
                <CircleUserRound className="h-5 w-5" aria-hidden="true" />
              </button>
              {userMenuOpen ? (
                <div className="absolute right-4 top-14 z-50 w-56 rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-xl">
                  {["Profile", "Sign out"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        refreshConsole(item === "Sign out" ? "Session remains active." : `${item} opened.`);
                      }}
                      className="flex min-h-9 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#1F2933] hover:bg-[#F8FAFC]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </header>

          <div className="p-4 lg:p-6">
            {activeView === "tomorrow" ? (
              <TomorrowPlanner
                counts={counts}
                dateMode={dateMode}
                allMachines={allPlannedMachines}
                onDateModeChange={setDateMode}
                onHistoryOpen={() => showView("history")}
                onMachineOpen={openMachine}
                onRelease={() => setReleaseModalOpen(true)}
                onWorksiteChange={(id) => {
                  setWorksiteId(id);
                }}
                selectedWorksite={selectedWorksite}
                worksiteId={worksiteId}
              />
            ) : null}
            {activeView === "worksites" ? (
              <WorksitesView
                worksitesList={visibleWorksites}
                onOpenPlanner={(worksite) => {
                  setWorksiteId(worksite.id);
                  showView("tomorrow");
                  emitConsoleToast(`${worksite.name} opened in Tomorrow's Work Planner.`);
                }}
              />
            ) : null}
            {activeView === "machines" ? <MachinesView machinesList={visibleMachines} onMachineOpen={openMachine} /> : null}
            {activeView === "blockers" ? <ActionQueueView machinesList={visibleMachines} onActionStart={startMachineAction} onMachineOpen={openMachine} /> : null}
            {activeView === "certificates" ? (
              <DocumentsView
                machinesList={visibleMachines}
                onActionStart={startMachineAction}
                onMachineOpen={(machine) => {
                  openMachine(machine, "passport", "documents");
                }}
              />
            ) : null}
            {activeView === "service" ? (
              <WorkshopView
                machinesList={visibleMachines}
                onJobCreate={addWorkshopJob}
                onMachineOpen={(machine) => {
                  openMachine(machine, "passport", "service");
                }}
                onServiceStatusChange={updateServiceStatus}
              />
            ) : null}
            {activeView === "history" ? <ReleaseHistoryView searchTerm={searchTerm} /> : null}
          </div>
        </div>

        {drawerOpen ? (
          <DetailDrawer
            machine={selectedMachine}
            mode={drawerMode}
            onClose={() => setDrawerOpen(false)}
            onAssignOwner={(blockerId) => setDrawerAction({ type: "assign-owner", blockerId })}
            onCompleteAction={(blockerId) => setDrawerAction({ type: "complete-action", blockerId })}
            onExportPassport={() => downloadTextFile(`${selectedMachine.code}-passport.txt`, `${selectedMachine.code}\n${selectedMachine.name}\n${externalStatus(selectedMachine.state)}`)}
            onReleaseOverride={() => setDrawerAction({ type: "override" })}
            onModeChange={setDrawerMode}
            onPassportTabChange={setPassportTab}
            onUploadDocument={(blockerId) => setDrawerAction({ type: "upload-document", blockerId, source: "passport" })}
            passportTab={passportTab}
          />
        ) : null}
      </div>

      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      {releaseModalOpen ? (
        <ReleaseModal
          machines={allPlannedMachines}
          onClose={() => setReleaseModalOpen(false)}
          onReleaseReady={() => releaseReadyMachines(allPlannedMachines)}
          onReviewBlocked={() => emitConsoleToast("Blocked machines are visible in the release checklist.")}
        />
      ) : null}
      {drawerAction ? (
        <DrawerActionModal
          action={drawerAction}
          blockers={blockerCardsForMachine(selectedMachine)}
          machine={selectedMachine}
          onAssign={(owner, blockerId, dueIso, note, assignmentStatus, channels) => {
            assignOwner(selectedMachine.id, owner, blockerId, dueIso, note, assignmentStatus, channels);
            setDrawerAction(null);
          }}
          onClose={() => setDrawerAction(null)}
          onComplete={(blockerId, note) => {
            completeBlocker(selectedMachine.id, blockerId, note);
            setDrawerAction(null);
          }}
          onOverride={(reason, approver, acceptedUntil) => {
            releaseWithOverride(selectedMachine.id, reason, approver, acceptedUntil);
            setDrawerAction(null);
          }}
          onUpload={(blockerId, documentName, expiryDate) => {
            uploadDocument(selectedMachine.id, blockerId, documentName, expiryDate);
            setDrawerAction(null);
          }}
        />
      ) : null}
      {addModalType ? <AddItemModal type={addModalType} onAdd={addConsoleItem} onClose={() => setAddModalType(null)} /> : null}
      {toast ? (
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-lg border border-[#CFFAFE] bg-[#ECFEFF] px-4 py-3 text-sm font-bold text-[#0F766E] shadow-xl">
          {toast.message}
        </div>
      ) : null}
    </main>
  );
}

function TomorrowPlanner({
  allMachines,
  counts,
  dateMode,
  onDateModeChange,
  onHistoryOpen,
  onMachineOpen,
  onRelease,
  onWorksiteChange,
  selectedWorksite,
  worksiteId,
}: {
  allMachines: Machine[];
  counts: { ready: number; attention: number; blocked: number; total: number };
  dateMode: "Today" | "Tomorrow" | "Custom";
  onDateModeChange: (mode: "Today" | "Tomorrow" | "Custom") => void;
  onHistoryOpen: () => void;
  onMachineOpen: (machine: Machine, mode?: DrawerMode) => void;
  onRelease: () => void;
  onWorksiteChange: (id: string) => void;
  selectedWorksite: Worksite;
  worksiteId: string;
}) {
  const [machineListFilter, setMachineListFilter] = useState<"all" | MachineState>("all");
  const [machineListQuery, setMachineListQuery] = useState("");
  const [machinePage, setMachinePage] = useState(1);
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [customDate, setCustomDate] = useState("2026-06-03");
  const customDateRef = useRef<HTMLDivElement | null>(null);
  const machinePageSize = 10;
  const isReadyForRelease = counts.blocked === 0;
  const orderedMachines = [...allMachines].sort((a, b) => {
    const order: Record<MachineState, number> = { blocked: 0, at_risk: 1, ready: 2 };
    return order[a.state] - order[b.state];
  });
  const filteredMachines = orderedMachines.filter((machine) => {
    const matchesState = machineListFilter === "all" || machine.state === machineListFilter;
    return matchesState && machineMatchesQuery(machine, machineListQuery);
  });
  const totalMachinePages = Math.max(1, Math.ceil(filteredMachines.length / machinePageSize));
  const safeMachinePage = Math.min(machinePage, totalMachinePages);
  const pagedMachines = filteredMachines.slice((safeMachinePage - 1) * machinePageSize, safeMachinePage * machinePageSize);
  const rangeStart = filteredMachines.length === 0 ? 0 : (safeMachinePage - 1) * machinePageSize + 1;
  const rangeEnd = Math.min(safeMachinePage * machinePageSize, filteredMachines.length);
  const releaseStatus = isReadyForRelease ? "Will start" : "Will not start";
  const releaseTone = isReadyForRelease ? "border-[#15803D]" : "border-[#B91C1C]";
  const selectedDateLabel = dateMode === "Custom" ? formatPlannerDate(customDate) : dateMode;

  useEffect(() => {
    if (!customDateOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!customDateRef.current?.contains(event.target as Node)) {
        setCustomDateOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [customDateOpen]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">Prevent expensive construction downtime</p>
        <h1 className="mt-1 text-2xl font-semibold leading-tight text-[#111827] sm:text-[26px]">Know what will stop tomorrow&apos;s work before it happens.</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6B7280]">
          FleetLever checks the worksite, machines, evidence, inspections, and service jobs before tomorrow&apos;s work is released.
        </p>
      </div>

      <Surface className={`overflow-visible border-l-4 p-0 ${releaseTone}`}>
        <div className="flex flex-col gap-3 border-b border-[#E5E7EB] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">Tomorrow readiness check</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="truncate text-lg font-semibold leading-tight text-[#111827] sm:text-xl">{selectedWorksite.name}</h2>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${isReadyForRelease ? statusClasses("ready") : statusClasses("blocked")}`}>
                {releaseStatus}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#6B7280]">{selectedDateLabel} · {counts.total} required machines · readiness check</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={worksiteId}
              onChange={(event) => onWorksiteChange(event.target.value)}
              className="h-9 min-w-64 rounded-md border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#0F172A]"
              aria-label="Worksite"
            >
              {worksites.map((worksite) => (
                <option key={worksite.id} value={worksite.id}>
                  {worksite.name}
                </option>
              ))}
            </select>
            <div ref={customDateRef} className="relative inline-flex rounded-md border border-[#E5E7EB] bg-white p-1">
              {(["Today", "Tomorrow", "Custom"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    onDateModeChange(mode);
                    setCustomDateOpen(mode === "Custom");
                  }}
                  className={`min-h-7 rounded px-3 text-[13px] font-semibold ${
                    dateMode === mode ? "bg-[#0F172A] text-white" : "text-[#6B7280] hover:text-[#111827]"
                  }`}
                >
                  {mode}
                </button>
              ))}
              {customDateOpen ? (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xl">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Select work date</p>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(event) => {
                      setCustomDate(event.target.value);
                      onDateModeChange("Custom");
                    }}
                    className="mt-3 h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#0F172A]"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDateModeChange("Tomorrow");
                        setCustomDateOpen(false);
                      }}
                      className="min-h-8 rounded-md border border-[#E5E7EB] bg-white px-3 text-[13px] font-bold text-[#374151]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomDateOpen(false)}
                      className="min-h-8 rounded-md bg-[#0F172A] px-3 text-[13px] font-bold text-white"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onRelease}
              className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#0F172A] px-4 text-[13px] font-bold uppercase text-white shadow-sm transition hover:bg-[#1F2937]"
            >
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              Release clear machines
            </button>
          </div>
        </div>
        <div className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-stretch">
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3">
            <div className="grid gap-6 md:grid-cols-3">
              <ReleaseCount label="Ready" value={counts.ready} total={counts.total} tone="ready" />
              <ReleaseCount label="Review" value={counts.attention} total={counts.total} tone="at_risk" />
              <ReleaseCount label="Blocked" value={counts.blocked} total={counts.total} tone="blocked" />
            </div>
          </div>
          <MorningChangesSummary onHistoryOpen={onHistoryOpen} />
        </div>
      </Surface>

      <div className="grid min-w-0 gap-5">
        <div className="min-w-0 space-y-4">
          <Surface className="min-w-0 overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[#E5E7EB] px-5 py-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold leading-tight text-[#111827]">Readiness checklist</h2>
                <p className="mt-1 text-[13px] text-[#6B7280]">
                  What FleetLever checks before tomorrow can start. Showing {rangeStart}-{rangeEnd} of {filteredMachines.length}.
                </p>
              </div>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
                  <input
                    type="search"
                    value={machineListQuery}
                    onChange={(event) => setMachineListQuery(event.target.value)}
                    placeholder="Search release checklist"
                    className="h-9 w-full rounded-md border border-[#E5E7EB] bg-white pl-9 pr-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#0F172A] lg:w-72"
                  />
                </div>
                <div className="inline-flex rounded-md border border-[#E5E7EB] bg-white p-1">
                  {([
                    ["all", "All"],
                    ["blocked", "Blocked"],
                    ["at_risk", "Review"],
                    ["ready", "Ready"],
                  ] as Array<["all" | MachineState, string]>).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMachineListFilter(value)}
                      className={`min-h-7 rounded px-3 text-[12px] font-bold ${
                        machineListFilter === value ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#111827]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-[1120px] table-fixed text-left text-[13px]">
                <colgroup>
                  <col className="w-[160px]" />
                  <col className="w-[120px]" />
                  <col className="w-[150px]" />
                  <col className="w-[210px]" />
                  <col className="w-[110px]" />
                  <col className="w-[240px]" />
                  <col className="w-[110px]" />
                  <col className="w-[132px]" />
                </colgroup>
                <thead className="bg-[#F9FAFB] text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    {["Machine", "Type", "Tomorrow State", "Why", "Owner", "Next Action", "ETA", "Action"].map((heading) => {
                      const isAction = heading === "Action";
                      return (
                        <th
                          key={heading}
                          className={`border-b border-[#E5E7EB] px-4 py-3 whitespace-nowrap ${isAction ? "pl-4 text-left" : ""}`}
                        >
                          {heading}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {pagedMachines.map((machine) => (
                    <RequiredMachineTableRow key={machine.id} machine={machine} onMachineOpen={onMachineOpen} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#E5E7EB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] font-semibold text-[#64748B]">
                Page {safeMachinePage} of {totalMachinePages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMachinePage((page) => Math.max(1, page - 1))}
                  disabled={safeMachinePage === 1}
                  className="min-h-8 rounded-md border border-[#E5E7EB] bg-white px-3 text-[13px] font-bold text-[#111827] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setMachinePage((page) => Math.min(totalMachinePages, page + 1))}
                  disabled={safeMachinePage === totalMachinePages}
                  className="min-h-8 rounded-md border border-[#E5E7EB] bg-white px-3 text-[13px] font-bold text-[#111827] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function MorningChangesSummary({ onHistoryOpen }: { onHistoryOpen: () => void }) {
  const releaseChanges = [
    ["ready", "EX-12 cleared"],
    ["ready", "GN-02 released"],
    ["attention", "TR-08 due soon"],
  ] as const;

  return (
    <div className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Since Yesterday</p>
          <p className="mt-1 text-[13px] font-bold leading-5 text-[#111827]">2 released · 1 needs review</p>
          <div className="mt-2 grid gap-1">
            {releaseChanges.map(([tone, label]) => (
              <div key={label} className="flex items-center gap-2 text-[12px] font-bold text-[#475569]">
                <span className={`h-1.5 w-1.5 rounded-full ${tone === "ready" ? "bg-[#15803D]" : "bg-[#B45309]"}`} aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onHistoryOpen}
          aria-label="Open release history"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#64748B] transition hover:border-[#0F172A] hover:text-[#0F172A]"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function ReleaseCount({
  label,
  total,
  value,
  tone,
}: {
  label: string;
  total: number;
  value: number;
  tone: MachineState;
}) {
  const colorClass = tone === "ready" ? "text-[#15803D]" : tone === "at_risk" ? "text-[#B45309]" : "text-[#B91C1C]";
  const barClass = tone === "ready" ? "bg-[#15803D]" : tone === "at_risk" ? "bg-[#D97706]" : "bg-[#DC2626]";
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-3">
        <p className={`text-[34px] font-bold leading-none ${colorClass}`}>{value}</p>
        <p className="text-[14px] font-bold uppercase tracking-normal text-[#475569]">{label}</p>
      </div>
      <div
        className="mt-4 overflow-hidden rounded-full bg-[#E5E7EB]"
        style={{
          height: 24,
          background: "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0)), #e5e7eb",
          boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.12)",
        }}
      >
        <div
          className={`relative h-full overflow-hidden rounded-full ${barClass}`}
          style={{
            width: `${pct}%`,
            minWidth: 18,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -1px 2px rgba(15,23,42,0.18)",
          }}
        >
          <span
            className="absolute inset-0 opacity-85"
            style={{
              background:
                "radial-gradient(30px 15px at 18px 48%, rgba(255,255,255,0.28), transparent 72%), radial-gradient(38px 17px at 68px 58%, rgba(255,255,255,0.18), transparent 70%)",
              backgroundSize: "88px 100%",
              animation: "release-flow-wave 3.8s linear infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function RequiredMachineTableRow({
  machine,
  onMachineOpen,
}: {
  machine: Machine;
  onMachineOpen: (machine: Machine, mode?: DrawerMode) => void;
}) {
  const isBlocked = machine.state === "blocked";
  const isAttention = machine.state === "at_risk";
  const rowTone = isBlocked ? "bg-[#FEF2F2]/45" : isAttention ? "bg-[#FFFBEB]/55" : "bg-white";
  const action = isBlocked ? "Resolve" : isAttention ? "Review" : "Passport";

  return (
    <tr className={`border-b border-[#E5E7EB] last:border-0 ${rowTone}`}>
      <td className="px-4 py-3">
        <button type="button" onClick={() => onMachineOpen(machine, isBlocked ? "why" : "passport")} className="text-left">
          <span className="block text-[13px] font-bold text-[#111827]">{machine.code}</span>
          <span className="mt-1 block text-[11px] font-semibold leading-4 text-[#6B7280]">{machine.name}</span>
        </button>
      </td>
      <td className="px-4 py-3 text-[#374151]">{machine.type}</td>
      <td className="px-4 py-3">
        <MachineStatusBadge state={machine.state} />
      </td>
      <td className="px-4 py-3 font-semibold text-[#374151]">{machine.reason}</td>
      <td className="px-4 py-3 text-[#374151]">{machine.owner}</td>
      <td className="px-4 py-3 text-[#374151]">{machine.nextAction === "-" ? "No action" : machine.nextAction}</td>
      <td className="px-4 py-3 text-[#374151]">{machine.eta}</td>
      <td className="px-4 py-3 text-left">
        <button
          type="button"
          onClick={() => onMachineOpen(machine, isBlocked ? "why" : "passport")}
          className={`inline-flex min-h-8 min-w-[84px] items-center justify-center rounded-md border px-3 text-[12px] font-bold ${
            isBlocked
              ? "border-[#FECACA] text-[#B91C1C]"
              : isAttention
                ? "border-[#FDE68A] text-[#B45309]"
                : "border-[#BBF7D0] text-[#15803D]"
          }`}
        >
          {action}
        </button>
      </td>
    </tr>
  );
}

function MachineStatusBadge({ state }: { state: MachineState }) {
  const label = state === "ready" ? "Ready" : state === "at_risk" ? "Needs Review" : "Blocked";
  return (
    <span className={`inline-flex min-w-[104px] items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase whitespace-nowrap ${statusClasses(state)}`}>
      {label}
    </span>
  );
}

function KpiStrip({
  items,
}: {
  items: Array<[string, number | string, "ready" | "attention" | "blocked" | "neutral"]>;
}) {
  const xlColumns = items.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-5";

  return (
    <div className={`grid gap-3 md:grid-cols-2 ${xlColumns}`}>
      {items.map(([label, value, tone]) => {
        const toneClass =
          tone === "ready"
            ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803D]"
            : tone === "attention"
              ? "border-[#fde68a] bg-[#fffbeb] text-[#B45309]"
              : tone === "blocked"
                ? "border-[#fecaca] bg-[#fef2f2] text-[#B91C1C]"
                : "border-[#E2E8F0] bg-white text-[#0D2F2D]";
        return (
          <Surface key={label} className={`p-4 ${toneClass}`}>
            <p className="text-sm font-bold">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </Surface>
        );
      })}
    </div>
  );
}

function DetailDrawer({
  machine,
  mode,
  onAssignOwner,
  onClose,
  onCompleteAction,
  onExportPassport,
  onReleaseOverride,
  onModeChange,
  onPassportTabChange,
  onUploadDocument,
  passportTab,
}: {
  machine: Machine;
  mode: DrawerMode;
  onAssignOwner: (blockerId?: string) => void;
  onClose: () => void;
  onCompleteAction: (blockerId?: string) => void;
  onExportPassport: () => void;
  onReleaseOverride: () => void;
  onModeChange: (mode: DrawerMode) => void;
  onPassportTabChange: (tab: PassportTab) => void;
  onUploadDocument: (blockerId?: string) => void;
  passportTab: PassportTab;
}) {
  return (
    <aside className="fixed bottom-0 right-0 top-16 z-40 w-full max-w-[440px] border-l border-[#E2E8F0] bg-white shadow-2xl">
      <div className="h-full overflow-y-auto">
        <div className="border-b border-[#E2E8F0] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-[#64748B]">{mode === "why" ? "Why tomorrow stops" : "Machine Passport"}</p>
              <h2 className="mt-1 text-xl font-bold text-[#0D2F2D]">{machine.code}</h2>
              <p className="text-sm text-[#64748B]">{machine.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] text-[#64748B]"
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onModeChange("why")}
              className={`min-h-9 rounded-md px-3 text-sm font-bold ${mode === "why" ? "bg-[#0D2F2D] text-white" : "bg-[#F8FAFC] text-[#64748B]"}`}
            >
              Why tomorrow stops
            </button>
            <button
              type="button"
              onClick={() => onModeChange("passport")}
              className={`min-h-9 rounded-md px-3 text-sm font-bold ${mode === "passport" ? "bg-[#0D2F2D] text-white" : "bg-[#F8FAFC] text-[#64748B]"}`}
            >
              Machine Passport
            </button>
          </div>
        </div>
        {mode === "why" ? (
          <WhyBlocked
            machine={machine}
            onAssignOwner={onAssignOwner}
            onCompleteAction={onCompleteAction}
            onOpenPassport={() => onModeChange("passport")}
            onReleaseOverride={onReleaseOverride}
            onUploadDocument={onUploadDocument}
          />
        ) : null}
        {mode === "passport" ? (
          <MachinePassport
            machine={machine}
            onExportPassport={onExportPassport}
            onPassportTabChange={onPassportTabChange}
            onUploadDocument={onUploadDocument}
            passportTab={passportTab}
          />
        ) : null}
      </div>
    </aside>
  );
}

type BlockerCard = {
  id: string;
  kind: BlockerKind;
  title: string;
  status: string;
  summary: string;
  primaryAction: string;
  lines: Array<[string, string]>;
};

function blockerStatusClasses(status: string) {
  const normalized = status.toLowerCase();
  if (["valid", "resolved", "clear"].includes(normalized)) return "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]";
  if (normalized.includes("soon") || normalized.includes("progress") || normalized.includes("waiting") || normalized.includes("open")) {
    return "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]";
  }
  return "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]";
}

function blockerCardsForMachine(machine: Machine): BlockerCard[] {
  const certificateCards: BlockerCard[] = machine.certificates
    .filter((certificate) => ["Expired", "Missing", "Critical"].includes(certificate.status))
    .map((certificate) => ({
      id: `certificate:${certificate.name}`,
      kind: "certificate",
      title: certificate.status === "Missing" ? "Inspection Problem" : "Certificate Problem",
      status: certificate.status,
      summary:
        certificate.status === "Missing"
          ? `${certificate.name} is missing.`
          : `${certificate.name} ${certificate.status.toLowerCase()}${certificate.expiry !== "Required" ? ` on ${certificate.expiry}` : ""}.`,
      primaryAction: "Upload to passport",
      lines: [
        [certificate.status === "Missing" ? "Required document" : "Document", certificate.name],
        [certificate.status === "Missing" ? "Status" : "Expiry", certificate.expiry],
        ["Owner", certificate.owner],
        ["Assignment", certificate.assignmentStatus ?? "Unassigned"],
        ["Due", certificate.due ?? "Not set"],
        ["Next step", certificate.action],
      ],
    }));

  const serviceCards: BlockerCard[] = machine.service
    .filter((service) => service.blocksRelease && service.status !== "Resolved")
    .map((service) => ({
      id: `service:${service.issue}`,
      kind: "service",
      title: "Service Problem",
      status: service.due === "Today" ? "Due today" : service.status,
      summary: `${service.issue} is blocking release.`,
      primaryAction: "Complete service",
      lines: [
        ["Task", service.issue],
        ["Owner", service.owner],
        ["Assignment", service.assignmentStatus ?? "Unassigned"],
        ["Due", service.due],
        ["Next step", "Complete service action"],
      ],
    }));

  return [...certificateCards, ...serviceCards];
}

function WhyBlocked({
  machine,
  onAssignOwner,
  onCompleteAction,
  onOpenPassport,
  onReleaseOverride,
  onUploadDocument,
}: {
  machine: Machine;
  onAssignOwner: (blockerId?: string) => void;
  onCompleteAction: (blockerId?: string) => void;
  onOpenPassport: () => void;
  onReleaseOverride: () => void;
  onUploadDocument: (blockerId?: string) => void;
}) {
  const blockerCards = blockerCardsForMachine(machine);

  if (machine.state !== "blocked") {
    return (
      <div className="p-5">
        <StatusPill state={machine.state} />
        <p className="mt-4 text-sm leading-6 text-[#1F2933]">
          {machine.code} can be released. {machine.reason}.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <StatusPill state={machine.state} />
      <div className="mt-5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4">
        <p className="text-sm font-bold text-[#B91C1C]">
          This machine will stop {machineWorksite(machine).name} tomorrow because:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#1F2933]">
          {blockerCards.length ? blockerCards.map((card) => <li key={card.summary}>{card.summary}</li>) : <li>{machine.reason}.</li>}
        </ol>
      </div>
      <div className="mt-4 space-y-3">
        {blockerCards.map((card) => (
          <div key={`${card.title}-${card.summary}`} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-[#0D2F2D]">{card.title}</h3>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${blockerStatusClasses(card.status)}`}>
                {card.status}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {card.lines.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[6rem_1fr] gap-2 text-sm">
                  <span className="font-semibold text-[#64748B]">{label}</span>
                  <span className="font-semibold text-[#1F2933]">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onAssignOwner(card.id)}
                className="min-h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0D2F2D]"
              >
                Assign
              </button>
              <button
                type="button"
                onClick={() => (card.kind === "certificate" ? onUploadDocument(card.id) : onCompleteAction(card.id))}
                className="min-h-9 rounded-md bg-[#0D2F2D] px-3 text-xs font-bold text-white"
              >
                {card.primaryAction}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        <button type="button" onClick={onOpenPassport} className="min-h-10 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#0D2F2D]">
          Open Machine Passport
        </button>
        <button type="button" onClick={onReleaseOverride} className="min-h-10 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 text-sm font-bold text-[#92400e]">
          Release with override
        </button>
      </div>
    </div>
  );
}

function MachinePassport({
  machine,
  onExportPassport,
  onPassportTabChange,
  onUploadDocument,
  passportTab,
}: {
  machine: Machine;
  onExportPassport: () => void;
  onPassportTabChange: (tab: PassportTab) => void;
  onUploadDocument: (blockerId?: string) => void;
  passportTab: PassportTab;
}) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between gap-3">
        <StatusPill state={machine.state} />
        <button type="button" onClick={onExportPassport} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#E2E8F0] px-3 text-sm font-bold text-[#0D2F2D]">
          <Download className="h-4 w-4" aria-hidden="true" />
          Export Machine Passport
        </button>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#64748B]">Everything needed to prove whether this machine can work.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          ["Type", machine.type],
          ["Plate/Serial", machine.serial],
          ["Current worksite", machineWorksite(machine).name],
          ["Assigned owner", machine.owner],
          ["Last updated", machine.lastUpdated],
          ["Ownership", machine.ownership],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <p className="text-xs font-bold uppercase text-[#64748B]">{label}</p>
            <p className="mt-1 text-sm font-bold text-[#1F2933]">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {passportTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onPassportTabChange(tab.key)}
            className={`min-h-8 rounded-full px-3 text-xs font-bold ${passportTab === tab.key ? "bg-[#0D2F2D] text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {passportTab === "overview" ? <PassportOverview machine={machine} /> : null}
        {passportTab === "documents" ? <PassportDocuments machine={machine} onUploadDocument={onUploadDocument} /> : null}
        {passportTab === "service" ? <ServiceCards machine={machine} /> : null}
        {passportTab === "issues" ? <SimpleRows rows={machine.issues.map((issue) => [issue.title, issue.severity, issue.status])} empty="No open issues." /> : null}
        {passportTab === "photos" ? <SimpleRows rows={machine.photos.map((photo) => [photo.title, photo.category, photo.date])} empty="No photos uploaded." /> : null}
        {passportTab === "history" ? <SimpleRows rows={releaseHistory.filter((item) => item.machine === machine.code).map((item) => [item.date, item.result, item.reason])} empty="No release history yet." /> : null}
      </div>
    </div>
  );
}

function PassportDocuments({ machine, onUploadDocument }: { machine: Machine; onUploadDocument: (blockerId?: string) => void }) {
  const identityDocuments = [
    ["Machine registration", "Identity", "Valid"],
    ["Insurance file", "Insurance", "Valid"],
    ["Operator assignment", "Worksite", "Updated today"],
  ];

  return (
    <div className="space-y-4">
      <section>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Identity files</p>
        <SimpleRows rows={identityDocuments} />
      </section>
      <section>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Release evidence</p>
        <CertificateCards machine={machine} onUploadDocument={onUploadDocument} />
      </section>
    </div>
  );
}

function PassportOverview({ machine }: { machine: Machine }) {
  return (
    <div className="space-y-3">
      {[
        ["Current release status", externalStatus(machine.state)],
        ["Active blockers", machine.activeBlockers],
        ["Upcoming expirations", machine.certificates.find((certificate) => certificate.status !== "Valid")?.expiry ?? "None"],
        ["Latest service", machine.service[0]?.issue ?? "No open service blocker"],
        ["Recent release decision", machine.reason],
      ].map(([label, value]) => (
        <div key={label} className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <p className="text-xs font-bold uppercase text-[#64748B]">{label}</p>
          <p className="mt-1 text-sm font-bold text-[#1F2933]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function CertificateCards({ machine, onUploadDocument }: { machine: Machine; onUploadDocument: (blockerId?: string) => void }) {
  return (
    <div className="space-y-3">
      {machine.certificates.map((certificate) => (
        <div key={certificate.name} className="rounded-lg border border-[#E2E8F0] p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#0D2F2D]">{certificate.name}</h3>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${certificateClasses(certificate.status)}`}>{certificate.status}</span>
          </div>
          <p className="mt-2 text-sm text-[#64748B]">Expiry: {certificate.expiry}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => downloadTextFile(`${machine.code}-${certificate.name}.txt`, `${machine.code}\n${certificate.name}\n${certificate.status}`)}
              className="rounded-md border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#0D2F2D]"
            >
              Download
            </button>
            <button type="button" onClick={() => onUploadDocument(blockerIdForCertificate(certificate))} className="rounded-md border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#0D2F2D]">
              Upload to passport
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceCards({ machine }: { machine: Machine }) {
  if (!machine.service.length) return <p className="text-sm font-semibold text-[#64748B]">No service blockers.</p>;
  return (
    <div className="space-y-3">
      {machine.service.map((item) => (
        <div key={item.issue} className="rounded-lg border border-[#E2E8F0] p-3">
          <h3 className="text-sm font-bold text-[#0D2F2D]">{item.issue}</h3>
          <p className="mt-2 text-sm text-[#64748B]">
            Severity: {item.severity} · Blocks release: {item.blocksRelease ? "Yes" : "No"}
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            Owner: {item.owner} · Due: {item.due} · Status: {item.status}
          </p>
        </div>
      ))}
    </div>
  );
}

function SimpleRows({ empty = "No records.", rows }: { empty?: string; rows: string[][] }) {
  if (!rows.length) return <p className="text-sm font-semibold text-[#64748B]">{empty}</p>;
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.join("-")} className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm">
          <p className="font-bold text-[#0D2F2D]">{row[0]}</p>
          <p className="mt-1 text-[#64748B]">{row.slice(1).join(" · ")}</p>
        </div>
      ))}
    </div>
  );
}

function DrawerActionModal({
  action,
  blockers,
  machine,
  onAssign,
  onClose,
  onComplete,
  onOverride,
  onUpload,
}: {
  action: Exclude<DrawerAction, null>;
  blockers: BlockerCard[];
  machine: Machine;
  onAssign: (owner: string, blockerId?: string, dueIso?: string, note?: string, assignmentStatus?: NonNullable<Certificate["assignmentStatus"]>, channels?: string[]) => void;
  onClose: () => void;
  onComplete: (blockerId: string, note: string) => void;
  onOverride: (reason: string, approver: string, acceptedUntil: string) => void;
  onUpload: (blockerId: string, documentName: string, expiryDate: string) => void;
}) {
  const certificateBlockers = blockers.filter((blocker) => blocker.kind === "certificate");
  const actionBlockerId = action.type === "override" ? undefined : action.blockerId;
  const initialBlockerId = action.type === "upload-document" ? actionBlockerId ?? certificateBlockers[0]?.id ?? blockers[0]?.id ?? "" : actionBlockerId ?? blockers[0]?.id ?? "";
  const [blockerId, setBlockerId] = useState(initialBlockerId);
  const [owner, setOwner] = useState(machine.owner);
  const [assignmentStatus, setAssignmentStatus] = useState<NonNullable<Certificate["assignmentStatus"]>>("Assigned");
  const initialDue = duePresetDate("today-1700");
  const [dueDate, setDueDate] = useState(localDateInputValue(initialDue));
  const [dueTime, setDueTime] = useState(localTimeInputValue(initialDue));
  const [notifyChannels, setNotifyChannels] = useState<string[]>(["In-app"]);
  const [note, setNote] = useState("");
  const [documentName, setDocumentName] = useState(certificateBlockers.find((blocker) => blocker.id === initialBlockerId)?.summary ?? "");
  const [expiryDate, setExpiryDate] = useState("30 June 2026");
  const [selectedEvidenceFile, setSelectedEvidenceFile] = useState<File | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [approver, setApprover] = useState("George");
  const [acceptedUntil, setAcceptedUntil] = useState("Today, 18:00");
  const [overrideReason, setOverrideReason] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectedBlocker = blockers.find((blocker) => blocker.id === blockerId);
  const dueIso = buildDueIso(dueDate, dueTime);
  const dueLabel = formatDueLabel(dueIso);
  const dueOverdue = isDueOverdue(dueIso);
  const selectableBlockers = action.type === "upload-document" && certificateBlockers.length ? certificateBlockers : blockers;
  const canSubmitAssign = owner.trim().length > 1 && Boolean(dueIso) && notifyChannels.length > 0;
  const canSubmitComplete = Boolean(blockerId);
  const canSubmitUpload = Boolean(blockerId && documentName.trim()) && !isUploadingEvidence;
  const canSubmitOverride = overrideReason.trim().length >= 8 && approver.trim().length > 1 && acceptedUntil.trim().length > 1 && confirmation === "OVERRIDE";
  const uploadSource = action.type === "upload-document" ? action.source ?? "passport" : undefined;
  const uploadTitle =
    uploadSource === "action-queue"
      ? "Resolve evidence upload"
      : uploadSource === "documents"
        ? "Upload evidence"
        : "Upload to passport";
  const uploadDescription =
    uploadSource === "action-queue"
      ? "Upload the evidence that clears this release action. The document record and machine passport update together."
      : uploadSource === "documents"
        ? "Add or renew evidence in document control. Matching release actions and machine passport records update together."
        : "Attach evidence to this machine passport. The document record and release action update from the same upload.";
  const uploadSubmitLabel =
    uploadSource === "action-queue"
      ? "Upload and resolve"
      : uploadSource === "documents"
        ? "Upload evidence"
        : "Upload to passport";

  const title =
    action.type === "assign-owner"
      ? "Assign owner"
      : action.type === "complete-action"
        ? "Complete blocker action"
        : action.type === "upload-document"
          ? uploadTitle
          : "Release with override";
  const description =
    action.type === "assign-owner"
      ? "Choose who owns this blocker and when the next action is due."
      : action.type === "complete-action"
        ? "Clear one blocker at a time so the release state stays auditable."
        : action.type === "upload-document"
          ? uploadDescription
          : "Overrides require an approver, expiry, reason, and typed confirmation.";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0D2F2D]/45 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] p-5">
          <div>
            <p className="text-xs font-bold uppercase text-[#008C95]">{machine.code}</p>
            <h2 className="mt-1 text-xl font-bold text-[#0D2F2D]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0]">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          {action.type !== "override" ? (
            <label className="block">
              <span className="text-xs font-bold uppercase text-[#64748B]">Blocker</span>
              <select
                value={blockerId}
                onChange={(event) => {
                  setBlockerId(event.target.value);
                  const nextBlocker = selectableBlockers.find((blocker) => blocker.id === event.target.value);
                  if (action.type === "upload-document") setDocumentName(nextBlocker?.summary ?? "");
                }}
                className="mt-2 min-h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
              >
                {selectableBlockers.map((blocker) => (
                  <option key={blocker.id} value={blocker.id}>
                    {blocker.title}: {blocker.summary}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {selectedBlocker && action.type !== "override" ? (
            <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <p className="text-sm font-bold text-[#0D2F2D]">{selectedBlocker.summary}</p>
              <p className="mt-1 text-xs font-semibold text-[#64748B]">{selectedBlocker.lines.map(([label, value]) => `${label}: ${value}`).join(" · ")}</p>
            </div>
          ) : null}

          {action.type === "assign-owner" ? (
            <>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Owner</span>
                <select
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                >
                  {teamMembers.map((person) => (
                    <option key={person.name} value={person.name}>
                      {person.name} · {person.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Assignment status</span>
                <select
                  value={assignmentStatus}
                  onChange={(event) => setAssignmentStatus(event.target.value as NonNullable<Certificate["assignmentStatus"]>)}
                  className="mt-2 min-h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                >
                  {["Assigned", "Accepted", "Overdue"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Due</span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="min-h-11 rounded-md border border-[#E2E8F0] px-3 text-sm font-semibold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                  />
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(event) => setDueTime(event.target.value)}
                    className="min-h-11 rounded-md border border-[#E2E8F0] px-3 text-sm font-semibold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                  />
                </div>
                <div className={`mt-2 rounded-md border p-3 text-sm font-bold ${dueOverdue ? "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]" : "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"}`}>
                  Due: {dueLabel}
                  {dueOverdue ? " · will be marked overdue" : ""}
                </div>
              </label>
              <div>
                <span className="text-xs font-bold uppercase text-[#64748B]">Notify</span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {assignmentChannels.map((channel) => {
                    const selected = notifyChannels.includes(channel.label);
                    const Icon = channel.icon;
                    return (
                      <button
                        key={channel.label}
                        type="button"
                        onClick={() => {
                          setNotifyChannels((current) => selected ? current.filter((item) => item !== channel.label) : [...current, channel.label]);
                        }}
                        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-2 text-xs font-bold ${selected ? "border-[#0D2F2D] bg-[#0D2F2D] text-white" : "border-[#E2E8F0] bg-white text-[#1F2933]"}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {channel.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs font-semibold text-[#64748B]">This creates an in-app notification now. SMS is recorded as a delivery channel for backend wiring.</p>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Note</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional context for the owner"
                  className="mt-2 min-h-20 w-full rounded-md border border-[#E2E8F0] p-3 text-sm outline-none focus:border-[#0D2F2D]"
                />
              </label>
            </>
          ) : null}

          {action.type === "complete-action" ? (
            <label className="block">
              <span className="text-xs font-bold uppercase text-[#64748B]">Completion note</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What was completed?"
                className="mt-2 min-h-24 w-full rounded-md border border-[#E2E8F0] p-3 text-sm outline-none focus:border-[#0D2F2D]"
              />
            </label>
          ) : null}

          {action.type === "upload-document" ? (
            <>
              <div className="rounded-md border border-[#CFFAFE] bg-[#ECFEFF] p-3">
                <p className="text-sm font-bold text-[#0F766E]">One evidence upload updates Evidence, Machine Passport, Stop List, and Decision History.</p>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Evidence name</span>
                <input
                  value={documentName}
                  onChange={(event) => setDocumentName(event.target.value)}
                  placeholder="Renewed lifting certificate"
                  className="mt-2 min-h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm font-semibold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">New expiry / validity</span>
                <input
                  value={expiryDate}
                  onChange={(event) => setExpiryDate(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm font-semibold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                />
              </label>
	              <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-3 text-sm font-bold text-[#0D2F2D]">
	                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
	                {selectedEvidenceFile ? selectedEvidenceFile.name : "Select evidence file"}
	                <input
	                  type="file"
	                  aria-label="Select evidence file"
	                  className="sr-only"
	                  onChange={(event) => setSelectedEvidenceFile(event.target.files?.[0] ?? null)}
	                />
	              </label>
            </>
          ) : null}

          {action.type === "override" ? (
            <>
              <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] p-3">
                <p className="text-sm font-bold text-[#B91C1C]">This releases a blocked machine with an audit record. Use only when the site accepts the risk.</p>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Override reason</span>
                <textarea
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  placeholder="Why is this machine being released despite blockers?"
                  className="mt-2 min-h-24 w-full rounded-md border border-[#E2E8F0] p-3 text-sm outline-none focus:border-[#0D2F2D]"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase text-[#64748B]">Approved by</span>
                  <input
                    value={approver}
                    onChange={(event) => setApprover(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm font-semibold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-[#64748B]">Risk accepted until</span>
                  <input
                    value={acceptedUntil}
                    onChange={(event) => setAcceptedUntil(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm font-semibold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Type OVERRIDE to confirm</span>
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm font-bold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                />
              </label>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#E2E8F0] p-5">
          <button type="button" onClick={onClose} className="min-h-10 rounded-md border border-[#E2E8F0] px-4 text-sm font-bold text-[#1F2933]">
            Cancel
          </button>
          {action.type === "assign-owner" ? (
            <button
              type="button"
              disabled={!canSubmitAssign}
              onClick={() => onAssign(owner.trim(), blockerId || undefined, dueIso, note.trim(), dueOverdue ? "Overdue" : assignmentStatus, notifyChannels)}
              className="min-h-10 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
            >
              Assign owner
            </button>
          ) : null}
          {action.type === "complete-action" ? (
            <button
              type="button"
              disabled={!canSubmitComplete}
              onClick={() => onComplete(blockerId, note.trim() || "Action completed")}
              className="min-h-10 rounded-md bg-[#15803D] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
            >
              Complete blocker
            </button>
          ) : null}
          {action.type === "upload-document" ? (
	            <button
	              type="button"
	              disabled={!canSubmitUpload}
	              onClick={async () => {
	                try {
	                  setIsUploadingEvidence(true);
	                  if (selectedEvidenceFile) {
	                    await uploadConsoleFile(selectedEvidenceFile, "evidence", machine, {
	                      documentCategory: selectedBlocker?.kind === "certificate" ? selectedBlocker.title.replace(" Problem", "") : "Safety document",
	                      documentTitle: documentName.trim(),
	                      expiresAt: dateInputFromLabel(expiryDate.trim()),
	                    });
	                  }
	                  onUpload(blockerId, documentName.trim(), expiryDate.trim());
	                } catch (error) {
	                  emitConsoleToast(error instanceof Error ? error.message : "Upload failed.");
	                } finally {
	                  setIsUploadingEvidence(false);
	                }
	              }}
	              className="min-h-10 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
	            >
	              {isUploadingEvidence ? "Uploading..." : uploadSubmitLabel}
	            </button>
          ) : null}
          {action.type === "override" ? (
            <button
              type="button"
              disabled={!canSubmitOverride}
              onClick={() => onOverride(overrideReason.trim(), approver.trim(), acceptedUntil.trim())}
              className="min-h-10 rounded-md bg-[#B45309] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
            >
              Release with override
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReleaseModal({
  machines: releaseMachines,
  onClose,
  onReleaseReady,
  onReviewBlocked,
}: {
  machines: Machine[];
  onClose: () => void;
  onReleaseReady: () => void;
  onReviewBlocked: () => void;
}) {
  const blocked = releaseMachines.filter((machine) => machine.state === "blocked").length;
  const attention = releaseMachines.filter((machine) => machine.state === "at_risk").length;
  const ready = releaseMachines.filter((machine) => machine.state === "ready").length;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D2F2D]/40 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] p-5">
          <div>
            <h2 className="text-xl font-bold text-[#0D2F2D]">Review release readiness?</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              FleetLever confirms what can start tomorrow and records why anything stays behind.
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0]">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">
          <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-4">
            <p className="font-bold text-[#92400e]">
              {ready} machines can start. {attention} need review. {blocked} will stop tomorrow unless cleared.
            </p>
            <p className="mt-2 text-sm text-[#92400e]">Any override requires an approver, expiry, reason, and evidence packet.</p>
          </div>
          <div className="mt-5 overflow-x-auto rounded-lg border border-[#E2E8F0]">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-xs font-bold uppercase text-[#64748B]">
                <tr>
                  {["Machine", "Result", "Reason", "Required action"].map((heading) => (
                    <th key={heading} className="border-b border-[#E2E8F0] px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {releaseMachines.map((machine) => (
                  <tr key={machine.id} className="border-b border-[#E2E8F0] last:border-0">
                    <td className="px-4 py-3 font-bold text-[#0D2F2D]">{machine.code}</td>
                    <td className="px-4 py-3">
                      <StatusPill state={machine.state} />
                    </td>
                    <td className="px-4 py-3 text-[#1F2933]">{machine.reason}</td>
                    <td className="px-4 py-3 text-[#1F2933]">{machine.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-sm font-bold text-[#0D2F2D]">Release with override</p>
            <p className="mt-1 text-sm text-[#64748B]">Owner/Admin only. Requires reason, user name, timestamp, and audit log entry.</p>
            <textarea
              placeholder="Override reason"
              className="mt-3 min-h-20 w-full rounded-md border border-[#E2E8F0] bg-white p-3 text-sm outline-none focus:border-[#0D2F2D]"
            />
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="min-h-11 rounded-md border border-[#E2E8F0] px-4 text-sm font-bold text-[#1F2933]">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onReviewBlocked();
                onClose();
              }}
              className="min-h-11 rounded-md border border-[#E2E8F0] px-4 text-sm font-bold text-[#0D2F2D]"
            >
              Review blocked machines
            </button>
            <button type="button" onClick={onReleaseReady} className="min-h-11 rounded-md bg-[#15803D] px-4 text-sm font-bold text-white">
              Release ready machines
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddItemModal({
  onAdd,
  onClose,
  type,
}: {
  onAdd: (type: AddItemType, name: string) => void;
  onClose: () => void;
  type: AddItemType;
}) {
  const [name, setName] = useState("");
  const placeholder =
    type === "Machine"
      ? "e.g. BO-07 Concrete Pump"
      : type === "Worksite"
        ? "e.g. Hospital Extension"
        : type === "Certificate"
          ? "e.g. Lifting Certificate"
          : type === "Service Blocker"
            ? "e.g. Brake inspection overdue"
            : "e.g. Insurance document";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D2F2D]/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] p-5">
          <div>
            <h2 className="text-xl font-bold text-[#0D2F2D]">Add {type}</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Add this item to the current workspace view.
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0]">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <form
          className="p-5"
          onSubmit={(event) => {
            event.preventDefault();
            onAdd(type, name);
          }}
        >
          <label className="text-sm font-bold text-[#0D2F2D]" htmlFor="add-item-name">
            Name
          </label>
          <input
            id="add-item-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={placeholder}
            className="mt-2 h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm text-[#1F2933] outline-none focus:border-[#0D2F2D]"
            autoFocus
          />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="min-h-11 rounded-md border border-[#E2E8F0] px-4 text-sm font-bold text-[#1F2933]">
              Cancel
            </button>
            <button type="submit" className="min-h-11 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white">
              Add {type}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WorksitesView({ onOpenPlanner, worksitesList }: { onOpenPlanner: (worksite: Worksite) => void; worksitesList: Worksite[] }) {
  const [reviewWorksite, setReviewWorksite] = useState<Worksite | null>(null);
  const worksiteRows = worksitesList.map((worksite) => {
    const list = machinesForWorksite(worksite);
    const counts = countsForMachines(list);
    const mainBlocker = list.find((machine) => machine.state === "blocked") ?? list.find((machine) => machine.state === "at_risk");
    return { worksite, list, counts, mainBlocker };
  });
  const sortedRows = [...worksiteRows].sort((a, b) => b.counts.blocked - a.counts.blocked || b.counts.attention - a.counts.attention);
  const blockedSites = sortedRows.filter(({ counts }) => counts.blocked > 0).length;
  const reviewSites = sortedRows.filter(({ counts }) => counts.blocked === 0 && counts.attention > 0).length;
  const readySites = sortedRows.filter(({ counts }) => counts.blocked === 0 && counts.attention === 0).length;

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Worksites"
        description="See which jobs can start tomorrow, which ones cannot, and what each site needs before release."
        showActions={false}
      />
      <Surface className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Worksite readiness queue</p>
            <h2 className="mt-2 text-xl font-bold leading-tight text-[#0D2F2D]">Which work will not start?</h2>
            <p className="mt-2 text-sm font-semibold text-[#64748B]">Sorted by the jobs most likely to surprise the site tomorrow morning.</p>
          </div>
          <div className="grid min-w-full grid-cols-3 overflow-hidden rounded-lg border border-[#E5E7EB] text-sm font-bold xl:min-w-[360px]">
            <div className="bg-[#FEF2F2] px-3 py-2 text-[#B91C1C]">
              <p className="text-[11px] uppercase">Blocked</p>
              <p className="mt-1 text-lg">{blockedSites}</p>
            </div>
            <div className="border-x border-[#E5E7EB] bg-[#FFFBEB] px-3 py-2 text-[#B45309]">
              <p className="text-[11px] uppercase">Review</p>
              <p className="mt-1 text-lg">{reviewSites}</p>
            </div>
            <div className="bg-[#F0FDF4] px-3 py-2 text-[#15803D]">
              <p className="text-[11px] uppercase">Ready</p>
              <p className="mt-1 text-lg">{readySites}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto rounded-lg border border-[#E5E7EB]">
          <div className="grid min-w-[1180px] grid-cols-[minmax(220px,1.1fr)_150px_150px_minmax(260px,1.1fr)_minmax(240px,1.2fr)_150px] bg-[#F9FAFB] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#64748B]">
            <span>Worksite</span>
            <span>Tomorrow State</span>
            <span>Ready</span>
            <span>Main Blocker</span>
            <span>Owner Action</span>
            <span>Next Step</span>
          </div>
          {sortedRows.map(({ counts, mainBlocker, worksite }) => {
            const state: MachineState = counts.blocked ? "blocked" : counts.attention ? "at_risk" : "ready";
            const stateLabel = state === "ready" ? "Ready" : state === "at_risk" ? "Review" : "Blocked";
            const rowTone = state === "blocked" ? "bg-[#FEF2F2]/45" : state === "at_risk" ? "bg-[#FFFBEB]/55" : "bg-white";
            const readyWidth = counts.total ? (counts.ready / counts.total) * 100 : 0;
            return (
              <button
                key={worksite.id}
                type="button"
                onClick={() => setReviewWorksite(worksite)}
                className={`grid min-w-[1180px] w-full grid-cols-[minmax(220px,1.1fr)_150px_150px_minmax(260px,1.1fr)_minmax(240px,1.2fr)_150px] items-center gap-4 border-t border-[#E5E7EB] px-4 py-4 text-left transition hover:bg-[#F8FAFC] ${rowTone}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#111827]">{worksite.name}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">{worksite.location}</p>
                </div>
                <span className={`inline-flex w-fit min-w-[86px] items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${statusClasses(state)}`}>
                  {stateLabel}
                </span>
                <div>
                  <p className="text-sm font-bold text-[#111827]">
                    {counts.ready}/{counts.total}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div className="h-full rounded-full bg-[#008C95]" style={{ width: `${readyWidth}%` }} />
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#1F2933]">
                  {mainBlocker ? `${mainBlocker.code}: ${mainBlocker.reason}` : "No blocker found"}
                </p>
                <p className="text-xs font-semibold leading-5 text-[#64748B]">
                  {mainBlocker ? `${mainBlocker.owner} · ${mainBlocker.nextAction}` : "No action needed"}
                </p>
                <span className="inline-flex min-h-8 items-center justify-center rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0D2F2D]">
                  Open worksite
                </span>
              </button>
            );
          })}
        </div>
      </Surface>
      {reviewWorksite ? (
        <WorksiteReleaseReview
          worksite={reviewWorksite}
          onClose={() => setReviewWorksite(null)}
          onOpenPlanner={() => {
            setReviewWorksite(null);
            onOpenPlanner(reviewWorksite);
          }}
        />
      ) : null}
    </div>
  );
}

function WorksiteReleaseReview({
  onClose,
  onOpenPlanner,
  worksite,
}: {
  onClose: () => void;
  onOpenPlanner: () => void;
  worksite: Worksite;
}) {
  const list = machinesForWorksite(worksite);
  const counts = countsForMachines(list);
  const blockers = list.filter((machine) => machine.state === "blocked");
  const reviewItems = list.filter((machine) => machine.state === "at_risk");
  const ownerActions = [...blockers, ...reviewItems].map((machine) => ({
    id: machine.id,
    code: machine.code,
    owner: machine.owner,
    action: machine.nextAction === "-" ? "No action" : machine.nextAction,
    eta: machine.eta,
    reason: machine.reason,
    state: machine.state,
  }));
  const canRelease = counts.blocked === 0;

  return (
    <aside className="fixed bottom-0 right-0 top-16 z-40 w-full max-w-[520px] border-l border-[#E2E8F0] bg-white shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-[#E2E8F0] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Worksite readiness review</p>
              <h2 className="mt-1 truncate text-xl font-bold text-[#0D2F2D]">{worksite.name}</h2>
              <p className="mt-1 text-sm font-semibold text-[#64748B]">
                {worksite.date} · {worksite.location}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] text-[#64748B]"
              aria-label="Close worksite readiness review"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className={`rounded-lg border p-4 ${canRelease ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#FECACA] bg-[#FEF2F2]"}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Tomorrow readiness check</p>
            <p className={`mt-2 text-lg font-bold ${canRelease ? "text-[#15803D]" : "text-[#B91C1C]"}`}>
              {canRelease ? "Will start" : "Will not start"}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#475569]">
              {canRelease ? "No blocking machines found for this worksite." : `${counts.blocked} blocker${counts.blocked === 1 ? "" : "s"} must be cleared before crews arrive.`}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-[#E5E7EB] text-sm font-bold">
            <div className="bg-[#F0FDF4] px-3 py-3 text-[#15803D]">
              <p className="text-[11px] uppercase">Ready</p>
              <p className="mt-1 text-xl">{counts.ready}</p>
            </div>
            <div className="border-x border-[#E5E7EB] bg-[#FFFBEB] px-3 py-3 text-[#B45309]">
              <p className="text-[11px] uppercase">Review</p>
              <p className="mt-1 text-xl">{counts.attention}</p>
            </div>
            <div className="bg-[#FEF2F2] px-3 py-3 text-[#B91C1C]">
              <p className="text-[11px] uppercase">Blocked</p>
              <p className="mt-1 text-xl">{counts.blocked}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#111827]">Owner action queue</h3>
              <span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-xs font-bold text-[#64748B]">{ownerActions.length} open</span>
            </div>
            <div className="mt-3 space-y-2">
              {ownerActions.length ? (
                ownerActions.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-3 ${item.state === "blocked" ? "border-[#FECACA] bg-[#FFF7F7]" : "border-[#FDE68A] bg-[#FFFBEB]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#111827]">{item.code}</p>
                        <p className={item.state === "blocked" ? "mt-1 text-sm font-bold text-[#B91C1C]" : "mt-1 text-sm font-bold text-[#B45309]"}>{item.reason}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/80 bg-white px-2 py-1 text-xs font-bold text-[#475569]">{item.eta}</span>
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase text-[#64748B]">Owner</p>
                    <p className="mt-1 text-sm font-semibold text-[#1F2933]">
                      {item.owner} · {item.action}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm font-semibold text-[#15803D]">No owner action needed before release.</div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-bold text-[#111827]">Required machines</h3>
            <div className="mt-3 overflow-hidden rounded-lg border border-[#E5E7EB]">
              {list.map((machine) => (
                <div key={machine.id} className="grid grid-cols-[80px_1fr_auto] items-center gap-3 border-b border-[#E5E7EB] px-3 py-3 text-sm last:border-0">
                  <p className="font-bold text-[#111827]">{machine.code}</p>
                  <p className="min-w-0 truncate font-semibold text-[#475569]">{machine.reason}</p>
                  <MachineStatusBadge state={machine.state} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] p-4">
          <button type="button" onClick={onOpenPlanner} className="min-h-10 w-full rounded-md bg-[#0F172A] px-4 text-sm font-bold text-white">
            Open full planner
          </button>
          <button type="button" onClick={onClose} className="mt-2 min-h-10 w-full rounded-md border border-[#E2E8F0] px-4 text-sm font-bold text-[#1F2933]">
            Close review
          </button>
        </div>
      </div>
    </aside>
  );
}

function machinePhotoPlaceholder(machine: Machine) {
  const photoMap: Record<string, string> = {
    cr04: "/fleetlever/machines/cr04-crane.jpg",
    ex12: "/fleetlever/machines/ex12-excavator.jpg",
    tr08: "/fleetlever/machines/tr08-truck.jpg",
    ld03: "/fleetlever/machines/ld03-loader.jpg",
    gn02: "/fleetlever/machines/gn02-generator.jpg",
  };

  return photoMap[machine.id] ?? photoMap.ex12;
}

function MachinesView({ machinesList, onMachineOpen }: { machinesList: Machine[]; onMachineOpen: (machine: Machine, mode?: DrawerMode) => void }) {
  const [photoUploads, setPhotoUploads] = useState<Record<string, string>>({});
  const photoUploadUrls = useRef<string[]>([]);
  const grouped = {
    blocked: machinesList.filter((machine) => machine.state === "blocked"),
    at_risk: machinesList.filter((machine) => machine.state === "at_risk"),
    ready: machinesList.filter((machine) => machine.state === "ready"),
  };

  useEffect(() => {
    return () => {
      photoUploadUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  async function handlePhotoUpload(machine: Machine, file: File | undefined) {
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    setPhotoUploads((current) => {
      const previousUrl = current[machine.id];
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
        photoUploadUrls.current = photoUploadUrls.current.filter((url) => url !== previousUrl);
      }
      photoUploadUrls.current.push(nextUrl);
      return { ...current, [machine.id]: nextUrl };
    });
    try {
      await uploadConsoleFile(file, "machine-photo", machine);
      emitConsoleToast(`${machine.code} photo uploaded to storage.`);
    } catch (error) {
      emitConsoleToast(error instanceof Error ? error.message : `${machine.code} photo upload failed.`);
    }
  }

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Machines"
        description="One-click clarity for every machine: can it work, why not, who owns the fix, and what happens next."
        exportLabel="Export Machine List"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Blocked", grouped.blocked, "blocked"],
          ["Needs review", grouped.at_risk, "at_risk"],
          ["Ready", grouped.ready, "ready"],
        ].map(([label, list, state]) => (
          <Surface key={label as string} className={`overflow-hidden border-t-4 p-0 ${columnToneClasses(state as MachineState)}`}>
            <div className={`flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3 ${columnHeaderClasses(state as MachineState)}`}>
              <h2 className="text-sm font-bold text-[#0D2F2D]">{label as string}</h2>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(state as MachineState)}`}>
                {(list as Machine[]).length}
              </span>
            </div>
            <div className="space-y-3 p-3">
              {(list as Machine[]).map((machine) => (
                <MachineInventoryCard
                  key={machine.id}
                  machine={machine}
                  photoUrl={photoUploads[machine.id] ?? machinePhotoPlaceholder(machine)}
                  onOpen={() => onMachineOpen(machine, machine.state === "blocked" ? "why" : "passport")}
                  onPhotoUpload={(file) => handlePhotoUpload(machine, file)}
                />
              ))}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function MachineInventoryCard({
  machine,
  onOpen,
  onPhotoUpload,
  photoUrl,
}: {
  machine: Machine;
  onOpen: () => void;
  onPhotoUpload: (file: File | undefined) => void;
  photoUrl: string;
}) {
  const uploadId = `machine-photo-${machine.id}`;
  const action = machine.state === "blocked" ? "Open case" : machine.state === "at_risk" ? "Review case" : "Open passport";
  const tone = machineCardTone(machine.state);

  return (
    <article className={`overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md ${tone.border}`}>
      <div className="relative aspect-[16/9] overflow-hidden bg-[#E2E8F0]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={`${machine.code} ${machine.type}`}
          width={1200}
          height={675}
          decoding="async"
          loading="eager"
          className="h-full w-full object-cover saturate-[0.94] transition duration-300 hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/0 to-black/35" aria-hidden="true" />
        <div className={`absolute inset-x-0 top-0 h-1.5 ${tone.accent}`} aria-hidden="true" />
        <div className="absolute left-3 top-3">
          <MachineStatusBadge state={machine.state} />
        </div>
        <div className="absolute bottom-3 left-3 text-white drop-shadow">
          <p className="text-sm font-bold">{machine.code}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/80">{machine.type}</p>
        </div>
        <label
          htmlFor={uploadId}
          className="absolute bottom-3 right-3 inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-md border border-white/60 bg-white/90 px-3 text-xs font-bold text-[#0D2F2D] shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          Upload photo
        </label>
        <input
          id={uploadId}
          type="file"
          accept="image/*"
          aria-label={`Upload photo for ${machine.code}`}
          className="sr-only"
          onChange={(event) => onPhotoUpload(event.target.files?.[0])}
        />
      </div>
      <div className={`${tone.body} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold text-[#0D2F2D]">{machine.code}</p>
            <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">{machine.name}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#F1F5F9] px-2 py-1 text-[11px] font-bold uppercase text-[#64748B]">{machine.type}</span>
        </div>
        <p className="mt-3 text-sm font-bold text-[#1F2933]">{machine.reason}</p>
        <p className="mt-1 text-xs font-semibold text-[#64748B]">
          {machine.owner} · {machine.nextAction === "-" ? "No action" : machine.nextAction}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3">
          <p className="text-xs font-semibold text-[#64748B]">{machineWorksite(machine).name}</p>
          <button type="button" onClick={onOpen} className={`min-h-8 rounded-md px-3 text-xs font-bold ${tone.action}`}>
            {action}
          </button>
        </div>
      </div>
    </article>
  );
}

function columnToneClasses(state: MachineState) {
  if (state === "ready") return "border-t-[#15803D]";
  if (state === "at_risk") return "border-t-[#D97706]";
  return "border-t-[#DC2626]";
}

function columnHeaderClasses(state: MachineState) {
  if (state === "ready") return "bg-[#F0FDF4]";
  if (state === "at_risk") return "bg-[#FFFBEB]";
  return "bg-[#FEF2F2]";
}

function machineCardTone(state: MachineState) {
  if (state === "ready") {
    return {
      accent: "bg-[#15803D]",
      action: "bg-[#15803D] text-white hover:bg-[#166534]",
      body: "bg-[#F8FFFB]",
      border: "border-[#BBF7D0] hover:border-[#15803D]",
    };
  }
  if (state === "at_risk") {
    return {
      accent: "bg-[#D97706]",
      action: "bg-[#B45309] text-white hover:bg-[#92400E]",
      body: "bg-[#FFFCF2]",
      border: "border-[#FDE68A] hover:border-[#D97706]",
    };
  }
  return {
    accent: "bg-[#DC2626]",
    action: "bg-[#B91C1C] text-white hover:bg-[#991B1B]",
    body: "bg-[#FFF7F7]",
    border: "border-[#FECACA] hover:border-[#DC2626]",
  };
}

type ActionQueueRow = {
  action: Exclude<DrawerAction, null>;
  actionLabel: string;
  blocker: BlockerCard;
  due: string;
  impact: string;
  machine: Machine;
  nextStep: string;
  owner: string;
  priority: "blocking" | "review";
};

type QueueFilter = "all" | "blocking" | "review" | "documents" | "workshop";
type DocumentFilter = "needs-action" | "expired" | "missing" | "critical" | "valid";
type SearchResultTone = "ready" | "attention" | "blocked" | "neutral";
type GlobalSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  label: string;
  tone: SearchResultTone;
  imageUrl?: string;
  onSelect: () => void;
};
type GlobalSearchGroup = {
  title: string;
  results: GlobalSearchResult[];
};

function GlobalSearchViewer({
  groups,
  onClear,
  query,
  resultCount,
}: {
  groups: GlobalSearchGroup[];
  onClear: () => void;
  query: string;
  resultCount: number;
}) {
  return (
    <div data-global-search-panel className="absolute left-0 right-0 top-11 z-[80] max-h-[72vh] overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Search FleetLever</p>
          <p className="mt-1 truncate text-sm font-semibold text-[#64748B]">
            {resultCount ? `${resultCount} results for "${query}"` : `No results for "${query}"`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="min-h-8 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#1F2933] transition hover:border-[#0D2F2D] hover:text-[#0D2F2D]"
        >
          Clear
        </button>
      </div>
      {groups.length ? (
        <div className="grid gap-4 p-4 xl:grid-cols-2">
          {groups.map((group) => (
            <section key={group.title} className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="truncate text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{group.title}</h3>
                <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-bold text-[#64748B]">{group.results.length}</span>
              </div>
              <div className="space-y-2">
                {group.results.map((result) => (
                  <GlobalSearchResultCard key={result.id} result={result} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="p-5 text-sm font-semibold text-[#64748B]">
          No matching machines, worksites, evidence, stop-list actions, service jobs, or decisions.
        </div>
      )}
    </div>
  );
}

function GlobalSearchResultCard({ result }: { result: GlobalSearchResult }) {
  return (
    <button
      type="button"
      onClick={result.onSelect}
      className="flex min-h-[74px] w-full items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3 text-left transition hover:border-[#008C95] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0D2F2D]/15"
    >
      {result.imageUrl ? (
        <Image src={result.imageUrl} alt="" width={56} height={48} className="h-12 w-14 shrink-0 rounded-md object-cover" priority />
      ) : (
        <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-md bg-[#F1F5F9] text-xs font-bold text-[#64748B]">
          {result.title.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-[#0D2F2D]">{result.title}</p>
          <SearchResultBadge label={result.label} tone={result.tone} />
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-[#1F2933]">{result.subtitle}</p>
        <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">{result.meta}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden="true" />
    </button>
  );
}

function SearchResultBadge({ label, tone }: { label: string; tone: SearchResultTone }) {
  const toneClass =
    tone === "ready"
      ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
      : tone === "attention"
        ? "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
        : tone === "blocked"
          ? "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
          : "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]";

  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${toneClass}`}>{label}</span>;
}

function actionForQueueRow(machine: Machine, blocker: BlockerCard): Exclude<DrawerAction, null> {
  if (machine.state === "at_risk") return { type: "assign-owner", blockerId: blocker.id };
  if (blocker.kind === "service") return { type: "complete-action", blockerId: blocker.id };
  return { type: "upload-document", blockerId: blocker.id, source: "action-queue" };
}

function blockerIdForCertificate(certificate: Certificate) {
  return `certificate:${certificate.name}`;
}

function documentActionForCertificate(certificate: Certificate): Exclude<DrawerAction, null> {
  if (certificate.status === "Critical" || certificate.status === "Expiring soon") return { type: "assign-owner", blockerId: blockerIdForCertificate(certificate) };
  return { type: "upload-document", blockerId: blockerIdForCertificate(certificate), source: "documents" };
}

function documentCommandLabel(certificate: Certificate) {
  if (certificate.status === "Missing") return "Upload evidence";
  if (certificate.status === "Critical" || certificate.status === "Expiring soon") return "Assign renewal owner";
  if (certificate.status === "Valid") return "View file";
  return "Upload evidence";
}

function actionLabelForQueueRow(machine: Machine, blocker: BlockerCard) {
  if (machine.state === "at_risk") return "Assign owner";
  if (blocker.kind === "certificate") return "Resolve upload";
  return blocker.primaryAction;
}

function blockerLineValue(blocker: BlockerCard, label: string) {
  return blocker.lines.find(([lineLabel]) => lineLabel === label)?.[1];
}

function actionQueueRows(machinesList: Machine[]): ActionQueueRow[] {
  const stateWeight = { blocked: 0, at_risk: 1, ready: 2 } satisfies Record<MachineState, number>;
  return machinesList
    .filter((machine) => machine.state !== "ready")
    .flatMap((machine) => {
      const blockers = blockerCardsForMachine(machine);
      const fallbackRows: BlockerCard[] = [
        {
          id: `issue:${machine.reason}`,
          kind: "certificate",
          title: "Review Item",
          status: externalStatus(machine.state),
          summary: machine.reason,
          primaryAction: "Review",
          lines: [
            ["Owner", machine.owner],
            ["Due", machine.eta],
            ["Next step", machine.nextAction === "-" ? "Review machine state" : machine.nextAction],
          ],
        },
      ];
      const rows = blockers.length
        ? blockers
        : fallbackRows;

      return rows.map((blocker) => ({
        action: actionForQueueRow(machine, blocker),
        actionLabel: actionLabelForQueueRow(machine, blocker),
        blocker,
        due: blockerLineValue(blocker, "Due") ?? machine.eta,
        impact: machine.state === "blocked" ? `Stops ${machineWorksite(machine).name}` : `Review before ${machineWorksite(machine).name}`,
        machine,
        nextStep: blockerLineValue(blocker, "Next step") ?? machine.nextAction,
        owner: blockerLineValue(blocker, "Owner") ?? machine.owner,
        priority: machine.state === "blocked" ? "blocking" as const : "review" as const,
      }));
    })
    .sort((left, right) => stateWeight[left.machine.state] - stateWeight[right.machine.state] || left.machine.eta.localeCompare(right.machine.eta));
}

function actionQueueRowKey(row: ActionQueueRow) {
  return `${row.machine.id}:${row.blocker.id}`;
}

function ActionQueueView({
  machinesList,
  onActionStart,
  onMachineOpen,
}: {
  machinesList: Machine[];
  onActionStart: (machine: Machine, action: Exclude<DrawerAction, null>) => void;
  onMachineOpen: (machine: Machine, mode?: DrawerMode) => void;
}) {
  const [filter, setFilter] = useState<QueueFilter>("all");
  const rows = actionQueueRows(machinesList);
  const filteredRows = rows.filter((row) => {
    if (filter === "blocking") return row.priority === "blocking";
    if (filter === "review") return row.priority === "review";
    if (filter === "documents") return row.blocker.kind === "certificate";
    if (filter === "workshop") return row.blocker.kind === "service";
    return true;
  });
  const blockingActionCount = rows.filter((row) => row.priority === "blocking").length;
  const reviewActionCount = rows.filter((row) => row.priority === "review").length;
  const owners = new Set(rows.map((row) => row.owner)).size;
  const certificateActions = rows.filter((row) => row.blocker.kind === "certificate").length;
  const serviceActions = rows.filter((row) => row.blocker.kind === "service").length;
  const filterItems: Array<{ key: QueueFilter; label: string; tone: "blocked" | "attention" | "neutral"; value: number }> = [
    { key: "all", label: "All", tone: "neutral", value: rows.length },
    { key: "blocking", label: "Blocking", tone: "blocked", value: blockingActionCount },
    { key: "review", label: "Review", tone: "attention", value: reviewActionCount },
    { key: "documents", label: "Evidence", tone: "neutral", value: certificateActions },
    { key: "workshop", label: "Service", tone: "neutral", value: serviceActions },
  ];

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Stop List"
        description="The cross-worksite list of owner actions that could stop tomorrow's work."
        showActions={false}
      />
      <KpiStrip
        items={[
          ["Open Actions", rows.length, "neutral"],
          ["Blocking", blockingActionCount, "blocked"],
          ["Review", reviewActionCount, "attention"],
          ["Evidence", certificateActions, "blocked"],
          ["Service", serviceActions, "neutral"],
        ]}
      />
      <Surface className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Stop list</p>
            <h2 className="mt-2 text-xl font-bold text-[#0D2F2D]">Fix what could stop tomorrow&apos;s work</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">{rows.length} actions · {owners} owners · no guessing, no phone-chain chase.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterItems.map((item) => (
              <ActionQueueFilterChip
                key={item.key}
                active={filter === item.key}
                label={item.label}
                onClick={() => setFilter(item.key)}
                tone={item.tone}
                value={item.value}
              />
            ))}
          </div>
        </div>

        {rows.length ? (
          filteredRows.length ? (
            <div className="divide-y divide-[#E2E8F0]">
              {filteredRows.map((row, index) => (
                <ActionQueueRowItem
                  key={actionQueueRowKey(row)}
                  featured={index === 0 && filter === "all"}
                  onActionStart={onActionStart}
                  onMachineOpen={onMachineOpen}
                  row={row}
                />
              ))}
            </div>
          ) : (
            <div className="m-5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm font-bold text-[#64748B]">
              No actions match this filter.
            </div>
          )
        ) : (
          <div className="m-5 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-sm font-bold text-[#15803D]">
            No open blockers. Tomorrow&apos;s work can move to final review.
          </div>
        )}
      </Surface>
    </div>
  );
}

function ActionQueueFilterChip({
  active,
  label,
  onClick,
  tone,
  value,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone: "blocked" | "attention" | "neutral";
  value: number;
}) {
  const toneClass =
    tone === "blocked"
      ? "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
      : tone === "attention"
        ? "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
        : "border-[#E2E8F0] bg-[#F8FAFC] text-[#0D2F2D]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-bold transition hover:border-[#0D2F2D] ${
        active ? "ring-2 ring-[#0D2F2D]/15" : ""
      } ${toneClass}`}
    >
      <span className="text-lg leading-none">{value}</span>
      <span className="text-[11px] uppercase tracking-wide">{label}</span>
    </button>
  );
}

function ActionQueueRowItem({
  featured,
  onActionStart,
  onMachineOpen,
  row,
}: {
  featured: boolean;
  onActionStart: (machine: Machine, action: Exclude<DrawerAction, null>) => void;
  onMachineOpen: (machine: Machine, mode?: DrawerMode) => void;
  row: ActionQueueRow;
}) {
  const toneClass = row.priority === "blocking" ? "bg-[#FFF7F7]" : "bg-[#FFFCF0]";
  const actionTone = row.priority === "blocking" ? "bg-[#0D2F2D] text-white hover:bg-[#092321]" : "bg-[#B45309] text-white hover:bg-[#92400E]";

  return (
    <div className={`grid gap-4 px-5 py-4 lg:grid-cols-[220px_minmax(0,1.4fr)_minmax(0,1fr)_150px_130px_170px] lg:items-center ${toneClass}`}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-bold text-[#0D2F2D]">{row.machine.code}</p>
          {featured ? <span className="rounded-full border border-[#FECACA] bg-white px-2.5 py-1 text-[11px] font-bold uppercase text-[#B91C1C]">Next</span> : null}
        </div>
        <p className="mt-1 text-xs font-semibold text-[#64748B]">{machineWorksite(row.machine).name}</p>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${row.priority === "blocking" ? statusClasses("blocked") : statusClasses("at_risk")}`}>
            {row.blocker.kind === "certificate" ? "Evidence" : "Service"}
          </span>
          <span className="rounded-full border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold uppercase text-[#64748B]">{row.blocker.status}</span>
        </div>
        <p className="mt-2 text-sm font-bold leading-snug text-[#111827]">{row.nextStep}</p>
        <p className="mt-1 text-xs font-semibold leading-snug text-[#64748B]">{row.blocker.summary}</p>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase text-[#64748B]">Impact</p>
        <p className="mt-1 text-sm font-bold text-[#1F2933]">{row.impact}</p>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase text-[#64748B]">Owner</p>
        <p className="mt-1 font-bold text-[#0D2F2D]">{row.owner}</p>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase text-[#64748B]">Due</p>
        <p className="mt-1 font-semibold text-[#1F2933]">{row.due}</p>
      </div>
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => onActionStart(row.machine, row.action)}
          className={`min-h-10 rounded-md px-3 text-sm font-bold ${actionTone}`}
        >
          {row.actionLabel}
        </button>
        <button
          type="button"
          onClick={() => onMachineOpen(row.machine, "why")}
          className="min-h-10 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#475569] hover:border-[#008C95]"
        >
          Open case
        </button>
      </div>
    </div>
  );
}

function DocumentsView({
  machinesList,
  onActionStart,
  onMachineOpen,
}: {
  machinesList: Machine[];
  onActionStart: (machine: Machine, action: Exclude<DrawerAction, null>) => void;
  onMachineOpen: (machine: Machine) => void;
}) {
  const [filter, setFilter] = useState<DocumentFilter>("needs-action");
  const allCertificates = machinesList.flatMap((machine) => machine.certificates.map((certificate) => ({ certificate, machine })));
  const priorityCertificates = allCertificates.filter(({ certificate }) => certificate.status !== "Valid");
  const filterItems: Array<{ key: DocumentFilter; label: string; tone: "ready" | "attention" | "blocked" | "neutral"; value: number }> = [
    ["needs-action", "Needs Action", "neutral", priorityCertificates.length],
    ["expired", "Expired", "blocked", allCertificates.filter(({ certificate }) => certificate.status === "Expired").length],
    ["missing", "Missing", "blocked", allCertificates.filter(({ certificate }) => certificate.status === "Missing").length],
    ["critical", "Critical", "attention", allCertificates.filter(({ certificate }) => certificate.status === "Critical" || certificate.status === "Expiring soon").length],
    ["valid", "Valid", "ready", allCertificates.filter(({ certificate }) => certificate.status === "Valid").length],
  ].map(([key, label, tone, value]) => ({ key, label, tone, value })) as Array<{ key: DocumentFilter; label: string; tone: "ready" | "attention" | "blocked" | "neutral"; value: number }>;
  const visibleCertificates = allCertificates.filter(({ certificate }) => {
    const matchesFilter =
      filter === "needs-action"
        ? certificate.status !== "Valid"
        : filter === "critical"
          ? certificate.status === "Critical" || certificate.status === "Expiring soon"
          : filter === "expired"
            ? certificate.status === "Expired"
            : filter === "missing"
              ? certificate.status === "Missing"
              : certificate.status === "Valid";
    return matchesFilter;
  });

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Evidence"
        description="Documents, certificates, and inspections that could stop tomorrow's work."
        exportLabel="Export Evidence Report"
      />
      <KpiStrip
        items={[
          ["Expired", allCertificates.filter(({ certificate }) => certificate.status === "Expired").length, "blocked"],
          ["Missing", allCertificates.filter(({ certificate }) => certificate.status === "Missing").length, "blocked"],
          ["Critical Soon", allCertificates.filter(({ certificate }) => certificate.status === "Critical" || certificate.status === "Expiring soon").length, "attention"],
          ["Valid", allCertificates.filter(({ certificate }) => certificate.status === "Valid").length, "ready"],
          ["Could Stop Work", machinesList.filter((machine) => machine.state === "blocked" && machine.certificates.some((certificate) => certificate.status !== "Valid")).length, "blocked"],
        ]}
      />
      <Surface className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Evidence queue</p>
            <h2 className="mt-2 text-xl font-bold text-[#0D2F2D]">Proof that keeps machines available</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">Upload proof, assign renewal owners, or open the full machine file before documents stop work.</p>
          </div>
          <div className="flex flex-col gap-2 lg:max-w-[560px]">
            <div className="flex flex-wrap gap-2">
              {filterItems.map((item) => (
                <DocumentFilterChip
                  key={item.key}
                  active={filter === item.key}
                  label={item.label}
                  onClick={() => setFilter(item.key)}
                  tone={item.tone}
                  value={item.value}
                />
              ))}
            </div>
          </div>
        </div>

        {visibleCertificates.length ? (
          <div className="divide-y divide-[#E2E8F0]">
            {visibleCertificates.map(({ certificate, machine }) => {
            const blocksRelease = machine.state === "blocked" && ["Expired", "Missing"].includes(certificate.status);
            const primaryLabel = documentCommandLabel(certificate);
            const primaryAction = documentActionForCertificate(certificate);
            return (
              <div key={`${machine.id}-${certificate.name}`} className={`grid gap-4 px-5 py-4 lg:grid-cols-[220px_minmax(0,1.1fr)_minmax(0,0.9fr)_140px_170px] lg:items-center ${blocksRelease ? "bg-[#FEF2F2]/45" : "bg-white"}`}>
                <div>
                  <p className="text-base font-bold text-[#0D2F2D]">{machine.code}</p>
                  <p className="mt-1 text-xs font-semibold text-[#64748B]">{machineWorksite(machine).name}</p>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#111827]">{certificate.name}</h3>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${certificateClasses(certificate.status)}`}>{certificate.status}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#64748B]">{certificate.action}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase text-[#64748B]">Impact</p>
                  <p className={`mt-1 text-sm font-bold ${blocksRelease ? "text-[#B91C1C]" : certificate.status === "Valid" ? "text-[#15803D]" : "text-[#B45309]"}`}>
                    {blocksRelease ? `Stops ${machineWorksite(machine).name}` : certificate.status === "Valid" ? "Evidence accepted" : `Review before ${machineWorksite(machine).name}`}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase text-[#64748B]">Owner</p>
                  <p className="mt-1 font-bold text-[#0D2F2D]">{certificate.owner}</p>
                  <p className="text-[11px] font-bold uppercase text-[#64748B]">Expiry</p>
                  <p className="mt-1 font-semibold text-[#1F2933]">{certificate.expiry}</p>
                </div>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (certificate.status === "Valid") {
                        emitConsoleToast(`${machine.code}: ${certificate.name} file preview opened.`);
                        return;
                      }
                      onActionStart(machine, primaryAction);
                    }}
                    className={`min-h-10 rounded-md px-3 text-sm font-bold ${
                      certificate.status === "Critical" || certificate.status === "Expiring soon"
                        ? "bg-[#B45309] text-white hover:bg-[#92400E]"
                        : certificate.status === "Valid"
                          ? "border border-[#BBF7D0] bg-white text-[#15803D] hover:border-[#15803D]"
                          : "bg-[#0D2F2D] text-white hover:bg-[#092321]"
                    }`}
                  >
                    {primaryLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => onMachineOpen(machine)}
                    className="min-h-10 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#475569] hover:border-[#008C95]"
                  >
                    Open passport
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="m-5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm font-bold text-[#64748B]">
            No documents match this filter.
          </div>
        )}
      </Surface>
    </div>
  );
}

function DocumentFilterChip({
  active,
  label,
  onClick,
  tone,
  value,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone: "ready" | "attention" | "blocked" | "neutral";
  value: number;
}) {
  const toneClass =
    tone === "ready"
      ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
      : tone === "attention"
        ? "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
        : tone === "blocked"
          ? "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
          : "border-[#E2E8F0] bg-[#F8FAFC] text-[#0D2F2D]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold transition hover:border-[#0D2F2D] ${active ? "ring-2 ring-[#0D2F2D]/15" : ""} ${toneClass}`}
    >
      <span className="text-sm leading-none">{value}</span>
      <span className="uppercase tracking-wide">{label}</span>
    </button>
  );
}

function workshopStatusClasses(status: ServiceBlocker["status"]) {
  if (status === "Resolved") return "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]";
  if (status === "In Progress") return "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]";
  if (status === "Waiting") return "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]";
  return "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]";
}

function workshopPartsLabel(service: ServiceBlocker) {
  if (service.status === "Resolved") return "No parts needed";
  if (service.status === "Waiting") return "Parts pending";
  if (service.issue.toLowerCase().includes("leak")) return "Seal kit check";
  return "No parts logged";
}

function workshopSortScore(service: ServiceBlocker) {
  const statusScore = service.status === "Open" ? 0 : service.status === "In Progress" ? 1 : service.status === "Waiting" ? 2 : 4;
  const releaseScore = service.blocksRelease ? -10 : 0;
  const dueScore = service.due === "Today" ? -3 : service.due.includes("Tomorrow") ? -1 : 0;
  return releaseScore + statusScore + dueScore;
}

function workshopJobId(machine: Machine, service: ServiceBlocker) {
  return `${machine.id}::${service.issue}`;
}

function WorkshopJobCardContent({ machine, service }: { machine: Machine; service: ServiceBlocker }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3">
      <div className="relative h-full min-h-[122px] overflow-hidden rounded-md border border-[#E2E8F0] bg-[#F1F5F9]">
        <Image
          src={machinePhotoPlaceholder(machine)}
          alt={`${machine.code} ${machine.type}`}
          fill
          sizes="112px"
          className="object-cover"
          draggable={false}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-2 pb-2 pt-7">
          <p className="text-sm font-bold text-white">{machine.code}</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-white/85">{machine.type}</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <GripVertical className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8]" />
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-[#111827]">{machine.name}</p>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-[#64748B]">
                {machine.code} · {machine.type}
              </p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${workshopStatusClasses(service.status)}`}>
            {service.status}
          </span>
        </div>
        <p className="mt-2 text-sm font-bold leading-snug text-[#111827]">{service.issue}</p>
        <p className="mt-1 text-xs font-semibold leading-snug text-[#64748B]">
          {machineWorksite(machine).name} · {service.owner} · {service.due}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3 text-xs font-bold">
          {service.blocksRelease && service.status !== "Resolved" ? (
            <span className="rounded-full border border-[#FECACA] bg-white px-2.5 py-1 uppercase text-[#B91C1C]">Blocks release</span>
          ) : null}
          <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[#475569]">{workshopPartsLabel(service)}</span>
        </div>
      </div>
    </div>
  );
}

function WorkshopView({
  machinesList,
  onJobCreate,
  onMachineOpen,
  onServiceStatusChange,
}: {
  machinesList: Machine[];
  onJobCreate: (draft: WorkshopJobDraft) => void;
  onMachineOpen: (machine: Machine) => void;
  onServiceStatusChange: (machineId: string, issue: string, status: ServiceBlocker["status"]) => void;
}) {
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<ServiceBlocker["status"] | null>(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [pointerDrag, setPointerDrag] = useState<WorkshopDragState | null>(null);
  const suppressNextCardClickRef = useRef(false);

  const serviceJobs = machinesList
    .flatMap((machine) => machine.service.map((service) => ({ machine, service })))
    .sort((left, right) => workshopSortScore(left.service) - workshopSortScore(right.service));
  const laneItems: Array<{
    statuses: ServiceBlocker["status"][];
    dropStatus: ServiceBlocker["status"];
    title: string;
    subtitle: string;
    headerClass: string;
    dotClass: string;
    countClass: string;
    accentClass: string;
  }> = [
    {
      statuses: ["Open"],
      dropStatus: "Open",
      title: "To do",
      subtitle: "Not started",
      headerClass: "bg-[#FFF7F7]",
      dotClass: "bg-[#EF4444]",
      countClass: "bg-[#FEF2F2] text-[#B91C1C]",
      accentClass: "bg-[#EF4444]",
    },
    {
      statuses: ["In Progress", "Waiting"],
      dropStatus: "In Progress",
      title: "Doing",
      subtitle: "In the workshop",
      headerClass: "bg-[#FFFBEB]",
      dotClass: "bg-[#D97706]",
      countClass: "bg-[#FFFBEB] text-[#B45309]",
      accentClass: "bg-[#D97706]",
    },
    {
      statuses: ["Resolved"],
      dropStatus: "Resolved",
      title: "Done",
      subtitle: "Cleared for release",
      headerClass: "bg-[#F0FDF4]",
      dotClass: "bg-[#16A34A]",
      countClass: "bg-[#F0FDF4] text-[#15803D]",
      accentClass: "bg-[#16A34A]",
    },
  ];
  const releaseBlockers = serviceJobs.filter(({ service }) => service.blocksRelease && service.status !== "Resolved").length;
  const workingNow = serviceJobs.filter(({ service }) => service.status === "In Progress").length;
  const cleared = serviceJobs.filter(({ service }) => service.status === "Resolved").length;

  useEffect(() => {
    if (!pointerDrag) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousWebkitUserSelect = document.body.style.getPropertyValue("-webkit-user-select");
    const previousCursor = document.body.style.cursor;

    document.body.style.userSelect = "none";
    document.body.style.setProperty("-webkit-user-select", "none");
    document.body.style.cursor = "grabbing";
    document.getSelection()?.removeAllRanges();

    return () => {
      document.body.style.userSelect = previousUserSelect;
      if (previousWebkitUserSelect) {
        document.body.style.setProperty("-webkit-user-select", previousWebkitUserSelect);
      } else {
        document.body.style.removeProperty("-webkit-user-select");
      }
      document.body.style.cursor = previousCursor;
      document.getSelection()?.removeAllRanges();
    };
  }, [pointerDrag]);

  function moveDraggedJob(jobId: string, status: ServiceBlocker["status"]) {
    const job = serviceJobs.find(({ machine, service }) => workshopJobId(machine, service) === jobId);
    if (!job || job.service.status === status) return;
    onServiceStatusChange(job.machine.id, job.service.issue, status);
  }

  function laneStatusFromPoint(x: number, y: number) {
    const target = document.elementFromPoint(x, y)?.closest("[data-workshop-drop-status]");
    const status = target?.getAttribute("data-workshop-drop-status");
    if (status === "Open" || status === "In Progress" || status === "Waiting" || status === "Resolved") return status;

    const lanes = Array.from(document.querySelectorAll<HTMLElement>("[data-workshop-drop-status]"));
    const boundedLane = lanes.find((lane) => {
      const rect = lane.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
    const boundedStatus = boundedLane?.getAttribute("data-workshop-drop-status");
    return boundedStatus === "Open" || boundedStatus === "In Progress" || boundedStatus === "Waiting" || boundedStatus === "Resolved" ? boundedStatus : null;
  }

  function clearPointerDrag() {
    setPointerDrag(null);
    setDraggedJobId(null);
    setDropStatus(null);
  }

  function beginPointerDrag(event: React.PointerEvent<HTMLDivElement>, machine: Machine, service: ServiceBlocker) {
    if (event.button !== 0) return;
    event.preventDefault();
    const jobId = workshopJobId(machine, service);
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    document.getSelection()?.removeAllRanges();
    suppressNextCardClickRef.current = false;
    setDraggedJobId(jobId);
    setPointerDrag({
      jobId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      width: bounds.width,
      height: bounds.height,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    });
    setDropStatus(laneStatusFromPoint(event.clientX, event.clientY));
  }

  function movePointerDrag(event: React.PointerEvent<HTMLDivElement>, jobId: string) {
    if (!pointerDrag || pointerDrag.jobId !== jobId) return;
    event.preventDefault();
    document.getSelection()?.removeAllRanges();
    const moved = Math.abs(event.clientX - pointerDrag.startX) > 6 || Math.abs(event.clientY - pointerDrag.startY) > 6;
    if (moved) suppressNextCardClickRef.current = true;
    setPointerDrag((current) => (current && current.jobId === jobId ? { ...current, x: event.clientX, y: event.clientY } : current));
    setDropStatus(laneStatusFromPoint(event.clientX, event.clientY));
  }

  function endPointerDrag(event: React.PointerEvent<HTMLDivElement>, jobId: string) {
    if (!pointerDrag || pointerDrag.jobId !== jobId) return;
    event.preventDefault();
    document.getSelection()?.removeAllRanges();
    const targetStatus = laneStatusFromPoint(event.clientX, event.clientY);
    const moved = Math.abs(event.clientX - pointerDrag.startX) > 6 || Math.abs(event.clientY - pointerDrag.startY) > 6;
    if (targetStatus && moved) moveDraggedJob(jobId, targetStatus);
    suppressNextCardClickRef.current = moved;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    clearPointerDrag();
  }

  const liftedJob = pointerDrag ? serviceJobs.find(({ machine, service }) => workshopJobId(machine, service) === pointerDrag.jobId) : undefined;

  return (
    <div className={`space-y-5 select-none ${pointerDrag ? "cursor-grabbing" : ""}`}>
      <ViewHeader title="Service Jobs" description="Mechanical jobs that could stop tomorrow's work. Add a job, drag it across the board, and clear it before release." showActions={false} />
      <Surface className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E8F0] px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Service board</p>
            <h2 className="mt-2 text-xl font-bold text-[#0D2F2D]">Clear service jobs before they stop the site</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">Move each vehicle from To do to Doing to Done. Done means it no longer blocks tomorrow&apos;s work.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setJobModalOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#092321]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New service job
            </button>
            <span className="rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 text-xs font-bold uppercase text-[#B91C1C]">{releaseBlockers} blocking</span>
            <span className="rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1.5 text-xs font-bold uppercase text-[#B45309]">{workingNow} doing</span>
            <span className="rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-1.5 text-xs font-bold uppercase text-[#15803D]">{cleared} done</span>
          </div>
        </div>

        <div className={`grid select-none gap-4 bg-[#F8FAFC] p-4 xl:grid-cols-3 ${pointerDrag ? "cursor-grabbing" : ""}`}>
          {laneItems.map((lane) => {
            const laneJobs = serviceJobs.filter(({ service }) => lane.statuses.includes(service.status));
            const isDropTarget = dropStatus === lane.dropStatus;
            return (
              <div
                key={lane.title}
                data-workshop-drop-status={lane.dropStatus}
                className={`relative flex min-h-[520px] flex-col overflow-hidden rounded-lg border bg-white transition ${
                  isDropTarget ? "border-[#008C95] bg-[#E6FAFA] shadow-md ring-2 ring-[#008C95]/20" : "border-[#E2E8F0]"
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${lane.accentClass}`} aria-hidden="true" />
                <div className={`border-b border-[#E2E8F0] px-4 py-3 pt-4 ${lane.headerClass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="inline-flex items-center gap-2 text-lg font-bold text-[#0D2F2D]">
                      <span className={`h-2.5 w-2.5 rounded-full ${lane.dotClass}`} aria-hidden="true" />
                      {lane.title}
                    </h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${lane.countClass}`}>{laneJobs.length}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#64748B]">{lane.subtitle}</p>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3">
                  {laneJobs.length ? (
                    laneJobs.map(({ machine, service }) => (
                      <div
                        key={`${machine.id}-${service.issue}`}
                        role="button"
                        tabIndex={0}
                        onPointerDown={(event) => beginPointerDrag(event, machine, service)}
                        onPointerMove={(event) => movePointerDrag(event, workshopJobId(machine, service))}
                        onPointerUp={(event) => endPointerDrag(event, workshopJobId(machine, service))}
                        onPointerCancel={(event) => {
                          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                            event.currentTarget.releasePointerCapture(event.pointerId);
                          }
                          clearPointerDrag();
                        }}
                        onClick={() => {
                          if (suppressNextCardClickRef.current) {
                            suppressNextCardClickRef.current = false;
                            return;
                          }
                          onMachineOpen(machine);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onMachineOpen(machine);
                          }
                        }}
                        className={`touch-none select-none cursor-grab rounded-md border p-2.5 transition hover:shadow-md active:cursor-grabbing ${
                          draggedJobId === workshopJobId(machine, service) ? "invisible shadow-none" : "shadow-sm"
                        } ${
                          service.blocksRelease && service.status !== "Resolved" ? "border-[#FECACA] bg-[#FEF2F2]/45" : "border-[#E2E8F0] bg-white"
                        }`}
                      >
                        <WorkshopJobCardContent machine={machine} service={service} />
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm font-bold text-[#64748B]">No jobs here.</div>
                  )}
                  {pointerDrag ? (
                    <div
                      className={`mt-auto rounded-md border border-dashed p-4 text-center text-xs font-bold uppercase tracking-wide transition ${
                        isDropTarget ? "border-[#008C95] bg-white text-[#008C95]" : "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]"
                      }`}
                    >
                      Drop service job here
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Surface>
      {pointerDrag && liftedJob ? (
        <div
          data-workshop-lifted-card="true"
          className={`pointer-events-none fixed z-[70] rotate-[-2deg] rounded-md border p-2.5 shadow-[0_28px_70px_rgba(15,23,42,0.32)] ${
            liftedJob.service.blocksRelease && liftedJob.service.status !== "Resolved" ? "border-[#FCA5A5] bg-[#FEF2F2]" : "border-[#008C95] bg-white"
          }`}
          style={{
            left: pointerDrag.x - pointerDrag.offsetX,
            top: pointerDrag.y - pointerDrag.offsetY,
            width: pointerDrag.width,
            minHeight: pointerDrag.height,
          }}
          aria-hidden="true"
        >
          <WorkshopJobCardContent machine={liftedJob.machine} service={liftedJob.service} />
        </div>
      ) : null}
      {jobModalOpen ? <WorkshopJobModal machinesList={machinesList} onClose={() => setJobModalOpen(false)} onCreate={onJobCreate} /> : null}
    </div>
  );
}

function WorkshopJobModal({
  machinesList,
  onClose,
  onCreate,
}: {
  machinesList: Machine[];
  onClose: () => void;
  onCreate: (draft: WorkshopJobDraft) => void;
}) {
  const [machineId, setMachineId] = useState(machinesList[0]?.id ?? "");
  const [issue, setIssue] = useState("");
  const [owner, setOwner] = useState("Workshop");
  const [due, setDue] = useState("Today");
  const [blocksRelease, setBlocksRelease] = useState(true);
  const selectedMachine = machinesList.find((machine) => machine.id === machineId) ?? machinesList[0];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function submitJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMachine || !issue.trim()) return;
    onCreate({ machineId: selectedMachine.id, issue, owner, due, blocksRelease });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D2F2D]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#008C95]">Service job</p>
            <h2 className="mt-1 text-2xl font-bold text-[#0D2F2D]">New service job</h2>
            <p className="mt-2 text-sm font-semibold text-[#64748B]">Pick the vehicle, name the work, then it appears in To do.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E2E8F0] text-[#475569]">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <form className="grid gap-5 p-5 lg:grid-cols-[260px_minmax(0,1fr)]" onSubmit={submitJob}>
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            {selectedMachine ? (
              <>
                <div className="relative h-40 overflow-hidden rounded-md bg-[#E2E8F0]">
                  <Image
                    src={machinePhotoPlaceholder(selectedMachine)}
                    alt={`${selectedMachine.code} ${selectedMachine.type}`}
                    fill
                    sizes="260px"
                    className="object-cover"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xl font-bold text-[#111827]">{selectedMachine.code}</p>
                  <p className="mt-1 text-sm font-bold text-[#475569]">{selectedMachine.name}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#64748B]">
                    {selectedMachine.type} · {machineWorksite(selectedMachine).name}
                  </p>
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#64748B]" htmlFor="workshop-machine">
                Vehicle
              </label>
              <select
                id="workshop-machine"
                value={machineId}
                onChange={(event) => setMachineId(event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] bg-white px-3 text-sm font-bold text-[#111827] outline-none focus:border-[#0D2F2D]"
              >
                {machinesList.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.code} · {machine.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#64748B]" htmlFor="workshop-issue">
                Job
              </label>
              <input
                id="workshop-issue"
                value={issue}
                onChange={(event) => setIssue(event.target.value)}
                placeholder="e.g. Brake inspection, oil leak repair, tyre replacement"
                className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#0D2F2D]"
                autoFocus
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#64748B]" htmlFor="workshop-owner">
                  Owner
                </label>
                <select
                  id="workshop-owner"
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] bg-white px-3 text-sm font-bold text-[#111827] outline-none focus:border-[#0D2F2D]"
                >
                  {teamMembers.map((person) => (
                    <option key={person.name} value={person.name}>
                      {person.name} · {person.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#64748B]" htmlFor="workshop-due">
                  Due
                </label>
                <select
                  id="workshop-due"
                  value={due}
                  onChange={(event) => setDue(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] bg-white px-3 text-sm font-bold text-[#111827] outline-none focus:border-[#0D2F2D]"
                >
                  <option value="Today">Today</option>
                  <option value="Tomorrow morning">Tomorrow morning</option>
                  <option value="Tomorrow noon">Tomorrow noon</option>
                  <option value="Waiting parts">Waiting parts</option>
                </select>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <input
                type="checkbox"
                checked={blocksRelease}
                onChange={(event) => setBlocksRelease(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#0D2F2D]"
              />
              <span>
                <span className="block text-sm font-bold text-[#0D2F2D]">Blocks tomorrow&apos;s release</span>
                <span className="mt-1 block text-xs font-semibold text-[#64748B]">Turn this off for routine workshop work that should not stop tomorrow&apos;s release.</span>
              </span>
            </label>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="min-h-11 rounded-md border border-[#E2E8F0] px-4 text-sm font-bold text-[#1F2933]">
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!issue.trim() || !selectedMachine}
              >
                <Wrench className="h-4 w-4" aria-hidden="true" />
                Add to board
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function isReleaseDecisionRecord(record: ReleaseRecord) {
  return Boolean(record.machine && record.result);
}

function releaseDecisionState(record: ReleaseRecord): MachineState {
  if (["Ready For Work", "Service Cleared"].includes(record.result)) return "ready";
  if (["Cannot Be Released"].includes(record.result)) return "blocked";
  return "at_risk";
}

function releaseAuditId(record: ReleaseRecord) {
  return `FL-${record.date}-${record.worksite}-${record.machine}-${record.result}-${record.reason}-${record.action}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase();
}

function releaseEvidencePacketText(record: ReleaseRecord) {
  const machine = machines.find((item) => item.code === record.machine);
  const worksite = worksites.find((item) => item.name === record.worksite) ?? (machine ? machineWorksite(machine) : undefined);
  const requiredMachines = worksite ? machinesForWorksite(worksite) : machine ? [machine] : [];
  const counts = countsForMachines(requiredMachines);
  const blockerLines = machine && blockerCardsForMachine(machine).length
    ? blockerCardsForMachine(machine).map((blocker) => `- ${blocker.title}: ${blocker.summary}`).join("\n")
    : "- No active blocker snapshot for this decision.";
  const documentLines = machine
    ? machine.certificates.map((certificate) => `- ${certificate.name}: ${certificate.status} · ${certificate.expiry} · owner ${certificate.owner}`).join("\n")
    : "- No machine document snapshot available.";
  const serviceLines = machine
    ? machine.service.map((service) => `- ${service.issue}: ${service.status} · ${service.due} · owner ${service.owner}`).join("\n")
    : "- No machine service snapshot available.";

  return [
    `Evidence packet ${releaseAuditId(record)}`,
    "",
    "Decision event",
    `Date: ${record.date}`,
    `Worksite: ${record.worksite}`,
    `Machine: ${record.machine}`,
    `Decision: ${record.result}`,
    `Reason: ${record.reason}`,
    `Action: ${record.action}`,
    `User: ${record.user}`,
    `Override: ${record.override}`,
    "",
    "Work package snapshot",
    `Required machines: ${counts.total}`,
    `Ready: ${counts.ready}`,
    `Needs review: ${counts.attention}`,
    `Blocked: ${counts.blocked}`,
    "",
    "Machine blocker snapshot",
    blockerLines,
    "",
    "Document snapshot",
    documentLines,
    "",
    "Service snapshot",
    serviceLines,
  ].join("\n");
}

function EvidencePacketDrawer({ record, onClose }: { record: ReleaseRecord; onClose: () => void }) {
  const machine = machines.find((item) => item.code === record.machine);
  const worksite = worksites.find((item) => item.name === record.worksite) ?? (machine ? machineWorksite(machine) : undefined);
  const requiredMachines = worksite ? machinesForWorksite(worksite) : machine ? [machine] : [];
  const counts = countsForMachines(requiredMachines);
  const blockers = machine ? blockerCardsForMachine(machine) : [];
  const auditId = releaseAuditId(record);
  const state = releaseDecisionState(record);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0D2F2D]/35"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#008C95]">Evidence packet</p>
            <h2 className="mt-1 text-2xl font-bold text-[#0D2F2D]">{record.machine} decision event</h2>
            <p className="mt-2 text-sm font-semibold text-[#64748B]">{auditId}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E2E8F0] text-[#475569]">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className={`rounded-lg border p-4 ${statusClasses(state)}`}>
            <p className="text-xs font-bold uppercase tracking-wide">Decision event</p>
            <p className="mt-2 text-2xl font-bold">{record.result}</p>
            <p className="mt-2 text-sm font-bold">{record.reason}</p>
            <p className="mt-1 text-sm font-semibold opacity-85">{record.action} · {record.user} · Override: {record.override}</p>
          </div>

          <Surface className="p-4">
            <h3 className="text-lg font-bold text-[#0D2F2D]">Work package snapshot</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Worksite", record.worksite],
                ["Decision date", record.date],
                ["Required machines", String(counts.total)],
                ["Ready / Review / Blocked", `${counts.ready} / ${counts.attention} / ${counts.blocked}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{label}</p>
                  <p className="mt-1 text-sm font-bold text-[#111827]">{value}</p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-4">
            <h3 className="text-lg font-bold text-[#0D2F2D]">Evidence included</h3>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-[#1F2933]">
              {["Decision log", "Work package machine checklist", "Blocker snapshot", "Evidence snapshot", "Service snapshot", "Override declaration when used"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-md bg-[#F8FAFC] px-3 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-[#008C95]" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-4">
            <h3 className="text-lg font-bold text-[#0D2F2D]">Current blocker snapshot</h3>
            {blockers.length ? (
              <div className="mt-3 space-y-2">
                {blockers.map((blocker) => (
                  <div key={blocker.id} className="rounded-md border border-[#FECACA] bg-[#FEF2F2] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-[#111827]">{blocker.title}</p>
                      <span className="rounded-full border border-[#FECACA] bg-white px-2.5 py-1 text-[11px] font-bold uppercase text-[#B91C1C]">{blocker.status}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#B91C1C]">{blocker.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm font-bold text-[#15803D]">No active blocker snapshot for this decision.</p>
            )}
          </Surface>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[#E2E8F0] p-4">
          <button type="button" onClick={onClose} className="min-h-11 rounded-md border border-[#E2E8F0] px-4 text-sm font-bold text-[#1F2933]">
            Close
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile(`${auditId}-evidence-packet.txt`, releaseEvidencePacketText(record))}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download packet
          </button>
        </div>
      </aside>
    </div>
  );
}

function ReleaseHistoryView({ searchTerm }: { searchTerm: string }) {
  const [selectedRecord, setSelectedRecord] = useState<ReleaseRecord | null>(null);
  const normalized = normalizeSearch(searchTerm);
  const decisionHistory = releaseHistory.filter(isReleaseDecisionRecord);
  const visibleHistory = decisionHistory.filter((item) =>
    !normalized || [item.date, item.worksite, item.machine, item.result, item.reason, item.action, item.user].some((value) => value.toLowerCase().includes(normalized)),
  );

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Decision History"
        description="The evidence trail for Know Before Tomorrow: who decided, why, when, and with what proof."
        showActions={false}
      />
      <KpiStrip
        items={[
          ["Events", visibleHistory.length, "neutral"],
          ["Released", visibleHistory.filter((item) => item.result === "Ready For Work" || item.result === "Released With Override").length, "ready"],
          ["Blocked", visibleHistory.filter((item) => item.result === "Cannot Be Released").length, "blocked"],
          ["Overrides", visibleHistory.filter((item) => item.override === "Yes").length, "neutral"],
        ]}
      />
      <Surface className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E8F0] px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Decision proof packets</p>
            <h2 className="mt-2 text-xl font-bold text-[#0D2F2D]">What changed, who did it, and why it mattered</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">Open a packet to review the decision event, machine checklist, blocker snapshot, and exportable evidence.</p>
          </div>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {visibleHistory.length ? (
            visibleHistory.map((item) => {
              const state = releaseDecisionState(item);
              return (
                <div key={releaseAuditId(item)} className="grid gap-4 p-4 lg:grid-cols-[130px_190px_minmax(0,1fr)_190px] lg:items-center">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Decision date</p>
                    <p className="mt-1 font-bold text-[#0D2F2D]">{item.date}</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#0D2F2D]">{item.machine}</p>
                    <p className="mt-1 text-xs font-semibold text-[#64748B]">{item.worksite}</p>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(state)}`}>{item.result}</span>
                    <p className="mt-2 text-sm font-bold text-[#1F2933]">{item.reason}</p>
                    <p className="mt-1 text-xs font-semibold text-[#64748B]">
                      {item.action} · {item.user} · {releaseAuditId(item)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(item)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0D2F2D] hover:border-[#0D2F2D]"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    View packet
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-sm font-bold text-[#64748B]">No release decisions match this search.</div>
          )}
        </div>
      </Surface>
      {selectedRecord ? <EvidencePacketDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} /> : null}
    </div>
  );
}

function ViewHeader({
  description,
  exportLabel = "Export Report",
  showActions = true,
  title,
}: {
  description: string;
  exportLabel?: string;
  showActions?: boolean;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[#0D2F2D]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">{description}</p>
      </div>
      {showActions ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => downloadTextFile(`${title.toLowerCase().replaceAll(" ", "-")}.txt`, `${title}\n${description}`)}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#1F2933]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {exportLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
