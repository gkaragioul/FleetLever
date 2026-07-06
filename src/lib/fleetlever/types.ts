export type ReleaseStatus =
  | "Ready"
  | "Blocked"
  | "Needs review"
  | "Released with exception"
  | "Defect reported"
  | "Proof missing";

export type Severity = "low" | "medium" | "high" | "critical";
export type ChecklistAnswer = "clean" | "risk" | "skip";
export type CaptureMode = "release" | "return";

export type Defect = {
  id?: string;
  title: string;
  severity: Severity;
  status: "open" | "acknowledged" | "resolved";
  blocking?: boolean;
  owner?: string;
  neededBy?: string;
};

export type ProofPhoto = {
  id: string;
  machineId: string;
  proofSlot: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  timestamp: string;
  operator: string;
  captureMode?: CaptureMode;
  qualityStatus?: "accepted" | "needs retake";
};

export type Machine = {
  id: string;
  fleetNumber: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  currentSite: string;
  status: ReleaseStatus;
  operator: string;
  supervisor: string;
  reason: string;
  nextAction: string;
  requiredPhotoSlots: string[];
  completedPhotoSlots: string[];
  checklistPassed: number;
  checklistTotal: number;
  riskScore: number;
  flags: string[];
  defects: Defect[];
  history: Array<{ time: string; actor: string; event: string }>;
  proofPhotos?: ProofPhoto[];
  releaseNote?: string;
  blockReason?: string;
  qrValue?: string;
};

export type FleetLeverEventType =
  | "PROOF_ADDED"
  | "HANDOVER_SUBMITTED"
  | "REVIEW_REQUESTED"
  | "PROOF_REQUESTED"
  | "MACHINE_BLOCKED"
  | "MACHINE_RELEASED"
  | "RELEASED_WITH_NOTE"
  | "ISSUE_CREATED"
  | "ISSUE_RESOLVED";

export type FleetLeverEvent = {
  id: string;
  type: FleetLeverEventType;
  machineId: string;
  user: string;
  timestamp: string;
  note?: string;
  reason?: string;
  beforeStatus?: ReleaseStatus;
  afterStatus?: ReleaseStatus;
  relatedProofSlot?: string;
  relatedIssueId?: string;
};

export type HandoverRecord = {
  id: string;
  machineId: string;
  submittedAt: string;
  operator: string;
  mode?: CaptureMode;
  completedSlots: string[];
  warningCount: number;
  beforeStatus: ReleaseStatus;
  afterStatus: ReleaseStatus;
};

export type ReleaseNote = {
  id: string;
  machineId: string;
  note: string;
  supervisor: string;
  timestamp: string;
};

export type BlockDecision = {
  id: string;
  machineId: string;
  reason: string;
  owner: string;
  neededBy?: string;
  timestamp: string;
};

export type FleetLeverState = {
  version: 1;
  machines: Machine[];
  proofPhotos: ProofPhoto[];
  handovers: HandoverRecord[];
  events: FleetLeverEvent[];
  releaseNotes: ReleaseNote[];
  blockDecisions: BlockDecision[];
  updatedAt: string;
};
