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

export const today = new Date("2026-05-29T09:00:00+03:00");

export const assets: Asset[] = [
  {
    id: "asset-cr04",
    name: "Liebherr LTM 1040",
    code: "CR-04",
    type: "Crane",
    plate: "DEM-0001",
    serial: "LTM1040-19-GR",
    location: "Aspropyrgos yard",
    department: "Lifting",
    operator: "Nikos Papadakis",
    status: "attention",
    ownership: "owned",
    hours: 6420,
  },
  {
    id: "asset-b12",
    name: "Mercedes Tourismo",
    code: "B-12",
    type: "Bus",
    plate: "DEM-0002",
    serial: "WDB632-T12",
    location: "Athens depot",
    department: "Tourism transfers",
    operator: "Eleni Mavrou",
    status: "blocked",
    ownership: "leased",
    mileage: 218400,
  },
  {
    id: "asset-fl02",
    name: "Toyota 8FG Forklift",
    code: "FL-02",
    type: "Forklift",
    serial: "8FG-55621",
    location: "Piraeus warehouse",
    department: "Warehouse",
    operator: "Giorgos Rallis",
    status: "attention",
    ownership: "owned",
    hours: 3810,
  },
  {
    id: "asset-ex01",
    name: "CAT 320 Excavator",
    code: "EX-01",
    type: "Excavator",
    serial: "CAT0320ZK",
    location: "Koropi project",
    department: "Construction",
    operator: "Kostas Antoniou",
    status: "blocked",
    ownership: "rented",
    hours: 7050,
  },
  {
    id: "asset-v07",
    name: "Ford Transit Service Van",
    code: "V-07",
    type: "Van",
    plate: "DEM-0003",
    serial: "WF0XXXTTG",
    location: "Thessaloniki branch",
    department: "Field service",
    operator: "Maria Sotiropoulou",
    status: "ready",
    ownership: "owned",
    mileage: 92400,
  },
];

export const documents: FleetDocument[] = [
  {
    id: "doc-cr04-lift",
    title: "CR-04 πιστοποιητικό ανύψωσης",
    category: "Lifting certificate",
    assetId: "asset-cr04",
    issuedAt: "2025-06-03",
    expiresAt: "2026-06-03",
    reviewState: "approved",
    confidence: 0.98,
  },
  {
    id: "doc-b12-kteo",
    title: "B-12 έλεγχος KTEO",
    category: "KTEO",
    assetId: "asset-b12",
    issuedAt: "2025-05-20",
    expiresAt: "2026-05-20",
    reviewState: "approved",
    confidence: 0.96,
  },
  {
    id: "doc-b12-ins",
    title: "B-12 ασφαλιστήριο",
    category: "Insurance",
    assetId: "asset-b12",
    issuedAt: "2026-01-14",
    expiresAt: "2026-07-14",
    reviewState: "approved",
    confidence: 0.93,
  },
  {
    id: "doc-fl02-inspection",
    title: "FL-02 περιοδικός έλεγχος",
    category: "Periodic inspection",
    assetId: "asset-fl02",
    issuedAt: "2025-12-01",
    expiresAt: "2026-06-18",
    reviewState: "under review",
    confidence: 0.74,
  },
  {
    id: "doc-v07-ins",
    title: "V-07 ασφαλιστήριο",
    category: "Insurance",
    assetId: "asset-v07",
    issuedAt: "2026-03-02",
    expiresAt: "2027-03-02",
    reviewState: "approved",
    confidence: 0.99,
  },
  {
    id: "doc-nikos-license",
    title: "Άδεια χειριστή Νίκου Παπαδάκη",
    category: "Operator license",
    operator: "Nikos Papadakis",
    issuedAt: "2023-08-11",
    expiresAt: "2026-06-10",
    reviewState: "approved",
    confidence: 0.91,
  },
];

export const maintenanceTasks: MaintenanceTask[] = [
  {
    id: "mnt-fl02",
    assetId: "asset-fl02",
    title: "Έλεγχος υδραυλικών λαδιών και φρένων",
    dueAt: "2026-05-24",
    status: "overdue",
    owner: "Giorgos Rallis",
    cost: 360,
  },
  {
    id: "mnt-cr04",
    assetId: "asset-cr04",
    title: "Προετοιμασία ελέγχου μπούμας",
    dueAt: "2026-06-01",
    status: "scheduled",
    owner: "Nikos Papadakis",
  },
  {
    id: "mnt-v07",
    assetId: "asset-v07",
    title: "Service 10.000 χλμ.",
    dueAt: "2026-06-22",
    status: "scheduled",
    owner: "Maria Sotiropoulou",
    cost: 180,
  },
];

export const issues: Issue[] = [
  {
    id: "iss-ex01",
    assetId: "asset-ex01",
    title: "Πτώση υδραυλικής πίεσης υπό φορτίο",
    severity: "critical",
    status: "in progress",
    blocking: true,
    assignee: "Kostas Antoniou",
    openedAt: "2026-05-28",
  },
  {
    id: "iss-b12",
    assetId: "asset-b12",
    title: "Ληγμένο KTEO, δεν μπορεί να μπει σε διαδρομή Σαββατοκύριακου",
    severity: "high",
    status: "triaged",
    blocking: true,
    assignee: "Eleni Mavrou",
    openedAt: "2026-05-27",
  },
  {
    id: "iss-cr04",
    assetId: "asset-cr04",
    title: "Λείπει ενημερωμένη φωτογραφία από τα outriggers",
    severity: "medium",
    status: "open",
    blocking: false,
    assignee: "Office team",
    openedAt: "2026-05-29",
  },
];

export const operators: Operator[] = [
  {
    id: "op-nikos",
    name: "Nikos Papadakis",
    role: "Crane operator",
    phone: "+30 210 0000 004",
    licenseCategories: ["Crane", "Lifting"],
    licenseExpiresAt: "2026-06-10",
    assignedAssetIds: ["asset-cr04"],
  },
  {
    id: "op-eleni",
    name: "Eleni Mavrou",
    role: "Bus driver",
    phone: "+30 210 0000 012",
    licenseCategories: ["D", "Passenger transport"],
    licenseExpiresAt: "2027-02-18",
    assignedAssetIds: ["asset-b12"],
  },
  {
    id: "op-kostas",
    name: "Kostas Antoniou",
    role: "Machine operator",
    phone: "+30 210 0000 001",
    licenseCategories: ["Earthmoving"],
    licenseExpiresAt: "2026-09-04",
    assignedAssetIds: ["asset-ex01"],
  },
];

export const complianceTemplates: ComplianceTemplate[] = [
  {
    assetType: "Crane",
    requiredCategories: ["Insurance", "Lifting certificate", "Periodic inspection", "Operator license"],
  },
  {
    assetType: "Bus",
    requiredCategories: ["KTEO", "Insurance", "Permit", "Operator license"],
  },
  {
    assetType: "Forklift",
    requiredCategories: ["Periodic inspection", "Safety document"],
  },
  {
    assetType: "Van",
    requiredCategories: ["KTEO", "Insurance"],
  },
  {
    assetType: "Excavator",
    requiredCategories: ["Insurance", "Periodic inspection", "Safety document"],
  },
];

export const fallbackFleetData: FleetLeverData = {
  organization: {
    id: "demo-local",
    name: "Demo ΑΕ",
    locale: "el-GR",
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
    name: "Athens Depot",
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
