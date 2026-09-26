"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Archive,
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  GripVertical,
  History,
  LogOut,
  Menu,
  Plus,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Smartphone,
  Truck,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import { SettingsView } from "@/components/fleetlever/settings-view";
import {
  currentDemoSessionStorageKey,
  demoSessionStateEndpoint,
  publicDemoSessionIdFromLocation,
} from "@/lib/commercial/demo-session-client";
import {
  customFieldDisplayValue,
  defaultAssetColumnLayout,
  defaultBrandingSettings,
  normalizedCustomFieldValue,
  type AssetColumnLayout,
  type BrandingSettings,
  type CustomFieldDefinition,
  type CustomFieldValue,
} from "@/lib/fleetlever/customization";

type MachineState = "ready" | "at_risk" | "blocked";
type ViewKey =
  | "tomorrow"
  | "worksites"
  | "machines"
  | "blockers"
  | "certificates"
  | "service"
  | "staff"
  | "history"
  | "settings";
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
  customFields?: Record<string, CustomFieldValue>;
};

type ServiceBlocker = {
  issue: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  blocksRelease: boolean;
  owner: string;
  due: string;
  status: "Open" | "In progress" | "On hold" | "Resolved";
  parts?: string;
  partsStatus?: "Not needed" | "Needed" | "Ordered" | "On hold" | "Received";
  assignmentStatus?: "Unassigned" | "Assigned" | "Accepted" | "Overdue";
  assignedAt?: string;
  customFields?: Record<string, CustomFieldValue>;
};

type Machine = {
  id: string;
  code: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serial: string;
  ownership: "Owned" | "Rented";
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
  customFields?: Record<string, CustomFieldValue>;
};

type Worksite = {
  id: string;
  name: string;
  location: string;
  date: string;
  requiredMachineIds: string[];
  customFields?: Record<string, CustomFieldValue>;
};

type ReleaseRecord = {
  id?: string;
  date: string;
  worksite: string;
  machine: string;
  result: string;
  reason: string;
  action: string;
  user: string;
  override: "Yes" | "No";
};

type AddItemType = "Vehicle" | "City service" | "Work package" | "Check / document" | "Workshop issue" | "File";

type Toast = {
  id: number;
  message: string;
};

type TeamMember = {
  name: string;
  role: string;
};
type StaffStatus = "available" | "assigned" | "missing" | "leave" | "sick";
type StaffMember = {
  id: string;
  name: string;
  role: string;
  team: string;
  status: StaffStatus;
  photo: string;
  shift: string;
  assignedTo: string;
  phone: string;
  note: string;
  replacement?: string;
  customFields?: Record<string, CustomFieldValue>;
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
  schemaVersion: 5;
  branding: BrandingSettings;
  customFieldDefinitions: CustomFieldDefinition[];
  assetColumnLayout: AssetColumnLayout[];
  machines: Machine[];
  notifications: OperationalNotification[];
  releaseHistory: ReleaseRecord[];
  staff: StaffMember[];
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
  parts: string;
  partsStatus: NonNullable<ServiceBlocker["partsStatus"]>;
};
type LisaMessage = {
  id: number;
  role: "lisa" | "user";
  action?: {
    label: string;
    machineId?: string;
    tone?: "danger" | "neutral";
    view?: ViewKey;
  };
  text: string;
  bullets?: string[];
};
type LisaConnectionStatus = "checking" | "connected" | "unavailable" | "busy" | "misconfigured" | "disabled";
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

const defaultClientName = "FleetLever Demo";
const allowDemoConsoleData = process.env.NEXT_PUBLIC_FLEETLEVER_ALLOW_DEMO_CONSOLE !== "false";
const lisaCodexUiEnabled = process.env.NEXT_PUBLIC_FLEETLEVER_LISA_CODEX_ENABLED === "true";

const standaloneTeamMembers: TeamMember[] = [
  { name: "David", role: "Fleet manager" },
  { name: "Maria", role: "Compliance & documents" },
  { name: "Chris", role: "Workshop manager" },
  { name: "External workshop", role: "Technical support" },
  { name: "George", role: "Operations director" },
];

const teamMembers = standaloneTeamMembers;

const baseStaffMembers: StaffMember[] = [
  {
    id: "staff-dimitris",
    name: "David",
    role: "Traffic office",
    team: "Shift coordination",
    status: "assigned",
    photo: "/fleetlever/staff/dimitris.jpg",
    shift: "Tomorrow 06:30-14:30",
    assignedTo: "Morning waste collection",
    phone: "ext. 204",
    note: "Books drivers and crew for the refuse trucks.",
  },
  {
    id: "staff-kostas",
    name: "Chris",
    role: "Council workshop",
    team: "Workshop",
    status: "assigned",
    photo: "/fleetlever/staff/kostas.jpg",
    shift: "Today until 18:00",
    assignedTo: "EL-02 · charger check",
    phone: "ext. 218",
    note: "Must report back before tomorrow's shift locks.",
  },
  {
    id: "staff-maria",
    name: "Maria",
    role: "Documents and checks",
    team: "Administrative control",
    status: "available",
    photo: "/fleetlever/staff/maria.jpg",
    shift: "Tomorrow 07:00-15:00",
    assignedTo: "Documents & checks",
    phone: "ext. 231",
    note: "Available for roadworthiness tests, driver licences and vehicle files.",
  },
  {
    id: "staff-giorgos",
    name: "George",
    role: "Cleansing supervisor",
    team: "Cleansing",
    status: "available",
    photo: "/fleetlever/staff/giorgos.jpg",
    shift: "Tomorrow 06:00-14:00",
    assignedTo: "Morning note",
    phone: "ext. 209",
    note: "Can approve crew changes or an exception.",
  },
  {
    id: "staff-nikos",
    name: "Nick",
    role: "Refuse truck driver",
    team: "Collection",
    status: "missing",
    photo: "/fleetlever/staff/nikos.jpg",
    shift: "Tomorrow 06:30-14:30",
    assignedTo: "RT-01",
    phone: "no reply",
    note: "Has not confirmed attendance for the morning shift.",
    replacement: "David to find an available driver by 17:00",
  },
  {
    id: "staff-eleni",
    name: "Helen",
    role: "Refuse truck loader",
    team: "Collection",
    status: "leave",
    photo: "/fleetlever/staff/eleni.jpg",
    shift: "Tomorrow",
    assignedTo: "RT-02",
    phone: "booked leave",
    note: "Leave is recorded. Cover is only needed if a second route opens.",
    replacement: "Cover from an available cleansing operative",
  },
  {
    id: "staff-petros",
    name: "Peter",
    role: "Grab lorry operator",
    team: "Bulky waste and pruning",
    status: "sick",
    photo: "/fleetlever/staff/petros.jpg",
    shift: "Tomorrow 06:30-14:30",
    assignedTo: "GL-92",
    phone: "reported this morning",
    note: "Off sick tomorrow. The grab needs a second operator.",
    replacement: "George to approve a change to the bulky waste order",
  },
];

const standaloneStaffMembers: StaffMember[] = [
  {
    ...baseStaffMembers[0],
    role: "Fleet manager",
    team: "Operations coordination",
    assignedTo: "Metro line extension",
    note: "Locks operators, vehicles and next actions before the morning start.",
  },
  {
    ...baseStaffMembers[1],
    role: "Workshop manager",
    team: "Technical support",
    assignedTo: "LD-03 · hydraulics check",
    note: "Updates the operations team as soon as the inspection is done.",
  },
  {
    ...baseStaffMembers[2],
    role: "Compliance & documents",
    team: "Administrative control",
    assignedTo: "Fleet certificates",
    note: "Tracks expiries, renewals and proof per vehicle.",
  },
  {
    ...baseStaffMembers[3],
    role: "Operations director",
    team: "Project operations",
    assignedTo: "Morning report",
    note: "Approves operator changes and exceptions before the shift locks.",
  },
  {
    ...baseStaffMembers[4],
    role: "Crane operator",
    team: "Lifting",
    assignedTo: "CR-04",
    note: "Has not confirmed availability for the morning start.",
    replacement: "David to find an available operator by 17:00",
  },
  {
    ...baseStaffMembers[5],
    role: "Lorry driver",
    team: "Haulage",
    assignedTo: "TR-08",
    note: "The leave is recorded. Cover is only needed if a second route opens.",
    replacement: "Cover from an available haulage driver",
  },
  {
    ...baseStaffMembers[6],
    role: "Loader operator",
    team: "Earthworks",
    assignedTo: "LD-03",
    note: "Off sick tomorrow. The project needs a second certified operator.",
    replacement: "George to approve an operator change",
  },
];

const staffMembers = standaloneStaffMembers;

const standaloneSeedWorksites: Worksite[] = [
  {
    id: "metro-extension",
    name: "Metro line extension",
    location: "North shaft · Lifting zone",
    date: "Tomorrow, 07:00",
    requiredMachineIds: ["cr04", "ex12", "tr08", "ld03", "gn02"],
  },
  {
    id: "port-expansion",
    name: "Port facility extension",
    location: "Pier C · Loading zone",
    date: "Tomorrow, 06:30",
    requiredMachineIds: ["cr04", "ld03", "gn02"],
  },
  {
    id: "road-project",
    name: "A12 road project",
    location: "Junction 12 · East face",
    date: "Tomorrow, 08:00",
    requiredMachineIds: ["ex12", "tr08", "gn02"],
  },
];

const standaloneSeedMachines: Machine[] = [
  {
    id: "cr04",
    code: "CR-04",
    name: "Liebherr LTM 1040",
    type: "Mobile crane",
    manufacturer: "Liebherr",
    model: "LTM 1040",
    serial: "LTM-1040-123",
    ownership: "Owned",
    worksiteId: "metro-extension",
    state: "blocked",
    reason: "The lifting certificate has expired",
    owner: "David",
    nextAction: "Close the inspection and upload a new certificate",
    eta: "Today, 17:00",
    lastUpdated: "Today, 07:05",
    activeBlockers: "2",
    documents: "18 files",
    certificates: [
      {
        name: "Lifting certificate",
        status: "Expired",
        expiry: "28 May 2026",
        daysLeft: "-4",
        owner: "David",
        action: "Upload the renewed certificate",
      },
      {
        name: "Periodic inspection",
        status: "Missing",
        expiry: "Required before the shift",
        daysLeft: "-",
        owner: "Maria",
        action: "Close the inspection",
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
        issue: "Hydraulic circuit check outstanding",
        severity: "High",
        blocksRelease: true,
        owner: "Chris",
        due: "Today",
        status: "Open",
        partsStatus: "Not needed",
      },
      {
        issue: "Greasing of boom points",
        severity: "Medium",
        blocksRelease: false,
        owner: "Chris",
        due: "Tomorrow morning",
        status: "Open",
        partsStatus: "Not needed",
      },
    ],
    issues: [
      { title: "Periodic inspection missing", severity: "Critical", owner: "Maria", status: "Open" },
      { title: "Hydraulic check outstanding", severity: "High", owner: "Chris", status: "Open" },
    ],
    photos: [{ title: "Boom condition", category: "Check", date: "30 May" }],
  },
  {
    id: "ex12",
    code: "EX-12",
    name: "CAT 330",
    type: "Tracked excavator",
    manufacturer: "CAT",
    model: "330",
    serial: "CAT-330-77",
    ownership: "Owned",
    worksiteId: "metro-extension",
    state: "ready",
    reason: "Has an operator, documents and a completed service",
    owner: "Chris",
    nextAction: "-",
    eta: "-",
    lastUpdated: "Today, 06:50",
    activeBlockers: "0",
    documents: "14 files",
    certificates: [
      {
        name: "Inspection certificate",
        status: "Valid",
        expiry: "21 August 2026",
        daysLeft: "81",
        owner: "Maria",
        action: "No action",
      },
    ],
    service: [
      {
        issue: "The scheduled service is complete",
        severity: "Low",
        blocksRelease: false,
        owner: "Chris",
        due: "Completed",
        status: "Resolved",
        partsStatus: "Received",
      },
      {
        issue: "Bucket tooth wear check",
        severity: "Medium",
        blocksRelease: false,
        owner: "Chris",
        due: "Tomorrow midday",
        status: "Open",
        partsStatus: "Not needed",
      },
    ],
    issues: [],
    photos: [{ title: "Complete the service", category: "Service", date: "1 June" }],
  },
  {
    id: "tr08",
    code: "TR-08",
    name: "Mercedes Arocs",
    type: "Tipper lorry",
    manufacturer: "Mercedes-Benz",
    model: "Arocs 3345",
    serial: "TRK-9081",
    ownership: "Rented",
    worksiteId: "metro-extension",
    state: "at_risk",
    reason: "The roadworthiness test expires in 3 days",
    owner: "Maria",
    nextAction: "Renew roadworthiness test",
    eta: "In 3 days",
    lastUpdated: "Today, 06:35",
    activeBlockers: "0",
    documents: "11 files",
    certificates: [
      {
        name: "Vehicle roadworthiness test",
        status: "Critical",
        expiry: "4 June 2026",
        daysLeft: "3",
        owner: "Maria",
        action: "Renew roadworthiness test",
      },
    ],
    service: [
      {
        issue: "Brake pressure test",
        severity: "Medium",
        blocksRelease: false,
        owner: "Chris",
        due: "Today",
        status: "Open",
        partsStatus: "Not needed",
      },
    ],
    issues: [{ title: "The roadworthiness test expires soon", severity: "Medium", owner: "Maria", status: "Open" }],
    photos: [{ title: "Hire handover", category: "Handover", date: "27 May" }],
  },
  {
    id: "ld03",
    code: "LD-03",
    name: "Volvo L90",
    type: "Wheeled loader",
    manufacturer: "Volvo",
    model: "L90",
    serial: "V-L90-445",
    ownership: "Owned",
    worksiteId: "metro-extension",
    state: "blocked",
    reason: "The hydraulic leak check is not finished",
    owner: "Chris",
    nextAction: "Complete the hydraulic check",
    eta: "Tomorrow midday",
    lastUpdated: "Today, 06:20",
    activeBlockers: "1",
    documents: "10 files",
    certificates: [
      {
        name: "Safe operation certificate",
        status: "Valid",
        expiry: "18 October 2026",
        daysLeft: "139",
        owner: "Maria",
        action: "No action",
      },
    ],
    service: [
      {
        issue: "Hydraulic leak check",
        severity: "High",
        blocksRelease: true,
        owner: "Chris",
        due: "Today",
        status: "In progress",
        parts: "High pressure hydraulic hose",
        partsStatus: "On hold",
      },
      {
        issue: "Tyre sidewall check",
        severity: "Medium",
        blocksRelease: false,
        owner: "Chris",
        due: "Tomorrow morning",
        status: "Open",
        partsStatus: "Not needed",
      },
    ],
    issues: [{ title: "A hydraulic leak was reported", severity: "High", owner: "Chris", status: "Open" }],
    photos: [{ title: "Hydraulic hose", category: "Status", date: "1 June" }],
  },
  {
    id: "gn02",
    code: "GN-02",
    name: "Atlas Copco QAS",
    type: "Generator set",
    manufacturer: "Atlas Copco",
    model: "QAS 150",
    serial: "GEN-221",
    ownership: "Owned",
    worksiteId: "metro-extension",
    state: "ready",
    reason: "Ready, fuelled and with a valid safety certificate",
    owner: "Chris",
    nextAction: "-",
    eta: "-",
    lastUpdated: "Today, 06:10",
    activeBlockers: "0",
    documents: "9 files",
    certificates: [
      {
        name: "Electrical safety certificate",
        status: "Valid",
        expiry: "3 December 2026",
        daysLeft: "185",
        owner: "Maria",
        action: "No action",
      },
    ],
    service: [
      {
        issue: "Battery terminal check",
        severity: "Low",
        blocksRelease: false,
        owner: "Chris",
        due: "Today",
        status: "Open",
        partsStatus: "Not needed",
      },
    ],
    issues: [],
    photos: [{ title: "Morning check", category: "Check", date: "31 May" }],
  },
];

const standaloneSeedReleaseHistory: ReleaseRecord[] = [
  {
    id: "release-cr04-2026-06-01",
    date: "1 June",
    worksite: "Metro line extension",
    machine: "CR-04",
    result: "Not going out on shift",
    reason: "The lifting certificate expired",
    action: "Technical inspection assigned",
    user: "George",
    override: "No",
  },
  {
    id: "release-ex12-2026-06-01",
    date: "1 June",
    worksite: "Metro line extension",
    machine: "EX-12",
    result: "Ready for the shift",
    reason: "No blocker found",
    action: "Locked for the project",
    user: "David",
    override: "No",
  },
  {
    id: "release-tr08-2026-06-01",
    date: "1 June",
    worksite: "A12 road project",
    machine: "TR-08",
    result: "Needs attention",
    reason: "The roadworthiness test expires soon",
    action: "Renewal assigned",
    user: "Maria",
    override: "No",
  },
];

const standaloneInitialNotifications: OperationalNotification[] = [
  {
    id: 1,
    title: "CR-04 needs a new lifting certificate",
    detail: "David has the renewal and the technical inspection.",
    createdAt: "Today, 07:05",
    read: false,
  },
  {
    id: 2,
    title: "LD-03 is waiting on a hydraulic check",
    detail: "The workshop must close the leak before the start.",
    createdAt: "Today, 07:10",
    read: false,
  },
  {
    id: 3,
    title: "The morning check is ready",
    detail: "2 ready, 1 for review and 2 blocked on the main project.",
    createdAt: "Today, 07:30",
    read: false,
  },
];

const seedWorksites = standaloneSeedWorksites;
const seedMachines = standaloneSeedMachines;
const seedReleaseHistory = standaloneSeedReleaseHistory;
const initialNotifications = standaloneInitialNotifications;

const emptyWorksite: Worksite = {
  id: "no-worksite",
  name: "No work package selected",
  location: "Add vehicles and jobs to start the readiness check",
  date: "Not scheduled",
  requiredMachineIds: [],
};

const emptyMachine: Machine = {
  id: "no-machine",
  code: "-",
  name: "No vehicle selected",
  type: "Fleet vehicle",
  manufacturer: "FleetLever",
  model: "Not set",
  serial: "Not set",
  ownership: "Owned",
  worksiteId: emptyWorksite.id,
  state: "ready",
  reason: "No vehicle details loaded",
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

const defaultConsoleSnapshotKey = "fleetlever-console-state-v5";

function activeConsoleSnapshotKey() {
  return currentDemoSessionStorageKey() ?? defaultConsoleSnapshotKey;
}

function activeConsoleSnapshotEndpoint() {
  const demoSessionId = publicDemoSessionIdFromLocation();
  return demoSessionId ? demoSessionStateEndpoint(demoSessionId) : "/api/fleetlever/console-state";
}

function cloneConsoleData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeReleaseHistory(records: ReleaseRecord[]) {
  const usedIds = new Set<string>();

  return records.map((record, index) => {
    const baseId = record.id?.trim() || releaseAuditId(record) || `FL-LEGACY-${index + 1}`;
    let id = baseId;
    let duplicateNumber = 2;

    while (usedIds.has(id)) {
      id = `${baseId}-${duplicateNumber}`;
      duplicateNumber += 1;
    }

    usedIds.add(id);
    return { ...record, id };
  });
}

function createReleaseRecordId() {
  const randomId = globalThis.crypto?.randomUUID?.();
  return randomId ? `release-${randomId}` : `release-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function replaceConsoleArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...cloneConsoleData(next));
}

function consoleSnapshot(
  notifications: OperationalNotification[],
  organizationName = defaultClientName,
  branding: BrandingSettings = defaultBrandingSettings,
  customFieldDefinitions: CustomFieldDefinition[] = [],
  assetColumnLayout: AssetColumnLayout[] = defaultAssetColumnLayout,
): ConsoleSnapshot {
  return {
    organizationName,
    schemaVersion: 5,
    branding: cloneConsoleData(branding),
    customFieldDefinitions: cloneConsoleData(customFieldDefinitions),
    assetColumnLayout: cloneConsoleData(assetColumnLayout),
    machines: cloneConsoleData(machines),
    notifications: cloneConsoleData(notifications),
    releaseHistory: normalizeReleaseHistory(cloneConsoleData(releaseHistory)),
    staff: cloneConsoleData(staffMembers),
    updatedAt: new Date().toISOString(),
    worksites: cloneConsoleData(worksites),
  };
}

function consoleSnapshotSignature(
  notifications: OperationalNotification[],
  organizationName: string,
  branding: BrandingSettings,
  customFieldDefinitions: CustomFieldDefinition[],
  assetColumnLayout: AssetColumnLayout[],
) {
  return JSON.stringify({
    ...consoleSnapshot(notifications, organizationName, branding, customFieldDefinitions, assetColumnLayout),
    updatedAt: "",
  });
}

function saveConsoleSnapshot(
  notifications: OperationalNotification[],
  organizationName: string,
  branding: BrandingSettings,
  customFieldDefinitions: CustomFieldDefinition[],
  assetColumnLayout: AssetColumnLayout[],
) {
  if (typeof window === "undefined") return;
  if (!allowDemoConsoleData || publicDemoSessionIdFromLocation()) return;
  window.localStorage.setItem(activeConsoleSnapshotKey(), JSON.stringify(consoleSnapshot(notifications, organizationName, branding, customFieldDefinitions, assetColumnLayout)));
}

function normalizeConsoleSnapshot(snapshot: Partial<Omit<ConsoleSnapshot, "schemaVersion">> & { schemaVersion?: number }): ConsoleSnapshot | null {
  if (
    !snapshot ||
    (snapshot.schemaVersion !== 4 && snapshot.schemaVersion !== 5) ||
    !Array.isArray(snapshot.machines) ||
    !Array.isArray(snapshot.worksites) ||
    !Array.isArray(snapshot.releaseHistory) ||
    !Array.isArray(snapshot.notifications)
  ) return null;

  const normalizedMachines = snapshot.machines.map((machine) => ({
    ...machine,
    certificates: Array.isArray(machine.certificates)
      ? machine.certificates.map((certificate) => ({
          ...certificate,
          customFields: certificate.customFields && typeof certificate.customFields === "object" ? certificate.customFields : {},
        }))
      : [],
    customFields: machine.customFields && typeof machine.customFields === "object" ? machine.customFields : {},
    service: Array.isArray(machine.service)
      ? machine.service.map((service) => ({
          ...service,
          customFields: service.customFields && typeof service.customFields === "object" ? service.customFields : {},
        }))
      : [],
  }));
  const normalizedWorksites = snapshot.worksites.map((worksite) => ({
    ...worksite,
    customFields: worksite.customFields && typeof worksite.customFields === "object" ? worksite.customFields : {},
  }));
  const normalizedStaff = (Array.isArray(snapshot.staff) ? snapshot.staff : staffMembers).map((person) => ({
    ...person,
    customFields: person.customFields && typeof person.customFields === "object" ? person.customFields : {},
  }));

  return {
    organizationName: snapshot.organizationName,
    schemaVersion: 5,
    branding: snapshot.branding ?? defaultBrandingSettings,
    customFieldDefinitions: Array.isArray(snapshot.customFieldDefinitions) ? snapshot.customFieldDefinitions : [],
    assetColumnLayout: Array.isArray(snapshot.assetColumnLayout) ? snapshot.assetColumnLayout : defaultAssetColumnLayout,
    machines: normalizedMachines,
    notifications: snapshot.notifications,
    releaseHistory: normalizeReleaseHistory(snapshot.releaseHistory),
    staff: normalizedStaff,
    updatedAt: snapshot.updatedAt ?? new Date(0).toISOString(),
    worksites: normalizedWorksites,
  };
}

function loadConsoleSnapshot() {
  if (typeof window === "undefined") return null;
  if (!allowDemoConsoleData || publicDemoSessionIdFromLocation()) return null;
  const rawSnapshot = window.localStorage.getItem(activeConsoleSnapshotKey());
  if (!rawSnapshot) return null;

  try {
    const parsed = JSON.parse(rawSnapshot) as Partial<ConsoleSnapshot>;
    return normalizeConsoleSnapshot(parsed);
  } catch {
    return null;
  }
}

async function loadServerConsoleSnapshot() {
  const response = await fetch(activeConsoleSnapshotEndpoint(), {
    cache: "no-store",
  });

  if (!response.ok) return null;

  const payload = await response.json() as ServerConsoleSnapshotPayload;
  const snapshot = payload.snapshot;
  return normalizeConsoleSnapshot(snapshot ?? {});
}

async function saveServerConsoleSnapshot(
  notifications: OperationalNotification[],
  organizationName: string,
  branding: BrandingSettings,
  customFieldDefinitions: CustomFieldDefinition[],
  assetColumnLayout: AssetColumnLayout[],
) {
  const response = await fetch(activeConsoleSnapshotEndpoint(), {
    body: JSON.stringify(consoleSnapshot(notifications, organizationName, branding, customFieldDefinitions, assetColumnLayout)),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error("The console state could not be synchronized.");
  }
}

async function recordConsoleAction(payload: {
  action: string;
  detail: string;
  metadata?: Record<string, unknown>;
  recordId?: string;
  recordTable?: string;
  title: string;
}) {
  if (publicDemoSessionIdFromLocation()) return;
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
    replaceConsoleArray(staffMembers, initialConsoleSnapshot.staff);
  }

  return initialConsoleSnapshot;
}

function todayDecisionDate() {
  return "Today";
}

const navItems: Array<{ key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "tomorrow", label: "Tomorrow's shift", icon: CalendarDays },
  { key: "worksites", label: "Work packages", icon: Building2 },
  { key: "blockers", label: "What's missing", icon: ShieldAlert },
  { key: "machines", label: "Vehicles", icon: Building2 },
  { key: "certificates", label: "Documents & checks", icon: BadgeCheck },
  { key: "service", label: "Workshop", icon: Wrench },
  { key: "staff", label: "Staff", icon: CircleUserRound },
  { key: "history", label: "Shift history", icon: History },
  { key: "settings", label: "Settings", icon: Settings },
];

const passportTabs: Array<{ key: PassportTab; label: string }> = [
  { key: "overview", label: "Summary" },
  { key: "documents", label: "Documents" },
  { key: "service", label: "Workshop" },
  { key: "issues", label: "Issues" },
  { key: "photos", label: "Photos" },
  { key: "history", label: "Decision history" },
];

const assignmentChannels: Array<{ label: "In the app" | "SMS"; icon: React.ComponentType<{ className?: string }> }> = [
  { label: "In the app", icon: Bell },
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
  if (!dueIso) return "No due date";
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

function downloadBlobFile(filename: string, content: BlobPart, type: string) {
  if (typeof window === "undefined") return;
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  emitConsoleToast(`${filename} exported.`);
}

function downloadTextFile(filename: string, content: string) {
  downloadBlobFile(filename, content, "text/plain;charset=utf-8");
}

type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsvFile<T>(filename: string, rows: T[], columns: Array<ExportColumn<T>>) {
  const csv = [
    columns.map((column) => csvEscape(column.header)).join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(column.value(row))).join(",")),
  ].join("\r\n");
  downloadBlobFile(filename, `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function xmlEscape(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function spreadsheetColumnName(index: number) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const modulo = (value - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    value = Math.floor((value - modulo) / 26);
  }
  return name;
}

function buildWorksheetXml<T>(rows: T[], columns: Array<ExportColumn<T>>) {
  const headerRow = columns
    .map((column, columnIndex) => `<c r="${spreadsheetColumnName(columnIndex)}1" t="inlineStr"><is><t>${xmlEscape(column.header)}</t></is></c>`)
    .join("");
  const bodyRows = rows
    .map((row, rowIndex) => {
      const excelRow = rowIndex + 2;
      const cells = columns
        .map((column, columnIndex) => {
          const cell = `${spreadsheetColumnName(columnIndex)}${excelRow}`;
          return `<c r="${cell}" t="inlineStr"><is><t>${xmlEscape(column.value(row))}</t></is></c>`;
        })
        .join("");
      return `<row r="${excelRow}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${columns.map((_, index) => `<col min="${index + 1}" max="${index + 1}" width="22" customWidth="1"/>`).join("")}</cols>
  <sheetData><row r="1">${headerRow}</row>${bodyRows}</sheetData>
</worksheet>`;
}

let crcTable: Uint32Array | null = null;

function crc32(bytes: Uint8Array) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      crcTable[index] = value >>> 0;
    }
  }

  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crcTable![byte ^ (crc & 0xff)] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
}

function createZip(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const entries = Object.entries(files).map(([name, content]) => ({
    name,
    nameBytes: encoder.encode(name),
    contentBytes: encoder.encode(content),
  }));
  const localSize = entries.reduce((sum, entry) => sum + 30 + entry.nameBytes.length + entry.contentBytes.length, 0);
  const centralSize = entries.reduce((sum, entry) => sum + 46 + entry.nameBytes.length, 0);
  const zip = new Uint8Array(localSize + centralSize + 22);
  const centralRecords: Array<{ crc: number; entry: (typeof entries)[number]; offset: number }> = [];
  let offset = 0;

  entries.forEach((entry) => {
    const crc = crc32(entry.contentBytes);
    centralRecords.push({ crc, entry, offset });
    writeUint32(zip, offset, 0x04034b50);
    writeUint16(zip, offset + 4, 20);
    writeUint16(zip, offset + 6, 0);
    writeUint16(zip, offset + 8, 0);
    writeUint16(zip, offset + 10, 0);
    writeUint16(zip, offset + 12, 0);
    writeUint32(zip, offset + 14, crc);
    writeUint32(zip, offset + 18, entry.contentBytes.length);
    writeUint32(zip, offset + 22, entry.contentBytes.length);
    writeUint16(zip, offset + 26, entry.nameBytes.length);
    writeUint16(zip, offset + 28, 0);
    zip.set(entry.nameBytes, offset + 30);
    zip.set(entry.contentBytes, offset + 30 + entry.nameBytes.length);
    offset += 30 + entry.nameBytes.length + entry.contentBytes.length;
  });

  const centralOffset = offset;
  centralRecords.forEach(({ crc, entry, offset: localOffset }) => {
    writeUint32(zip, offset, 0x02014b50);
    writeUint16(zip, offset + 4, 20);
    writeUint16(zip, offset + 6, 20);
    writeUint16(zip, offset + 8, 0);
    writeUint16(zip, offset + 10, 0);
    writeUint16(zip, offset + 12, 0);
    writeUint16(zip, offset + 14, 0);
    writeUint32(zip, offset + 16, crc);
    writeUint32(zip, offset + 20, entry.contentBytes.length);
    writeUint32(zip, offset + 24, entry.contentBytes.length);
    writeUint16(zip, offset + 28, entry.nameBytes.length);
    writeUint16(zip, offset + 30, 0);
    writeUint16(zip, offset + 32, 0);
    writeUint16(zip, offset + 34, 0);
    writeUint16(zip, offset + 36, 0);
    writeUint32(zip, offset + 38, 0);
    writeUint32(zip, offset + 42, localOffset);
    zip.set(entry.nameBytes, offset + 46);
    offset += 46 + entry.nameBytes.length;
  });

  writeUint32(zip, offset, 0x06054b50);
  writeUint16(zip, offset + 8, entries.length);
  writeUint16(zip, offset + 10, entries.length);
  writeUint32(zip, offset + 12, centralSize);
  writeUint32(zip, offset + 16, centralOffset);
  writeUint16(zip, offset + 20, 0);
  return zip;
}

function downloadXlsxFile<T>(filename: string, rows: T[], columns: Array<ExportColumn<T>>) {
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Staff" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    "xl/worksheets/sheet1.xml": buildWorksheetXml(rows, columns),
  };
  downloadBlobFile(filename, new Blob([createZip(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
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
  if (publicDemoSessionIdFromLocation()) {
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    return { demo: true, ok: true };
  }

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
    throw new Error(payload?.error ?? "The upload failed.");
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
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section {...props} className={`rounded-lg border border-[#E2E8F0] bg-white shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function ConsolePage({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-[1480px] space-y-5 ${className}`}>{children}</div>;
}

function PanelHeader({
  actions,
  description,
  eyebrow,
  meta,
  title,
  wrapActions = false,
}: {
  actions?: React.ReactNode;
  description?: React.ReactNode;
  eyebrow: string;
  meta?: React.ReactNode;
  title: React.ReactNode;
  wrapActions?: boolean;
}) {
  return (
    <header className="flex min-h-0 flex-col gap-4 border-b border-[#E2E8F0] px-4 py-4 sm:px-5 2xl:min-h-[100px] 2xl:flex-row 2xl:items-center 2xl:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase text-[#008C95]">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold leading-tight text-[#0D2F2D]">{title}</h2>
        {description ? <p className="mt-1 text-[13px] leading-5 text-[#64748B]">{description}</p> : null}
        {meta ? <div className="mt-2">{meta}</div> : null}
      </div>
      {actions ? (
        <div
          className={`flex w-full max-w-full shrink-0 items-center gap-2 2xl:w-auto 2xl:justify-end ${
            wrapActions
              ? "flex-wrap overflow-visible"
              : "flex-wrap overflow-visible sm:flex-nowrap sm:overflow-x-auto sm:[-ms-overflow-style:none] sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden"
          }`}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}

function SplitRowAction({
  detailsLabel,
  icon,
  label,
  onDetails,
  onPrimary,
}: {
  detailsLabel: string;
  icon: React.ReactNode;
  label: string;
  onDetails: () => void;
  onPrimary: () => void;
}) {
  return (
    <div className="flex h-11 w-full overflow-hidden rounded-md border border-[#C9DAD3] bg-[#F5F8F7] 2xl:h-10 2xl:w-[184px]">
      <button
        type="button"
        onClick={onPrimary}
        aria-label={label}
        title={label}
        className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 px-3 text-sm font-bold whitespace-nowrap text-[#0D2F2D] transition duration-200 hover:bg-[#E7F1ED] active:translate-y-px focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#14B8A6]"
      >
        {icon}
        {label}
      </button>
      <button
        type="button"
        onClick={onDetails}
        aria-label={detailsLabel}
        title={detailsLabel}
        className="inline-flex w-11 shrink-0 items-center justify-center border-l border-[#C9DAD3] bg-white text-[#64748B] transition duration-200 hover:bg-[#F8FAF9] hover:text-[#0D2F2D] active:translate-y-px focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#14B8A6] 2xl:w-10"
      >
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function MetricChip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ready" | "attention" | "blocked" | "info";
}) {
  const toneClass =
    tone === "ready"
      ? "bg-[#F0FDF4] text-[#15803D]"
      : tone === "attention"
        ? "bg-[#FFFBEB] text-[#B45309]"
        : tone === "blocked"
          ? "bg-[#FEF2F2] text-[#B91C1C]"
          : tone === "info"
            ? "bg-[#EFF6FF] text-[#1D4ED8]"
            : "bg-[#F1F5F9] text-[#334155]";

  return <span className={`rounded-md px-3 py-2 text-xs font-bold tabular-nums ${toneClass}`}>{children}</span>;
}

const overlayFieldClass =
  "mt-2 h-11 w-full rounded-md border border-[#CBD9D4] bg-white px-3 text-sm font-semibold text-[#1F2933] outline-none transition focus:border-[#0D2F2D] focus:ring-2 focus:ring-[#0D2F2D]/10";
const overlayLabelClass = "text-[11px] font-bold uppercase text-[#64748B]";
const overlayPrimaryActionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white transition hover:bg-[#123C38] active:translate-y-px disabled:cursor-not-allowed disabled:bg-[#94A3B8] sm:w-auto";
const overlaySecondaryActionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#CBD9D4] bg-white px-4 text-sm font-bold text-[#1F2933] transition hover:border-[#91AAA5] hover:bg-[#F8FAF9] active:translate-y-px sm:w-auto";

function useOverlayEscape(onClose: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
}

function OverlayCloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#D7E2DC] bg-white text-[#64748B] transition hover:border-[#91AAA5] hover:bg-[#F8FAF9] hover:text-[#0D2F2D] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"
      aria-label={label}
      title={label}
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function OverlayHeader({
  description,
  eyebrow,
  onClose,
  title,
  titleId,
}: {
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  onClose: () => void;
  title: React.ReactNode;
  titleId?: string;
}) {
  return (
    <header className="flex min-h-[104px] shrink-0 items-start justify-between gap-4 border-b border-[#DCE5E1] bg-white px-5 py-4 sm:px-6">
      <div className="min-w-0">
        {eyebrow ? <p className="text-[11px] font-bold uppercase text-[#008C95]">{eyebrow}</p> : null}
        <h2 id={titleId} className="mt-1 text-xl font-semibold leading-tight text-[#0D2F2D] sm:text-2xl">
          {title}
        </h2>
        {description ? <div className="mt-1.5 text-[13px] leading-5 text-[#64748B]">{description}</div> : null}
      </div>
      <OverlayCloseButton label="Close" onClick={onClose} />
    </header>
  );
}

function OverlayFooter({ children }: { children: React.ReactNode }) {
  return <footer className="flex shrink-0 flex-col gap-2 border-t border-[#DCE5E1] bg-[#FBFCFA] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-4">{children}</footer>;
}

function OverlayTabs({
  active,
  items,
  onChange,
}: {
  active: string;
  items: Array<{ key: string; label: string }>;
  onChange: (key: string) => void;
}) {
  return (
    <div className="grid w-full max-w-full grid-cols-2 gap-1 rounded-md border border-[#DCE5E1] bg-[#F8FAF9] p-1 sm:flex sm:w-auto sm:overflow-x-auto sm:[-ms-overflow-style:none] sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`min-h-11 min-w-0 rounded px-3 text-xs font-bold transition sm:min-h-9 sm:shrink-0 ${
            active === item.key ? "bg-[#0D2F2D] text-white shadow-sm" : "text-[#64748B] hover:bg-white hover:text-[#0D2F2D]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ToolbarPopover({
  children,
  className = "",
  positionClassName = "absolute right-0 top-12",
  role = "menu",
}: {
  children: React.ReactNode;
  className?: string;
  positionClassName?: string;
  role?: React.AriaRole;
}) {
  return (
    <div
      role={role}
      className={`fleet-popover-enter z-50 overflow-hidden rounded-lg border border-[#D7E2DC] bg-white p-1.5 shadow-[0_18px_50px_rgba(15,47,45,0.16)] ${positionClassName} ${className}`}
    >
      {children}
    </div>
  );
}

function ToolbarMenuItem({
  detail,
  icon,
  label,
  onClick,
  tone = "default",
}: {
  detail?: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left transition hover:bg-[#F3F7F5] ${
        tone === "danger" ? "text-[#B91C1C]" : "text-[#1F2933]"
      }`}
    >
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          tone === "danger" ? "bg-[#FEF2F2] text-[#B91C1C]" : "bg-[#EDF5F2] text-[#0D2F2D]"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{label}</span>
        {detail ? <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#64748B]">{detail}</span> : null}
      </span>
    </button>
  );
}

function LisaAssistant({
  activeView,
  counts,
  machinesList,
  onClose,
  onOpenMachine,
  onToggle,
  onViewOpen,
  open,
  selectedWorksite,
  suppressed = false,
}: {
  activeView: ViewKey;
  counts: { ready: number; attention: number; blocked: number; total: number };
  machinesList: Machine[];
  onClose: () => void;
  onOpenMachine: (machine: Machine) => void;
  onToggle: () => void;
  onViewOpen: (view: ViewKey) => void;
  open: boolean;
  selectedWorksite: Worksite;
  suppressed?: boolean;
}) {
  const [messages, setMessages] = useState<LisaMessage[]>(() => [{
    id: 1,
    role: "lisa",
    text: "Lisa is connecting to the secure local assistant…",
  }]);
  const [draft, setDraft] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<LisaConnectionStatus>("checking");
  const [responding, setResponding] = useState(false);
  const messageIdRef = useRef(1);
  const requestControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const [renderPanel, setRenderPanel] = useState(open);
  const [panelVisible, setPanelVisible] = useState(open);
  const quickOptions = [
    "What needs attention now?",
    "Where do I add a custom field?",
    "How do I upload proof?",
    "How does the workshop work?",
  ];

  function navigationActionForResponse(text: string) {
    const match = text.match(/(?:^|\n)NAVIGATE:\s*(tomorrow|worksites|machines|blockers|certificates|service|staff|history|settings)\s*$/i);
    const cleanText = (value: string) => value.replace(/\*\*(.*?)\*\*/g, "$1").trim();
    if (!match) return { text: cleanText(text) };
    const view = match[1].toLowerCase() as ViewKey;
    return {
      text: cleanText(text.replace(match[0], "")),
      action: {
        label: "Open the related page",
        tone: "neutral" as const,
        view,
      },
    };
  }

  async function askLisa(label: string) {
    const question = label.trim();
    if (!question || responding) return;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    messageIdRef.current += 1;
    const userMessage: LisaMessage = { id: messageIdRef.current, role: "user", text: question };
    messageIdRef.current += 1;
    const answerId = messageIdRef.current;
    setMessages((current) => [
      ...current.slice(-8),
      userMessage,
      { id: answerId, role: "lisa", text: "Thinking…" },
    ]);
    setDraft("");
    setResponding(true);

    try {
      const relevantMachines = machinesForWorksite(selectedWorksite).length ? machinesForWorksite(selectedWorksite) : machinesList;
      const summary = relevantMachines.slice(0, 12).map((machine) => (
        `${machine.code}: ${machine.state}; ${machine.reason}; owner ${machine.owner}; next ${machine.nextAction}`
      )).join("\n");
      const response = await fetch("/api/fleetlever/lisa/chat", {
        body: JSON.stringify({
          question,
          context: {
            locale: document.documentElement.lang || navigator.language || "el",
            organization: document.title,
            route: window.location.pathname,
            selectedAsset: relevantMachines[0]?.code ?? null,
            summary: `Counts: ${counts.ready} ready, ${counts.attention} review, ${counts.blocked} blocked, ${counts.total} total.\n${summary}`,
            view: activeView,
          },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const error = await response.json().catch(() => ({ status: "unavailable" }));
        const status = (error.status ?? "unavailable") as LisaConnectionStatus;
        setConnectionStatus(status);
        throw new Error(error.detail ?? "Lisa is not available right now.");
      }

      setConnectionStatus("connected");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answerText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const event = frame.match(/^event:\s*(.+)$/m)?.[1];
          const rawData = frame.match(/^data:\s*(.+)$/m)?.[1];
          if (!event || !rawData) continue;
          const data = JSON.parse(rawData) as { detail?: string; status?: LisaConnectionStatus; text?: string };
          if (event === "message" && data.text) {
            answerText = data.text;
            const normalized = navigationActionForResponse(answerText);
            setMessages((current) => current.map((message) => (
              message.id === answerId ? { id: answerId, role: "lisa", ...normalized } : message
            )));
          }
          if (event === "error") throw new Error(data.detail ?? "Lisa could not answer.");
        }
      }

      if (!answerText) throw new Error("Lisa returned no answer.");
    } catch (error) {
      if (controller.signal.aborted) return;
      setMessages((current) => current.map((message) => (
        message.id === answerId
          ? { id: answerId, role: "lisa", text: error instanceof Error ? error.message : "Lisa is not available right now." }
          : message
      )));
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
      setResponding(false);
    }
  }

  function handleLisaAction(message: LisaMessage) {
    if (!message.action) return;
    if (message.action.machineId) {
      const machine = machinesList.find((item) => item.id === message.action?.machineId) ?? machines.find((item) => item.id === message.action?.machineId);
      if (machine) {
        onOpenMachine(machine);
        return;
      }
    }
    if (message.action.view) onViewOpen(message.action.view);
  }

  function submitDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askLisa(draft);
  }

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setConnectionStatus("checking");
    fetch("/api/fleetlever/lisa/health", { cache: "no-store", signal: controller.signal })
      .then(async (response) => ({ ok: response.ok, body: await response.json() as { status?: LisaConnectionStatus } }))
      .then(({ ok, body }) => {
        const status = body.status ?? "unavailable";
        setConnectionStatus(status);
        setMessages((current) => current.map((message, index) => index === 0 ? {
          ...message,
          text: ok && status === "connected"
            ? "I'm connected. Ask me about FleetLever or about the authorised data on this page."
            : "The secure local assistant is not connected. Lisa will not present canned replies as artificial intelligence.",
        } : message));
      })
      .catch(() => {
        if (!controller.signal.aborted) setConnectionStatus("unavailable");
      });
    return () => controller.abort();
  }, [open]);

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
        timeout = window.setTimeout(() => setRenderPanel(false), 180);
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

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  if (suppressed) return null;

  if (!open && !renderPanel) {
    return (
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-[70] sm:bottom-5 sm:left-5">
        <button
          type="button"
          onClick={onToggle}
          className="group relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#20B7C9] text-[#062321] shadow-[0_14px_34px_rgba(8,47,73,0.32)] ring-[3px] ring-[#0D2F2D] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#B7F5F7] sm:h-16 sm:w-16 sm:shadow-[0_18px_45px_rgba(8,47,73,0.35)] sm:ring-4"
          aria-label="Open the Lisa assistant"
        >
          <Image
            src="/fleetlever/assistant/lisa-avatar-clean.png"
            alt=""
            fill
            sizes="(max-width: 639px) 56px, 64px"
            className="object-cover object-center"
            unoptimized
          />
          <span className="pointer-events-none absolute left-16 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-[#102A27] px-3 py-1.5 text-xs font-bold text-white shadow-xl group-hover:block">
            Ask Lisa
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:inset-auto sm:bottom-4 sm:left-4 sm:p-0">
      <section
        ref={panelRef}
        data-lisa-panel
        role="dialog"
        aria-modal="true"
        aria-label="Lisa assistant"
        className={`flex h-[min(680px,calc(100dvh-0.75rem))] max-h-[calc(100dvh-0.75rem)] min-h-0 w-full origin-bottom-left flex-col overflow-hidden rounded-lg border border-[#D9E2EC] bg-[#F8FAFC] text-[#102A27] shadow-[0_24px_70px_rgba(15,23,42,0.28)] transition duration-200 ease-out sm:h-auto sm:max-h-[min(720px,calc(100dvh-2rem))] sm:min-h-[560px] sm:w-[min(500px,calc(100vw-2rem))] ${
          panelVisible && open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4 bg-[#0D2F2D] p-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative inline-flex h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#20B7C9] ring-2 ring-white/20">
              <Image
                src="/fleetlever/assistant/lisa-avatar-clean.png"
                alt="Lisa assistant"
                fill
                sizes="64px"
                className="object-cover object-center"
                unoptimized
              />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wide text-[#8BE4DF]">FleetLever assistant</p>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Lisa</h2>
                <span className={`h-2 w-2 rounded-full ${connectionStatus === "connected" ? "bg-[#5EE49B]" : connectionStatus === "checking" || connectionStatus === "busy" ? "bg-[#FBBF24]" : "bg-[#F87171]"}`} aria-hidden="true" />
              </div>
              <p className="mt-1 max-w-sm text-sm font-semibold leading-5 text-white/72">It suggests and guides. It does not make changes.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/75 transition hover:bg-white/10 hover:text-white sm:h-9 sm:w-9"
            aria-label="Close the Lisa assistant"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-lg px-4 py-3 text-sm shadow-sm ${
                message.role === "user" ? "bg-[#20B7C9] text-[#062321]" : "border border-[#DDE7E3] bg-white text-[#102A27]"
              }`}
              >
                <p className="font-semibold leading-6">{message.text}</p>
                {message.bullets?.length ? (
                  <ul className="mt-3 space-y-1.5 text-xs font-semibold leading-5 text-[#52616B]">
                    {message.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {message.action ? (
                  <button
                    type="button"
                    onClick={() => handleLisaAction(message)}
                    className={`mt-3 inline-flex min-h-10 w-full items-center justify-between gap-3 rounded-sm px-3 text-left text-xs font-black transition ${
                      message.action.tone === "danger"
                        ? "bg-[#FDE7E7] text-[#991B1B] hover:bg-[#FBD1D1]"
                        : "bg-[#E6F7F8] text-[#075E67] hover:bg-[#D4F1F3]"
                    }`}
                  >
                    <span>{message.action.label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        <div className="space-y-3 border-t border-[#DDE7E3] bg-white p-4">
          <div className="grid grid-cols-2 gap-2">
            {quickOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => void askLisa(option)}
                disabled={connectionStatus !== "connected" || responding}
                className="min-h-11 rounded-sm border border-[#D9E2EC] bg-[#F8FAFC] px-3 text-left text-xs font-bold leading-4 text-[#102A27] transition hover:border-[#20B7C9] hover:bg-[#ECFEFF]"
              >
                {option}
              </button>
            ))}
          </div>

          <form onSubmit={submitDraft} className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Lisa..."
              disabled={connectionStatus !== "connected" || responding}
              className="h-12 min-w-0 flex-1 rounded-sm border border-[#D9E2EC] bg-white px-4 text-sm font-semibold text-[#102A27] outline-none placeholder:text-[#94A3B8] focus:border-[#20B7C9]"
            />
            <button
              type="submit"
              disabled={connectionStatus !== "connected" || responding || !draft.trim()}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-[#0D2F2D] text-white transition hover:bg-[#123C38]"
              aria-label="Send a message to Lisa"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
          <p className="text-[10px] font-semibold leading-4 text-[#7B8983]">
            {connectionStatus === "connected" ? "Connected to the local Codex assistant · Only you make changes." : "Lisa stays inactive until the secure local assistant connects."}
          </p>
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

export function ConstructionPrototype({
  trialInfo,
}: {
  trialInfo?: { daysRemaining: number; endsAt: string; userName: string; organizationName: string };
} = {}) {
  const [clientName, setClientName] = useState(defaultClientName);
  const [branding, setBranding] = useState<BrandingSettings>(defaultBrandingSettings);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [assetColumnLayout, setAssetColumnLayout] = useState<AssetColumnLayout[]>(defaultAssetColumnLayout);
  const [activeView, setActiveView] = useState<ViewKey>("tomorrow");
  const [worksiteId, setWorksiteId] = useState(worksites[0]?.id ?? emptyWorksite.id);
  const [dateMode, setDateMode] = useState<"Today" | "Tomorrow" | "Customise">("Tomorrow");
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
  const [lisaOpen, setLisaOpen] = useState(false);
  const [notifications, setNotifications] = useState<OperationalNotification[]>(allowDemoConsoleData ? initialNotifications : []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [version, setVersion] = useState(0);
  const [browserHydrated, setBrowserHydrated] = useState(false);
  const [serverHydrated, setServerHydrated] = useState(false);
  const [serverHydrationRevision, setServerHydrationRevision] = useState(0);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchBoxRef = useRef<HTMLDivElement | null>(null);
  const serverSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const serverSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverSnapshotSignatureRef = useRef<string | null>(null);
  const hydrationFallbackSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const bootSnapshot = restoreInitialConsoleSnapshot();
    hydrationFallbackSignatureRef.current = bootSnapshot
      ? consoleSnapshotSignature(
          bootSnapshot.notifications ?? (allowDemoConsoleData ? initialNotifications : []),
          bootSnapshot.organizationName ?? defaultClientName,
          bootSnapshot.branding,
          bootSnapshot.customFieldDefinitions,
          bootSnapshot.assetColumnLayout,
        )
      : consoleSnapshotSignature(
          allowDemoConsoleData ? initialNotifications : [],
          defaultClientName,
          defaultBrandingSettings,
          [],
          defaultAssetColumnLayout,
        );

    queueMicrotask(() => {
      if (bootSnapshot) {
        setClientName(bootSnapshot.organizationName ?? defaultClientName);
        setBranding(bootSnapshot.branding);
        setCustomFieldDefinitions(bootSnapshot.customFieldDefinitions);
        setAssetColumnLayout(bootSnapshot.assetColumnLayout);
        setNotifications(bootSnapshot.notifications ?? (allowDemoConsoleData ? initialNotifications : []));
        setWorksiteId(bootSnapshot.worksites[0]?.id ?? worksites[0]?.id ?? emptyWorksite.id);
        setSelectedMachineId(bootSnapshot.machines[0]?.id ?? machines[0]?.id ?? emptyMachine.id);
        setVersion((current) => current + 1);
      }

      setBrowserHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!browserHydrated) return;
    saveConsoleSnapshot(notifications, clientName, branding, customFieldDefinitions, assetColumnLayout);
    if (!serverHydrated) return;
    const nextSignature = consoleSnapshotSignature(notifications, clientName, branding, customFieldDefinitions, assetColumnLayout);
    if (nextSignature === serverSnapshotSignatureRef.current) return;
    if (serverSaveTimerRef.current) clearTimeout(serverSaveTimerRef.current);
    serverSaveTimerRef.current = setTimeout(() => {
      serverSaveTimerRef.current = null;
      serverSaveQueueRef.current = serverSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          await saveServerConsoleSnapshot(notifications, clientName, branding, customFieldDefinitions, assetColumnLayout);
          serverSnapshotSignatureRef.current = nextSignature;
        });
      void serverSaveQueueRef.current.catch(() => {
        emitConsoleToast("Saved locally. Syncing to the server will retry on the next change.");
      });
    }, 180);
  }, [assetColumnLayout, branding, browserHydrated, clientName, customFieldDefinitions, notifications, serverHydrated, version]);

  useEffect(() => () => {
    if (serverSaveTimerRef.current) clearTimeout(serverSaveTimerRef.current);
  }, []);

  useEffect(() => {
    if (serverHydrationRevision === 0 || !serverSnapshotSignatureRef.current) return;
    const renderedSignature = consoleSnapshotSignature(notifications, clientName, branding, customFieldDefinitions, assetColumnLayout);
    if (renderedSignature === serverSnapshotSignatureRef.current) setServerHydrated(true);
  }, [assetColumnLayout, branding, clientName, customFieldDefinitions, notifications, serverHydrationRevision, version]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromServer() {
      try {
        const serverSnapshot = await loadServerConsoleSnapshot();
        if (cancelled) return;

        if (serverSnapshot) {
          const hasTenantOperationalData = serverSnapshot.machines.length > 0;
          if (hasTenantOperationalData) {
            replaceConsoleArray(worksites, serverSnapshot.worksites);
            replaceConsoleArray(machines, serverSnapshot.machines);
            replaceConsoleArray(releaseHistory, serverSnapshot.releaseHistory);
            replaceConsoleArray(staffMembers, serverSnapshot.staff);
          }
          const nextClientName = serverSnapshot.organizationName ?? defaultClientName;
          const nextBranding = serverSnapshot.branding;
          const nextCustomFieldDefinitions = serverSnapshot.customFieldDefinitions;
          const nextAssetColumnLayout = serverSnapshot.assetColumnLayout;
          const nextNotifications = hasTenantOperationalData ? serverSnapshot.notifications : initialNotifications;
          setClientName(nextClientName);
          setBranding(nextBranding);
          setCustomFieldDefinitions(nextCustomFieldDefinitions);
          setAssetColumnLayout(nextAssetColumnLayout);
          setNotifications(nextNotifications);
          setWorksiteId((hasTenantOperationalData ? serverSnapshot.worksites[0]?.id : worksites[0]?.id) ?? emptyWorksite.id);
          setSelectedMachineId((hasTenantOperationalData ? serverSnapshot.machines[0]?.id : machines[0]?.id) ?? emptyMachine.id);
          setVersion((current) => current + 1);
          serverSnapshotSignatureRef.current = consoleSnapshotSignature(
            nextNotifications,
            nextClientName,
            nextBranding,
            nextCustomFieldDefinitions,
            nextAssetColumnLayout,
          );
        } else {
          serverSnapshotSignatureRef.current = hydrationFallbackSignatureRef.current;
        }
      } catch {
        if (!cancelled) {
          serverSnapshotSignatureRef.current = hydrationFallbackSignatureRef.current;
          emitConsoleToast("The FleetLever server status is unavailable.");
        }
      } finally {
        if (!cancelled) setServerHydrationRevision((current) => current + 1);
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
      const target = event.target as Node;
      if (!searchBoxRef.current?.contains(target)) setSearchOpen(false);
      if (!mobileSearchBoxRef.current?.contains(target)) setMobileSearchOpen(false);
      if (!(event.target instanceof Element) || !event.target.closest("[data-toolbar-menu]")) {
        setAddMenuOpen(false);
        setNotificationOpen(false);
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setSearchOpen(false);
      setMobileSearchOpen(false);
      setAddMenuOpen(false);
      setNotificationOpen(false);
      setUserMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
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
    setMobileSearchOpen(false);
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
    setMobileSearchOpen(false);
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
    setMobileSearchOpen(false);
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
    setMobileSearchOpen(false);
  }

  function refreshConsole(message: string) {
    setVersion((version) => version + 1);
    emitConsoleToast(message);
  }

  function recordDecision(machine: Machine, result: string, reason: string, action: string, user: string, override: "Yes" | "No" = "No") {
    releaseHistory.unshift({
      id: createReleaseRecordId(),
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
      action: result === "Approved by exception" ? "console.override_released" : "console.release_decision",
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
      metadata: { source: "fleet-console" },
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
      machine.reason = activeCertificate.status === "Missing" ? `Missing ${activeCertificate.name}` : `${activeCertificate.name} ${activeCertificate.status.toLowerCase()}`;
      machine.owner = activeCertificate.owner;
      machine.nextAction = activeCertificate.action;
      machine.eta = activeCertificate.daysLeft.startsWith("-") ? "Today" : activeCertificate.expiry;
      return;
    }

    if (activeService) {
      machine.state = "blocked";
      machine.reason = activeService.issue;
      machine.owner = activeService.owner;
      machine.nextAction = "Complete workshop job";
      machine.eta = activeService.due;
      return;
    }

    if (activeIssueCount) {
      const nextIssue = machine.issues.find((issue) => issue.status !== "Resolved");
      machine.state = "at_risk";
      machine.reason = nextIssue?.title ?? "Needs review";
      machine.owner = nextIssue?.owner ?? machine.owner;
      machine.nextAction = "Open issue review";
      machine.eta = "Today";
      return;
    }

    machine.state = "ready";
    machine.reason = "No open item found";
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
    channels: string[] = ["In the app"],
  ) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    const assignedAt = "Just now";
    const assignmentDue = formatDueLabel(dueIso ?? "");
    const computedStatus: NonNullable<Certificate["assignmentStatus"]> = isDueOverdue(dueIso ?? "") ? "Overdue" : assignmentStatus;
    const assignedBlocker = blockerId ? blockerCardsForMachine(machine).find((blocker) => blocker.id === blockerId) : undefined;
    const assignmentSummary = assignedBlocker?.summary ?? "Open items";
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
    recordDecision(machine, "An owner was assigned", assignmentSummary, `${owner} takes the next action · Due ${assignmentDue}${note ? ` · ${note}` : ""}`, "FleetLever", "No");
    addOperationalNotification(`${machine.code}: ${computedStatus.toLowerCase()} to ${owner}`, `${assignmentSummary} · Due ${assignmentDue} · ${channels.join(", ")}${note ? ` · ${note}` : ""}`);
    refreshConsole(`${machine.code}: ${blockerId ? "the open item" : "the open items"} ${computedStatus.toLowerCase()} to ${owner}.`);
  }

  function updateMachineCustomField(machineId: string, fieldId: string, value: unknown) {
    const machine = machines.find((item) => item.id === machineId);
    const field = customFieldDefinitions.find((item) => item.id === fieldId && item.module === "assets" && !item.archived);
    if (!machine || !field) return;
    machine.customFields = {
      ...(machine.customFields ?? {}),
      [fieldId]: normalizedCustomFieldValue(field, value),
    };
    machine.lastUpdated = "Just now";
    refreshConsole(`${machine.code}: updated field ${field.name}.`);
  }

  function updateWorksiteCustomField(worksiteId: string, fieldId: string, value: unknown) {
    const worksite = worksites.find((item) => item.id === worksiteId);
    const field = customFieldDefinitions.find((item) => item.id === fieldId && item.module === "assignments" && !item.archived);
    if (!worksite || !field) return;
    worksite.customFields = {
      ...(worksite.customFields ?? {}),
      [fieldId]: normalizedCustomFieldValue(field, value),
    };
    refreshConsole(`${worksite.name}: updated field ${field.name}.`);
  }

  function updateCertificateCustomField(machineId: string, certificateName: string, fieldId: string, value: unknown) {
    const machine = machines.find((item) => item.id === machineId);
    const certificate = machine?.certificates.find((item) => item.name === certificateName);
    const field = customFieldDefinitions.find((item) => item.id === fieldId && item.module === "documents" && !item.archived);
    if (!machine || !certificate || !field) return;
    certificate.customFields = {
      ...(certificate.customFields ?? {}),
      [fieldId]: normalizedCustomFieldValue(field, value),
    };
    machine.lastUpdated = "Just now";
    refreshConsole(`${machine.code}: updated field ${field.name}.`);
  }

  function updateServiceCustomField(machineId: string, issue: string, fieldId: string, value: unknown) {
    const machine = machines.find((item) => item.id === machineId);
    const service = machine?.service.find((item) => item.issue === issue);
    const field = customFieldDefinitions.find((item) => item.id === fieldId && item.module === "service" && !item.archived);
    if (!machine || !service || !field) return;
    service.customFields = {
      ...(service.customFields ?? {}),
      [fieldId]: normalizedCustomFieldValue(field, value),
    };
    machine.lastUpdated = "Just now";
    refreshConsole(`${machine.code}: updated field ${field.name}.`);
  }

  function updateStaffCustomField(personId: string, fieldId: string, value: unknown) {
    const person = staffMembers.find((item) => item.id === personId);
    const field = customFieldDefinitions.find((item) => item.id === fieldId && item.module === "people" && !item.archived);
    if (!person || !field) return;
    person.customFields = {
      ...(person.customFields ?? {}),
      [fieldId]: normalizedCustomFieldValue(field, value),
    };
    refreshConsole(`${person.name}: updated field ${field.name}.`);
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
    recordDecision(machine, machine.state === "ready" ? "Ready for work" : "The action was completed", machine.reason, note || "The owner's action is complete", "FleetLever", "No");
    addOperationalNotification(`${machine.code}: item completed`, `${machine.reason} · ${note || "The action was completed"}`);
    refreshConsole(`${machine.code}: the action was completed.`);
  }

  function updateServiceStatus(machineId: string, issue: string, status: ServiceBlocker["status"]) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    const service = machine.service.find((item) => item.issue === issue);
    if (!service) return;
    const nextDue = status === "Resolved" ? "Completed" : status === "On hold" ? "Awaiting parts" : service.due === "Completed" || service.due === "Awaiting parts" ? "Today" : service.due;

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
    recordDecision(machine, status === "Resolved" ? "The workshop cleared it" : "The workshop was updated", issue, `The workshop job was marked ${status.toLowerCase()}`, "Workshop", "No");
    addOperationalNotification(`${machine.code}: workshop job ${status.toLowerCase()}`, `${issue} · ${machineWorksite(machine).name}`);
    refreshConsole(`${machine.code}: the workshop job was marked ${status.toLowerCase()}.`);
  }

  function addWorkshopJob(draft: WorkshopJobDraft) {
    const machine = machines.find((item) => item.id === draft.machineId);
    if (!machine) return;
    const issue = draft.issue.trim();
    if (!issue) return;
    const existingJob = machine.service.find((service) => service.issue.toLowerCase() === issue.toLowerCase());

    if (existingJob) {
      emitConsoleToast(`${machine.code}: this workshop job already exists.`);
      return;
    }

    machine.service = [
      {
        issue,
        severity: draft.blocksRelease ? "High" : "Medium",
        blocksRelease: draft.blocksRelease,
        owner: draft.owner,
        due: draft.due,
        status: draft.partsStatus === "On hold" ? "On hold" : "Open",
        parts: draft.parts.trim(),
        partsStatus: draft.partsStatus,
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
    machine.nextAction = "Complete workshop job";
    machine.owner = draft.owner;
    machine.eta = draft.due;
    syncMachineReleaseState(machine);
    const partsNote = draft.parts.trim() ? ` · Parts: ${draft.partsStatus} · ${draft.parts.trim()}` : ` · Parts: ${draft.partsStatus}`;
    recordDecision(machine, "Workshop job added", issue, `${draft.blocksRelease ? "Stops tomorrow's shift" : "Track the job"} · ${draft.owner} · ${draft.due}${partsNote}`, draft.owner, "No");
    addOperationalNotification(`${machine.code}: workshop job added`, `${issue} · ${draft.owner} · ${draft.due}${partsNote}`);
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
    machine.photos.push({ title: documentName || "Proof uploaded", category: "Documents & checks", date: "Today" });
    syncMachineReleaseState(machine);
    recordDecision(machine, machine.state === "ready" ? "Ready for work" : "Proof uploaded", documentName || "Proof uploaded", `${expiryDate || "Uploaded today"} · The vehicle file was updated`, "FleetLever", "No");
    addOperationalNotification(`${machine.code}: proof uploaded`, `${documentName || "Proof"} was updated in Documents & checks and in the vehicle file.`);
    refreshConsole(`${machine.code}: ${documentName || "proof"} uploaded and synced.`);
  }

  function releaseWithOverride(machineId: string, reason: string, approver: string, acceptedUntil: string) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    recordDecision(machine, "Approved by exception", machine.reason, `${reason} · Approved by ${approver} · Valid until ${acceptedUntil}`, approver, "Yes");
    machine.state = "at_risk";
    machine.reason = "Approved by exception";
    machine.nextAction = `Close exception reason: ${reason}`;
    machine.eta = acceptedUntil || "Today";
    machine.lastUpdated = "Just now";
    refreshConsole(`${machine.code}: approved by exception and recorded.`);
  }

  function releaseReadyMachines(releaseMachines: Machine[]) {
    const readyMachines = releaseMachines.filter((machine) => machine.state === "ready");
    readyMachines.forEach((machine) => {
      recordDecision(machine, "Ready for the shift", "No open item found", `Locked for ${selectedWorksite.name}`, "David", "No");
    });
    addOperationalNotification(`Shift updated for ${selectedWorksite.name}`, `${readyMachines.length} ready vehicles were locked. The morning note was updated.`);
    setReleaseModalOpen(false);
    refreshConsole(`${readyMachines.length} ready vehicles were locked for ${selectedWorksite.name}.`);
  }

  function addConsoleItem(type: AddItemType, name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;
    if (type === "City service" || type === "Work package") {
      const id = `worksite-${Date.now()}`;
      worksites.push({
        id,
        name: cleanName,
        location: "New work package",
        date: "Tomorrow, 07:00",
        requiredMachineIds: [],
      });
      setWorksiteId(id);
      setActiveView("tomorrow");
      addOperationalNotification(`Added ${cleanName}`, "The new service is ready for vehicles to be assigned.");
      refreshConsole(`${cleanName} was added as a service.`);
    } else if (type === "Vehicle") {
      const id = `machine-${Date.now()}`;
      const code = `M-${String(machines.length + 1).padStart(2, "0")}`;
      const newMachine: Machine = {
        id,
        code,
        name: cleanName,
        type: "Vehicle",
        manufacturer: "FleetLever",
        model: "New",
        serial: `SN-${Date.now()}`,
        ownership: "Owned",
        worksiteId,
        state: "at_risk",
        reason: "The new vehicle needs a review",
        owner: "David",
        nextAction: "Complete the vehicle file",
        eta: "Today",
        lastUpdated: "Just now",
        activeBlockers: "0",
        documents: "0 files",
        certificates: [],
        service: [],
        issues: [{ title: "The vehicle file is incomplete", severity: "Medium", owner: "David", status: "Open" }],
        photos: [],
      };
      machines.push(newMachine);
      selectedWorksite.requiredMachineIds.push(id);
      setSelectedMachineId(id);
      setDrawerMode("passport");
      setDrawerOpen(true);
      recordDecision(newMachine, "Needs attention", "The new vehicle needs a review", "The vehicle was added and its file opened", "FleetLever", "No");
      addOperationalNotification(`${code}: added to ${selectedWorksite.name}`, "Complete the vehicle file before the shift locks.");
      refreshConsole(`${cleanName} was added to ${selectedWorksite.name}.`);
    } else if (type === "Check / document") {
      const targetMachine = machines.find((machine) => machine.id === selectedMachineId);
      if (!targetMachine) return;
      targetMachine.certificates.push({ name: cleanName, status: "Expiring soon", expiry: "30 June 2026", daysLeft: "29", owner: "Maria", action: "Document review" });
      targetMachine.state = targetMachine.state === "ready" ? "at_risk" : targetMachine.state;
      targetMachine.reason = targetMachine.state === "at_risk" ? "The document needs review" : targetMachine.reason;
      targetMachine.lastUpdated = "Just now";
      recordDecision(targetMachine, "Document added", cleanName, "The document was added for review", "Maria", "No");
      addOperationalNotification(`${targetMachine.code}: document added`, `${cleanName} needs review.`);
      refreshConsole(`${cleanName} was added to ${targetMachine.code}.`);
    } else if (type === "Workshop issue") {
      const targetMachine = machines.find((machine) => machine.id === selectedMachineId);
      if (!targetMachine) return;
      targetMachine.service.push({ issue: cleanName, severity: "High", blocksRelease: true, owner: "Chris", due: "Today", status: "Open" });
      targetMachine.issues.push({ title: cleanName, severity: "High", owner: "Chris", status: "Open" });
      syncMachineReleaseState(targetMachine);
      recordDecision(targetMachine, "Workshop job added", cleanName, "The workshop item was added from the console", "Chris", "No");
      addOperationalNotification(`${targetMachine.code}: workshop job added`, `${cleanName} may stop tomorrow's shift.`);
      refreshConsole(`${cleanName} was added as an open item for ${targetMachine.code}.`);
    } else {
      const targetMachine = machines.find((machine) => machine.id === selectedMachineId);
      const documentBlocker = targetMachine?.certificates.find((certificate) => ["Expired", "Missing", "Critical"].includes(certificate.status));
      if (targetMachine && documentBlocker) {
        uploadDocument(selectedMachineId, `certificate:${documentBlocker.name}`, cleanName, "Uploaded today");
      } else {
        refreshConsole("No document item selected.");
      }
    }
    setAddModalType(null);
    setAddMenuOpen(false);
  }

  const globalSearchGroups: GlobalSearchGroup[] = normalizedGlobalSearch.length >= 2
    ? [
        {
          title: "Vehicles",
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
          title: "Work packages",
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
                label: siteCounts.blocked ? "Blocked" : siteCounts.attention ? "For review" : "Ready",
                tone: siteCounts.blocked ? "blocked" as const : siteCounts.attention ? "attention" as const : "ready" as const,
                onSelect: () => {
                  openWorksiteFromSearch(worksite);
                },
              };
            }),
        },
        {
          title: "Documents & checks",
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
          title: "Open item list",
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
              label: row.priority === "blocking" ? "Blocks" : "For review",
              tone: row.priority === "blocking" ? "blocked" as const : "attention" as const,
              onSelect: () => {
                openActionFromSearch(row.machine, row.action);
              },
            })),
        },
        {
          title: "Workshop jobs",
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
              label: service.blocksRelease ? "May block" : service.status,
              tone: service.blocksRelease ? "blocked" as const : service.status === "Resolved" ? "ready" as const : "attention" as const,
              onSelect: () => {
                openMachineFromSearch(machine, "service", "passport", "service");
              },
            })),
        },
        {
          title: "Decision history",
          results: releaseHistory
            .filter((item) => valuesMatchSearch(normalizedGlobalSearch, [item.date, item.worksite, item.machine, item.result, item.reason, item.action, item.user]))
            .slice(0, 3)
            .map((item) => ({
              id: `history:${item.date}:${item.machine}:${item.reason}`,
              title: `${item.machine} · ${item.result}`,
              subtitle: item.reason,
              meta: `${item.date} · ${item.user}`,
              label: "Decision",
              tone: item.result === "Ready for work" ? "ready" as const : item.result === "Needs attention" ? "attention" as const : "neutral" as const,
              onSelect: () => {
                setSearchOpen(false);
                setMobileSearchOpen(false);
                showView("history");
              },
            })),
        },
      ].filter((group) => group.results.length)
    : [];
  const globalSearchResultCount = globalSearchGroups.reduce((total, group) => total + group.results.length, 0);
  const lisaSuppressed = !lisaCodexUiEnabled || drawerOpen || mobileNavOpen || Boolean(addModalType) || Boolean(drawerAction) || releaseModalOpen;

  if (!serverHydrated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef2e7] px-6 text-[#0D2F2D]" aria-busy="true">
        <div className="flex flex-col items-center gap-5 text-center">
          <FleetLeverLogo />
          <div className="h-1 w-36 overflow-hidden rounded-full bg-[#D4E0DA]">
            <span className="block h-full w-1/2 animate-pulse rounded-full bg-[#008C95]" />
          </div>
          <p className="text-sm font-bold text-[#55706B]">Loading your operation…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-y-auto bg-[#eef2e7] text-[#0D2F2D] [scrollbar-gutter:stable]">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#143d38] bg-[#123c36] text-white transition-transform duration-200 ease-out xl:relative xl:flex ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
          }`}
        >
          <div className="flex min-h-32 items-center border-b border-white/10 px-5 py-5">
            <div className="min-w-0">
              {branding.logo ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={branding.logo.dataUrl} alt={`${clientName} logo`} className="max-h-16 max-w-[13rem] object-contain object-left" />
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-white/55">Powered by FleetLever</p>
                </div>
              ) : (
                <div>
                  <FleetLeverLogo inverse />
                  <p className="mt-2 text-[11px] font-bold uppercase text-white/60">Fleet readiness centre</p>
                </div>
              )}
            </div>
          </div>
          <nav aria-label="App navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => showView(item.key)}
                className={`flex min-h-11 w-full items-center gap-3 rounded-md border-l-2 px-3 text-left text-[13px] font-semibold transition xl:min-h-10 ${
                  activeView === item.key
                    ? "border-[#8be4df] bg-white/12 text-white"
                    : "border-transparent text-white/78 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <button
          type="button"
          aria-label="Close the Lisa assistant"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setLisaOpen(false);
          }}
          className={`fixed inset-0 z-[65] bg-[#0D2F2D]/10 backdrop-blur-[1px] transition-opacity duration-200 ${
            lisaOpen && !lisaSuppressed ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <LisaAssistant
          activeView={activeView}
          counts={counts}
          machinesList={visibleMachines}
          onClose={() => setLisaOpen(false)}
          onOpenMachine={(machine) => {
            setLisaOpen(false);
            setActiveView("machines");
            setMobileNavOpen(false);
            setSearchTerm("");
            setSearchOpen(false);
            setDrawerAction(null);
            openMachine(machine, machine.state === "blocked" ? "why" : "passport");
          }}
          onToggle={() => setLisaOpen((open) => !open)}
          onViewOpen={(view) => {
            showView(view);
            setLisaOpen(false);
          }}
          open={lisaOpen}
          selectedWorksite={selectedWorksite}
          suppressed={lisaSuppressed}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[#cad9cf] bg-[#f8fbf4]/95 backdrop-blur">
            <div className="flex h-16 items-center gap-1.5 px-3 sm:gap-3 sm:px-4 xl:px-6">
              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#1F2933] xl:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div ref={searchBoxRef} className="relative hidden min-w-0 flex-1 sm:block">
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
                  placeholder="Search vehicle, service, document, owner...  ⌘K"
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
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(true);
                  setAddMenuOpen(false);
                  setNotificationOpen(false);
                  setUserMenuOpen(false);
                }}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#1F2933] sm:hidden"
                aria-label="Search FleetLever"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
              {trialInfo ? (
                <div className="hidden h-9 shrink-0 items-center rounded-md border border-[#B8D5CC] bg-[#F1FAF6] px-3 text-[11px] font-black uppercase text-[#116149] lg:inline-flex" title={`Trial ends ${new Date(trialInfo.endsAt).toLocaleDateString("en-GB")}`}>
                  Trial · {trialInfo.daysRemaining} {trialInfo.daysRemaining === 1 ? "day" : "days"} left
                </div>
              ) : null}
              <div data-toolbar-menu className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAddMenuOpen((open) => !open);
                    setNotificationOpen(false);
                    setUserMenuOpen(false);
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-0 text-[13px] font-semibold text-[#1F2933] sm:h-9 sm:w-9 md:w-auto md:px-3"
                  aria-label="Add"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden md:inline">Add</span>
                  <ChevronDown className="hidden h-4 w-4 text-[#64748B] md:block" aria-hidden="true" />
                </button>
                {addMenuOpen ? (
                  <ToolbarPopover
                    positionClassName="fixed left-4 right-4 top-16 md:absolute md:left-auto md:right-0 md:top-12"
                    className="w-auto md:w-72"
                  >
                    {([
                      ["Vehicle", Truck, "New fleet record"],
                      [
                        "Work package",
                        Building2,
                        "New job or project",
                      ],
                      ["Check / document", FileText, "New requirement or proof"],
                      ["Workshop issue", Wrench, "New maintenance job"],
                      ["File", Archive, "New file record"],
                    ] as Array<[AddItemType, typeof Truck, string]>).map(([item, Icon, detail]) => (
                      <ToolbarMenuItem
                        key={item}
                        icon={<Icon className="h-4 w-4" aria-hidden="true" />}
                        label={item}
                        detail={detail}
                        onClick={() => {
                          setAddMenuOpen(false);
                          setAddModalType(item);
                        }}
                      />
                    ))}
                  </ToolbarPopover>
                ) : null}
              </div>
              <div data-toolbar-menu className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationOpen((open) => !open);
                    setAddMenuOpen(false);
                    setUserMenuOpen(false);
                  }}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#1F2933] sm:h-9 sm:w-9"
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
                  <ToolbarPopover
                    role="dialog"
                    positionClassName="fixed left-4 right-4 top-16 md:absolute md:left-auto md:right-0 md:top-12"
                    className="w-auto p-0 md:w-[360px]"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-[#DCE5E1] px-4 py-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase text-[#008C95]">Notifications</p>
                        <p className="mt-1 text-sm font-semibold text-[#64748B]">{unreadNotifications} not reviewed</p>
                      </div>
                      <Bell className="h-4 w-4 text-[#64748B]" aria-hidden="true" />
                    </div>
                    <div className="max-h-80 divide-y divide-[#E2E8F0] overflow-y-auto">
                      {notifications.slice(0, 5).map((item) => (
                        <div key={item.id} className={`relative px-4 py-3 text-sm ${item.read ? "bg-white" : "bg-[#F2FBFA]"}`}>
                          {!item.read ? <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-[#008C95]" aria-hidden="true" /> : null}
                          <p className="font-bold text-[#1F2933]">{item.title}</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#64748B]">{item.detail}</p>
                          <p className="mt-1.5 text-[11px] font-bold text-[#94A3B8]">{item.createdAt}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-[#DCE5E1] p-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNotifications((current) => current.map((item) => ({ ...item, read: true })));
                          setNotificationOpen(false);
                          refreshConsole("Notifications marked as reviewed.");
                        }}
                        className="min-h-9 w-full rounded-md px-3 text-sm font-bold text-[#0D2F2D] transition hover:bg-[#F3F7F5]"
                      >
                        Mark all as reviewed
                      </button>
                    </div>
                  </ToolbarPopover>
                ) : null}
              </div>
              <div data-toolbar-menu className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen((open) => !open);
                    setAddMenuOpen(false);
                    setNotificationOpen(false);
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#1F2933] sm:h-9 sm:w-9"
                  aria-label="User menu"
                >
                  <CircleUserRound className="h-5 w-5" aria-hidden="true" />
                </button>
                {userMenuOpen ? (
                  <ToolbarPopover className="w-60">
                    <div className="border-b border-[#DCE5E1] px-3 py-2.5">
                      <p className="text-sm font-bold text-[#0D2F2D]">{trialInfo?.userName ?? "George"}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#64748B]">
                        Fleet manager
                      </p>
                    </div>
                    <div className="pt-1">
                      <ToolbarMenuItem
                        icon={<CircleUserRound className="h-4 w-4" aria-hidden="true" />}
                        label="Profile"
                        detail="Details and preferences"
                        onClick={() => {
                          setUserMenuOpen(false);
                          refreshConsole("The profile opened.");
                        }}
                      />
                      <ToolbarMenuItem
                        icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
                        label="Sign out"
                        detail="End the current session"
                        tone="danger"
                        onClick={() => {
                          setUserMenuOpen(false);
                          // A full page load after sign-out is deliberate: it discards all client-side
                          // tenant state instead of carrying it into the login page.
                          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                          void fetch("/api/auth/logout", { method: "POST" }).finally(() => window.location.assign("/login"));
                        }}
                      />
                    </div>
                  </ToolbarPopover>
                ) : null}
              </div>
            </div>
          </header>
          {mobileSearchOpen ? (
            <div ref={mobileSearchBoxRef} className="fixed inset-0 z-[80] flex min-h-0 flex-col bg-[#F8FAF9] sm:hidden">
              <div className="flex shrink-0 items-center gap-2 border-b border-[#DCE5E1] bg-white px-3 py-2.5">
                <Search className="h-5 w-5 shrink-0 text-[#64748B]" aria-hidden="true" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Vehicle, document, owner..."
                  className="h-11 min-w-0 flex-1 rounded-md border border-[#CBD9D4] bg-[#F8FAFC] px-3 text-base text-[#1F2933] outline-none focus:border-[#0D2F2D] focus:bg-white focus:ring-2 focus:ring-[#0D2F2D]/10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#D7E2DC] bg-white text-[#64748B]"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {normalizedGlobalSearch.length >= 2 ? (
                  <GlobalSearchViewer
                    groups={globalSearchGroups}
                    mobileInline
                    query={searchTerm}
                    resultCount={globalSearchResultCount}
                    onClear={() => setSearchTerm("")}
                  />
                ) : (
                  <div className="px-5 py-8">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Global search</p>
                    <p className="mt-2 text-lg font-semibold text-[#0D2F2D]">Find what you need quickly.</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#64748B]">Type at least two characters to search vehicles, services, documents, open items and owners.</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
          {branding.banner ? (
            <div
              className="relative h-20 overflow-hidden border-b border-[#CAD9CF] bg-[#123C36] bg-cover bg-center px-4 text-white sm:h-24 xl:px-6"
              style={{ backgroundImage: `linear-gradient(90deg,rgba(13,47,45,.92),rgba(13,47,45,.25)),url(${branding.banner.dataUrl})`, backgroundPosition: `${branding.banner.positionX}% ${branding.banner.positionY}%`, backgroundSize: branding.banner.fit === "cover" ? "cover" : "contain" }}
            >
              <div className="mx-auto flex h-full max-w-[1560px] items-center gap-3">
                {branding.compactLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding.compactLogo.dataUrl} alt="" className="h-11 w-11 rounded-sm bg-white/90 object-contain p-1" />
                ) : null}
                <div><p className="text-[10px] font-black uppercase tracking-wide text-[#8BE4DF]">Organization workspace</p><p className="mt-1 text-lg font-black sm:text-xl">{clientName}</p></div>
              </div>
            </div>
          ) : null}

          <div className="p-3 pb-24 sm:p-4 sm:pb-24 xl:p-6 xl:pb-6">
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
                customFields={customFieldDefinitions.filter((field) => field.module === "assignments" && !field.archived)}
                worksitesList={visibleWorksites}
                onCustomFieldChange={updateWorksiteCustomField}
                onOpenPlanner={(worksite) => {
                  setWorksiteId(worksite.id);
                  showView("tomorrow");
                  emitConsoleToast(`${worksite.name}: opened in tomorrow's shift.`);
                }}
              />
            ) : null}
            {activeView === "machines" ? (
              <MachinesView
                assetColumnLayout={assetColumnLayout}
                customFields={customFieldDefinitions.filter((field) => field.module === "assets" && !field.archived)}
                machinesList={visibleMachines}
                onColumnLayoutChange={setAssetColumnLayout}
                onCustomFieldChange={updateMachineCustomField}
                onMachineOpen={openMachine}
              />
            ) : null}
            {activeView === "blockers" ? <ActionQueueView machinesList={visibleMachines} onActionStart={startMachineAction} onMachineOpen={openMachine} /> : null}
            {activeView === "certificates" ? (
              <DocumentsView
                customFields={customFieldDefinitions.filter((field) => field.module === "documents" && !field.archived)}
                machinesList={visibleMachines}
                onActionStart={startMachineAction}
                onCustomFieldChange={updateCertificateCustomField}
                onMachineOpen={(machine) => {
                  openMachine(machine, "passport", "documents");
                }}
              />
            ) : null}
            {activeView === "service" ? (
              <WorkshopView
                customFields={customFieldDefinitions.filter((field) => field.module === "service" && !field.archived)}
                machinesList={visibleMachines}
                onCustomFieldChange={updateServiceCustomField}
                onJobCreate={addWorkshopJob}
                onMachineOpen={(machine) => {
                  openMachine(machine, "passport", "service");
                }}
                onServiceStatusChange={updateServiceStatus}
              />
            ) : null}
            {activeView === "staff" ? (
              <StaffView
                customFields={customFieldDefinitions.filter((field) => field.module === "people" && !field.archived)}
                onCustomFieldChange={updateStaffCustomField}
                staffList={staffMembers}
              />
            ) : null}
            {activeView === "history" ? <ReleaseHistoryView searchTerm={searchTerm} /> : null}
            {activeView === "settings" ? (
              <SettingsView
                branding={branding}
                customFields={customFieldDefinitions}
                onBrandingChange={(nextBranding) => { setBranding(nextBranding); setVersion((current) => current + 1); }}
                onCustomFieldsChange={(fields) => { setCustomFieldDefinitions(fields); setVersion((current) => current + 1); }}
              />
            ) : null}
          </div>
        </div>

        {drawerOpen ? (
          <DetailDrawer
            customFields={customFieldDefinitions.filter((field) => field.module === "assets" && !field.archived && field.visibility.form)}
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
            onCustomFieldChange={(fieldId, value) => updateMachineCustomField(selectedMachine.id, fieldId, value)}
            passportTab={passportTab}
          />
        ) : null}
      </div>

      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fleet-overlay-backdrop fixed inset-0 z-30 bg-[#0D2F2D]/25 backdrop-blur-[1px] xl:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      {releaseModalOpen ? (
        <ReleaseModal
          machines={allPlannedMachines}
          onClose={() => setReleaseModalOpen(false)}
          onReleaseReady={() => releaseReadyMachines(allPlannedMachines)}
          onReviewBlocked={() => emitConsoleToast("Blocked vehicles appear in the shift check list.")}
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
  dateMode: "Today" | "Tomorrow" | "Customise";
  onDateModeChange: (mode: "Today" | "Tomorrow" | "Customise") => void;
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
  const blockedMachines = orderedMachines.filter((machine) => machine.state === "blocked");
  const filteredMachines = orderedMachines.filter((machine) => {
    const matchesState = machineListFilter === "all" || machine.state === machineListFilter;
    return matchesState && machineMatchesQuery(machine, machineListQuery);
  });
  const totalMachinePages = Math.max(1, Math.ceil(filteredMachines.length / machinePageSize));
  const safeMachinePage = Math.min(machinePage, totalMachinePages);
  const pagedMachines = filteredMachines.slice((safeMachinePage - 1) * machinePageSize, safeMachinePage * machinePageSize);
  const releaseTone = isReadyForRelease ? "border-[#15803D]" : "border-[#B91C1C]";
  const releaseButtonClass = isReadyForRelease
    ? "bg-[#0F172A] text-white shadow-sm hover:bg-[#1F2937]"
    : "bg-[#0D4B47] text-white shadow-sm hover:bg-[#123F3C]";
  const selectedDateLabel = dateMode === "Customise" ? formatPlannerDate(customDate) : dateMode;
  const listHeading =
    machineListFilter === "blocked"
      ? "Issues for tomorrow's shift"
      : machineListFilter === "at_risk"
        ? "Vehicles for review"
        : machineListFilter === "ready"
          ? "Ready vehicles"
          : "All vehicles";
  const listDescription =
    machineListFilter === "blocked"
      ? "Items needing action are shown first."
      : machineListFilter === "at_risk"
        ? counts.attention
          ? `${counts.attention} vehicles are waiting for review.`
          : "No vehicles are waiting for review."
        : machineListFilter === "ready"
          ? `${counts.ready} vehicles are ready for the route.`
          : `${counts.total} vehicles are booked on the shift.`;

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
    <ConsolePage>
      <ViewHeader title="Tomorrow's shift" description="The check before vehicles go out on the road." showActions={false} />

      <Surface className={`min-w-0 overflow-visible border-l-4 p-0 ${releaseTone}`}>
        <PanelHeader
          eyebrow="Pre-departure check"
          wrapActions
          title={isReadyForRelease ? "The morning collection can start" : "The morning collection cannot be closed"}
          description={
            isReadyForRelease
              ? `${selectedWorksite.name} · ${selectedDateLabel} · ${counts.total} vehicles · all ready`
              : `${selectedWorksite.name} · ${selectedDateLabel} · ${counts.total} vehicles · ${counts.blocked} issues before 17:00`
          }
          actions={(
            <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:items-center">
              <select
                value={worksiteId}
                onChange={(event) => onWorksiteChange(event.target.value)}
                className="h-11 w-full min-w-0 rounded-md border border-[#DDE7E3] bg-white px-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#0F172A] sm:min-w-64 xl:h-9 xl:w-auto"
                aria-label={"Work package"}
              >
                {worksites.map((worksite) => (
                  <option key={worksite.id} value={worksite.id}>
                    {worksite.name}
                  </option>
                ))}
              </select>
              <div ref={customDateRef} className="relative grid w-full grid-cols-3 rounded-md border border-[#DDE7E3] bg-white p-1 sm:inline-flex sm:w-auto">
                {(["Today", "Tomorrow", "Customise"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      onDateModeChange(mode);
                      setCustomDateOpen(mode === "Customise");
                    }}
                    className={`min-h-11 min-w-0 rounded px-2 text-[12px] font-semibold sm:min-h-9 sm:px-3 sm:text-[13px] ${
                      dateMode === mode ? "bg-[#0F172A] text-white" : "text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
                {customDateOpen ? (
                  <div className="fleet-popover-enter absolute right-0 top-12 z-50 w-72 rounded-lg border border-[#D7E2DC] bg-white p-4 shadow-[0_18px_50px_rgba(15,47,45,0.16)]">
                    <p className="text-[11px] font-bold uppercase text-[#008C95]">Shift date</p>
                    <p className="mt-1 text-sm font-semibold text-[#64748B]">Choose the day you want to check.</p>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(event) => {
                        setCustomDate(event.target.value);
                        onDateModeChange("Customise");
                      }}
                      className={overlayFieldClass}
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onDateModeChange("Tomorrow");
                          setCustomDateOpen(false);
                        }}
                        className="min-h-9 rounded-md border border-[#CBD9D4] bg-white px-3 text-[13px] font-bold text-[#374151] transition hover:bg-[#F8FAF9]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomDateOpen(false)}
                        className="min-h-9 rounded-md bg-[#0D2F2D] px-3 text-[13px] font-bold text-white transition hover:bg-[#123C38]"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isReadyForRelease) {
                    onRelease();
                    return;
                  }
                  if (blockedMachines[0]) onMachineOpen(blockedMachines[0], "why");
                }}
                className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-[13px] font-bold transition duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2 sm:col-span-2 xl:min-h-9 xl:w-auto ${releaseButtonClass}`}
              >
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                {isReadyForRelease ? `Lock ${counts.ready} ready` : `Resolve ${counts.blocked} issues`}
              </button>
            </div>
          )}
        />
        <div className="border-t border-[#E5E7EB] px-5 py-2.5">
          <MorningChangesSummary onHistoryOpen={onHistoryOpen} />
        </div>
        <div className="border-t border-[#E5E7EB]">
          <PanelHeader
            eyebrow="Shift list"
            title={listHeading}
            description={listDescription}
            actions={(
              <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
              <input
                type="search"
                value={machineListQuery}
                onChange={(event) => setMachineListQuery(event.target.value)}
                placeholder="Search vehicle or problem"
                className="h-11 w-full rounded-md border border-[#E5E7EB] bg-white pl-9 pr-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#0F172A] lg:h-9 lg:w-72"
              />
            </div>
            <div className="grid w-full grid-cols-2 gap-1 rounded-md border border-[#DCE5E1] bg-[#F8FAFC] p-1 sm:flex sm:w-auto">
              {([
                ["all", "All", "neutral", counts.total],
                ["blocked", "Open", "blocked", counts.blocked],
                ["at_risk", "For review", "attention", counts.attention],
                ["ready", "Ready", "ready", counts.ready],
              ] as Array<["all" | MachineState, string, "neutral" | "blocked" | "attention" | "ready", number]>).map(([value, label, tone, count]) => (
                <ActionQueueFilterChip
                  key={value}
                  active={machineListFilter === value}
                  label={label}
                  onClick={() => setMachineListFilter(value)}
                  tone={tone}
                  value={count}
                />
              ))}
            </div>
              </div>
            )}
          />
        </div>
        <div className="grid gap-3 bg-[#F8FAFC] p-3 lg:hidden">
          {pagedMachines.length ? (
            pagedMachines.map((machine) => (
              <RequiredMachineMobileCard key={machine.id} machine={machine} onMachineOpen={onMachineOpen} />
            ))
          ) : (
            <div className="rounded-md border border-dashed border-[#CBD5E1] bg-white px-4 py-8 text-center text-[13px] font-semibold text-[#64748B]">
              There are no vehicles in this category.
            </div>
          )}
        </div>
        <div className="hidden max-w-full overflow-x-auto lg:block">
          <table className="w-full min-w-[880px] table-fixed text-left text-[13px]">
                <colgroup>
                  <col className="w-[160px]" />
                  <col className="w-[260px]" />
                  <col className="w-[240px]" />
                  <col className="w-[120px]" />
                  <col className="w-[100px]" />
                </colgroup>
                <thead className="bg-[#F9FAFB] text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    {["Vehicle", "Issue", "Next action", "Owner", "Action"].map((heading) => {
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
                  {pagedMachines.length ? (
                    pagedMachines.map((machine) => (
                      <RequiredMachineTableRow key={machine.id} machine={machine} onMachineOpen={onMachineOpen} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-[13px] font-semibold text-[#64748B]">
                        There are no vehicles in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalMachinePages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-[#E5E7EB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] font-semibold text-[#64748B]">
                  Page {safeMachinePage} of {totalMachinePages}
                </p>
                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setMachinePage((page) => Math.max(1, page - 1))}
                    disabled={safeMachinePage === 1}
                    className="min-h-11 flex-1 rounded-md border border-[#E5E7EB] bg-white px-3 text-[13px] font-bold text-[#111827] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-8 sm:flex-none"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setMachinePage((page) => Math.min(totalMachinePages, page + 1))}
                    disabled={safeMachinePage === totalMachinePages}
                    className="min-h-11 flex-1 rounded-md border border-[#E5E7EB] bg-white px-3 text-[13px] font-bold text-[#111827] disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-8 sm:flex-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
      </Surface>
    </ConsolePage>
  );
}

function MorningChangesSummary({ onHistoryOpen }: { onHistoryOpen: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onHistoryOpen}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 text-[12px] font-bold text-[#475569] transition hover:text-[#0F172A] sm:min-h-0"
      >
        <History className="h-4 w-4" aria-hidden="true" />
        3 changes since yesterday
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function RequiredMachineMobileCard({
  machine,
  onMachineOpen,
}: {
  machine: Machine;
  onMachineOpen: (machine: Machine, mode?: DrawerMode) => void;
}) {
  const isBlocked = machine.state === "blocked";
  const isAttention = machine.state === "at_risk";
  const action = isBlocked ? "Resolve issue" : isAttention ? "Vehicle check" : "Open the file";
  const railTone = isBlocked ? "border-l-[#DC2626]" : isAttention ? "border-l-[#D97706]" : "border-l-[#16A34A]";

  return (
    <article className={`rounded-md border border-[#E2E8F0] border-l-4 bg-white p-4 shadow-sm ${railTone}`}>
      <button
        type="button"
        onClick={() => onMachineOpen(machine, isBlocked ? "why" : "passport")}
        className="flex min-h-11 w-full items-start justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-base font-black text-[#111827]">{machine.code}</span>
          <span className="mt-1 block text-xs font-semibold leading-5 text-[#64748B]">{machine.name}</span>
        </span>
        <StatusPill state={machine.state} />
      </button>

      <div className="mt-3 border-t border-[#E2E8F0] pt-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#64748B]">Issue</p>
        <p className={`mt-1 text-sm font-bold leading-5 ${isBlocked ? "text-[#991B1B]" : "text-[#1F2937]"}`}>{machine.reason}</p>
      </div>

      <div className="mt-3 rounded-md bg-[#F8FAFC] p-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#64748B]">Next action</p>
        <p className="mt-1 text-sm font-semibold leading-5 text-[#1F2937]">{machine.nextAction === "-" ? "No action" : machine.nextAction}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-[#64748B]">Owner</p>
          <p className="mt-1 text-sm font-bold text-[#0D2F2D]">{machine.owner}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-[#64748B]">Due</p>
          <p className="mt-1 text-sm font-bold text-[#0D2F2D]">{machine.eta === "-" ? "Not required" : machine.eta}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onMachineOpen(machine, isBlocked ? "why" : "passport")}
        className={`mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 text-sm font-black transition active:translate-y-px ${
          isBlocked
            ? "bg-[#FDE7E7] text-[#991B1B] hover:bg-[#FBD1D1]"
            : isAttention
              ? "bg-[#FFF4D8] text-[#92400E] hover:bg-[#FDE68A]"
              : "bg-[#EAF7EF] text-[#166534] hover:bg-[#DCFCE7]"
        }`}
      >
        {action}
      </button>
    </article>
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
  const statusLabel = machine.state === "ready" ? "Going out" : isAttention ? "For review" : "Not going out";
  const statusText = isBlocked ? "text-[#B91C1C]" : isAttention ? "text-[#B45309]" : "text-[#15803D]";
  const railTone = isBlocked ? "border-l-[#DC2626]" : isAttention ? "border-l-[#D97706]" : "border-l-transparent";
  const action = isBlocked ? "Resolve" : isAttention ? "Check" : "File";

  return (
    <tr className="border-b border-[#E5E7EB] bg-white last:border-0">
      <td className={`border-l-4 px-4 py-3 ${railTone}`}>
        <button type="button" onClick={() => onMachineOpen(machine, isBlocked ? "why" : "passport")} className="text-left">
          <span className="block text-[13px] font-bold text-[#111827]">{machine.code}</span>
          <span className="mt-1 block text-[11px] font-semibold leading-4 text-[#6B7280]">{machine.name}</span>
          <span className={`mt-2 block text-[11px] font-black uppercase ${statusText}`}>{statusLabel}</span>
        </button>
      </td>
      <td className={`px-4 py-3 font-bold ${isBlocked ? "text-[#991B1B]" : "text-[#374151]"}`}>{machine.reason}</td>
      <td className="px-4 py-3 font-semibold text-[#1F2937]">{machine.nextAction === "-" ? "No action" : machine.nextAction}</td>
      <td className="px-4 py-3 text-[#374151]">
        <span className="block font-semibold">{machine.owner}</span>
        <span className="mt-1 block text-[11px] font-semibold text-[#64748B]">{machine.eta}</span>
      </td>
      <td className="px-4 py-3 text-left">
        <button
          type="button"
          onClick={() => onMachineOpen(machine, isBlocked ? "why" : "passport")}
          className={`inline-flex min-h-8 min-w-[82px] items-center justify-center rounded-md px-3 text-[12px] font-bold transition duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2 ${
            isBlocked
              ? "bg-[#FDE7E7] text-[#991B1B] hover:bg-[#FBD1D1]"
              : isAttention
                ? "bg-[#FFF4D8] text-[#92400E] hover:bg-[#FDE68A]"
                : "bg-[#EAF7EF] text-[#166534] hover:bg-[#DCFCE7]"
          }`}
        >
          {action}
        </button>
      </td>
    </tr>
  );
}

function MachineStatusBadge({ state }: { state: MachineState }) {
  const label = state === "ready" ? "Ready" : state === "at_risk" ? "Needs review" : "Blocked";
  return (
    <span className={`inline-flex min-w-[104px] items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase whitespace-nowrap ${statusClasses(state)}`}>
      {label}
    </span>
  );
}

function DetailDrawer({
  customFields,
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
  onCustomFieldChange,
  passportTab,
}: {
  customFields: CustomFieldDefinition[];
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
  onCustomFieldChange: (fieldId: string, value: unknown) => void;
  passportTab: PassportTab;
}) {
  useOverlayEscape(onClose);

  return (
    <div
      className="fleet-overlay-backdrop fixed inset-x-0 bottom-0 top-16 z-[60] flex justify-end bg-[#0D2F2D]/32 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-drawer-title"
        className="fleet-drawer-enter flex h-full w-full max-w-[560px] flex-col overflow-hidden border-l border-[#D7E2DC] bg-white shadow-[0_24px_70px_rgba(15,47,45,0.24)]"
      >
        <OverlayHeader
          eyebrow={mode === "why" ? "Tomorrow's shift check" : "Vehicle file"}
          title={`${machine.code} · ${machine.name}`}
          titleId="vehicle-drawer-title"
          description={`${machineWorksite(machine).name} · ${externalStatus(machine.state)}`}
          onClose={onClose}
        />
        <div className="shrink-0 border-b border-[#DCE5E1] bg-[#FBFCFA] px-5 py-3 sm:px-6">
          <OverlayTabs
            active={mode}
            items={[
              { key: "why", label: "Departure check" },
              { key: "passport", label: "Vehicle file" },
            ]}
            onChange={(key) => onModeChange(key as DrawerMode)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
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
              customFields={customFields}
              machine={machine}
              onCustomFieldChange={onCustomFieldChange}
              onExportPassport={onExportPassport}
              onPassportTabChange={onPassportTabChange}
              onUploadDocument={onUploadDocument}
              passportTab={passportTab}
            />
          ) : null}
        </div>
      </aside>
    </div>
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
      title: certificate.status === "Missing" ? "Document item" : "Certificate item",
      status: certificate.status,
      summary:
        certificate.status === "Missing"
          ? `Missing: ${certificate.name}.`
          : `${certificate.name} ${certificate.status.toLowerCase()}${certificate.expiry !== "Required" ? ` on ${certificate.expiry}` : ""}.`,
      primaryAction: "Upload to the file",
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
      title: "Workshop issue",
      status: service.due === "Today" ? "Expires today" : service.status,
      summary: service.issue,
      primaryAction: "Complete job",
      lines: [
        ["Job", service.issue],
        ["Owner", service.owner],
        ["Assignment", service.assignmentStatus ?? "Unassigned"],
        ["Due", service.due],
        ["Next step", "Complete workshop job"],
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
          {machine.code} can be locked for tomorrow. {machine.reason}.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <StatusPill state={machine.state} />
      <div className="mt-5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4">
        <p className="text-sm font-bold text-[#B91C1C]">
          This vehicle will stop {machineWorksite(machine).name} tomorrow because:
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
                className="min-h-10 rounded-md border border-[#CBD9D4] bg-white px-3 text-xs font-bold text-[#0D2F2D] transition hover:bg-[#F8FAF9]"
              >
                Assignment
              </button>
              <button
                type="button"
                onClick={() => (card.kind === "certificate" ? onUploadDocument(card.id) : onCompleteAction(card.id))}
                className="min-h-10 rounded-md bg-[#0D2F2D] px-3 text-xs font-bold text-white transition hover:bg-[#123C38]"
              >
                {card.primaryAction}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onOpenPassport} className="min-h-11 rounded-md border border-[#CBD9D4] bg-white px-3 text-sm font-bold text-[#0D2F2D] transition hover:bg-[#F8FAF9]">
          Open the vehicle file
        </button>
        <button type="button" onClick={onReleaseOverride} className="min-h-11 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 text-sm font-bold text-[#92400e] transition hover:bg-[#FEF3C7]">
          Approved by exception
        </button>
      </div>
    </div>
  );
}

function MachinePassport({
  customFields,
  machine,
  onCustomFieldChange,
  onExportPassport,
  onPassportTabChange,
  onUploadDocument,
  passportTab,
}: {
  customFields: CustomFieldDefinition[];
  machine: Machine;
  onCustomFieldChange: (fieldId: string, value: unknown) => void;
  onExportPassport: () => void;
  onPassportTabChange: (tab: PassportTab) => void;
  onUploadDocument: (blockerId?: string) => void;
  passportTab: PassportTab;
}) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between gap-3">
        <StatusPill state={machine.state} />
        <button type="button" onClick={onExportPassport} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#CBD9D4] bg-white px-3 text-sm font-bold text-[#0D2F2D] transition hover:bg-[#F8FAF9]">
          <Download className="h-4 w-4" aria-hidden="true" />
          Export the file
        </button>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#64748B]">Everything needed to show whether this vehicle can go out tomorrow.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          ["Type", machine.type],
          ["Plate/serial", machine.serial],
          ["Current service", machineWorksite(machine).name],
          ["Assignment owner", machine.owner],
          ["Last updated", machine.lastUpdated],
          ["Ownership", machine.ownership],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <p className="text-xs font-bold uppercase text-[#64748B]">{label}</p>
            <p className="mt-1 text-sm font-bold text-[#1F2933]">{value}</p>
          </div>
        ))}
      </div>
      {customFields.length ? (
        <section className="mt-5 border-t border-[#E2E8F0] pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase text-[#008C95]">Organization data</p>
              <h3 className="mt-1 font-black text-[#0D2F2D]">Custom asset fields</h3>
            </div>
            <span className="text-xs font-semibold text-[#64748B]">Saved with this asset</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[...customFields].sort((left, right) => left.order - right.order).map((field) => (
              <label key={field.id} className="block text-[11px] font-black uppercase text-[#64748B]">
                {field.name}
                <CustomFieldInput
                  field={field}
                  value={machine.customFields?.[field.id]}
                  onChange={(value) => onCustomFieldChange(field.id, value)}
                />
                {field.description ? <span className="mt-1 block normal-case font-medium leading-4 text-[#8A9A96]">{field.description}</span> : null}
              </label>
            ))}
          </div>
        </section>
      ) : null}
      <div className="mt-5">
        <OverlayTabs
          active={passportTab}
          items={passportTabs}
          onChange={(key) => onPassportTabChange(key as PassportTab)}
        />
      </div>
      <div className="mt-5">
        {passportTab === "overview" ? <PassportOverview machine={machine} /> : null}
        {passportTab === "documents" ? <PassportDocuments machine={machine} onUploadDocument={onUploadDocument} /> : null}
        {passportTab === "service" ? <ServiceCards machine={machine} /> : null}
        {passportTab === "issues" ? <SimpleRows rows={machine.issues.map((issue) => [issue.title, issue.severity, issue.status])} empty="There are no open issues." /> : null}
        {passportTab === "photos" ? <SimpleRows rows={machine.photos.map((photo) => [photo.title, photo.category, photo.date])} empty="No photos have been uploaded." /> : null}
        {passportTab === "history" ? <SimpleRows rows={releaseHistory.filter((item) => item.machine === machine.code).map((item) => [item.date, item.result, item.reason])} empty="There is no decision history yet." /> : null}
      </div>
    </div>
  );
}

function PassportDocuments({ machine, onUploadDocument }: { machine: Machine; onUploadDocument: (blockerId?: string) => void }) {
  const identityDocuments = [
    ["Vehicle licence", "Identity", "Valid"],
    ["Insurance file", "Insurance", "Valid"],
    ["Driver / operator assignment", "Service", "Updated today"],
  ];

  return (
    <div className="space-y-4">
      <section>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Identity files</p>
        <SimpleRows rows={identityDocuments} />
      </section>
      <section>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Shift documents</p>
        <CertificateCards machine={machine} onUploadDocument={onUploadDocument} />
      </section>
    </div>
  );
}

function PassportOverview({ machine }: { machine: Machine }) {
  return (
    <div className="space-y-3">
      {[
        ["Current shift status", externalStatus(machine.state)],
        ["Open items", machine.activeBlockers],
        ["Upcoming expiries", machine.certificates.find((certificate) => certificate.status !== "Valid")?.expiry ?? "None"],
        ["Last workshop job", machine.service[0]?.issue ?? "No open workshop item"],
        ["Last shift decision", machine.reason],
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
              Upload to the file
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceCards({ machine }: { machine: Machine }) {
  if (!machine.service.length) return <p className="text-sm font-semibold text-[#64748B]">There are no workshop items.</p>;
  return (
    <div className="space-y-3">
      {machine.service.map((item) => (
        <div key={item.issue} className="rounded-lg border border-[#E2E8F0] p-3">
          <h3 className="text-sm font-bold text-[#0D2F2D]">{item.issue}</h3>
          <p className="mt-2 text-sm text-[#64748B]">
            Severity: {item.severity} · Blocks the shift: {item.blocksRelease ? "Yes" : "No"}
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            Owner: {item.owner} · Due: {item.due} · Status: {item.status}
          </p>
        </div>
      ))}
    </div>
  );
}

function SimpleRows({ empty = "There are no records.", rows }: { empty?: string; rows: string[][] }) {
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
  const [notifyChannels, setNotifyChannels] = useState<string[]>(["In the app"]);
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
  const canSubmitOverride = overrideReason.trim().length >= 8 && approver.trim().length > 1 && acceptedUntil.trim().length > 1 && confirmation === "APPROVE";
  const uploadSource = action.type === "upload-document" ? action.source ?? "passport" : undefined;
  const uploadTitle =
    uploadSource === "action-queue"
      ? "Resolve by uploading proof"
      : uploadSource === "documents"
        ? "Upload proof"
        : "Upload to the file";
  const uploadDescription =
    uploadSource === "action-queue"
      ? "Upload the proof that clears this shift action. The document and the vehicle file are updated together."
      : uploadSource === "documents"
        ? "Add or renew proof in the document review. The matching shift actions and the vehicle file are updated together."
        : "Link proof to this vehicle file. The document and the shift action are updated from the same upload.";
  const uploadSubmitLabel =
    uploadSource === "action-queue"
      ? "Upload and resolve"
      : uploadSource === "documents"
        ? "Upload proof"
        : "Upload to the file";

  const title =
    action.type === "assign-owner"
      ? "Assign an owner"
      : action.type === "complete-action"
        ? "Complete the open item"
        : action.type === "upload-document"
          ? uploadTitle
          : "Approved by exception";
  const description =
    action.type === "assign-owner"
      ? "Choose who takes the item and when the next action is due."
      : action.type === "complete-action"
        ? "Close one item at a time so the shift status stays clear."
        : action.type === "upload-document"
          ? uploadDescription
          : "Exceptions need an approver, an end date, a reason and a typed confirmation.";

  return (
    <div
      className="fleet-overlay-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-[#0D2F2D]/45 p-2 backdrop-blur-[1px] sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-action-title"
        className="fleet-dialog-enter flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-[#D7E2DC] bg-white shadow-[0_24px_70px_rgba(15,47,45,0.24)]"
      >
        <OverlayHeader
          eyebrow={machine.code}
          title={title}
          titleId="drawer-action-title"
          description={description}
          onClose={onClose}
        />
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {action.type !== "override" ? (
            <label className="block">
              <span className="text-xs font-bold uppercase text-[#64748B]">Open item</span>
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
                <span className="text-xs font-bold uppercase text-[#64748B]">Notification</span>
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
                <p className="mt-2 text-xs font-semibold text-[#64748B]">The assignment is recorded and sent through the selected channels.</p>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Note</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional note for the owner"
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
                <p className="text-sm font-bold text-[#0F766E]">One upload updates the documents, the vehicle file, the open items and the decision history.</p>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Proof name</span>
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
	                {selectedEvidenceFile ? selectedEvidenceFile.name : "Choose a proof file"}
	                <input
	                  type="file"
	                  aria-label="Choose a proof file"
	                  className="sr-only"
	                  onChange={(event) => setSelectedEvidenceFile(event.target.files?.[0] ?? null)}
	                />
	              </label>
            </>
          ) : null}

          {action.type === "override" ? (
            <>
              <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] p-3">
                <p className="text-sm font-bold text-[#B91C1C]">This approves a blocked vehicle with a decision record. Use it only when the service accepts the risk.</p>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Exception reason</span>
                <textarea
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  placeholder="Why approve while items are still open?"
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
                  <span className="text-xs font-bold uppercase text-[#64748B]">Valid until</span>
                  <input
                    value={acceptedUntil}
                    onChange={(event) => setAcceptedUntil(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm font-semibold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#64748B]">Type APPROVE to confirm</span>
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-md border border-[#E2E8F0] px-3 text-sm font-bold text-[#1F2933] outline-none focus:border-[#0D2F2D]"
                />
              </label>
            </>
          ) : null}
        </div>
        <OverlayFooter>
          <button type="button" onClick={onClose} className={overlaySecondaryActionClass}>
            Cancel
          </button>
          {action.type === "assign-owner" ? (
            <button
              type="button"
              disabled={!canSubmitAssign}
              onClick={() => onAssign(owner.trim(), blockerId || undefined, dueIso, note.trim(), dueOverdue ? "Overdue" : assignmentStatus, notifyChannels)}
              className={overlayPrimaryActionClass}
            >
              Assign an owner
            </button>
          ) : null}
          {action.type === "complete-action" ? (
            <button
              type="button"
              disabled={!canSubmitComplete}
              onClick={() => onComplete(blockerId, note.trim() || "The action was completed")}
              className={`${overlayPrimaryActionClass} bg-[#166534] hover:bg-[#14532D]`}
            >
              Complete
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
	                      documentCategory: selectedBlocker?.kind === "certificate" ? selectedBlocker.title : "Safety document",
	                      documentTitle: documentName.trim(),
	                      expiresAt: dateInputFromLabel(expiryDate.trim()),
	                    });
	                  }
	                  onUpload(blockerId, documentName.trim(), expiryDate.trim());
	                } catch (error) {
	                  emitConsoleToast(error instanceof Error ? error.message : "The upload failed.");
	                } finally {
	                  setIsUploadingEvidence(false);
	                }
	              }}
	              className={overlayPrimaryActionClass}
	            >
	              {isUploadingEvidence ? "Uploading..." : uploadSubmitLabel}
	            </button>
          ) : null}
          {action.type === "override" ? (
            <button
              type="button"
              disabled={!canSubmitOverride}
              onClick={() => onOverride(overrideReason.trim(), approver.trim(), acceptedUntil.trim())}
              className={`${overlayPrimaryActionClass} bg-[#B45309] hover:bg-[#92400E]`}
            >
              Approved by exception
            </button>
          ) : null}
        </OverlayFooter>
      </section>
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
    <div
      className="fleet-overlay-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-[#0D2F2D]/45 p-2 backdrop-blur-[1px] sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-review-title"
        className="fleet-dialog-enter flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-[#D7E2DC] bg-white shadow-[0_24px_70px_rgba(15,47,45,0.24)]"
      >
        <OverlayHeader
          eyebrow="Lock the shift"
          title="Check before locking"
          titleId="release-review-title"
          description="Confirm which vehicles start and which stay off shift."
          onClose={onClose}
        />
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-3 overflow-hidden rounded-md border border-[#DCE5E1]">
            <div className="bg-[#F0FDF4] px-4 py-3 text-[#15803D]">
              <p className="text-[11px] font-bold uppercase">Ready</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{ready}</p>
            </div>
            <div className="border-x border-[#DCE5E1] bg-[#FFFBEB] px-4 py-3 text-[#B45309]">
              <p className="text-[11px] font-bold uppercase">For review</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{attention}</p>
            </div>
            <div className="bg-[#FEF2F2] px-4 py-3 text-[#B91C1C]">
              <p className="text-[11px] font-bold uppercase">Not starting</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{blocked}</p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto rounded-md border border-[#DCE5E1]">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-xs font-bold uppercase text-[#64748B]">
                <tr>
                  {["Vehicle", "Outcome", "Reason", "Required action"].map((heading) => (
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
          <div className="mt-5 border-l-4 border-[#D97706] bg-[#FFFBEB] px-4 py-3">
            <p className="text-sm font-bold text-[#92400E]">Exceptions are approved per vehicle.</p>
            <p className="mt-1 text-sm leading-5 text-[#92400E]">They need a reason, an approver and an end time before they are written to the history.</p>
          </div>
        </div>
        <OverlayFooter>
          <button type="button" onClick={onClose} className={overlaySecondaryActionClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onReviewBlocked();
              onClose();
            }}
            className={overlaySecondaryActionClass}
          >
            Check vehicles that are not starting
          </button>
          <button type="button" onClick={onReleaseReady} className={`${overlayPrimaryActionClass} bg-[#166534] hover:bg-[#14532D]`}>
            Lock {ready} ready
          </button>
        </OverlayFooter>
      </section>
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
    type === "Vehicle"
      ? "e.g. RT-30 new refuse truck"
      : type === "Work package"
        ? "e.g. Port facility extension"
        : type === "Check / document"
          ? "e.g. roadworthiness test or driver assignment"
          : type === "Workshop issue"
            ? "e.g. Waiting on a part"
            : "e.g. Insurance document";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fleet-overlay-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-[#0D2F2D]/45 p-2 backdrop-blur-[1px] sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-title"
        className="fleet-dialog-enter flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-[#D7E2DC] bg-white shadow-[0_24px_70px_rgba(15,47,45,0.24)]"
      >
        <OverlayHeader
          eyebrow={type}
          title="New record"
          titleId="add-item-title"
          description="Enter the basic name. The rest can be added later."
          onClose={onClose}
        />
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            onAdd(type, name);
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <label className={overlayLabelClass} htmlFor="add-item-name">
              Record name
            </label>
            <input
              id="add-item-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={placeholder}
              className={overlayFieldClass}
              autoFocus
            />
          </div>
          <OverlayFooter>
            <button type="button" onClick={onClose} className={overlaySecondaryActionClass}>
              Cancel
            </button>
            <button type="submit" disabled={!name.trim()} className={overlayPrimaryActionClass}>
              Add
            </button>
          </OverlayFooter>
        </form>
      </section>
    </div>
  );
}

function WorksitesView({
  customFields,
  onCustomFieldChange,
  onOpenPlanner,
  worksitesList,
}: {
  customFields: CustomFieldDefinition[];
  onCustomFieldChange: (worksiteId: string, fieldId: string, value: unknown) => void;
  onOpenPlanner: (worksite: Worksite) => void;
  worksitesList: Worksite[];
}) {
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
    <ConsolePage>
      <ViewHeader
        title="Work packages"
        description="Which jobs start tomorrow and what needs action today."
        showActions={false}
      />
      <Surface className="overflow-hidden p-0">
        <PanelHeader
          eyebrow="Service readiness"
          title="What needs attention before the shift closes"
          actions={(
            <>
            <MetricChip tone="blocked">{blockedSites} not starting</MetricChip>
            <MetricChip tone="attention">{reviewSites} for review</MetricChip>
            <MetricChip tone="ready">{readySites} ready</MetricChip>
            </>
          )}
        />
        <div className="grid gap-3 bg-[#F8FAFC] p-4 xl:grid-cols-3">
          {sortedRows.map(({ counts, mainBlocker, worksite }) => {
            const state: MachineState = counts.blocked ? "blocked" : counts.attention ? "at_risk" : "ready";
            const stateLabel = state === "ready" ? "Ready" : state === "at_risk" ? "For review" : "Not starting";
            const readyWidth = counts.total ? (counts.ready / counts.total) * 100 : 0;
            return (
              <button
                key={worksite.id}
                type="button"
                onClick={() => setReviewWorksite(worksite)}
                className="group flex min-h-[220px] flex-col rounded-md border border-[#E2E8F0] bg-white p-4 text-left transition hover:border-[#9CB8B4] hover:shadow-sm"
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#0D2F2D]">{worksite.name}</p>
                    <p className="mt-1 text-xs font-semibold text-[#64748B]">{worksite.location}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusClasses(state)}`}>
                    {stateLabel}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-[#475569]">
                    <span>Ready vehicles</span>
                    <span>{counts.ready}/{counts.total}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div className="h-full rounded-full bg-[#008C95]" style={{ width: `${readyWidth}%` }} />
                  </div>
                </div>
                <div className="mt-4 flex-1">
                  <p className="text-sm font-bold leading-5 text-[#1F2933]">
                    {mainBlocker ? `${mainBlocker.code}: ${mainBlocker.reason}` : "No action needed"}
                  </p>
                  {mainBlocker ? <p className="mt-1 text-xs font-semibold text-[#64748B]">{mainBlocker.owner} · {mainBlocker.nextAction}</p> : null}
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#0D5D59]">
                  Open service <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </Surface>
      <CustomDataSection
        fields={customFields}
        title="Job and assignment fields"
        records={sortedRows.map(({ worksite }) => ({
          id: worksite.id,
          label: worksite.name,
          meta: `${worksite.location} · ${worksite.date}`,
          values: worksite.customFields,
        }))}
        onChange={onCustomFieldChange}
      />
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
    </ConsolePage>
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
  useOverlayEscape(onClose);

  return (
    <div
      className="fleet-overlay-backdrop fixed inset-x-0 bottom-0 top-16 z-[60] flex justify-end bg-[#0D2F2D]/32 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-review-title"
        className="fleet-drawer-enter flex h-full w-full max-w-[560px] flex-col overflow-hidden border-l border-[#D7E2DC] bg-white shadow-[0_24px_70px_rgba(15,47,45,0.24)]"
      >
        <OverlayHeader
          eyebrow="Service readiness check"
          title={worksite.name}
          titleId="service-review-title"
          description={`${worksite.date} · ${worksite.location}`}
          onClose={onClose}
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className={`rounded-lg border p-4 ${canRelease ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#FECACA] bg-[#FEF2F2]"}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Tomorrow&apos;s shift check</p>
            <p className={`mt-2 text-lg font-bold ${canRelease ? "text-[#15803D]" : "text-[#B91C1C]"}`}>
              {canRelease ? "Will start" : "Will not start"}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#475569]">
              {canRelease ? "No vehicles are stopping this service." : `${counts.blocked} open items must be closed before the service can start.`}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-[#E5E7EB] text-sm font-bold">
            <div className="bg-[#F0FDF4] px-3 py-3 text-[#15803D]">
              <p className="text-[11px] uppercase">Ready</p>
              <p className="mt-1 text-xl">{counts.ready}</p>
            </div>
            <div className="border-x border-[#E5E7EB] bg-[#FFFBEB] px-3 py-3 text-[#B45309]">
              <p className="text-[11px] uppercase">Check</p>
              <p className="mt-1 text-xl">{counts.attention}</p>
            </div>
            <div className="bg-[#FEF2F2] px-3 py-3 text-[#B91C1C]">
              <p className="text-[11px] uppercase">Not starting</p>
              <p className="mt-1 text-xl">{counts.blocked}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#111827]">Owner actions</h3>
              <span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-xs font-bold text-[#64748B]">{ownerActions.length} open</span>
            </div>
            <div className="mt-3 overflow-hidden rounded-md border border-[#DCE5E1] bg-white divide-y divide-[#E2E8F0]">
              {ownerActions.length ? (
                ownerActions.map((item) => (
                  <div
                    key={item.id}
                    className={`border-l-4 p-3 ${item.state === "blocked" ? "border-l-[#DC2626] bg-[#FFF9F9]" : "border-l-[#D97706] bg-[#FFFDF6]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#111827]">{item.code}</p>
                        <p className={item.state === "blocked" ? "mt-1 text-sm font-bold text-[#B91C1C]" : "mt-1 text-sm font-bold text-[#B45309]"}>{item.reason}</p>
                      </div>
                      <span className="shrink-0 rounded-md border border-[#DCE5E1] bg-white px-2 py-1 text-xs font-bold text-[#475569]">{item.eta}</span>
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase text-[#64748B]">Owner</p>
                    <p className="mt-1 text-sm font-semibold text-[#1F2933]">
                      {item.owner} · {item.action}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm font-semibold text-[#15803D]">No owner action is needed before the shift locks.</div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-bold text-[#111827]">Required vehicles</h3>
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

        <OverlayFooter>
          <button type="button" onClick={onClose} className={overlaySecondaryActionClass}>
            Close
          </button>
          <button type="button" onClick={onOpenPlanner} className={overlayPrimaryActionClass}>
            Open tomorrow&apos;s shift
          </button>
        </OverlayFooter>
      </aside>
    </div>
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

  return photoMap[machine.id] ?? photoMap.cr04;
}

function MachinesView({
  assetColumnLayout,
  customFields,
  machinesList,
  onColumnLayoutChange,
  onCustomFieldChange,
  onMachineOpen,
}: {
  assetColumnLayout: AssetColumnLayout[];
  customFields: CustomFieldDefinition[];
  machinesList: Machine[];
  onColumnLayoutChange: (layout: AssetColumnLayout[]) => void;
  onCustomFieldChange: (machineId: string, fieldId: string, value: unknown) => void;
  onMachineOpen: (machine: Machine, mode?: DrawerMode) => void;
}) {
  const [photoUploads, setPhotoUploads] = useState<Record<string, string>>({});
  const [columnControlsOpen, setColumnControlsOpen] = useState(false);
  const [sortFieldId, setSortFieldId] = useState<string>("code");
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
      emitConsoleToast(`${machine.code}: the photo was uploaded.`);
    } catch (error) {
      emitConsoleToast(error instanceof Error ? error.message : `${machine.code}: the photo upload failed.`);
    }
  }

  const systemColumns = [
    { id: "code", label: "Asset", width: 120 },
    { id: "name", label: "Description", width: 230 },
    { id: "state", label: "Readiness", width: 140 },
    { id: "owner", label: "Owner", width: 160 },
  ];
  const allColumns = [
    ...systemColumns,
    ...customFields.filter((field) => field.visibility.table).map((field) => ({ id: `custom:${field.id}`, label: field.name, width: field.width })),
  ];
  const resolvedLayout = allColumns.map((column, index) => assetColumnLayout.find((item) => item.id === column.id) ?? { id: column.id, width: column.width, hidden: false, order: index });
  const visibleColumns = allColumns
    .filter((column) => !resolvedLayout.find((item) => item.id === column.id)?.hidden)
    .sort((left, right) => (resolvedLayout.find((item) => item.id === left.id)?.order ?? 0) - (resolvedLayout.find((item) => item.id === right.id)?.order ?? 0));
  const orderedColumns = [...allColumns]
    .sort((left, right) => (resolvedLayout.find((item) => item.id === left.id)?.order ?? 0) - (resolvedLayout.find((item) => item.id === right.id)?.order ?? 0));
  const sortedMachines = [...machinesList].sort((left, right) => {
    if (sortFieldId.startsWith("custom:")) {
      const fieldId = sortFieldId.slice(7);
      return String(left.customFields?.[fieldId] ?? "").localeCompare(String(right.customFields?.[fieldId] ?? ""), undefined, { numeric: true });
    }
    return String(left[sortFieldId as "code" | "name" | "state" | "owner"] ?? "").localeCompare(String(right[sortFieldId as "code" | "name" | "state" | "owner"] ?? ""), undefined, { numeric: true });
  });

  function updateColumn(columnId: string, patch: Partial<AssetColumnLayout>) {
    const current = resolvedLayout.find((item) => item.id === columnId) ?? { id: columnId, width: 150, hidden: false, order: resolvedLayout.length };
    onColumnLayoutChange([...resolvedLayout.filter((item) => item.id !== columnId), { ...current, ...patch }]);
  }

  function moveColumn(columnId: string, direction: -1 | 1) {
    const ids = orderedColumns.map((column) => column.id);
    const currentIndex = ids.indexOf(columnId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ids.length) return;
    [ids[currentIndex], ids[targetIndex]] = [ids[targetIndex], ids[currentIndex]];
    onColumnLayoutChange(resolvedLayout.map((item) => ({ ...item, order: ids.indexOf(item.id) })));
  }

  function exportMachines(format: "csv" | "xlsx") {
    const columns: Array<ExportColumn<Machine>> = [
      { header: "Asset", value: (machine) => machine.code },
      { header: "Description", value: (machine) => machine.name },
      { header: "Readiness", value: (machine) => externalStatus(machine.state) },
      { header: "Owner", value: (machine) => machine.owner },
      ...customFields.filter((field) => field.visibility.export).sort((left, right) => left.order - right.order).map((field) => ({
        header: field.name,
        value: (machine: Machine) => customFieldDisplayValue(field, machine.customFields?.[field.id]),
      })),
    ];
    const date = new Date().toISOString().slice(0, 10);
    if (format === "csv") downloadCsvFile(`fleetlever-assets-${date}.csv`, sortedMachines, columns);
    else downloadXlsxFile(`fleetlever-assets-${date}.xlsx`, sortedMachines, columns);
  }

  return (
    <ConsolePage>
      <ViewHeader
        title="Vehicles"
        description="Status, open items and file for every vehicle."
        exportLabel="Export vehicle list"
        exportActions={[
          { label: "CSV", onClick: () => exportMachines("csv") },
          { label: "XLSX", onClick: () => exportMachines("xlsx") },
        ]}
      />
      <Surface className="overflow-hidden p-0">
        <PanelHeader
          eyebrow="Fleet status"
          title="Vehicles by status"
          description="Vehicles that are stopping or need review are shown first."
          actions={(
            <>
              <MetricChip tone="blocked">{grouped.blocked.length} not going out</MetricChip>
              <MetricChip tone="attention">{grouped.at_risk.length} for review</MetricChip>
              <MetricChip tone="ready">{grouped.ready.length} ready</MetricChip>
            </>
          )}
        />
        <div className="grid gap-4 bg-[#F8FAFC] p-4 xl:grid-cols-3">
        {[
          ["Blocked", grouped.blocked, "blocked"],
          ["Need review", grouped.at_risk, "at_risk"],
          ["Ready", grouped.ready, "ready"],
        ].map(([label, list, state]) => (
          <section key={label as string} className={`min-w-0 overflow-hidden rounded-md border border-[#E2E8F0] border-t-2 bg-white ${columnToneClasses(state as MachineState)}`}>
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
          </section>
        ))}
        </div>
      </Surface>
      <Surface className="overflow-hidden p-0">
        <PanelHeader
          eyebrow="Custom columns"
          title="Operational asset data"
          description="Edit organization-specific values here. Tap a heading to sort."
          actions={(
            <button type="button" onClick={() => setColumnControlsOpen((open) => !open)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#CBD9D4] bg-white px-4 text-sm font-bold text-[#0D2F2D]">
              <Settings className="h-4 w-4" /> Columns
            </button>
          )}
        />
        {columnControlsOpen ? (
          <div className="grid gap-3 border-b border-[#E2E8F0] bg-[#F8FAF9] p-4 sm:grid-cols-2 xl:grid-cols-3">
            {orderedColumns.map((column, columnIndex) => {
              const layout = resolvedLayout.find((item) => item.id === column.id)!;
              return (
                <div key={column.id} data-column-control={column.id} className="flex items-center gap-2 rounded-md border border-[#D7E2DE] bg-white p-3">
                  <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold"><input type="checkbox" checked={!layout.hidden} onChange={(event) => updateColumn(column.id, { hidden: !event.target.checked })} /><span className="truncate">{column.label}</span></label>
                  <div className="inline-flex overflow-hidden rounded-md border border-[#D7E2DE] bg-[#F8FAF9]">
                    <button type="button" aria-label={`Move ${column.label} left`} disabled={columnIndex === 0} onClick={() => moveColumn(column.id, -1)} className="grid h-9 w-9 place-items-center border-r border-[#D7E2DE] text-[#0D2F2D] hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"><ArrowLeft className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label={`Move ${column.label} right`} disabled={columnIndex === orderedColumns.length - 1} onClick={() => moveColumn(column.id, 1)} className="grid h-9 w-9 place-items-center text-[#0D2F2D] hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"><ArrowRight className="h-3.5 w-3.5" /></button>
                  </div>
                  <input aria-label={`${column.label} width`} type="range" min="100" max="360" step="10" value={layout.width} onChange={(event) => updateColumn(column.id, { width: Number(event.target.value) })} className="w-20 accent-[#008C95]" />
                  <span className="w-11 text-right text-[10px] font-bold text-[#64748B]">{layout.width}px</span>
                </div>
              );
            })}
            <button type="button" onClick={() => onColumnLayoutChange([...defaultAssetColumnLayout, ...customFields.map((field, index) => ({ id: `custom:${field.id}`, width: field.width, hidden: false, order: defaultAssetColumnLayout.length + index }))])} className="min-h-11 rounded-md border border-[#CBD9D4] bg-white px-4 text-sm font-bold">Restore default sizing</button>
          </div>
        ) : null}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full table-fixed border-collapse" style={{ minWidth: `${Math.max(760, visibleColumns.reduce((total, column) => total + (resolvedLayout.find((item) => item.id === column.id)?.width ?? column.width), 90))}px` }}>
            <thead className="bg-[#F4F7F6] text-left text-[10px] font-black uppercase text-[#64748B]">
              <tr>{visibleColumns.map((column) => <th key={column.id} style={{ width: resolvedLayout.find((item) => item.id === column.id)?.width ?? column.width }} className="border-b border-[#DDE7E3] px-4 py-3"><button type="button" onClick={() => setSortFieldId(column.id)} className="font-black uppercase hover:text-[#008C95]">{column.label}{sortFieldId === column.id ? " ↑" : ""}</button></th>)}<th className="w-24 border-b border-[#DDE7E3] px-4 py-3">Record</th></tr>
            </thead>
            <tbody>{sortedMachines.map((machine) => (
              <tr key={machine.id} className="border-b border-[#E2E8F0] last:border-b-0">
                {visibleColumns.map((column) => {
                  if (column.id === "code") return <td key={column.id} className="px-4 py-3 text-sm font-black">{machine.code}</td>;
                  if (column.id === "name") return <td key={column.id} className="px-4 py-3 text-sm font-semibold">{machine.name}</td>;
                  if (column.id === "state") return <td key={column.id} className="px-4 py-3"><MachineStatusBadge state={machine.state} /></td>;
                  if (column.id === "owner") return <td key={column.id} className="px-4 py-3 text-sm font-semibold">{machine.owner}</td>;
                  const field = customFields.find((item) => `custom:${item.id}` === column.id);
                  return <td key={column.id} className="px-3 py-2">{field ? <CustomFieldInput compact field={field} value={machine.customFields?.[field.id]} onChange={(value) => onCustomFieldChange(machine.id, field.id, value)} /> : null}</td>;
                })}
                <td className="px-3 py-2"><button type="button" onClick={() => onMachineOpen(machine, "passport")} className="min-h-9 rounded-md border border-[#BDD3CF] px-3 text-xs font-bold">Open</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="space-y-3 bg-[#F8FAF9] p-3 md:hidden">
          {sortedMachines.map((machine) => (
            <article key={machine.id} className="rounded-md border border-[#D7E2DE] bg-white p-4">
              <div className="flex items-center justify-between gap-3"><div><p className="font-black">{machine.code}</p><p className="mt-1 text-xs text-[#64748B]">{machine.name}</p></div><MachineStatusBadge state={machine.state} /></div>
              {customFields.filter((field) => field.visibility.table).map((field) => <label key={field.id} className="mt-3 block text-[11px] font-black uppercase text-[#64748B]">{field.name}<CustomFieldInput field={field} value={machine.customFields?.[field.id]} onChange={(value) => onCustomFieldChange(machine.id, field.id, value)} /></label>)}
              <button type="button" onClick={() => onMachineOpen(machine, "passport")} className="mt-4 h-11 w-full rounded-md border border-[#BDD3CF] text-sm font-bold">Open record</button>
            </article>
          ))}
        </div>
      </Surface>
    </ConsolePage>
  );
}

function CustomFieldInput({
  compact = false,
  field,
  onChange,
  value,
}: {
  compact?: boolean;
  field: CustomFieldDefinition;
  onChange: (value: unknown) => void;
  value: CustomFieldValue | undefined;
}) {
  const className = `${compact ? "h-9" : "mt-2 h-11"} w-full min-w-0 rounded-md border border-[#CBD9D4] bg-white px-2 text-sm font-semibold`;
  if (field.type === "boolean") return <input type="checkbox" checked={Boolean(value ?? field.defaultValue)} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[#008C95]" />;
  if (field.type === "single-select") return <select value={String(value ?? field.defaultValue ?? "")} onChange={(event) => onChange(event.target.value)} className={className}><option value="">-</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select>;
  if (field.type === "multi-select") return <select multiple value={Array.isArray(value) ? value : []} onChange={(event) => onChange(Array.from(event.target.selectedOptions, (option) => option.value))} className={`${className} ${compact ? "h-14" : "h-24"}`}>{field.options.map((option) => <option key={option}>{option}</option>)}</select>;
  const inputType = field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : field.type === "url" ? "url" : field.type === "number" || field.type === "percentage" || field.type === "currency" ? "number" : "text";
  return <input type={inputType} min={field.type === "percentage" ? 0 : undefined} max={field.type === "percentage" ? 100 : undefined} step={field.type === "currency" ? "0.01" : field.type === "number" || field.type === "percentage" ? "any" : undefined} required={field.required} value={String(value ?? field.defaultValue ?? "")} onChange={(event) => onChange(event.target.value)} className={className} />;
}

type CustomDataRecord = {
  id: string;
  label: string;
  meta: string;
  values: Record<string, CustomFieldValue> | undefined;
};

function CustomDataSection({
  fields,
  onChange,
  records,
  title,
}: {
  fields: CustomFieldDefinition[];
  onChange: (recordId: string, fieldId: string, value: unknown) => void;
  records: CustomDataRecord[];
  title: string;
}) {
  const visibleFields = fields
    .filter((field) => !field.archived && (field.visibility.table || field.visibility.form))
    .sort((left, right) => left.order - right.order);
  if (!visibleFields.length || !records.length) return null;

  return (
    <Surface className="overflow-hidden p-0">
      <PanelHeader
        eyebrow="Custom data"
        title={title}
        description="Fields are defined in Settings and saved with every record."
        actions={<MetricChip tone="info">{visibleFields.length} {visibleFields.length === 1 ? "field" : "fields"}</MetricChip>}
      />
      <div className="max-h-[520px] divide-y divide-[#E2E8F0] overflow-y-auto">
        {records.map((record) => (
          <article key={record.id} className="grid gap-4 bg-white px-4 py-4 lg:grid-cols-[minmax(180px,0.75fr)_minmax(0,2fr)] lg:px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#0D2F2D]">{record.label}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">{record.meta}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleFields.map((field) => (
                <label key={field.id} className="min-w-0 text-[11px] font-black uppercase text-[#64748B]">
                  <span className="flex min-h-4 items-center gap-1">
                    {field.name}{field.required ? <span className="text-[#DC2626]">*</span> : null}
                  </span>
                  <CustomFieldInput
                    field={field}
                    value={record.values?.[field.id]}
                    onChange={(value) => onChange(record.id, field.id, value)}
                  />
                </label>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Surface>
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
  const action = machine.state === "blocked" ? "Resolve" : machine.state === "at_risk" ? "Check" : "File";
  const tone = machineCardTone(machine.state);

  return (
    <article className={`overflow-hidden rounded-md border bg-white transition hover:shadow-sm ${tone.border}`}>
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
          Photo
        </label>
        <input
          id={uploadId}
          type="file"
          accept="image/*"
          aria-label={`Photo for ${machine.code}`}
          className="sr-only"
          onChange={(event) => onPhotoUpload(event.target.files?.[0])}
        />
      </div>
      <div className="bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-bold text-[#0D2F2D]">{machine.code}</p>
            <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">{machine.name}</p>
          </div>
          <span className="max-w-[46%] truncate text-[10px] font-bold uppercase text-[#64748B]">{machine.type}</span>
        </div>
        <p className="mt-3 text-sm font-bold text-[#1F2933]">{machine.reason}</p>
        <p className="mt-1 text-xs font-semibold text-[#64748B]">
          {machine.owner} · {machine.nextAction === "-" ? "No action" : machine.nextAction}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3">
          <p className="text-xs font-semibold text-[#64748B]">{machineWorksite(machine).name}</p>
          <button type="button" onClick={onOpen} className="min-h-11 rounded-md border border-[#BDD3CF] bg-[#F4FAF8] px-3 text-xs font-bold text-[#0D4A46] transition hover:bg-[#E8F4F1] lg:min-h-8">
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

function staffStatusLabel(status: StaffStatus) {
  if (status === "available") return "Available";
  if (status === "assigned") return "Being assigned";
  if (status === "missing") return "Missing";
  if (status === "leave") return "Leave";
  return "Sick";
}

function staffStatusClasses(status: StaffStatus) {
  if (status === "available") return "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]";
  if (status === "assigned") return "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]";
  if (status === "missing") return "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]";
  if (status === "leave") return "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]";
  return "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]";
}

function staffColumnTone(status: StaffStatus) {
  if (status === "available") return "border-t-[#22C55E]";
  if (status === "assigned") return "border-t-[#3B82F6]";
  if (status === "missing") return "border-t-[#EF4444]";
  if (status === "leave") return "border-t-[#F59E0B]";
  return "border-t-[#8B5CF6]";
}

function StaffCard({
  person,
  isDragging,
  onDragEnd,
  onDragStart,
}: {
  person: StaffMember;
  isDragging?: boolean;
  onDragEnd?: () => void;
  onDragStart?: () => void;
}) {
  return (
    <div
      aria-grabbed={isDragging ? "true" : "false"}
      draggable
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      className={`cursor-grab rounded-md border border-[#D7E2DC] bg-white p-3 transition active:cursor-grabbing ${
        isDragging ? "scale-[0.99] border-[#008C95] opacity-60" : "hover:border-[#9FB8AD] hover:shadow-[0_8px_24px_rgba(15,47,45,0.08)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-[#E2E8F0] bg-[#F8FAFC]">
            <Image
              src={person.photo}
              alt={`${person.name} · ${person.role}`}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-base font-black leading-5 text-[#0D2F2D]">{person.name}</p>
            <p className="mt-0.5 line-clamp-2 text-xs font-black uppercase leading-4 tracking-wide text-[#008C95]">{person.role}</p>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-4 text-[#64748B]">{person.team} · {person.shift}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${staffStatusClasses(person.status)}`}>
          {staffStatusLabel(person.status)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-sm border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-[#1F2933]">
          Assignment: {person.assignedTo}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-xs font-semibold leading-relaxed text-[#475569]">{person.note}</p>
      {person.replacement ? (
        <p className="mt-3 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-2 py-1.5 text-xs font-bold leading-relaxed text-[#92400E]">
          Next move: {person.replacement}
        </p>
      ) : null}
    </div>
  );
}

function StaffView({
  customFields,
  onCustomFieldChange,
  staffList,
}: {
  customFields: CustomFieldDefinition[];
  onCustomFieldChange: (personId: string, fieldId: string, value: unknown) => void;
  staffList: StaffMember[];
}) {
  const [boardStaff, setBoardStaff] = useState(staffList);
  const [draggedStaffId, setDraggedStaffId] = useState<string | null>(null);
  const staffExportColumns: Array<ExportColumn<StaffMember>> = [
    { header: "ID", value: (person) => person.id },
    { header: "Name", value: (person) => person.name },
    { header: "Role", value: (person) => person.role },
    { header: "Team", value: (person) => person.team },
    { header: "Status", value: (person) => staffStatusLabel(person.status) },
    { header: "Shift", value: (person) => person.shift },
    { header: "Assignment", value: (person) => person.assignedTo },
    { header: "Contact", value: (person) => person.phone },
    { header: "Note", value: (person) => person.note },
    { header: "Next move", value: (person) => person.replacement ?? "" },
    ...customFields
      .filter((field) => field.visibility.export && !field.archived)
      .sort((left, right) => left.order - right.order)
      .map((field): ExportColumn<StaffMember> => ({
        header: field.name,
        value: (person) => customFieldDisplayValue(field, person.customFields?.[field.id]),
      })),
  ];

  const available = boardStaff.filter((person) => person.status === "available").length;
  const assigned = boardStaff.filter((person) => person.status === "assigned").length;
  const missing = boardStaff.filter((person) => person.status === "missing" || person.status === "sick").length;
  const unavailable = boardStaff.filter((person) => person.status === "leave" || person.status === "sick").length;
  const coverageGaps = boardStaff.filter((person) => person.status === "missing" || person.status === "sick" || person.status === "leave");
  const columns: Array<{ title: string; subtitle: string; statuses: StaffStatus[]; status: StaffStatus }> = [
    { title: "Available", subtitle: "Can cover changes", statuses: ["available"], status: "available" },
    { title: "Being assigned", subtitle: "Already committed to work", statuses: ["assigned"], status: "assigned" },
    { title: "Missing", subtitle: "Need cover", statuses: ["missing", "sick", "leave"], status: "missing" },
  ];

  function moveStaffToLane(nextStatus: StaffStatus) {
    if (!draggedStaffId) return;
    setBoardStaff((current) =>
      current.map((person) =>
        person.id === draggedStaffId
          ? {
              ...person,
              status: nextStatus,
              replacement: nextStatus === "available" || nextStatus === "assigned" ? undefined : person.replacement,
            }
          : person,
      ),
    );
    setDraggedStaffId(null);
  }

  function updatePersonCustomField(personId: string, fieldId: string, value: unknown) {
    const field = customFields.find((item) => item.id === fieldId);
    if (!field) return;
    const normalizedValue = normalizedCustomFieldValue(field, value);
    setBoardStaff((current) => current.map((person) => (
      person.id === personId
        ? { ...person, customFields: { ...(person.customFields ?? {}), [fieldId]: normalizedValue } }
        : person
    )));
    onCustomFieldChange(personId, fieldId, normalizedValue);
  }

  function exportStaff(format: "csv" | "xlsx") {
    const date = new Date().toISOString().slice(0, 10);
    const sortedStaff = [...boardStaff].sort((left, right) => left.name.localeCompare(right.name, "el"));
    if (format === "csv") {
      downloadCsvFile(`fleetlever-prosopiko-${date}.csv`, sortedStaff, staffExportColumns);
      return;
    }
    downloadXlsxFile(`fleetlever-prosopiko-${date}.xlsx`, sortedStaff, staffExportColumns);
  }

  return (
    <ConsolePage>
      <ViewHeader
        title="Staff"
        description="Availability, assignments and gaps for tomorrow's shift."
        exportLabel="Export staff list"
        exportActions={[
          { label: "CSV", onClick: () => exportStaff("csv") },
          { label: "XLSX", onClick: () => exportStaff("xlsx") },
        ]}
      />

      <Surface className="overflow-hidden p-0">
        <PanelHeader
          eyebrow="Tomorrow's shift cover"
          title="Gaps that need cover"
          actions={(
            <>
            <MetricChip tone="ready">{available} available</MetricChip>
            <MetricChip tone="info">{assigned} being assigned</MetricChip>
            <MetricChip tone="blocked">{missing} missing</MetricChip>
            <MetricChip tone="attention">{unavailable} on leave or sick</MetricChip>
            </>
          )}
        />
        <div className="grid gap-3 p-4 lg:grid-cols-3">
          {coverageGaps.map((person) => (
            <div key={person.id} className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[#0D2F2D]">
                    <Image
                      src={person.photo}
                      alt={`${person.name} · ${person.role}`}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#111827]">{person.assignedTo}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">{person.name} · {staffStatusLabel(person.status)}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${staffStatusClasses(person.status)}`}>
                  {person.team}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold leading-relaxed text-[#475569]">{person.replacement ?? person.note}</p>
            </div>
          ))}
        </div>
        <div className="border-y border-[#E2E8F0] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#0D2F2D]">Staff availability</h2>
          <p className="mt-1 text-[13px] text-[#64748B]">Move a person to update the shift status.</p>
        </div>
        <div className="grid gap-4 bg-[#F8FAFC] p-4 xl:grid-cols-3">
        {columns.map((column) => {
          const people = boardStaff.filter((person) => column.statuses.includes(person.status));
          return (
            <section
              key={column.title}
              className={`min-w-0 overflow-hidden rounded-md border border-[#E2E8F0] border-t-2 bg-white transition ${staffColumnTone(column.status)} ${
                draggedStaffId ? "ring-2 ring-[#8BE4DF]/40" : ""
              }`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => moveStaffToLane(column.status)}
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-[#0D2F2D]">{column.title}</h2>
                  <p className="mt-1 text-xs font-semibold text-[#64748B]">{column.subtitle}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${staffStatusClasses(column.status)}`}>{people.length}</span>
              </div>
              <div className="space-y-2 p-3">
                {people.map((person) => (
                  <StaffCard
                    key={person.id}
                    person={person}
                    isDragging={draggedStaffId === person.id}
                    onDragEnd={() => setDraggedStaffId(null)}
                    onDragStart={() => setDraggedStaffId(person.id)}
                  />
                ))}
                <div className="rounded-md border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/70 px-3 py-2 text-center text-xs font-bold text-[#64748B]">
                  Drag a person here
                </div>
              </div>
            </section>
          );
        })}
        </div>
      </Surface>
      <CustomDataSection
        fields={customFields}
        title="Staff and operator fields"
        records={boardStaff.map((person) => ({
          id: person.id,
          label: person.name,
          meta: `${person.role} · ${person.team}`,
          values: person.customFields,
        }))}
        onChange={updatePersonCustomField}
      />
    </ConsolePage>
  );
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
  mobileInline = false,
  onClear,
  query,
  resultCount,
}: {
  groups: GlobalSearchGroup[];
  mobileInline?: boolean;
  onClear: () => void;
  query: string;
  resultCount: number;
}) {
  return (
    <div
      data-global-search-panel
      className={mobileInline
        ? "min-h-full bg-white"
        : "fleet-popover-enter fixed left-4 right-4 top-16 z-[80] max-h-[72vh] overflow-y-auto rounded-lg border border-[#D7E2DC] bg-white shadow-[0_18px_50px_rgba(15,47,45,0.16)] md:absolute md:left-0 md:right-0 md:top-11"}
    >
      <div className={`flex items-center justify-between gap-3 border-b border-[#DCE5E1] px-4 py-3 ${mobileInline ? "[&>button]:hidden" : ""}`}>
        <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Search FleetLever</p>
          <p className="mt-1 truncate text-sm font-semibold text-[#64748B]">
            {resultCount ? `${resultCount} results for "${query}"` : `No results for "${query}"`}
          </p>
        </div>
        <OverlayCloseButton label="Clear search" onClick={onClear} />
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
          No vehicles, services, documents, open items, workshop jobs or decisions were found.
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
  if (certificate.status === "Critical" || certificate.status === "Expiring soon") return "Assignment";
  if (certificate.status === "Valid") return "View";
  return "Upload";
}

function actionLabelForQueueRow(machine: Machine, blocker: BlockerCard) {
  if (machine.state === "at_risk") return "Assign an owner";
  if (blocker.kind === "certificate") return "Upload document";
  return "Complete job";
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
          title: "Issue for review",
          status: externalStatus(machine.state),
          summary: machine.reason,
          primaryAction: "For review",
          lines: [
            ["Owner", machine.owner],
            ["Due", machine.eta],
            ["Next step", machine.nextAction === "-" ? "Vehicle status check" : machine.nextAction],
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
        impact: machine.state === "blocked" ? `Stops ${machineWorksite(machine).name}` : `Check before ${machineWorksite(machine).name}`,
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
    { key: "blocking", label: "Stopping", tone: "blocked", value: blockingActionCount },
    { key: "review", label: "For review", tone: "attention", value: reviewActionCount },
    { key: "documents", label: "Documents", tone: "neutral", value: certificateActions },
    { key: "workshop", label: "Workshop", tone: "neutral", value: serviceActions },
  ];

  return (
    <ConsolePage>
      <ViewHeader
        title="Shift open items"
        description="Everything that must be resolved before tomorrow's shift closes."
        showActions={false}
      />
      <Surface className="overflow-hidden">
        <PanelHeader
          eyebrow="Priority order"
          title="What must be resolved today"
          description={`${blockingActionCount} stopping the shift · ${reviewActionCount} for review · ${owners} owners`}
          actions={(
            <div className="grid w-full grid-cols-2 gap-1 rounded-md border border-[#DCE5E1] bg-[#F8FAFC] p-1 sm:flex sm:w-auto">
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
          )}
        />

        {rows.length ? (
          filteredRows.length ? (
            <>
              <div className="hidden border-b border-l-4 border-b-[#E2E8F0] border-l-transparent bg-[#F8FAF9] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#64748B] 2xl:grid 2xl:grid-cols-[170px_minmax(320px,1fr)_140px_140px_184px] 2xl:gap-4">
                <span>Vehicle</span>
                <span>Open item</span>
                <span>Owner</span>
                <span>Due</span>
                <span>Action</span>
              </div>
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
            </>
          ) : (
            <div className="m-5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm font-bold text-[#64748B]">
              No action matches this filter.
            </div>
          )
        ) : (
          <div className="m-5 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-sm font-bold text-[#15803D]">
            There are no open items. The shift is ready for a final check.
          </div>
        )}
      </Surface>
    </ConsolePage>
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
  tone: "blocked" | "attention" | "neutral" | "ready";
  value: number;
}) {
  const indicatorClass = tone === "blocked" ? "bg-[#DC2626]" : tone === "attention" ? "bg-[#D97706]" : tone === "ready" ? "bg-[#15803D]" : "bg-[#94A3B8]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded px-2 text-[12px] font-bold whitespace-nowrap transition duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2 sm:min-h-8 sm:shrink-0 sm:px-3 ${
        active ? "bg-[#0D2F2D] text-white" : "text-[#64748B] hover:bg-[#F5F8F7] hover:text-[#0D2F2D]"
      }`}
    >
      {!active ? <span className={`h-1.5 w-1.5 rounded-full ${indicatorClass}`} aria-hidden="true" /> : null}
      <span>{label}</span>
      <span className={`tabular-nums ${active ? "text-white/75" : "text-[#94A3B8]"}`}>{value}</span>
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
  const railTone = row.priority === "blocking" ? "border-l-[#DC2626]" : "border-l-[#D97706]";
  const actionPresentation =
    row.action.type === "complete-action"
      ? { Icon: BadgeCheck, label: "Complete" }
      : row.action.type === "upload-document"
        ? { Icon: Upload, label: "Upload" }
        : { Icon: CircleUserRound, label: "Assignment" };
  const PrimaryActionIcon = actionPresentation.Icon;

  return (
    <article className={`grid gap-4 border-l-4 bg-white px-5 py-3.5 transition hover:bg-[#FAFCFB] 2xl:grid-cols-[170px_minmax(320px,1fr)_140px_140px_184px] 2xl:items-center ${railTone}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-bold text-[#0D2F2D]">{row.machine.code}</p>
          {featured ? <span className="text-[11px] font-bold text-[#B91C1C]">Next</span> : null}
        </div>
        <p className="mt-1 text-xs font-semibold text-[#64748B]">{machineWorksite(row.machine).name}</p>
        <p className={`mt-2 text-[11px] font-bold ${row.priority === "blocking" ? "text-[#B91C1C]" : "text-[#B45309]"}`}>
          {row.priority === "blocking" ? "Stops the shift" : "Needs review"}
        </p>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">
            {row.blocker.kind === "certificate" ? "Documents & checks" : "Workshop"}
          </span>
          <span className="text-[11px] font-semibold text-[#64748B]">· {row.blocker.status}</span>
        </div>
        <p className="mt-2 text-sm font-bold leading-snug text-[#111827]">{row.blocker.summary}</p>
        <p className="mt-1 text-xs font-semibold leading-snug text-[#64748B]">{row.nextStep}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 2xl:contents">
        <div>
          <p className="text-[11px] font-bold uppercase text-[#64748B] 2xl:hidden">Owner</p>
          <p className="mt-1 font-bold text-[#0D2F2D] 2xl:mt-0">{row.owner}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-[#64748B] 2xl:hidden">Due</p>
          <p className="mt-1 font-semibold text-[#1F2933] 2xl:mt-0">{row.due}</p>
        </div>
      </div>
      <div className="flex w-full justify-stretch 2xl:justify-end">
        <SplitRowAction
          detailsLabel={`Details for ${row.machine.code}`}
          icon={<PrimaryActionIcon className="h-4 w-4 shrink-0" aria-hidden="true" />}
          label={actionPresentation.label}
          onDetails={() => onMachineOpen(row.machine, "why")}
          onPrimary={() => onActionStart(row.machine, row.action)}
        />
      </div>
    </article>
  );
}

function DocumentsView({
  customFields,
  machinesList,
  onActionStart,
  onCustomFieldChange,
  onMachineOpen,
}: {
  customFields: CustomFieldDefinition[];
  machinesList: Machine[];
  onActionStart: (machine: Machine, action: Exclude<DrawerAction, null>) => void;
  onCustomFieldChange: (machineId: string, certificateName: string, fieldId: string, value: unknown) => void;
  onMachineOpen: (machine: Machine) => void;
}) {
  const [filter, setFilter] = useState<DocumentFilter>("needs-action");
  const allCertificates = machinesList.flatMap((machine) => machine.certificates.map((certificate) => ({ certificate, machine })));
  const priorityCertificates = allCertificates.filter(({ certificate }) => certificate.status !== "Valid");
  const filterItems: Array<{ key: DocumentFilter; label: string; tone: "ready" | "attention" | "blocked" | "neutral"; value: number }> = [
    ["needs-action", "Need action", "neutral", priorityCertificates.length],
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
    <ConsolePage>
      <ViewHeader
        title="Documents & checks"
        description="What is missing, what is expiring and who must act."
        exportLabel="Export report"
      />
      <Surface className="overflow-hidden">
        <PanelHeader
          eyebrow="Document priorities"
          title="Open items before the shift"
          description="Items needing action are shown first."
          actions={(
            <div className="grid w-full grid-cols-2 gap-1 rounded-md border border-[#DCE5E1] bg-[#F8FAFC] p-1 sm:flex sm:w-auto">
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
          )}
        />

        {visibleCertificates.length ? (
          <>
            <div className="hidden border-b border-l-4 border-b-[#E2E8F0] border-l-transparent bg-[#F8FAF9] px-5 py-2.5 text-[11px] font-bold uppercase text-[#64748B] 2xl:grid 2xl:grid-cols-[190px_minmax(260px,1.1fr)_minmax(220px,0.9fr)_140px_184px] 2xl:gap-4">
              <span>Vehicle</span>
              <span>Document</span>
              <span>On shift</span>
              <span>Owner / due</span>
              <span>Action</span>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
            {visibleCertificates.map(({ certificate, machine }) => {
            const blocksRelease = machine.state === "blocked" && ["Expired", "Missing"].includes(certificate.status);
            const primaryLabel = documentCommandLabel(certificate);
            const primaryAction = documentActionForCertificate(certificate);
            return (
              <div key={`${machine.id}-${certificate.name}`} className={`grid gap-4 border-l-4 px-5 py-3.5 2xl:grid-cols-[190px_minmax(260px,1.1fr)_minmax(220px,0.9fr)_140px_184px] 2xl:items-center ${blocksRelease ? "border-l-[#DC2626] bg-[#FEF2F2]/35" : "border-l-transparent bg-white"}`}>
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
                  <p className="text-[11px] font-bold uppercase text-[#64748B]">On shift</p>
                  <p className={`mt-1 text-sm font-bold ${blocksRelease ? "text-[#B91C1C]" : certificate.status === "Valid" ? "text-[#15803D]" : "text-[#B45309]"}`}>
                    {blocksRelease ? `Stops ${machineWorksite(machine).name}` : certificate.status === "Valid" ? "The proof was accepted" : `Check before ${machineWorksite(machine).name}`}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase text-[#64748B]">Owner</p>
                  <p className="mt-1 font-bold text-[#0D2F2D]">{certificate.owner}</p>
                  <p className="text-[11px] font-bold uppercase text-[#64748B]">Expiry</p>
                  <p className="mt-1 font-semibold text-[#1F2933]">{certificate.expiry}</p>
                </div>
                <div className="flex w-full justify-stretch 2xl:justify-end">
                  <SplitRowAction
                    detailsLabel={`Vehicle file ${machine.code}`}
                    icon={certificate.status === "Critical" || certificate.status === "Expiring soon"
                      ? <CircleUserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                      : certificate.status === "Valid"
                        ? <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                        : <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    label={primaryLabel}
                    onDetails={() => onMachineOpen(machine)}
                    onPrimary={() => {
                      if (certificate.status === "Valid") {
                        emitConsoleToast(`${machine.code}: the preview opened for ${certificate.name}.`);
                        return;
                      }
                      onActionStart(machine, primaryAction);
                    }}
                  />
                </div>
              </div>
            );
            })}
            </div>
          </>
        ) : (
          <div className="m-5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm font-bold text-[#64748B]">
            No document matches this filter.
          </div>
        )}
      </Surface>
      <CustomDataSection
        fields={customFields}
        title="Document and proof fields"
        records={allCertificates.map(({ certificate, machine }) => ({
          id: `${machine.id}::${certificate.name}`,
          label: certificate.name,
          meta: `${machine.code} · ${machine.name}`,
          values: certificate.customFields,
        }))}
        onChange={(recordId, fieldId, value) => {
          const separatorIndex = recordId.indexOf("::");
          onCustomFieldChange(recordId.slice(0, separatorIndex), recordId.slice(separatorIndex + 2), fieldId, value);
        }}
      />
    </ConsolePage>
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
  return (
    <ActionQueueFilterChip active={active} label={label} onClick={onClick} tone={tone} value={value} />
  );
}

function workshopStatusClasses(status: ServiceBlocker["status"]) {
  if (status === "Resolved") return "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]";
  if (status === "In progress") return "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]";
  if (status === "On hold") return "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]";
  return "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]";
}

function workshopPartsLabel(service: ServiceBlocker) {
  if (service.parts) return `${service.partsStatus ?? "Needed"} · ${service.parts}`;
  if (service.status === "Resolved") return "No parts needed";
  if (service.status === "On hold") return "Parts outstanding";
  if (service.issue.toLowerCase().includes("leak")) return "Seal kit check";
  return "No parts recorded";
}

function workshopSortScore(service: ServiceBlocker) {
  const statusScore = service.status === "Open" ? 0 : service.status === "In progress" ? 1 : service.status === "On hold" ? 2 : 4;
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
            <span className="rounded-full border border-[#FECACA] bg-white px-2.5 py-1 uppercase text-[#B91C1C]">Blocks the shift</span>
          ) : null}
          <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[#475569]">{workshopPartsLabel(service)}</span>
        </div>
      </div>
    </div>
  );
}

function WorkshopMobileJobCard({
  machine,
  onMachineOpen,
  onStatusChange,
  service,
}: {
  machine: Machine;
  onMachineOpen: (machine: Machine) => void;
  onStatusChange: (status: ServiceBlocker["status"]) => void;
  service: ServiceBlocker;
}) {
  const railTone = service.status === "Resolved" ? "border-l-[#16A34A]" : service.status === "Open" ? "border-l-[#EF4444]" : "border-l-[#D97706]";

  return (
    <article className={`rounded-md border border-[#E2E8F0] border-l-4 bg-white p-3 shadow-sm ${railTone}`}>
      <div className="flex gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#E2E8F0]">
          <Image
            src={machinePhotoPlaceholder(machine)}
            alt={`${machine.code} ${machine.type}`}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-black text-[#0D2F2D]">{machine.code}</p>
              <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-4 text-[#64748B]">{machine.name}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${workshopStatusClasses(service.status)}`}>
              {service.status}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold leading-5 text-[#111827]">{service.issue}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-[#F8FAFC] p-3 text-xs">
        <div>
          <p className="font-black uppercase tracking-wide text-[#64748B]">Owner</p>
          <p className="mt-1 font-bold text-[#1F2933]">{service.owner}</p>
        </div>
        <div>
          <p className="font-black uppercase tracking-wide text-[#64748B]">Due</p>
          <p className="mt-1 font-bold text-[#1F2933]">{service.due}</p>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-[#64748B]">{workshopPartsLabel(service)}</p>
      {service.blocksRelease && service.status !== "Resolved" ? (
        <p className="mt-2 text-xs font-black uppercase text-[#B91C1C]">Blocks the next shift</p>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="min-w-0">
          <span className="sr-only">Change stage</span>
          <select
            value={service.status}
            onChange={(event) => onStatusChange(event.target.value as ServiceBlocker["status"])}
            className="h-11 w-full rounded-md border border-[#CBD9D4] bg-white px-3 text-sm font-bold text-[#0D2F2D] outline-none focus:border-[#008C95]"
          >
            <option value="Open">Pending</option>
            <option value="In progress">In progress</option>
            <option value="On hold">On hold</option>
            <option value="Resolved">Completed</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => onMachineOpen(machine)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#CBD9D4] bg-white px-4 text-sm font-black text-[#0D2F2D]"
        >
          Details
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function WorkshopView({
  customFields,
  machinesList,
  onCustomFieldChange,
  onJobCreate,
  onMachineOpen,
  onServiceStatusChange,
}: {
  customFields: CustomFieldDefinition[];
  machinesList: Machine[];
  onCustomFieldChange: (machineId: string, issue: string, fieldId: string, value: unknown) => void;
  onJobCreate: (draft: WorkshopJobDraft) => void;
  onMachineOpen: (machine: Machine) => void;
  onServiceStatusChange: (machineId: string, issue: string, status: ServiceBlocker["status"]) => void;
}) {
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<ServiceBlocker["status"] | null>(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [mobileLaneIndex, setMobileLaneIndex] = useState(0);
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
      title: "Pending",
      subtitle: "Not started",
      headerClass: "bg-[#FFF7F7]",
      dotClass: "bg-[#EF4444]",
      countClass: "bg-[#FEF2F2] text-[#B91C1C]",
      accentClass: "bg-[#EF4444]",
    },
    {
      statuses: ["In progress", "On hold"],
      dropStatus: "In progress",
      title: "In progress",
      subtitle: "In the workshop",
      headerClass: "bg-[#FFFBEB]",
      dotClass: "bg-[#D97706]",
      countClass: "bg-[#FFFBEB] text-[#B45309]",
      accentClass: "bg-[#D97706]",
    },
    {
      statuses: ["Resolved"],
      dropStatus: "Resolved",
      title: "Completed",
      subtitle: "Cleared for the shift",
      headerClass: "bg-[#F0FDF4]",
      dotClass: "bg-[#16A34A]",
      countClass: "bg-[#F0FDF4] text-[#15803D]",
      accentClass: "bg-[#16A34A]",
    },
  ];
  const releaseBlockers = serviceJobs.filter(({ service }) => service.blocksRelease && service.status !== "Resolved").length;
  const workingNow = serviceJobs.filter(({ service }) => service.status === "In progress").length;
  const cleared = serviceJobs.filter(({ service }) => service.status === "Resolved").length;
  const activeMobileLane = laneItems[mobileLaneIndex] ?? laneItems[0];
  const activeMobileJobs = serviceJobs.filter(({ service }) => activeMobileLane.statuses.includes(service.status));

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
    if (status === "Open" || status === "In progress" || status === "On hold" || status === "Resolved") return status;

    const lanes = Array.from(document.querySelectorAll<HTMLElement>("[data-workshop-drop-status]"));
    const boundedLane = lanes.find((lane) => {
      const rect = lane.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
    const boundedStatus = boundedLane?.getAttribute("data-workshop-drop-status");
    return boundedStatus === "Open" || boundedStatus === "In progress" || boundedStatus === "On hold" || boundedStatus === "Resolved" ? boundedStatus : null;
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
    <ConsolePage className={`select-none ${pointerDrag ? "cursor-grabbing" : ""}`}>
      <ViewHeader title="Workshop" description="Jobs, parts and anything affecting tomorrow's shift." showActions={false} />
      <Surface className="overflow-hidden">
        <PanelHeader
          eyebrow="Job flow"
          title="Jobs by stage"
          description="Track what is pending, what is being worked on and what has cleared for the shift."
          actions={(
            <>
            <button
              type="button"
              onClick={() => setJobModalOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#092321] sm:min-h-10"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New job
            </button>
            <MetricChip tone="blocked">{releaseBlockers} stopping the shift</MetricChip>
            <MetricChip tone="attention">{workingNow} in progress</MetricChip>
            <MetricChip tone="ready">{cleared} completed</MetricChip>
            </>
          )}
        />

        <div className="bg-[#F8FAFC] p-3 lg:hidden">
          <div className="grid grid-cols-3 gap-1 rounded-md border border-[#DCE5E1] bg-white p-1">
            {laneItems.map((lane, index) => {
              const count = serviceJobs.filter(({ service }) => lane.statuses.includes(service.status)).length;
              return (
                <button
                  key={lane.title}
                  type="button"
                  onClick={() => setMobileLaneIndex(index)}
                  className={`min-h-11 rounded px-2 text-[11px] font-black leading-4 transition ${
                    mobileLaneIndex === index ? "bg-[#0D2F2D] text-white shadow-sm" : "text-[#64748B]"
                  }`}
                >
                  <span className="block">{lane.title}</span>
                  <span className={`mt-0.5 block tabular-nums ${mobileLaneIndex === index ? "text-white/70" : "text-[#94A3B8]"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-3">
            {activeMobileJobs.length ? (
              activeMobileJobs.map(({ machine, service }) => (
                <WorkshopMobileJobCard
                  key={workshopJobId(machine, service)}
                  machine={machine}
                  service={service}
                  onMachineOpen={onMachineOpen}
                  onStatusChange={(status) => onServiceStatusChange(machine.id, service.issue, status)}
                />
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[#CBD5E1] bg-white px-4 py-8 text-center text-sm font-bold text-[#64748B]">
                There are no jobs at this stage.
              </div>
            )}
          </div>
        </div>

        <div className={`hidden select-none gap-4 bg-[#F8FAFC] p-4 lg:grid lg:grid-cols-3 ${pointerDrag ? "cursor-grabbing" : ""}`}>
          {laneItems.map((lane) => {
            const laneJobs = serviceJobs.filter(({ service }) => lane.statuses.includes(service.status));
            const isDropTarget = dropStatus === lane.dropStatus;
            return (
              <div
                key={lane.title}
                data-workshop-drop-status={lane.dropStatus}
                className={`relative flex min-h-[420px] flex-col overflow-hidden rounded-md border bg-white transition ${
                  isDropTarget ? "border-[#008C95] bg-[#E6FAFA] shadow-md ring-2 ring-[#008C95]/20" : "border-[#E2E8F0]"
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${lane.accentClass}`} aria-hidden="true" />
                <div className={`border-b border-[#E2E8F0] px-4 py-3 pt-4 ${lane.headerClass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="inline-flex items-center gap-2 text-base font-bold text-[#0D2F2D]">
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
                    <div className="rounded-md border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm font-bold text-[#64748B]">There are no jobs here.</div>
                  )}
                  {pointerDrag ? (
                    <div
                      className={`mt-auto rounded-md border border-dashed p-4 text-center text-xs font-bold uppercase tracking-wide transition ${
                        isDropTarget ? "border-[#008C95] bg-white text-[#008C95]" : "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]"
                      }`}
                    >
                      Drop the job here
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Surface>
      <CustomDataSection
        fields={customFields}
        title="Workshop job fields"
        records={serviceJobs.map(({ machine, service }) => ({
          id: workshopJobId(machine, service),
          label: service.issue,
          meta: `${machine.code} · ${service.owner} · ${service.due}`,
          values: service.customFields,
        }))}
        onChange={(recordId, fieldId, value) => {
          const separatorIndex = recordId.indexOf("::");
          onCustomFieldChange(recordId.slice(0, separatorIndex), recordId.slice(separatorIndex + 2), fieldId, value);
        }}
      />
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
    </ConsolePage>
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
  const [parts, setParts] = useState("");
  const [partsStatus, setPartsStatus] = useState<NonNullable<ServiceBlocker["partsStatus"]>>("Not needed");
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
    onCreate({ machineId: selectedMachine.id, issue, owner, due, blocksRelease, parts, partsStatus });
    onClose();
  }

  return (
    <div
      className="fleet-overlay-backdrop fixed inset-0 z-[70] flex items-end justify-center bg-[#0D2F2D]/45 p-2 backdrop-blur-[1px] sm:items-center sm:p-4 lg:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="workshop-job-title"
        className="fleet-dialog-enter flex max-h-[calc(100dvh-1rem)] w-full max-w-[1120px] flex-col overflow-hidden rounded-lg border border-[#D7E2DC] bg-white shadow-[0_24px_70px_rgba(15,47,45,0.24)] sm:max-h-[calc(100dvh-2rem)]"
      >
        <OverlayHeader
          eyebrow="Workshop job"
          title="New workshop job"
          titleId="workshop-job-title"
          description="Choose a vehicle and record what must happen before the next shift."
          onClose={onClose}
        />
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitJob}>
          <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            {selectedMachine ? (
              <div className="flex items-center gap-3 sm:block">
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-[#E2E8F0] sm:h-40 sm:w-full">
                  <Image
                    src={machinePhotoPlaceholder(selectedMachine)}
                    alt={`${selectedMachine.code} ${selectedMachine.type}`}
                    fill
                    sizes="320px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 sm:mt-3">
                  <p className="text-lg font-bold text-[#111827] sm:text-xl">{selectedMachine.code}</p>
                  <p className="mt-1 text-sm font-bold text-[#475569]">{selectedMachine.name}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] font-bold uppercase tracking-wide text-[#64748B] sm:text-xs">
                    {selectedMachine.type} · {machineWorksite(selectedMachine).name}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 space-y-4">
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
                placeholder="e.g. brake check, oil leak repair, tyre change"
                className="mt-2 h-11 w-full rounded-md border border-[#CBD5E1] px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#0D2F2D]"
              />
            </div>

            <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#008C95]">Parts</p>
                  <p className="mt-1 text-sm font-bold text-[#0D2F2D]">What is missing to close this job?</p>
                </div>
                <select
                  value={partsStatus}
                  onChange={(event) => {
                    const nextStatus = event.target.value as NonNullable<ServiceBlocker["partsStatus"]>;
                    setPartsStatus(nextStatus);
                    if (nextStatus === "Not needed") setParts("");
                    if (nextStatus === "On hold") setDue("Awaiting parts");
                  }}
                  className="h-10 w-full rounded-md border border-[#CBD5E1] bg-white px-3 text-xs font-bold text-[#111827] outline-none focus:border-[#0D2F2D] sm:w-44"
                  aria-label="Parts status"
                >
                  <option value="Not needed">Not needed</option>
                  <option value="Needed">Needed</option>
                  <option value="Ordered">Ordered</option>
                  <option value="On hold">On hold</option>
                  <option value="Received">Received</option>
                </select>
              </div>
              <input
                value={parts}
                onChange={(event) => setParts(event.target.value)}
                placeholder="e.g. oil filter, 315/80 tyre, sweeper brush"
                disabled={partsStatus === "Not needed"}
                className="mt-3 h-11 w-full rounded-md border border-[#CBD5E1] bg-white px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#0D2F2D] disabled:cursor-not-allowed disabled:bg-[#EEF2F6] disabled:text-[#94A3B8]"
                aria-label="Part"
              />
              <p className="mt-2 text-xs font-semibold text-[#64748B]">
                If you put it on hold, the job stays on the board until the part is marked as received.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(12rem,0.85fr)]">
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
                  <option value="Tomorrow midday">Tomorrow midday</option>
                  <option value="Awaiting parts">Awaiting parts</option>
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
                <span className="block text-sm font-bold text-[#0D2F2D]">Blocks tomorrow&apos;s shift</span>
                <span className="mt-1 block text-xs font-semibold text-[#64748B]">Turn this off for a routine workshop job that should not stop tomorrow&apos;s shift.</span>
              </span>
            </label>

          </div>
          </div>
          <OverlayFooter>
            <button type="button" onClick={onClose} className={overlaySecondaryActionClass}>
              Cancel
            </button>
            <button type="submit" className={overlayPrimaryActionClass} disabled={!issue.trim() || !selectedMachine}>
              <Wrench className="h-4 w-4" aria-hidden="true" />
              Add to the board
            </button>
          </OverlayFooter>
        </form>
      </section>
    </div>
  );
}

function isReleaseDecisionRecord(record: ReleaseRecord) {
  return Boolean(record.machine && record.result);
}

function releaseDecisionState(record: ReleaseRecord): MachineState {
  if (["Ready for work", "The workshop cleared it"].includes(record.result)) return "ready";
  if (["Not released"].includes(record.result)) return "blocked";
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
    : "- There is no active item for this decision.";
  const documentLines = machine
    ? machine.certificates.map((certificate) => `- ${certificate.name}: ${certificate.status} · ${certificate.expiry} · owner ${certificate.owner}`).join("\n")
    : "- There is no document snapshot for this vehicle.";
  const serviceLines = machine
    ? machine.service.map((service) => `- ${service.issue}: ${service.status} · ${service.due} · owner ${service.owner}`).join("\n")
    : "- There is no workshop record for this vehicle.";

  return [
    `Proof pack ${releaseAuditId(record)}`,
    "",
    "Decision event",
    `Date: ${record.date}`,
    `${"Work package"}: ${record.worksite}`,
    `Vehicle: ${record.machine}`,
    `Decision: ${record.result}`,
    `Reason: ${record.reason}`,
    `Action: ${record.action}`,
    `User: ${record.user}`,
    `Exception: ${record.override}`,
    "",
    "Work package snapshot",
    `Required vehicles: ${counts.total}`,
    `Ready: ${counts.ready}`,
    `Need review: ${counts.attention}`,
    `Blocked: ${counts.blocked}`,
    "",
    "Vehicle open items",
    blockerLines,
    "",
    "Document snapshot",
    documentLines,
    "",
    "Workshop record",
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
      className="fleet-overlay-backdrop fixed inset-x-0 bottom-0 top-16 z-[60] flex justify-end bg-[#0D2F2D]/32 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-drawer-title"
        className="fleet-drawer-enter flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-[#D7E2DC] bg-white shadow-[0_24px_70px_rgba(15,47,45,0.24)]"
      >
        <OverlayHeader
          eyebrow="Proof pack"
          title={`Decision for ${record.machine}`}
          titleId="evidence-drawer-title"
          description={auditId}
          onClose={onClose}
        />

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className={`rounded-lg border p-4 ${statusClasses(state)}`}>
            <p className="text-xs font-bold uppercase tracking-wide">Decision event</p>
            <p className="mt-2 text-2xl font-bold">{record.result}</p>
            <p className="mt-2 text-sm font-bold">{record.reason}</p>
            <p className="mt-1 text-sm font-semibold opacity-85">{record.action} · {record.user} · Exception: {record.override}</p>
          </div>

          <section className="border-t border-[#DCE5E1] pt-4">
            <h3 className="text-lg font-bold text-[#0D2F2D]">Work package snapshot</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Work package", record.worksite],
                ["Decision date", record.date],
                ["Required vehicles", String(counts.total)],
                ["Ready / Review / Blocked", `${counts.ready} / ${counts.attention} / ${counts.blocked}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{label}</p>
                  <p className="mt-1 text-sm font-bold text-[#111827]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-[#DCE5E1] pt-4">
            <h3 className="text-lg font-bold text-[#0D2F2D]">Documents & checks included</h3>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-[#1F2933]">
              {["Decision record", "Vehicle check list", "Open items", "Related documents", "Workshop record", "Exception statement where used"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-md bg-[#F8FAFC] px-3 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-[#008C95]" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-[#DCE5E1] pt-4">
            <h3 className="text-lg font-bold text-[#0D2F2D]">Current open items</h3>
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
              <p className="mt-3 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm font-bold text-[#15803D]">There is no active item for this decision.</p>
            )}
          </section>
        </div>

        <OverlayFooter>
          <button type="button" onClick={onClose} className={overlaySecondaryActionClass}>
            Close
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile(`${auditId}-evidence-packet.txt`, releaseEvidencePacketText(record))}
            className={overlayPrimaryActionClass}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download pack
          </button>
        </OverlayFooter>
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
    <ConsolePage>
      <ViewHeader
        title="Shift history"
        description="Who decided, what changed and on what evidence."
        showActions={false}
      />
      <Surface className="overflow-hidden">
        <PanelHeader
          eyebrow="Decision archive"
          title="Decisions from previous shifts"
          description="Every record includes the decision, the owner and the supporting evidence."
          actions={(
            <>
            <MetricChip>{visibleHistory.length} decisions</MetricChip>
            <MetricChip tone="ready">
              {visibleHistory.filter((item) => item.result === "Ready for work" || item.result === "Approved by exception").length} approvals
            </MetricChip>
            <MetricChip tone="blocked">
              {visibleHistory.filter((item) => item.result === "Not released").length} not approved
            </MetricChip>
            <MetricChip tone="attention">
              {visibleHistory.filter((item) => item.override === "Yes").length} exceptions
            </MetricChip>
            </>
          )}
        />
        <div className="hidden border-b border-[#E2E8F0] bg-[#F8FAF9] px-5 py-2.5 text-[11px] font-bold uppercase text-[#64748B] 2xl:grid 2xl:grid-cols-[120px_170px_minmax(0,1fr)_184px] 2xl:gap-4">
          <span>Date</span>
          <span>Vehicle</span>
          <span>Decision</span>
          <span>Action</span>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {visibleHistory.length ? (
            visibleHistory.map((item, index) => {
              const state = releaseDecisionState(item);
              return (
                <div key={item.id ?? `${releaseAuditId(item)}-${index}`} className="grid gap-4 px-5 py-3.5 2xl:grid-cols-[120px_170px_minmax(0,1fr)_184px] 2xl:items-center">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-[#64748B]">Date</p>
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
                  <div className="flex w-full justify-stretch 2xl:justify-end">
                    <SplitRowAction
                      detailsLabel={`Decision details ${releaseAuditId(item)}`}
                      icon={<FileText className="h-4 w-4 shrink-0" aria-hidden="true" />}
                      label="Open"
                      onDetails={() => setSelectedRecord(item)}
                      onPrimary={() => setSelectedRecord(item)}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-sm font-bold text-[#64748B]">No decisions found for this search.</div>
          )}
        </div>
      </Surface>
      {selectedRecord ? <EvidencePacketDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} /> : null}
    </ConsolePage>
  );
}

function ViewHeader({
  description,
  exportActions = [],
  exportLabel = "Export report",
  showActions = true,
  title,
}: {
  description: string;
  exportActions?: Array<{ label: string; onClick: () => void }>;
  exportLabel?: string;
  showActions?: boolean;
  title: string;
}) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const hasExportActions = exportActions.length > 0;

  return (
    <header className="relative flex min-h-[76px] flex-col gap-3 md:min-h-[60px] md:flex-row md:items-center md:justify-between">
      <div className={`min-w-0 ${showActions ? "pr-12 md:pr-0" : ""}`}>
        <h1 className="text-2xl font-semibold leading-tight text-[#111827]">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-[13px] leading-5 text-[#64748B]">{description}</p>
      </div>
      {showActions ? (
        <div className="absolute right-0 top-0 flex gap-2 md:relative md:right-auto md:top-auto">
          <button
            type="button"
            onClick={() => {
              if (!hasExportActions) {
                downloadTextFile(`${title.toLowerCase().replaceAll(" ", "-")}.txt`, `${title}\n${description}`);
                return;
              }
              setExportMenuOpen((open) => !open);
            }}
            aria-expanded={hasExportActions ? exportMenuOpen : undefined}
            aria-label={exportLabel}
            title={exportLabel}
            className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-md border border-[#D7E2DC] bg-white px-0 text-sm font-bold text-[#1F2933] transition hover:border-[#91AAA5] hover:bg-[#F8FAFC] md:h-10 md:w-auto md:px-3"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">{exportLabel}</span>
          </button>
          {hasExportActions && exportMenuOpen ? (
            <ToolbarPopover className="min-w-44">
              {exportActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    action.onClick();
                    setExportMenuOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm font-bold text-[#1F2933] transition hover:bg-[#F3F7F5] md:min-h-10"
                >
                  <span>{action.label}</span>
                  <Download className="h-4 w-4 text-[#008C95]" aria-hidden="true" />
                </button>
              ))}
            </ToolbarPopover>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
