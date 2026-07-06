import type { Machine, ReleaseStatus } from "./types";

export function missingSlots(machine: Machine) {
  const completed = new Set(machine.completedPhotoSlots);
  return machine.requiredPhotoSlots.filter((slot) => !completed.has(slot));
}

export function hasCriticalIssue(machine: Machine) {
  return machine.defects.some((defect) => defect.status !== "resolved" && defect.severity === "critical");
}

export function hasBlockingIssue(machine: Machine) {
  return machine.defects.some((defect) => defect.status !== "resolved" && (defect.blocking || defect.severity === "critical"));
}

export function openIssueCount(machine: Machine) {
  return machine.defects.filter((defect) => defect.status !== "resolved").length;
}

export function isClear(machine: Machine) {
  return machine.status === "Ready" || machine.status === "Released with exception";
}

export function needsAction(machine: Machine) {
  return machine.status === "Needs review" || machine.status === "Proof missing" || machine.status === "Defect reported";
}

export function resolveMachineStatus({
  machine,
  completedSlots,
  warningCount,
}: {
  machine: Machine;
  completedSlots: string[];
  warningCount: number;
}): ReleaseStatus {
  const missing = machine.requiredPhotoSlots.filter((slot) => !completedSlots.includes(slot));

  if (hasBlockingIssue(machine)) return "Blocked";
  if (missing.length) return "Proof missing";
  if (warningCount > 0 || openIssueCount(machine) > 0 || completedSlots.length < machine.requiredPhotoSlots.length) return "Needs review";
  return "Ready";
}
