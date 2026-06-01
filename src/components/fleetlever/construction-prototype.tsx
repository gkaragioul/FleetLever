"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  ArrowRight,
  Download,
  FileText,
  History,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldAlert,
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
  | "passports"
  | "blockers"
  | "certificates"
  | "service"
  | "history"
  | "settings";
type DrawerMode = "why" | "passport";
type PassportTab = "overview" | "documents" | "certificates" | "service" | "issues" | "photos" | "history";

type Certificate = {
  name: string;
  status: "Valid" | "Expiring soon" | "Critical" | "Expired" | "Missing";
  expiry: string;
  daysLeft: string;
  owner: string;
  action: string;
};

type ServiceBlocker = {
  issue: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  blocksRelease: boolean;
  owner: string;
  due: string;
  status: "Open" | "In Progress" | "Waiting" | "Resolved";
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

const clientName = "Athens Crane Services";

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

const navItems: Array<{ key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "tomorrow", label: "Tomorrow's Work", icon: CalendarDays },
  { key: "worksites", label: "Worksites", icon: Building2 },
  { key: "machines", label: "Machines", icon: Building2 },
  { key: "passports", label: "Machine Passports", icon: FileText },
  { key: "blockers", label: "Blockers", icon: ShieldAlert },
  { key: "certificates", label: "Certificates", icon: BadgeCheck },
  { key: "service", label: "Service Blockers", icon: Wrench },
  { key: "history", label: "Release History", icon: History },
  { key: "settings", label: "Settings", icon: Settings },
];

const passportTabs: Array<{ key: PassportTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "documents", label: "Documents" },
  { key: "certificates", label: "Certificates" },
  { key: "service", label: "Service" },
  { key: "issues", label: "Issues" },
  { key: "photos", label: "Photos" },
  { key: "history", label: "Release History" },
];

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

function machineMatchesQuery(machine: Machine, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return [
    machine.code,
    machine.name,
    machine.type,
    machine.owner,
    machine.reason,
    machine.serial,
    machine.certificates.map((certificate) => certificate.name).join(" "),
    machine.service.map((service) => service.issue).join(" "),
  ].some((value) => value.toLowerCase().includes(normalized));
}

function worksiteMatchesQuery(worksite: Worksite, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return [worksite.name, worksite.location, worksite.date].some((value) => value.toLowerCase().includes(normalized));
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

function impactForMachine(machine: Machine) {
  if (machine.state === "ready") return "Can be released to tomorrow's work.";
  if (machine.state === "at_risk") return "Can work, but needs action before release.";
  if (machine.id === "cr04") return "Blocks Athens Metro release.";
  if (machine.id === "ld03") return "Cannot release to worksite.";
  return `Cannot release to ${machineWorksite(machine).name}.`;
}

function certificateSummary(machine: Machine) {
  const expired = machine.certificates.filter((certificate) => certificate.status === "Expired").length;
  const missing = machine.certificates.filter((certificate) => certificate.status === "Missing").length;
  const critical = machine.certificates.filter((certificate) => certificate.status === "Critical").length;
  const valid = machine.certificates.filter((certificate) => certificate.status === "Valid").length;
  return [
    expired ? `${expired} expired` : null,
    missing ? `${missing} missing` : null,
    critical ? `${critical} critical` : null,
    valid ? `${valid} valid` : null,
  ].filter(Boolean).join(" · ");
}

function serviceSummary(machine: Machine) {
  const blocking = machine.service.filter((item) => item.blocksRelease && item.status !== "Resolved").length;
  if (blocking) return `${blocking} blocker`;
  return machine.service[0]?.status ?? "Clear";
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
  const [toast, setToast] = useState<Toast | null>(null);
  const [version, setVersion] = useState(0);

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

  const selectedWorksite = findWorksite(worksiteId);
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) ?? machines[0];
  void version;
  const visibleWorksites = worksites.filter((worksite) => worksiteMatchesQuery(worksite, searchTerm));
  const visibleMachines = machines.filter((machine) => machineMatchesQuery(machine, searchTerm));
  const allPlannedMachines = (() => {
    return machinesForWorksite(selectedWorksite);
  })();

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

  function showView(nextView: ViewKey) {
    setActiveView(nextView);
    setMobileNavOpen(false);
  }

  function refreshPrototype(message: string) {
    setVersion((version) => version + 1);
    emitPrototypeToast(message);
  }

  function completeMachine(machineId: string, message = "Blockers cleared.") {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    machine.state = "ready";
    machine.reason = "No blocker found";
    machine.nextAction = "-";
    machine.eta = "-";
    machine.activeBlockers = "0";
    machine.lastUpdated = "Just now";
    machine.certificates = machine.certificates.map((certificate) =>
      certificate.status === "Expired" || certificate.status === "Missing" || certificate.status === "Critical"
        ? { ...certificate, status: "Valid", expiry: "Renewed today", daysLeft: "365", action: "No action" }
        : certificate,
    );
    machine.service = machine.service.map((service) => ({ ...service, blocksRelease: false, status: "Resolved", due: "Completed" }));
    machine.issues = [];
    releaseHistory.unshift({
      date: "Today",
      worksite: machineWorksite(machine).name,
      machine: machine.code,
      result: "Ready For Work",
      reason: "Blockers cleared",
      action: message,
      user: "George",
      override: "No",
    });
    refreshPrototype(`${machine.code}: ${message}`);
  }

  function assignOwner(machineId: string) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    machine.owner = machine.owner === "Dimitris" ? "Maria" : "Dimitris";
    machine.lastUpdated = "Just now";
    refreshPrototype(`${machine.code} assigned to ${machine.owner}.`);
  }

  function uploadDocument(machineId: string) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    const currentCount = Number.parseInt(machine.documents, 10) || 0;
    machine.documents = `${currentCount + 1} files`;
    machine.certificates = machine.certificates.map((certificate) =>
      certificate.status === "Expired" || certificate.status === "Missing"
        ? { ...certificate, status: "Valid", expiry: "Uploaded today", daysLeft: "365", action: "No action" }
        : certificate,
    );
    if (!machine.service.some((service) => service.blocksRelease) && machine.certificates.every((certificate) => certificate.status === "Valid")) {
      machine.state = "ready";
      machine.reason = "No blocker found";
      machine.nextAction = "-";
      machine.eta = "-";
      machine.activeBlockers = "0";
    }
    machine.lastUpdated = "Just now";
    refreshPrototype(`${machine.code}: document uploaded.`);
  }

  function releaseWithOverride(machineId: string) {
    const machine = machines.find((item) => item.id === machineId);
    if (!machine) return;
    releaseHistory.unshift({
      date: "Today",
      worksite: machineWorksite(machine).name,
      machine: machine.code,
      result: "Ready For Work",
      reason: machine.reason,
      action: "Released with override",
      user: "George",
      override: "Yes",
    });
    machine.state = "at_risk";
    machine.reason = "Released with override";
    machine.nextAction = "Complete audit follow-up";
    machine.eta = "Today";
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
      uploadDocument(selectedMachineId);
    }
    setAddModalType(null);
    setAddMenuOpen(false);
  }

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
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search machine, worksite, certificate, owner...  ⌘K"
                  className="h-9 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 text-[13px] text-[#1F2933] outline-none transition placeholder:text-[#64748B] focus:border-[#0D2F2D] focus:bg-white focus:ring-2 focus:ring-[#0D2F2D]/10"
                />
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#1F2933]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
              </button>
              {notificationOpen ? (
                <div className="absolute right-16 top-14 z-50 w-80 rounded-lg border border-[#E2E8F0] bg-white p-3 shadow-xl">
                  <p className="text-xs font-bold uppercase text-[#64748B]">Notifications</p>
                  <div className="mt-3 space-y-2">
                    {[
                      "CR-04 certificate blocks tomorrow's release.",
                      "LD-03 hydraulic check is still open.",
                      "Daily morning report is ready.",
                    ].map((item) => (
                      <div key={item} className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm font-semibold text-[#1F2933]">
                        {item}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
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
                onReview={(worksite) => {
                  setWorksiteId(worksite.id);
                  showView("tomorrow");
                }}
              />
            ) : null}
            {activeView === "machines" ? <MachinesView machinesList={visibleMachines} onMachineOpen={openMachine} /> : null}
            {activeView === "passports" ? <PassportsView machinesList={visibleMachines} onMachineOpen={(machine) => openMachine(machine, "passport")} /> : null}
            {activeView === "blockers" ? <BlockersView machinesList={visibleMachines} onMachineOpen={(machine) => openMachine(machine, "why")} /> : null}
            {activeView === "certificates" ? <CertificatesView machinesList={visibleMachines} onMachineOpen={(machine) => openMachine(machine, "passport")} /> : null}
            {activeView === "service" ? <ServiceView machinesList={visibleMachines} onMachineOpen={(machine) => openMachine(machine, "passport")} /> : null}
            {activeView === "history" ? <ReleaseHistoryView searchTerm={searchTerm} /> : null}
            {activeView === "settings" ? <SettingsView /> : null}
          </div>
        </div>

        {drawerOpen ? (
          <DetailDrawer
            machine={selectedMachine}
            mode={drawerMode}
            onClose={() => setDrawerOpen(false)}
            onAssignOwner={() => assignOwner(selectedMachine.id)}
            onCompleteAction={() => completeMachine(selectedMachine.id, "Action completed.")}
            onExportPassport={() => downloadTextFile(`${selectedMachine.code}-passport.txt`, `${selectedMachine.code}\n${selectedMachine.name}\n${externalStatus(selectedMachine.state)}`)}
            onReleaseOverride={() => releaseWithOverride(selectedMachine.id)}
            onModeChange={setDrawerMode}
            onPassportTabChange={setPassportTab}
            onUploadDocument={() => uploadDocument(selectedMachine.id)}
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
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
  onAssignOwner: () => void;
  onClose: () => void;
  onCompleteAction: () => void;
  onExportPassport: () => void;
  onReleaseOverride: () => void;
  onModeChange: (mode: DrawerMode) => void;
  onPassportTabChange: (tab: PassportTab) => void;
  onUploadDocument: () => void;
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

function WhyBlocked({
  machine,
  onAssignOwner,
  onCompleteAction,
  onOpenPassport,
  onReleaseOverride,
  onUploadDocument,
}: {
  machine: Machine;
  onAssignOwner: () => void;
  onCompleteAction: () => void;
  onOpenPassport: () => void;
  onReleaseOverride: () => void;
  onUploadDocument: () => void;
}) {
  const blockerCards = [
    {
      title: "Certificate Problem",
      status: machine.certificates.find((certificate) => certificate.status === "Expired")?.status ?? "Valid",
      lines: [
        ["Document", "Lifting Certificate"],
        ["Expired", "28 May 2026"],
        ["Action", "Upload renewed certificate"],
        ["Owner", "Dimitris"],
        ["Due", "2 June 2026"],
      ],
    },
    {
      title: "Inspection Problem",
      status: "Missing",
      lines: [
        ["Required", "Periodic inspection"],
        ["Action", "Book inspection"],
        ["Owner", "Maria"],
        ["Due", "3 June 2026"],
      ],
    },
    {
      title: "Service Problem",
      status: "Overdue",
      lines: [
        ["Task", "Hydraulic check"],
        ["Action", "Complete service"],
        ["Owner", "Workshop"],
        ["Due", "Today"],
      ],
    },
  ];

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
          <li>Lifting certificate expired on 28 May 2026.</li>
          <li>Periodic inspection is missing.</li>
          <li>Service task is overdue by 12 days.</li>
        </ol>
      </div>
      <div className="mt-4 space-y-3">
        {blockerCards.map((card) => (
          <div key={card.title} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-[#0D2F2D]">{card.title}</h3>
              <span className="rounded-full border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-xs font-bold text-[#B91C1C]">
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
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onAssignOwner} className="min-h-10 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#0D2F2D]">
          Assign owner
        </button>
        <button type="button" onClick={onCompleteAction} className="min-h-10 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#0D2F2D]">
          Mark action complete
        </button>
        <button type="button" onClick={onOpenPassport} className="min-h-10 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#0D2F2D]">
          Open Machine Passport
        </button>
        <button type="button" onClick={onUploadDocument} className="min-h-10 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#0D2F2D]">
          Upload document
        </button>
        <button type="button" onClick={onReleaseOverride} className="col-span-2 min-h-10 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 text-sm font-bold text-[#92400e]">
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
  onUploadDocument: () => void;
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
        {passportTab === "documents" ? <SimpleRows rows={[["Machine registration", "Identity", "Valid"], ["Insurance file", "Insurance", "Valid"], ["Operator assignment", "Worksite", "Updated today"]]} /> : null}
        {passportTab === "certificates" ? <CertificateCards machine={machine} onUploadDocument={onUploadDocument} /> : null}
        {passportTab === "service" ? <ServiceCards machine={machine} /> : null}
        {passportTab === "issues" ? <SimpleRows rows={machine.issues.map((issue) => [issue.title, issue.severity, issue.status])} empty="No open issues." /> : null}
        {passportTab === "photos" ? <SimpleRows rows={machine.photos.map((photo) => [photo.title, photo.category, photo.date])} empty="No photos uploaded." /> : null}
        {passportTab === "history" ? <SimpleRows rows={releaseHistory.filter((item) => item.machine === machine.code).map((item) => [item.date, item.result, item.reason])} empty="No release history yet." /> : null}
      </div>
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

function CertificateCards({ machine, onUploadDocument }: { machine: Machine; onUploadDocument: () => void }) {
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
            <button type="button" onClick={onUploadDocument} className="rounded-md border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#0D2F2D]">
              Replace
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

function WorksitesView({ onReview, worksitesList }: { onReview: (worksite: Worksite) => void; worksitesList: Worksite[] }) {
  const worksiteRows = worksitesList.map((worksite) => {
    const list = machinesForWorksite(worksite);
    const counts = countsForMachines(list);
    const mainBlocker = list.find((machine) => machine.state === "blocked") ?? list.find((machine) => machine.state === "at_risk");
    return { worksite, list, counts, mainBlocker };
  });
  const sortedRows = [...worksiteRows].sort((a, b) => b.counts.blocked - a.counts.blocked || b.counts.attention - a.counts.attention);

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Worksites"
        description="Start with the job, then see which machine, owner, and action controls tomorrow's release."
        showActions={false}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="p-5">
          <p className="text-xs font-bold uppercase text-[#008C95]">Tomorrow work queue</p>
          <h2 className="mt-2 text-2xl font-bold text-[#0D2F2D]">Which work packages can leave the gate?</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {sortedRows.map(({ counts, mainBlocker, worksite }) => {
              const state: MachineState = counts.blocked ? "blocked" : counts.attention ? "at_risk" : "ready";
              return (
                <button
                  key={worksite.id}
                  type="button"
                  onClick={() => onReview(worksite)}
                  className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${statusClasses(state)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-[#0D2F2D]">{worksite.name}</p>
                      <p className="mt-1 text-xs font-semibold text-[#64748B]">{worksite.location}</p>
                    </div>
                    <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-bold">{counts.ready}/{counts.total}</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                    <div className="h-full rounded-full bg-[#008C95]" style={{ width: `${counts.total ? (counts.ready / counts.total) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase">{state === "ready" ? "Ready to release" : state === "at_risk" ? "Review before release" : "Blocked"}</p>
                  <p className="mt-1 min-h-10 text-sm font-semibold text-[#1F2933]">
                    {mainBlocker ? `${mainBlocker.code}: ${mainBlocker.reason}` : "No blocker found"}
                  </p>
                </button>
              );
            })}
          </div>
        </Surface>
        <Surface className="p-5">
          <p className="text-xs font-bold uppercase text-[#64748B]">Operator focus</p>
          <h2 className="mt-2 text-lg font-bold text-[#0D2F2D]">Review blocked worksites first</h2>
          <div className="mt-4 space-y-3">
            {sortedRows.filter(({ counts }) => counts.blocked).map(({ mainBlocker, worksite }) => (
              <button
                key={worksite.id}
                type="button"
                onClick={() => onReview(worksite)}
                className="w-full rounded-lg border border-[#fecaca] bg-[#fff7f7] p-3 text-left"
              >
                <p className="font-bold text-[#0D2F2D]">{worksite.name}</p>
                <p className="mt-1 text-sm font-semibold text-[#B91C1C]">{mainBlocker ? mainBlocker.reason : "Blocked"}</p>
                <p className="mt-2 text-xs font-semibold text-[#64748B]">{mainBlocker ? `${mainBlocker.owner} · ${mainBlocker.nextAction}` : "Assign owner"}</p>
              </button>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function MachinesView({ machinesList, onMachineOpen }: { machinesList: Machine[]; onMachineOpen: (machine: Machine, mode?: DrawerMode) => void }) {
  const grouped = {
    blocked: machinesList.filter((machine) => machine.state === "blocked"),
    at_risk: machinesList.filter((machine) => machine.state === "at_risk"),
    ready: machinesList.filter((machine) => machine.state === "ready"),
  };

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Machines"
        description="A compact release inventory: what is blocked, what needs review, and what can work."
        importLabel="Import Machines"
        exportLabel="Export Machine List"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Blocked", grouped.blocked, "blocked"],
          ["Needs review", grouped.at_risk, "at_risk"],
          ["Ready", grouped.ready, "ready"],
        ].map(([label, list, state]) => (
          <Surface key={label as string} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-[#0D2F2D]">{label as string}</h2>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(state as MachineState)}`}>
                {(list as Machine[]).length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {(list as Machine[]).map((machine) => (
                <button
                  key={machine.id}
                  type="button"
                  onClick={() => onMachineOpen(machine, machine.state === "blocked" ? "why" : "passport")}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white p-3 text-left hover:border-[#008C95]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#0D2F2D]">{machine.code}</p>
                      <p className="text-xs font-semibold text-[#64748B]">{machine.name}</p>
                    </div>
                    <span className="text-xs font-bold uppercase text-[#64748B]">{machine.type}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#1F2933]">{machine.reason}</p>
                  <p className="mt-1 text-xs font-semibold text-[#64748B]">{machine.owner} · {machine.nextAction === "-" ? "No action" : machine.nextAction}</p>
                </button>
              ))}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function PassportsView({ machinesList, onMachineOpen }: { machinesList: Machine[]; onMachineOpen: (machine: Machine) => void }) {
  const [passportFilter, setPassportFilter] = useState<"all" | MachineState | "missing" | "expiring">("all");
  const filteredMachines = machinesList.filter((machine) => {
    if (passportFilter === "all") return true;
    if (passportFilter === "missing") return machine.certificates.some((certificate) => certificate.status === "Missing");
    if (passportFilter === "expiring") return machine.certificates.some((certificate) => certificate.status === "Critical" || certificate.status === "Expiring soon");
    return machine.state === passportFilter;
  });

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Machine Passports"
        description="The evidence file behind each release decision: certificates, service, issues and history."
        importLabel="Import Passports"
        exportLabel="Export Report"
      />
      <div className="flex flex-wrap gap-2">
        {[
          ["All", "all"],
          ["Ready For Work", "ready"],
          ["Needs Attention", "at_risk"],
          ["Cannot Be Released", "blocked"],
          ["Missing Documents", "missing"],
          ["Expiring Soon", "expiring"],
        ].map(([label, value]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPassportFilter(value as typeof passportFilter)}
            className={`min-h-9 rounded-full border px-3 text-xs font-bold uppercase ${
              passportFilter === value ? "border-[#0D2F2D] bg-[#0D2F2D] text-white" : "border-[#E2E8F0] bg-white text-[#64748B]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {filteredMachines.map((machine) => (
          <Surface key={machine.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#0D2F2D]">{machine.code}</h2>
                <p className="text-sm text-[#64748B]">{machine.name}</p>
              </div>
              <StatusPill state={machine.state} />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#64748B]">Worksite: {machineWorksite(machine).name}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <p className="rounded-md bg-[#F8FAFC] p-3"><span className="block text-xs font-bold uppercase text-[#64748B]">Documents</span>{machine.documents}</p>
              <p className="rounded-md bg-[#F8FAFC] p-3"><span className="block text-xs font-bold uppercase text-[#64748B]">Service</span>{serviceSummary(machine)}</p>
              <p className="col-span-2 rounded-md bg-[#F8FAFC] p-3"><span className="block text-xs font-bold uppercase text-[#64748B]">Certificates</span>{certificateSummary(machine)}</p>
            </div>
            <p className="mt-4 rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm font-bold text-[#0D2F2D]">{impactForMachine(machine)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onMachineOpen(machine)} className="min-h-10 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white">
                Open Passport
              </button>
              {machine.state === "blocked" ? (
                <button type="button" onClick={() => onMachineOpen(machine)} className="min-h-10 rounded-md border border-[#E2E8F0] bg-white px-4 text-sm font-bold text-[#0D2F2D]">
                  Review Blockers
                </button>
              ) : null}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function BlockersView({ machinesList, onMachineOpen }: { machinesList: Machine[]; onMachineOpen: (machine: Machine) => void }) {
  const blockedMachines = machinesList.filter((machine) => machine.state === "blocked");
  return (
    <div className="space-y-5">
      <ViewHeader title="Blockers" description="The owner queue for anything that stops release." showActions={false} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="p-5">
          <p className="text-xs font-bold uppercase text-[#B91C1C]">Resolve first</p>
          <h2 className="mt-2 text-2xl font-bold text-[#0D2F2D]">{blockedMachines.length} blockers stop the release tomorrow</h2>
          <div className="mt-5 space-y-3">
            {blockedMachines.map((machine) => (
              <button
                key={machine.id}
                type="button"
                onClick={() => onMachineOpen(machine)}
                className="grid w-full gap-3 rounded-lg border border-[#fecaca] bg-[#fff7f7] p-4 text-left md:grid-cols-[180px_minmax(0,1fr)_180px]"
              >
                <div>
                  <p className="font-bold text-[#0D2F2D]">{machine.code}</p>
                  <p className="text-xs font-semibold text-[#64748B]">{machineWorksite(machine).name}</p>
                </div>
                <div>
                  <p className="font-bold text-[#B91C1C]">{machine.reason}</p>
                  <p className="mt-1 text-sm text-[#64748B]">{impactForMachine(machine)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-[#64748B]">Owner</p>
                  <p className="font-bold text-[#0D2F2D]">{machine.owner}</p>
                  <p className="mt-1 text-xs font-semibold text-[#64748B]">{machine.eta}</p>
                </div>
              </button>
            ))}
          </div>
        </Surface>
        <Surface className="p-5">
          <p className="text-xs font-bold uppercase text-[#64748B]">Next actions</p>
          <div className="mt-4 space-y-3">
            {blockedMachines.map((machine) => (
              <div key={machine.id} className="rounded-lg border border-[#E2E8F0] p-3">
                <p className="font-bold text-[#0D2F2D]">{machine.owner}</p>
                <p className="mt-1 text-sm font-semibold text-[#1F2933]">{machine.nextAction}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function CertificatesView({ machinesList, onMachineOpen }: { machinesList: Machine[]; onMachineOpen: (machine: Machine) => void }) {
  const allCertificates = machinesList.flatMap((machine) => machine.certificates.map((certificate) => ({ certificate, machine })));
  const priorityCertificates = allCertificates.filter(({ certificate }) => certificate.status !== "Valid");

  return (
    <div className="space-y-5">
      <ViewHeader
        title="Certificates"
        description="Document deadlines translated into release risk."
        importLabel="Import Certificates"
        exportLabel="Export Certificate Report"
      />
      <KpiStrip
        items={[
          ["Expired", allCertificates.filter(({ certificate }) => certificate.status === "Expired").length, "blocked"],
          ["Missing", allCertificates.filter(({ certificate }) => certificate.status === "Missing").length, "blocked"],
          ["Critical Soon", allCertificates.filter(({ certificate }) => certificate.status === "Critical" || certificate.status === "Expiring soon").length, "attention"],
          ["Valid", allCertificates.filter(({ certificate }) => certificate.status === "Valid").length, "ready"],
          ["Blocking Release", machinesList.filter((machine) => machine.state === "blocked" && machine.certificates.some((certificate) => certificate.status !== "Valid")).length, "blocked"],
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {priorityCertificates.map(({ certificate, machine }) => (
          <Surface key={`${machine.id}-${certificate.name}`} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#64748B]">{machine.code} · {machineWorksite(machine).name}</p>
                <h2 className="mt-2 text-lg font-bold text-[#0D2F2D]">{certificate.name}</h2>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${certificateClasses(certificate.status)}`}>{certificate.status}</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <p className="rounded-md bg-[#F8FAFC] p-3 text-sm"><span className="block text-xs font-bold uppercase text-[#64748B]">Expiry</span>{certificate.expiry}</p>
              <p className="rounded-md bg-[#F8FAFC] p-3 text-sm"><span className="block text-xs font-bold uppercase text-[#64748B]">Owner</span>{certificate.owner}</p>
              <p className="rounded-md bg-[#F8FAFC] p-3 text-sm"><span className="block text-xs font-bold uppercase text-[#64748B]">Days left</span>{certificate.daysLeft}</p>
            </div>
            <p className="mt-4 text-sm font-semibold text-[#64748B]">
              {certificate.status === "Expired" || certificate.status === "Missing" ? `Blocks ${machineWorksite(machine).name} release.` : "Needs attention before the next release."}
            </p>
            <button type="button" onClick={() => onMachineOpen(machine)} className="mt-4 min-h-10 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white">
              {certificate.status === "Expired" || certificate.status === "Missing" ? "Resolve certificate" : "Review certificate"}
            </button>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function ServiceView({ machinesList, onMachineOpen }: { machinesList: Machine[]; onMachineOpen: (machine: Machine) => void }) {
  const allService = machinesList.flatMap((machine) => machine.service);
  const activeService = machinesList.flatMap((machine) => machine.service.map((service) => ({ machine, service }))).filter(({ service }) => service.status !== "Resolved");

  return (
    <div className="space-y-5">
      <ViewHeader title="Service Blockers" description="Workshop work that can delay a machine release." showActions={false} />
      <KpiStrip
        items={[
          ["Open Service Blockers", allService.filter((service) => service.status !== "Resolved").length, "blocked"],
          ["Blocking Release", allService.filter((service) => service.blocksRelease && service.status !== "Resolved").length, "blocked"],
          ["In Progress", allService.filter((service) => service.status === "In Progress").length, "attention"],
          ["Resolved", allService.filter((service) => service.status === "Resolved").length, "ready"],
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {activeService.map(({ machine, service }) => (
          <Surface key={`${machine.id}-${service.issue}`} className={`p-5 ${service.blocksRelease ? "border-[#fecaca] bg-[#fff7f7]" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#64748B]">{machine.code} · {machineWorksite(machine).name}</p>
                <h2 className="mt-2 text-lg font-bold text-[#0D2F2D]">{service.issue}</h2>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${service.blocksRelease ? statusClasses("blocked") : statusClasses("at_risk")}`}>
                {service.blocksRelease ? "Blocks release" : "Review"}
              </span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <p className="rounded-md bg-white p-3 text-sm"><span className="block text-xs font-bold uppercase text-[#64748B]">Owner</span>{service.owner}</p>
              <p className="rounded-md bg-white p-3 text-sm"><span className="block text-xs font-bold uppercase text-[#64748B]">Due</span>{service.due}</p>
              <p className="rounded-md bg-white p-3 text-sm"><span className="block text-xs font-bold uppercase text-[#64748B]">Status</span>{service.status}</p>
            </div>
            <button type="button" onClick={() => onMachineOpen(machine)} className="mt-4 min-h-10 rounded-md bg-[#0D2F2D] px-4 text-sm font-bold text-white">
              Open service blocker
            </button>
          </Surface>
        ))}
      </div>
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
            const state: MachineState = item.result === "Ready For Work" ? "ready" : item.result === "Needs Attention" ? "at_risk" : "blocked";
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
      <ViewHeader title="Settings" description="Rules that control release decisions, reports and team ownership." />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Release gate", "Blocked machines cannot be released without owner override and audit reason."],
          ["Morning report", "Daily email at 06:30 with ready, review and blocked machines."],
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
