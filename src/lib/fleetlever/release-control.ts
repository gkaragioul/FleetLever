import { hasBlockingIssue, missingSlots, needsAction, openIssueCount } from "./rules";
import type { FleetLeverEvent, Machine, ProofPhoto } from "./types";

export type ReleaseGateState = "clear" | "locked" | "decision" | "blocked" | "released-with-note";

export type ReleaseGate = {
  state: ReleaseGateState;
  label: string;
  detail: string;
  missing: string[];
  warningCount: number;
  canRelease: boolean;
  canReleaseWithNote: boolean;
};

export function getReleaseGate(machine: Machine): ReleaseGate {
  const missing = missingSlots(machine);
  const openIssues = openIssueCount(machine);
  const warningCount = machine.flags.length + openIssues;

  if (machine.status === "Blocked" || hasBlockingIssue(machine)) {
    return {
      state: "blocked",
      label: "Locked until issue is cleared",
      detail: machine.reason || "A blocking issue must be cleared before tomorrow.",
      missing,
      warningCount,
      canRelease: false,
      canReleaseWithNote: false,
    };
  }

  if (missing.length) {
    return {
      state: "locked",
      label: `Locked until ${missing[0]} proof is added`,
      detail: `Missing proof: ${missing.join(", ")}.`,
      missing,
      warningCount,
      canRelease: false,
      canReleaseWithNote: false,
    };
  }

  if (machine.status === "Released with exception") {
    return {
      state: "released-with-note",
      label: "Released with supervisor note",
      detail: machine.releaseNote || machine.reason || "A supervisor accepted the exception.",
      missing,
      warningCount,
      canRelease: true,
      canReleaseWithNote: true,
    };
  }

  if (machine.status === "Needs review" || machine.status === "Defect reported" || warningCount > 0) {
    return {
      state: "decision",
      label: "Supervisor decision required",
      detail: machine.reason || "Proof is complete, but a warning needs a decision.",
      missing,
      warningCount,
      canRelease: false,
      canReleaseWithNote: true,
    };
  }

  return {
    state: "clear",
    label: "Ready to release",
    detail: machine.reason || "Required proof is complete.",
    missing,
    warningCount,
    canRelease: true,
    canReleaseWithNote: false,
  };
}

export function getSupervisorQueue(machines: Machine[]) {
  return machines.filter((machine) => {
    const gate = getReleaseGate(machine);
    return gate.state === "decision" || gate.state === "blocked" || gate.state === "locked";
  });
}

export function getOperationalAlerts(machines: Machine[]) {
  const blocked = machines.filter((machine) => getReleaseGate(machine).state === "blocked");
  const locked = machines.filter((machine) => getReleaseGate(machine).state === "locked");
  const decision = machines.filter((machine) => getReleaseGate(machine).state === "decision");
  const needsWork = machines.filter(needsAction).length + blocked.length;

  return [
    {
      label: "4pm alert",
      message: `${needsWork} machines are not cleared for tomorrow.`,
    },
    {
      label: "6am alert",
      message: blocked.length ? `${blocked.length} still blocked before dispatch.` : "No blocked machines before dispatch.",
    },
    {
      label: "Proof requests",
      message: `${locked.length} need proof and ${decision.length} need a supervisor decision.`,
    },
  ];
}

export function buildMachineProofPack(machine: Machine, proofPhotos: ProofPhoto[], events: FleetLeverEvent[] = []) {
  const gate = getReleaseGate(machine);
  const machinePhotos = proofPhotos.filter((photo) => photo.machineId === machine.id);
  const machineEvents = events.filter((event) => event.machineId === machine.id).slice(-8);

  return [
    "Machine release proof pack",
    `Machine: ${machine.fleetNumber} - ${machine.name}`,
    `Site: ${machine.currentSite}`,
    `Status: ${machine.status}`,
    `Release gate: ${gate.label}`,
    `Decision detail: ${gate.detail}`,
    `Operator: ${machine.operator}`,
    `Supervisor: ${machine.supervisor}`,
    "",
    "Required proof:",
    ...machine.requiredPhotoSlots.map((slot) => {
      const photo = machinePhotos.find((item) => item.proofSlot === slot);
      return photo
        ? `- ${slot}: ${photo.fileName} by ${photo.operator} at ${photo.timestamp}`
        : `- ${slot}: missing`;
    }),
    "",
    "Recent decisions:",
    ...(machineEvents.length
      ? machineEvents.map((event) => `- ${event.type.replaceAll("_", " ")}: ${event.note ?? event.reason ?? event.user}`)
      : ["- No recorded decisions yet."]),
  ].join("\n");
}

export function buildFleetReleaseProofPack(machines: Machine[], proofPhotos: ProofPhoto[], events: FleetLeverEvent[] = []) {
  return machines.map((machine) => buildMachineProofPack(machine, proofPhotos, events)).join("\n\n---\n\n");
}
