import type { FleetLeverEvent, FleetLeverEventType, ReleaseStatus } from "./types";

export function createFleetLeverEvent({
  type,
  machineId,
  user,
  note,
  reason,
  beforeStatus,
  afterStatus,
  relatedProofSlot,
  relatedIssueId,
}: {
  type: FleetLeverEventType;
  machineId: string;
  user: string;
  note?: string;
  reason?: string;
  beforeStatus?: ReleaseStatus;
  afterStatus?: ReleaseStatus;
  relatedProofSlot?: string;
  relatedIssueId?: string;
}): FleetLeverEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    machineId,
    user,
    timestamp: new Date().toISOString(),
    note,
    reason,
    beforeStatus,
    afterStatus,
    relatedProofSlot,
    relatedIssueId,
  };
}
