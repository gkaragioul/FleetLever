export type AssetStatus = "ready" | "attention" | "blocked" | "inactive";
export type Severity = "low" | "medium" | "high" | "critical";
export type DocumentCategory =
  | "KTEO"
  | "Insurance"
  | "Permit"
  | "Lifting certificate"
  | "Periodic inspection"
  | "Operator license"
  | "Maintenance invoice"
  | "Safety document";

export type Asset = {
  id: string;
  name: string;
  code: string;
  type: string;
  plate?: string;
  serial?: string;
  location: string;
  department: string;
  operatorId?: string;
  operator: string;
  status: AssetStatus;
  ownership: "owned" | "leased" | "rented";
  hours?: number;
  mileage?: number;
};

export type FleetDocument = {
  id: string;
  title: string;
  category: DocumentCategory;
  assetId?: string;
  assetCode?: string;
  operator?: string;
  expiresAt?: string;
  issuedAt?: string;
  reviewState: "approved" | "under review";
  confidence: number;
  fileName?: string;
  fileSize?: number;
  storageKey?: string;
  hasFile?: boolean;
};

export type MaintenanceTask = {
  id: string;
  assetId: string;
  title: string;
  dueAt: string;
  status: "scheduled" | "in progress" | "overdue" | "completed";
  owner: string;
  cost?: number;
};

export type Issue = {
  id: string;
  assetId: string;
  title: string;
  severity: Severity;
  status: "open" | "triaged" | "in progress" | "waiting" | "resolved";
  blocking: boolean;
  assignee: string;
  openedAt: string;
};

export type Operator = {
  id: string;
  name: string;
  role: string;
  phone: string;
  licenseCategories: string[];
  licenseExpiresAt: string;
  assignedAssetIds: string[];
};

export type ComplianceTemplate = {
  id?: string;
  assetType: string;
  requiredCategories: DocumentCategory[];
};

export type FleetLeverData = {
  runtime?: {
    dataSource: "database" | "demo";
    warning?: string;
  };
  organization: {
    id: string;
    name: string;
    locale: string;
    timezone: string;
    currency: string;
  };
  session?: {
    organizationId: string;
    profileId: string;
    profileName: string;
    role: string;
  };
  location: {
    id?: string;
    name: string;
    assetCount: number;
    operatorCount: number;
  };
  assets: Asset[];
  documents: FleetDocument[];
  maintenanceTasks: MaintenanceTask[];
  issues: Issue[];
  operators: Operator[];
  complianceTemplates: ComplianceTemplate[];
};

export const today = new Date("2026-06-30T09:00:00+03:00");

export const assets: Asset[] = [
  {
    id: "asset-cat-320",
    name: "CAT 320 Excavator",
    code: "EX-320",
    type: "Excavator",
    serial: "CAT0320-FL-901",
    location: "North yard",
    department: "Construction machinery",
    operator: "Kostas Antoniou",
    status: "ready",
    ownership: "owned",
    hours: 4210,
  },
  {
    id: "asset-jcb-3cx",
    name: "JCB 3CX Backhoe Loader",
    code: "BL-3CX",
    type: "Backhoe loader",
    serial: "JCB3CX-FL-118",
    location: "Rental bay",
    department: "Rental handovers",
    operator: "Nikos Papadakis",
    status: "attention",
    ownership: "rented",
    hours: 3188,
  },
  {
    id: "asset-volvo-l120",
    name: "Volvo L120 Wheel Loader",
    code: "LD-120",
    type: "Wheel Loader",
    serial: "VOL120-FL-507",
    location: "Quarry face",
    department: "Quarry operations",
    operator: "Giorgos Rallis",
    status: "blocked",
    ownership: "owned",
    hours: 8820,
  },
  {
    id: "asset-bobcat-s650",
    name: "Bobcat S650 Skid Steer",
    code: "SS-650",
    type: "Skid Steer",
    serial: "BOB650-FL-332",
    location: "Small works bay",
    department: "Rental handovers",
    operator: "Eleni Mavrou",
    status: "attention",
    ownership: "rented",
    hours: 2440,
  },
  {
    id: "asset-manitou-mt1840",
    name: "Manitou MT 1840 Telehandler",
    code: "TH-1840",
    type: "Telehandler",
    serial: "DEM0006-FL-411",
    location: "Yard stand-by",
    department: "Construction machinery",
    operator: "Antonis Markou",
    status: "attention",
    ownership: "owned",
    hours: 5360,
  },
  {
    id: "asset-hamm-roller",
    name: "Hamm Roller",
    code: "RL-90",
    type: "Roller",
    serial: "HAM90-FL-772",
    location: "Road crew staging",
    department: "Road works",
    operator: "Petros Ioannou",
    status: "blocked",
    ownership: "owned",
    hours: 6105,
  },
  {
    id: "asset-komatsu-d65",
    name: "Komatsu D65 Dozer",
    code: "DZ-65",
    type: "Dozer",
    serial: "KOMD65-FL-093",
    location: "Earthworks lane",
    department: "Earthmoving",
    operator: "Maria Kontou",
    status: "ready",
    ownership: "owned",
    hours: 7025,
  },
];

export const documents: FleetDocument[] = [
  {
    id: "doc-cat-320-inspection",
    title: "EX-320 readiness proof packet",
    category: "Periodic inspection",
    assetId: "asset-cat-320",
    issuedAt: "2026-06-29",
    expiresAt: "2026-09-29",
    reviewState: "approved",
    confidence: 0.98,
  },
  {
    id: "doc-jcb-insurance",
    title: "BL-3CX insurance",
    category: "Insurance",
    assetId: "asset-jcb-3cx",
    issuedAt: "2026-03-14",
    expiresAt: "2027-03-14",
    reviewState: "approved",
    confidence: 0.93,
  },
  {
    id: "doc-manitou-inspection",
    title: "TH-1840 periodic inspection",
    category: "Periodic inspection",
    assetId: "asset-manitou-mt1840",
    issuedAt: "2026-04-01",
    expiresAt: "2026-07-18",
    reviewState: "under review",
    confidence: 0.74,
  },
  {
    id: "doc-komatsu-safety",
    title: "DZ-65 safety document",
    category: "Safety document",
    assetId: "asset-komatsu-d65",
    issuedAt: "2026-06-15",
    expiresAt: "2026-12-15",
    reviewState: "approved",
    confidence: 0.99,
  },
  {
    id: "doc-kostas-license",
    title: "Kostas Antoniou operator license",
    category: "Operator license",
    operator: "Kostas Antoniou",
    issuedAt: "2024-08-11",
    expiresAt: "2027-08-11",
    reviewState: "approved",
    confidence: 0.91,
  },
];

export const maintenanceTasks: MaintenanceTask[] = [
  {
    id: "mnt-volvo-leak",
    assetId: "asset-volvo-l120",
    title: "Inspect hydraulic leak before release",
    dueAt: "2026-06-30",
    status: "in progress",
    owner: "Workshop lead",
  },
  {
    id: "mnt-hamm-vibration",
    assetId: "asset-hamm-roller",
    title: "Resolve vibration defect from previous handover",
    dueAt: "2026-06-29",
    status: "overdue",
    owner: "Workshop lead",
  },
  {
    id: "mnt-jcb-attachment",
    assetId: "asset-jcb-3cx",
    title: "Verify bucket attachment proof photo",
    dueAt: "2026-06-30",
    status: "scheduled",
    owner: "Dimitris",
  },
];

export const issues: Issue[] = [
  {
    id: "iss-volvo-leak",
    assetId: "asset-volvo-l120",
    title: "Hydraulic leak under left lift arm",
    severity: "critical",
    status: "in progress",
    blocking: true,
    assignee: "Workshop lead",
    openedAt: "2026-06-30",
  },
  {
    id: "iss-hamm-vibration",
    assetId: "asset-hamm-roller",
    title: "Unresolved vibration defect from previous handover",
    severity: "high",
    status: "triaged",
    blocking: true,
    assignee: "Workshop lead",
    openedAt: "2026-06-29",
  },
  {
    id: "iss-bobcat-cosmetic",
    assetId: "asset-bobcat-s650",
    title: "Minor cosmetic scrape on rear panel",
    severity: "low",
    status: "triaged",
    blocking: false,
    assignee: "Maria Sotiropoulou",
    openedAt: "2026-06-30",
  },
];

export const operators: Operator[] = [
  {
    id: "op-kostas",
    name: "Kostas Antoniou",
    role: "Excavator operator",
    phone: "+30 210 0000 001",
    licenseCategories: ["Earthmoving"],
    licenseExpiresAt: "2027-08-11",
    assignedAssetIds: ["asset-cat-320"],
  },
  {
    id: "op-nikos",
    name: "Nikos Papadakis",
    role: "Backhoe operator",
    phone: "+30 210 0000 004",
    licenseCategories: ["Backhoe loader", "Attachments"],
    licenseExpiresAt: "2027-06-10",
    assignedAssetIds: ["asset-jcb-3cx"],
  },
  {
    id: "op-giorgos",
    name: "Giorgos Rallis",
    role: "Wheel loader operator",
    phone: "+30 210 0000 002",
    licenseCategories: ["Wheel loader"],
    licenseExpiresAt: "2026-09-04",
    assignedAssetIds: ["asset-volvo-l120"],
  },
  {
    id: "op-eleni",
    name: "Eleni Mavrou",
    role: "Skid steer operator",
    phone: "+30 210 0000 012",
    licenseCategories: ["Skid steer"],
    licenseExpiresAt: "2027-02-18",
    assignedAssetIds: ["asset-bobcat-s650"],
  },
];

export const complianceTemplates: ComplianceTemplate[] = [
  {
    assetType: "Excavator",
    requiredCategories: ["Insurance", "Periodic inspection", "Operator license", "Safety document"],
  },
  {
    assetType: "Backhoe loader",
    requiredCategories: ["Insurance", "Periodic inspection", "Operator license"],
  },
  {
    assetType: "Wheel Loader",
    requiredCategories: ["Insurance", "Periodic inspection", "Safety document"],
  },
  {
    assetType: "Skid Steer",
    requiredCategories: ["Insurance", "Periodic inspection", "Safety document"],
  },
  {
    assetType: "Telehandler",
    requiredCategories: ["Insurance", "Lifting certificate", "Periodic inspection", "Operator license"],
  },
  {
    assetType: "Roller",
    requiredCategories: ["Insurance", "Periodic inspection", "Safety document"],
  },
  {
    assetType: "Dozer",
    requiredCategories: ["Insurance", "Periodic inspection", "Safety document"],
  },
];

export const fallbackFleetData: FleetLeverData = {
  runtime: {
    dataSource: "demo",
    warning: "DATABASE_URL is not configured. Mutations are disabled until the app is connected to Postgres.",
  },
  organization: {
    id: "demo-local",
    name: "FleetLever Demo Yard",
    locale: "en-US",
    timezone: "Europe/Athens",
    currency: "EUR",
  },
  session: {
    organizationId: "demo-local",
    profileId: "demo-profile",
    profileName: "Demo user",
    role: "owner",
  },
  location: {
    name: "North Yard",
    assetCount: assets.length,
    operatorCount: operators.length,
  },
  assets,
  documents,
  maintenanceTasks,
  issues,
  operators,
  complianceTemplates,
};

export function daysUntil(date: string, baseDate = today) {
  const target = new Date(`${date}T12:00:00+03:00`);
  const diff = target.getTime() - baseDate.getTime();
  return Math.ceil(diff / 86_400_000);
}

export function documentStatus(document: FleetDocument) {
  if (!document.expiresAt) return "valid";
  const days = daysUntil(document.expiresAt);

  if (days < 0) return "expired";
  if (days <= 7) return "critical";
  if (days <= 30) return "warning";
  return "valid";
}

export function getAsset(assetId: string) {
  return assets.find((asset) => asset.id === assetId);
}

export function getDocumentsForAsset(assetId: string) {
  return documents.filter((document) => document.assetId === assetId);
}

export function getTemplateForAsset(asset: Asset) {
  return complianceTemplates.find((template) => template.assetType === asset.type);
}

export function getMissingDocumentCategories(asset: Asset) {
  const template = getTemplateForAsset(asset);
  if (!template) return [];

  const present = new Set(getDocumentsForAsset(asset.id).map((document) => document.category));
  return template.requiredCategories.filter((category) => !present.has(category));
}

export function getReadinessScore(asset: Asset) {
  const assetDocuments = getDocumentsForAsset(asset.id);
  const missing = getMissingDocumentCategories(asset).length;
  const expired = assetDocuments.filter((document) => documentStatus(document) === "expired").length;
  const critical = assetDocuments.filter((document) => documentStatus(document) === "critical").length;
  const overdueMaintenance = maintenanceTasks.filter(
    (task) => task.assetId === asset.id && task.status === "overdue",
  ).length;
  const blockingIssues = issues.filter((issue) => issue.assetId === asset.id && issue.blocking).length;

  return Math.max(0, 100 - missing * 18 - expired * 25 - critical * 12 - overdueMaintenance * 18 - blockingIssues * 25);
}

export function getAttentionItems() {
  const expiringDocuments = documents
    .filter((document) => document.expiresAt && ["expired", "critical", "warning"].includes(documentStatus(document)))
    .map((document) => ({
      id: document.id,
      label: document.title,
      source: document.assetId ? getAsset(document.assetId)?.code ?? document.operator ?? "Record" : document.operator ?? "Record",
      kind: documentStatus(document),
      detail:
        documentStatus(document) === "expired"
          ? `Expired ${Math.abs(daysUntil(document.expiresAt ?? ""))} days ago`
          : `Expires in ${daysUntil(document.expiresAt ?? "")} days`,
    }));

  const missingDocuments = assets.flatMap((asset) =>
    getMissingDocumentCategories(asset).map((category) => ({
      id: `${asset.id}-${category}`,
      label: `${asset.code} missing ${category}`,
      source: asset.type,
      kind: "missing",
      detail: "Required by template",
    })),
  );

  const overdue = maintenanceTasks
    .filter((task) => task.status === "overdue")
    .map((task) => ({
      id: task.id,
      label: task.title,
      source: getAsset(task.assetId)?.code ?? "Asset",
      kind: "overdue",
      detail: `Due ${Math.abs(daysUntil(task.dueAt))} days ago`,
    }));

  const blockers = issues
    .filter((issue) => issue.blocking)
    .map((issue) => ({
      id: issue.id,
      label: issue.title,
      source: getAsset(issue.assetId)?.code ?? "Asset",
      kind: "blocked",
      detail: `${issue.severity} severity`,
    }));

  return [...blockers, ...expiringDocuments, ...overdue, ...missingDocuments];
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("el-GR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00+03:00`));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
