export type FleetLeverEdition = "console" | "site";

export type FleetLeverEditionConfig = {
  edition: FleetLeverEdition;
  rootPath: "/fleet-management" | "/";
  requiresDatabase: boolean;
};

const editionConfigs: Record<FleetLeverEdition, FleetLeverEditionConfig> = {
  console: {
    edition: "console",
    rootPath: "/fleet-management",
    requiresDatabase: true,
  },
  site: {
    edition: "site",
    rootPath: "/",
    requiresDatabase: false,
  },
};

export function parseFleetLeverEdition(value: string | undefined): FleetLeverEdition {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) return "console";
  if (normalized === "console" || normalized === "site") return normalized;

  throw new Error(`Invalid FLEETLEVER_EDITION "${value}". Expected console or site.`);
}

export function getFleetLeverEdition(): FleetLeverEdition {
  return parseFleetLeverEdition(process.env.FLEETLEVER_EDITION);
}

export function editionConfig(edition = getFleetLeverEdition()): FleetLeverEditionConfig {
  return editionConfigs[edition];
}
