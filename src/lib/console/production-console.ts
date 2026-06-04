import type { FleetLeverData, FleetDocument, Issue, MaintenanceTask } from "@/lib/fleetlever";

type MachineState = "ready" | "at_risk" | "blocked";

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

type ConsoleMachine = {
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

type ConsoleWorksite = {
  id: string;
  name: string;
  location: string;
  date: string;
  requiredMachineIds: string[];
};

export type ProductionConsoleSnapshot = {
  organizationName: string;
  schemaVersion: 1;
  machines: ConsoleMachine[];
  notifications: Array<{ id: number; title: string; detail: string; createdAt: string; read: boolean }>;
  releaseHistory: Array<{
    date: string;
    worksite: string;
    machine: string;
    result: string;
    reason: string;
    action: string;
    user: string;
    override: "Yes" | "No";
  }>;
  updatedAt: string;
  worksites: ConsoleWorksite[];
};

const dayMs = 24 * 60 * 60 * 1000;

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "worksite";
}

function formatDate(value?: string) {
  if (!value) return "Not set";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function daysLeft(value?: string) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return String(Math.ceil((date.getTime() - Date.now()) / dayMs));
}

function certificateStatus(document: FleetDocument): Certificate["status"] {
  if (!document.expiresAt) return "Valid";
  const days = Number(daysLeft(document.expiresAt));
  if (!Number.isFinite(days)) return "Valid";
  if (days < 0) return "Expired";
  if (days <= 7) return "Critical";
  if (days <= 30) return "Expiring soon";
  return "Valid";
}

function documentAction(document: FleetDocument, status: Certificate["status"]) {
  if (status === "Expired") return "Upload renewed evidence";
  if (status === "Missing") return "Upload required evidence";
  if (status === "Critical" || status === "Expiring soon") return "Assign renewal owner";
  if (document.reviewState === "under review") return "Approve evidence";
  return "No action";
}

function severityLabel(value: string): ServiceBlocker["severity"] {
  if (value === "critical") return "Critical";
  if (value === "high") return "High";
  if (value === "low") return "Low";
  return "Medium";
}

function serviceStatus(task: MaintenanceTask): ServiceBlocker["status"] {
  if (task.status === "completed") return "Resolved";
  if (task.status === "in progress") return "In Progress";
  if (task.status === "overdue") return "Open";
  return "Open";
}

function serviceDue(task: MaintenanceTask) {
  if (task.status === "completed") return "Completed";
  if (!task.dueAt) return "Not set";
  const days = Number(daysLeft(task.dueAt));
  if (Number.isFinite(days)) {
    if (days < 0) return "Overdue";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
  }
  return formatDate(task.dueAt);
}

function machineState(assetStatus: string, certificates: Certificate[], services: ServiceBlocker[], issues: Issue[]): MachineState {
  if (
    assetStatus === "blocked" ||
    certificates.some((certificate) => certificate.status === "Expired" || certificate.status === "Missing") ||
    services.some((service) => service.blocksRelease && service.status !== "Resolved") ||
    issues.some((issue) => issue.blocking)
  ) {
    return "blocked";
  }

  if (
    assetStatus === "attention" ||
    certificates.some((certificate) => certificate.status === "Critical" || certificate.status === "Expiring soon") ||
    issues.length > 0
  ) {
    return "at_risk";
  }

  return "ready";
}

function releaseReason(certificates: Certificate[], services: ServiceBlocker[], issues: Issue[]) {
  const blockingCertificate = certificates.find((certificate) => certificate.status === "Expired" || certificate.status === "Missing");
  if (blockingCertificate) return blockingCertificate.status === "Missing" ? `${blockingCertificate.name} missing` : `${blockingCertificate.name} expired`;

  const blockingService = services.find((service) => service.blocksRelease && service.status !== "Resolved");
  if (blockingService) return blockingService.issue;

  const blockingIssue = issues.find((issue) => issue.blocking);
  if (blockingIssue) return blockingIssue.title;

  const reviewCertificate = certificates.find((certificate) => certificate.status === "Critical" || certificate.status === "Expiring soon");
  if (reviewCertificate) return `${reviewCertificate.name} due soon`;

  const issue = issues[0];
  if (issue) return issue.title;

  return "No blocker found";
}

function nextOwner(certificates: Certificate[], services: ServiceBlocker[], issues: Issue[], fallback: string) {
  const blocker = certificates.find((certificate) => certificate.status !== "Valid") ?? services.find((service) => service.status !== "Resolved");
  if (blocker) return blocker.owner;
  return issues[0]?.assignee ?? fallback;
}

function nextAction(certificates: Certificate[], services: ServiceBlocker[], issues: Issue[]) {
  const certificate = certificates.find((item) => item.status !== "Valid");
  if (certificate) return certificate.action;
  const service = services.find((item) => item.status !== "Resolved");
  if (service) return "Complete service action";
  if (issues[0]) return "Review open issue";
  return "-";
}

function nextEta(certificates: Certificate[], services: ServiceBlocker[], issues: Issue[]) {
  const certificate = certificates.find((item) => item.status !== "Valid");
  if (certificate) return certificate.expiry;
  const service = services.find((item) => item.status !== "Resolved");
  if (service) return service.due;
  if (issues[0]) return "Today";
  return "-";
}

export function buildProductionConsoleSnapshot(data: FleetLeverData): ProductionConsoleSnapshot {
  const worksiteId = slug(data.location.id ?? data.location.name);
  const documentsByAssetCode = new Map<string, FleetDocument[]>();
  const tasksByAssetId = new Map<string, MaintenanceTask[]>();
  const issuesByAssetId = new Map<string, Issue[]>();

  for (const document of data.documents) {
    if (!document.assetCode) continue;
    documentsByAssetCode.set(document.assetCode, [...(documentsByAssetCode.get(document.assetCode) ?? []), document]);
  }

  for (const task of data.maintenanceTasks) {
    tasksByAssetId.set(task.assetId, [...(tasksByAssetId.get(task.assetId) ?? []), task]);
  }

  for (const issue of data.issues) {
    issuesByAssetId.set(issue.assetId, [...(issuesByAssetId.get(issue.assetId) ?? []), issue]);
  }

  const machines: ConsoleMachine[] = data.assets.map((asset) => {
    const documents = documentsByAssetCode.get(asset.code) ?? [];
    const tasks = tasksByAssetId.get(asset.id) ?? [];
    const issues = issuesByAssetId.get(asset.id) ?? [];
    const certificates = documents.map((document) => {
      const status = certificateStatus(document);
      return {
        name: document.category || document.title,
        status,
        expiry: formatDate(document.expiresAt),
        daysLeft: daysLeft(document.expiresAt),
        owner: document.operator ?? "Office",
        action: documentAction(document, status),
        assignmentStatus: status === "Valid" ? "Accepted" as const : "Unassigned" as const,
      };
    });
    const service = tasks.map((task) => ({
      issue: task.title,
      severity: task.status === "overdue" ? "High" as const : "Medium" as const,
      blocksRelease: task.status === "overdue",
      owner: task.owner || "Workshop",
      due: serviceDue(task),
      status: serviceStatus(task),
      assignmentStatus: task.owner ? "Assigned" as const : "Unassigned" as const,
    }));
    const state = machineState(asset.status, certificates, service, issues);
    const blockerCount =
      certificates.filter((certificate) => certificate.status === "Expired" || certificate.status === "Missing").length +
      service.filter((item) => item.blocksRelease && item.status !== "Resolved").length +
      issues.filter((issue) => issue.blocking).length;

    return {
      id: asset.id,
      code: asset.code,
      name: asset.name,
      type: titleCase(asset.type),
      manufacturer: asset.name.split(" ")[0] ?? "FleetLever",
      model: asset.name.split(" ").slice(1).join(" ") || asset.type,
      serial: asset.serial ?? asset.plate ?? asset.code,
      ownership: asset.ownership === "rented" ? "Rental" : "Owned",
      worksiteId,
      state,
      reason: releaseReason(certificates, service, issues),
      owner: nextOwner(certificates, service, issues, asset.operator),
      nextAction: nextAction(certificates, service, issues),
      eta: nextEta(certificates, service, issues),
      lastUpdated: "Synced from database",
      activeBlockers: String(blockerCount),
      documents: `${documents.length} file${documents.length === 1 ? "" : "s"}`,
      certificates,
      service,
      issues: issues.map((issue) => ({
        title: issue.title,
        severity: severityLabel(issue.severity),
        owner: issue.assignee,
        status: titleCase(issue.status),
      })),
      photos: [],
    };
  });

  return {
    organizationName: data.organization.name,
    schemaVersion: 1,
    machines,
    notifications: [],
    releaseHistory: [],
    updatedAt: new Date().toISOString(),
    worksites: [
      {
        id: worksiteId,
        name: data.location.name || data.organization.name,
        location: `${data.location.assetCount} machines · ${data.location.operatorCount} operators`,
        date: "Next planned work",
        requiredMachineIds: machines.map((machine) => machine.id),
      },
    ],
  };
}
