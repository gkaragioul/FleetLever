"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { FleetLeverState, Machine } from "./types";

export const FLEETLEVER_STORE_KEY = "fleetlever.mvp.state.v1";
const listeners = new Set<() => void>();
let lastRaw: string | null | undefined;
let lastSnapshot: FleetLeverState | null = null;
let serverSnapshot: FleetLeverState | null = null;

function withQrValues(machines: Machine[]) {
  return machines.map((machine) => ({
    ...machine,
    qrValue: machine.qrValue ?? `fleetlever://machine/${machine.fleetNumber}`,
    proofPhotos: machine.proofPhotos ?? [],
    defects: machine.defects.map((defect, index) => ({
      id: defect.id ?? `${machine.id}-issue-${index + 1}`,
      blocking: defect.blocking ?? defect.severity === "critical",
      ...defect,
    })),
  }));
}

function createInitialState(machines: Machine[]): FleetLeverState {
  return {
    version: 1,
    machines: withQrValues(machines),
    proofPhotos: machines.flatMap((machine) => machine.proofPhotos ?? []),
    handovers: [],
    events: [],
    releaseNotes: [],
    blockDecisions: [],
    updatedAt: new Date().toISOString(),
  };
}

function loadState(initialMachines: Machine[]) {
  if (typeof window === "undefined") return createInitialState(initialMachines);

  try {
    const raw = window.localStorage.getItem(FLEETLEVER_STORE_KEY);
    if (raw === lastRaw && lastSnapshot) return lastSnapshot;

    lastRaw = raw;
    if (!raw) {
      lastSnapshot = createInitialState(initialMachines);
      return lastSnapshot;
    }
    const parsed = JSON.parse(raw) as FleetLeverState;
    if (parsed.version !== 1 || !Array.isArray(parsed.machines)) {
      lastSnapshot = createInitialState(initialMachines);
      return lastSnapshot;
    }

    lastSnapshot = {
      ...createInitialState(initialMachines),
      ...parsed,
      machines: withQrValues(parsed.machines),
      proofPhotos: parsed.proofPhotos ?? parsed.machines.flatMap((machine) => machine.proofPhotos ?? []),
      handovers: parsed.handovers ?? [],
      events: parsed.events ?? [],
      releaseNotes: parsed.releaseNotes ?? [],
      blockDecisions: parsed.blockDecisions ?? [],
    };
    return lastSnapshot;
  } catch {
    lastSnapshot = createInitialState(initialMachines);
    return lastSnapshot;
  }
}

function persistState(state: FleetLeverState) {
  if (typeof window === "undefined") return;
  lastSnapshot = state;
  lastRaw = JSON.stringify(state);
  window.localStorage.setItem(FLEETLEVER_STORE_KEY, lastRaw);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (typeof window !== "undefined") {
    const onStorage = (event: StorageEvent) => {
      if (event.key === FLEETLEVER_STORE_KEY) {
        lastRaw = undefined;
        listener();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return () => {
    listeners.delete(listener);
  };
}

export function useFleetLeverStore(initialMachines: Machine[]) {
  const state = useSyncExternalStore(
    subscribe,
    () => loadState(initialMachines),
    () => {
      serverSnapshot ??= createInitialState(initialMachines);
      return serverSnapshot;
    },
  );

  const updateState = useCallback((updater: (current: FleetLeverState) => FleetLeverState) => {
    const next = {
      ...updater(loadState(initialMachines)),
      updatedAt: new Date().toISOString(),
    };
    persistState(next);
  }, [initialMachines]);

  return { state, setState: updateState };
}
