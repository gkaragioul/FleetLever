"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  ArrowRight,
  Download,
  History,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldAlert,
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

type BlockerKind = "certificate" | "service";
type UploadSource = "action-queue" | "documents" | "passport";

type DrawerAction =
  | { type: "assign-owner"; blockerId?: string }
  | { type: "complete-action"; blockerId?: string }
  | { type: "upload-document"; blockerId?: string; source?: UploadSource }
  | { type: "override" }
  | null;

const clientName = "Athens Crane Services";

const teamMembers: TeamMember[] = [
  { name: "Dimitris", role: "Fleet Coordinator" },
  { name: "Maria", role: "Compliance" },
  { name: "Kostas", role: "Service Lead" },
  { name: "Workshop", role: "Workshop Queue" },
  { name: "George", role: "Operations Manager" },
];

const worksites: Worksite[] = [
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

const machines: Machine[] = [
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
    service: [],
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
    service: [],
    issues: [],
    photos: [{ title: "Condition check", category: "Inspection", date: "31 May" }],
  },
];

const releaseHistory: ReleaseRecord[] = [
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
    action: "Workshop assigned",
    user: "Kostas",
    override: "No",
  },
];

const initialNotifications: OperationalNotification[] = [
  {
    id: 1,
    title: "CR-04 certificate blocks release",
    detail: "Dimitris owns the lifting certificate renewal.",
    createdAt: "Today, 07:05",
    read: false,
  },
  {
    id: 2,
    title: "LD-03 service blocker open",
    detail: "Workshop must complete the hydraulic service action.",
    createdAt: "Today, 07:10",
    read: false,
  },
  {
    id: 3,
    title: "Daily morning report ready",
    detail: "2 ready, 1 review, 2 blocked for Athens Metro Extension.",
    createdAt: "Today, 07:30",
    read: false,
  },
];

const navItems: Array<{ key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "tomorrow", label: "Tomorrow's Work", icon: CalendarDays },
  { key: "worksites", label: "Worksites", icon: Building2 },
  { key: "blockers", label: "Action Queue", icon: ShieldAlert },
  { key: "machines", label: "Machines", icon: Building2 },
  { key: "certificates", label: "Documents", icon: BadgeCheck },
  { key: "service", label: "Workshop", icon: Wrench },
  { key: "history", label: "Release History", icon: History },
  { key: "settings", label: "Settings", icon: Settings },
];

const passportTabs: Array<{ key: PassportTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "documents", label: "Documents" },
  { key: "service", label: "Service" },
  { key: "issues", label: "Issues" },
  { key: "photos", label: "Photos" },
  { key: "history", label: "Release History" },
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

function emitPrototypeToast(message: string) {
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
  emitPrototypeToast(`${filename} exported.`);
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

function findWorksite(id: string) {
  return worksites.find((worksite) => worksite.id === id) ?? worksites[0];
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

export function ConstructionPrototype() {
  const [activeView, setActiveView] = useState<ViewKey>("tomorrow");
  const [worksiteId, setWorksiteId] = useState(worksites[0].id);
  const [dateMode, setDateMode] = useState<"Today" | "Tomorrow" | "Custom">("Tomorrow");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState("cr04");
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
  const [notifications, setNotifications] = useState<OperationalNotification[]>(initialNotifications);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [version, setVersion] = useState(0);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

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
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) ?? machines[0];
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

  function openMachine(machine: Machine, mode: DrawerMode = machine.state === "blocked" ? "why" : "passport") {
    setSelectedMachineId(machine.id);
    setDrawerMode(mode);
    setDrawerOpen(true);
    if (mode === "passport") setPassportTab("overview");
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

  function refreshPrototype(message: string) {
    setVersion((version) => version + 1);
    emitPrototypeToast(message);
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
    releaseHistory.unshift({
      date: "Today",
      worksite: machineWorksite(machine).name,
      machine: machine.code,
      result: computedStatus === "Overdue" ? "Assignment Overdue" : computedStatus === "Accepted" ? "Assignment Accepted" : "Owner Assigned",
      reason: assignmentSummary,
      action: `${computedStatus} by ${owner} · Due ${assignmentDue} · Notified via ${channels.join(", ")}${note ? ` · ${note}` : ""}`,
      user: "George",
      override: "No",
    });
    addOperationalNotification(`${machine.code} ${computedStatus.toLowerCase()} to ${owner}`, `${assignmentSummary} · Due ${assignmentDue} · ${channels.join(", ")}`);
    refreshPrototype(`${machine.code}: ${blockerId ? "blocker" : "open blockers"} ${computedStatus.toLowerCase()} to ${owner}.`);
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
    releaseHistory.unshift({
      date: "Today",
      worksite: machineWorksite(machine).name,
      machine: machine.code,
      result: machine.state === "ready" ? "Ready For Work" : "Blocker Updated",
      reason: machine.reason,
      action: note || "Action completed",
      user: "George",
      override: "No",
    });
    refreshPrototype(`${machine.code}: action completed.`);
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
    releaseHistory.unshift({
      date: "Today",
      worksite: machineWorksite(machine).name,
      machine: machine.code,
      result: machine.state === "ready" ? "Ready For Work" : "Evidence Uploaded",
      reason: documentName || "Evidence uploaded",
      action: `Evidence uploaded · Validity ${expiryDate || "Uploaded today"}`,
      user: "George",
      override: "No",
    });
    addOperationalNotification(`${machine.code} evidence uploaded`, `${documentName || "Evidence"} updated in Documents and Machine Passport.`);
    refreshPrototype(`${machine.code}: ${documentName || "evidence"} uploaded and synced.`);
  }

  function releaseWithOverride(machineId: string, reason: string, approver: string, acceptedUntil: string) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    releaseHistory.unshift({
      date: "Today",
      worksite: machineWorksite(machine).name,
      machine: machine.code,
      result: "Released With Override",
      reason: machine.reason,
      action: `${reason} · Approved by ${approver} · Accepted until ${acceptedUntil}`,
      user: approver,
      override: "Yes",
    });
    machine.state = "at_risk";
    machine.reason = "Released with override";
    machine.nextAction = `Resolve override reason: ${reason}`;
    machine.eta = acceptedUntil || "Today";
    machine.lastUpdated = "Just now";
    refreshPrototype(`${machine.code}: released with override and logged.`);
  }

  function releaseReadyMachines(releaseMachines: Machine[]) {
    const readyMachines = releaseMachines.filter((machine) => machine.state === "ready");
    readyMachines.forEach((machine) => {
      releaseHistory.unshift({
        date: "Today",
        worksite: selectedWorksite.name,
        machine: machine.code,
        result: "Ready For Work",
        reason: "No blocker found",
        action: "Released",
        user: "Dimitris",
        override: "No",
      });
    });
    setReleaseModalOpen(false);
    refreshPrototype(`${readyMachines.length} ready machines released for ${selectedWorksite.name}.`);
  }

  function addPrototypeItem(type: AddItemType, name: string) {
    const cleanName = name.trim();
    if (!cleanName) return;
    if (type === "Worksite") {
      const id = `worksite-${Date.now()}`;
      worksites.push({ id, name: cleanName, location: "New worksite", date: "Tomorrow, 07:00", requiredMachineIds: [] });
      setWorksiteId(id);
      setActiveView("tomorrow");
      refreshPrototype(`${cleanName} added as a worksite.`);
    } else if (type === "Machine") {
      const id = `machine-${Date.now()}`;
      const code = `M-${String(machines.length + 1).padStart(2, "0")}`;
      machines.push({
        id,
        code,
        name: cleanName,
        type: "Machine",
        manufacturer: "Prototype",
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
      });
      selectedWorksite.requiredMachineIds.push(id);
      setSelectedMachineId(id);
      setDrawerMode("passport");
      setDrawerOpen(true);
      refreshPrototype(`${cleanName} added to ${selectedWorksite.name}.`);
    } else if (type === "Certificate") {
      const targetMachine = machines.find((machine) => machine.id === selectedMachineId);
      if (!targetMachine) return;
      targetMachine.certificates.push({ name: cleanName, status: "Expiring soon", expiry: "30 June 2026", daysLeft: "29", owner: "Maria", action: "Review certificate" });
      targetMachine.state = targetMachine.state === "ready" ? "at_risk" : targetMachine.state;
      targetMachine.reason = targetMachine.state === "at_risk" ? "Certificate needs review" : targetMachine.reason;
      refreshPrototype(`${cleanName} added to ${targetMachine.code}.`);
    } else if (type === "Service Blocker") {
      const targetMachine = machines.find((machine) => machine.id === selectedMachineId);
      if (!targetMachine) return;
      targetMachine.service.push({ issue: cleanName, severity: "High", blocksRelease: true, owner: "Workshop", due: "Today", status: "Open" });
      targetMachine.state = "blocked";
      targetMachine.reason = cleanName;
      targetMachine.nextAction = "Complete service action";
      targetMachine.eta = "Today";
      targetMachine.activeBlockers = "1";
      refreshPrototype(`${cleanName} added as a blocker for ${targetMachine.code}.`);
    } else {
      const targetMachine = machines.find((machine) => machine.id === selectedMachineId);
      const documentBlocker = targetMachine?.certificates.find((certificate) => ["Expired", "Missing", "Critical"].includes(certificate.status));
      if (targetMachine && documentBlocker) {
        uploadDocument(selectedMachineId, `certificate:${documentBlocker.name}`, cleanName, "Uploaded today");
      } else {
        refreshPrototype("No document blocker selected.");
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
          title: "Documents",
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
          title: "Actions",
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
          title: "Workshop",
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
              label: service.blocksRelease ? "Blocks release" : service.status,
              tone: service.blocksRelease ? "blocked" as const : service.status === "Resolved" ? "ready" as const : "attention" as const,
              onSelect: () => {
                openMachineFromSearch(machine, "service", "passport", "service");
              },
            })),
        },
        {
          title: "Release History",
          results: releaseHistory
            .filter((item) => valuesMatchSearch(normalizedGlobalSearch, [item.date, item.worksite, item.machine, item.result, item.reason, item.action, item.user]))
            .slice(0, 3)
            .map((item) => ({
              id: `history:${item.date}:${item.machine}:${item.reason}`,
              title: `${item.machine} · ${item.result}`,
              subtitle: item.reason,
              meta: `${item.date} · ${item.user}`,
              label: "History",
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
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-[#E2E8F0] bg-[#0D2F2D] text-white transition lg:static lg:block ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex h-20 items-center border-b border-white/10 px-5">
            <div className="min-w-0">
              <FleetLeverLogo inverse />
              <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide text-white/55">{clientName}</p>
            </div>
          </div>
          <nav aria-label="App navigation" className="space-y-1 px-3 py-4">
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
                      refreshPrototype("Notifications marked as reviewed.");
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
                  {["Profile", "Settings", "Sign out"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (item === "Settings") showView("settings");
                        refreshPrototype(item === "Sign out" ? "Prototype session remains active." : `${item} opened.`);
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
                  emitPrototypeToast(`${worksite.name} opened in Tomorrow's Work Planner.`);
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
                  setPassportTab("documents");
                  openMachine(machine, "passport");
                }}
              />
            ) : null}
            {activeView === "service" ? (
              <WorkshopView
                machinesList={visibleMachines}
                onMachineOpen={(machine) => {
                  setPassportTab("service");
                  openMachine(machine, "passport");
                }}
              />
            ) : null}
            {activeView === "history" ? <ReleaseHistoryView searchTerm={searchTerm} /> : null}
            {activeView === "settings" ? <SettingsView /> : null}
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
          onReviewBlocked={() => emitPrototypeToast("Blocked machines are visible in the release checklist.")}
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
      {addModalType ? <AddItemModal type={addModalType} onAdd={addPrototypeItem} onClose={() => setAddModalType(null)} /> : null}
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
  const releaseStatus = isReadyForRelease ? "Ready to release" : "Cannot release yet";
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
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">Tomorrow&apos;s Work Planner</p>
        <h1 className="mt-1 text-2xl font-semibold leading-tight text-[#111827] sm:text-[26px]">17:00 release checklist</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6B7280]">
          Select the worksite, clear blockers, then release the machines that are ready.
        </p>
      </div>

      <Surface className={`overflow-visible border-l-4 p-0 ${releaseTone}`}>
        <div className="flex flex-col gap-3 border-b border-[#E5E7EB] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">Selected Worksite</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="truncate text-lg font-semibold leading-tight text-[#111827] sm:text-xl">{selectedWorksite.name}</h2>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${isReadyForRelease ? statusClasses("ready") : statusClasses("blocked")}`}>
                {releaseStatus}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#6B7280]">{selectedDateLabel} · {counts.total} required machines</p>
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
              Release Ready
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
                <h2 className="text-lg font-semibold leading-tight text-[#111827]">Required Machines</h2>
                <p className="mt-1 text-[13px] text-[#6B7280]">
                  Assigned to the selected worksite. Showing {rangeStart}-{rangeEnd} of {filteredMachines.length}.
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
                    {["Machine", "Type", "Release State", "Why", "Owner", "Next Action", "ETA", "Action"].map((heading) => {
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
              <p className="text-xs font-bold uppercase text-[#64748B]">{mode === "why" ? "Why Blocked" : "Machine Passport"}</p>
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
              Why Blocked
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
          This machine cannot be released to {machineWorksite(machine).name} tomorrow because:
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
  const canSubmitUpload = Boolean(blockerId && documentName.trim());
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
                <p className="text-sm font-bold text-[#0F766E]">One evidence upload updates Documents, Machine Passport, Action Queue, and Release History.</p>
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
                Select evidence file
                <input type="file" className="sr-only" />
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
              onClick={() => onUpload(blockerId, documentName.trim(), expiryDate.trim())}
              className="min-h-10 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
            >
              {uploadSubmitLabel}
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
            <h2 className="text-xl font-bold text-[#0D2F2D]">Release machines for tomorrow&apos;s work?</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              FleetLever will check certificates, inspections, documents, service blockers and open issues.
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0]">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">
          <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-4">
            <p className="font-bold text-[#92400e]">
              {blocked} machines cannot be released. {attention} need attention. {ready} are ready for work.
            </p>
            <p className="mt-2 text-sm text-[#92400e]">Blocked machines cannot be released without admin override and an audit reason.</p>
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
              This updates the local prototype immediately so the flow can be tested.
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
        description="Compare tomorrow's worksites, spot the release risk, and open the one that needs attention."
        showActions={false}
      />
      <Surface className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Worksite release queue</p>
            <h2 className="mt-2 text-xl font-bold leading-tight text-[#0D2F2D]">Where should operations focus first?</h2>
            <p className="mt-2 text-sm font-semibold text-[#64748B]">Sorted by blockers, then review items.</p>
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
            <span>Release State</span>
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
                  Review release
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
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Worksite Release Review</p>
              <h2 className="mt-1 truncate text-xl font-bold text-[#0D2F2D]">{worksite.name}</h2>
              <p className="mt-1 text-sm font-semibold text-[#64748B]">
                {worksite.date} · {worksite.location}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] text-[#64748B]"
              aria-label="Close worksite release review"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className={`rounded-lg border p-4 ${canRelease ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#FECACA] bg-[#FEF2F2]"}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Release Decision</p>
            <p className={`mt-2 text-lg font-bold ${canRelease ? "text-[#15803D]" : "text-[#B91C1C]"}`}>
              {canRelease ? "Ready to release" : "Cannot release yet"}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#475569]">
              {canRelease ? "No blocking machines found for this worksite." : `${counts.blocked} blocker${counts.blocked === 1 ? "" : "s"} must be cleared first.`}
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

  function handlePhotoUpload(machine: Machine, file: File | undefined) {
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
    emitPrototypeToast(`${machine.code} photo updated.`);
  }

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Machines"
        description="Asset inventory: find a machine, inspect its status, and open the passport or current release issue."
        importLabel="Import Machines"
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
  const action = machine.state === "blocked" ? "Open issue" : machine.state === "at_risk" ? "Review status" : "Open passport";
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
          No matching machines, worksites, documents, actions, workshop jobs, or release history.
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
    { key: "documents", label: "Documents", tone: "neutral", value: certificateActions },
    { key: "workshop", label: "Workshop", tone: "neutral", value: serviceActions },
  ];

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Action Queue"
        description="Cross-machine commands: do the next release action here, then open the machine case only when detail is needed."
        showActions={false}
      />
      <KpiStrip
        items={[
          ["Open Actions", rows.length, "neutral"],
          ["Blocking", blockingActionCount, "blocked"],
          ["Review", reviewActionCount, "attention"],
          ["Documents", certificateActions, "blocked"],
          ["Workshop", serviceActions, "neutral"],
        ]}
      />
      <Surface className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Release action queue</p>
            <h2 className="mt-2 text-xl font-bold text-[#0D2F2D]">Actions that need owner command</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">{rows.length} actions · {owners} owners · sorted by release impact and due time.</p>
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
            No open blockers. Tomorrow&apos;s work can move to release review.
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
            {row.blocker.kind === "certificate" ? "Document" : "Workshop"}
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
        title="Documents"
        description="Specialist document control: missing, expired, and near-expiry evidence across machines."
        importLabel="Import Documents"
        exportLabel="Export Document Report"
      />
      <KpiStrip
        items={[
          ["Expired", allCertificates.filter(({ certificate }) => certificate.status === "Expired").length, "blocked"],
          ["Missing", allCertificates.filter(({ certificate }) => certificate.status === "Missing").length, "blocked"],
          ["Critical Soon", allCertificates.filter(({ certificate }) => certificate.status === "Critical" || certificate.status === "Expiring soon").length, "attention"],
          ["Valid", allCertificates.filter(({ certificate }) => certificate.status === "Valid").length, "ready"],
          ["Release Impact", machinesList.filter((machine) => machine.state === "blocked" && machine.certificates.some((certificate) => certificate.status !== "Valid")).length, "blocked"],
        ]}
      />
      <Surface className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Document control queue</p>
            <h2 className="mt-2 text-xl font-bold text-[#0D2F2D]">Files that need office action</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">Upload evidence, assign renewal owners, or open the full machine file.</p>
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
                        emitPrototypeToast(`${machine.code}: ${certificate.name} file preview opened.`);
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

function WorkshopView({ machinesList, onMachineOpen }: { machinesList: Machine[]; onMachineOpen: (machine: Machine) => void }) {
  const allService = machinesList.flatMap((machine) => machine.service);
  const activeService = machinesList.flatMap((machine) => machine.service.map((service) => ({ machine, service }))).filter(({ service }) => service.status !== "Resolved");

  return (
    <div className="space-y-5">
      <ViewHeader title="Workshop" description="Specialist maintenance queue: service work, workshop ownership, and release impact." showActions={false} />
      <KpiStrip
        items={[
          ["Open Jobs", allService.filter((service) => service.status !== "Resolved").length, "blocked"],
          ["Release Impact", allService.filter((service) => service.blocksRelease && service.status !== "Resolved").length, "blocked"],
          ["In Progress", allService.filter((service) => service.status === "In Progress").length, "attention"],
          ["Resolved", allService.filter((service) => service.status === "Resolved").length, "ready"],
        ]}
      />
      <Surface className="overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#008C95]">Workshop job queue</p>
          <h2 className="mt-2 text-xl font-bold text-[#0D2F2D]">Service work owned by the workshop</h2>
          <p className="mt-1 text-sm font-semibold text-[#64748B]">Use this page to manage mechanical work. Open the machine passport for full service history.</p>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {activeService.map(({ machine, service }) => (
            <div key={`${machine.id}-${service.issue}`} className={`grid gap-4 px-5 py-4 lg:grid-cols-[220px_minmax(0,1fr)_150px_140px_160px_170px] lg:items-center ${service.blocksRelease ? "bg-[#FEF2F2]/45" : "bg-white"}`}>
              <div>
                <p className="text-base font-bold text-[#0D2F2D]">{machine.code}</p>
                <p className="mt-1 text-xs font-semibold text-[#64748B]">{machineWorksite(machine).name}</p>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-[#111827]">{service.issue}</h3>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${service.blocksRelease ? statusClasses("blocked") : statusClasses("at_risk")}`}>
                    {service.blocksRelease ? "Release impact" : "Review"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-[#64748B]">{service.severity} severity · {service.blocksRelease ? "blocks release" : "does not block release"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Owner</p>
                <p className="mt-1 font-bold text-[#0D2F2D]">{service.owner}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Due</p>
                <p className="mt-1 font-semibold text-[#1F2933]">{service.due}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[#64748B]">Status</p>
                <p className="mt-1 font-semibold text-[#1F2933]">{service.status}</p>
              </div>
              <button type="button" onClick={() => onMachineOpen(machine)} className="min-h-10 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white">
                Open service
              </button>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

function ReleaseHistoryView({ searchTerm }: { searchTerm: string }) {
  const normalized = normalizeSearch(searchTerm);
  const visibleHistory = releaseHistory.filter((item) =>
    !normalized || [item.date, item.worksite, item.machine, item.result, item.reason, item.action, item.user].some((value) => value.toLowerCase().includes(normalized)),
  );

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Release History"
        description="A clean audit trail of every release decision."
        showActions={false}
      />
      <KpiStrip
        items={[
          ["Released", visibleHistory.filter((item) => item.result === "Ready For Work").length, "ready"],
          ["Blocked", visibleHistory.filter((item) => item.result === "Cannot Be Released").length, "blocked"],
          ["Needs Attention", visibleHistory.filter((item) => item.result === "Needs Attention").length, "attention"],
          ["Overrides", visibleHistory.filter((item) => item.override === "Yes").length, "neutral"],
        ]}
      />
      <Surface className="overflow-hidden">
        <div className="divide-y divide-[#E2E8F0]">
          {visibleHistory.map((item) => {
            const state: MachineState =
              item.result === "Ready For Work"
                ? "ready"
                : item.result === "Needs Attention" || item.result === "Owner Assigned" || item.result === "Assignment Accepted"
                  ? "at_risk"
                  : "blocked";
            return (
              <div key={`${item.date}-${item.machine}-${item.reason}`} className="grid gap-4 p-4 md:grid-cols-[120px_180px_minmax(0,1fr)_180px]">
                <div>
                  <p className="text-xs font-bold uppercase text-[#64748B]">Date</p>
                  <p className="font-bold text-[#0D2F2D]">{item.date}</p>
                </div>
                <div>
                  <p className="font-bold text-[#0D2F2D]">{item.machine}</p>
                  <p className="text-xs font-semibold text-[#64748B]">{item.worksite}</p>
                </div>
                <div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(state)}`}>{item.result}</span>
                  <p className="mt-2 text-sm font-semibold text-[#1F2933]">{item.reason}</p>
                  <p className="text-xs text-[#64748B]">{item.action} · {item.user} · Override: {item.override}</p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadTextFile(`${item.machine}-release-evidence.txt`, `${item.date}\n${item.worksite}\n${item.machine}\n${item.result}\n${item.reason}`)}
                  className="h-10 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0D2F2D]"
                >
                  Download evidence
                </button>
              </div>
            );
          })}
        </div>
      </Surface>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-5">
      <ViewHeader title="Settings" description="Rules that control release decisions, reports and team ownership." showActions={false} />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Release gate", "Blocked machines cannot be released without owner override and audit reason."],
          ["Daily report", "06:30 in-app summary with ready, review and blocked machines."],
          ["Document warning", "Certificate warnings at 60, 30, 14 and 7 days."],
          ["Owners", "Dimitris operations · Maria office · Kostas workshop."],
          ["Worksites", worksites.map((worksite) => worksite.name).join(" · ")],
          ["Machine types", "Crane · Excavator · Loader · Truck · Generator · Other."],
        ].map(([title, body]) => (
          <Surface key={title} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0D2F2D]">{title}</h2>
              <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1 text-xs font-bold text-[#15803D]">Active</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">{body}</p>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function ViewHeader({
  description,
  exportLabel = "Export Report",
  importLabel = "Import",
  showActions = true,
  title,
}: {
  description: string;
  exportLabel?: string;
  importLabel?: string;
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
            onClick={() => emitPrototypeToast(`${importLabel} queue opened.`)}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#1F2933]"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {importLabel}
          </button>
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
