import { isClear, needsAction } from "./rules";
import type { FleetLeverEvent, Machine } from "./types";

export function getReportBuckets(machines: Machine[]) {
  const ready = machines.filter(isClear);
  const blocked = machines.filter((machine) => machine.status === "Blocked");
  const action = machines.filter(needsAction);
  const notes = machines.filter((machine) => machine.status === "Released with exception");

  return { ready, blocked, action, notes };
}

export function buildFleetLeverReportText(machines: Machine[], events: FleetLeverEvent[] = []) {
  const { ready, blocked, action, notes } = getReportBuckets(machines);
  const recentNotes = events
    .filter((event) => event.type === "RELEASED_WITH_NOTE" || event.type === "MACHINE_BLOCKED" || event.type === "ISSUE_CREATED")
    .slice(-8)
    .map((event) => {
      const machine = machines.find((item) => item.id === event.machineId);
      return `- ${machine?.name ?? event.machineId} - ${event.note ?? event.reason ?? "Decision recorded"}`;
    });

  return [
    "Tomorrow summary:",
    `${ready.length} ready.`,
    `${action.length} need action.`,
    `${blocked.length} blocked.`,
    `${notes.length} released with note.`,
    "",
    "Needs action:",
    ...(action.length ? action.map((machine) => `- ${machine.name} - ${machine.reason}`) : ["- None"]),
    "",
    "Blocked:",
    ...(blocked.length ? blocked.map((machine) => `- ${machine.name} - ${machine.reason}`) : ["- None"]),
    "",
    "Ready:",
    ...(ready.length ? ready.map((machine) => `- ${machine.name} - ${machine.reason}`) : ["- None"]),
    "",
    "Notes and issues:",
    ...(recentNotes.length ? recentNotes : ["- None"]),
  ].join("\n");
}
