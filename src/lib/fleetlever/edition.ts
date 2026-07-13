export type FleetLeverEdition = "elliniko" | "console" | "site";

export type FleetLeverEditionConfig = {
  edition: FleetLeverEdition;
  rootPath: "/main-page" | "/fleet-management" | "/";
  requiresDatabase: boolean;
  allowsMunicipalPortal: boolean;
  allowsCivicDispatch: boolean;
  brand: "municipal" | "fleetlever";
};

const editionConfigs: Record<FleetLeverEdition, FleetLeverEditionConfig> = {
  elliniko: {
    edition: "elliniko",
    rootPath: "/main-page",
    requiresDatabase: true,
    allowsMunicipalPortal: true,
    allowsCivicDispatch: true,
    brand: "municipal",
  },
  console: {
    edition: "console",
    rootPath: "/fleet-management",
    requiresDatabase: true,
    allowsMunicipalPortal: false,
    allowsCivicDispatch: false,
    brand: "fleetlever",
  },
  site: {
    edition: "site",
    rootPath: "/",
    requiresDatabase: false,
    allowsMunicipalPortal: false,
    allowsCivicDispatch: false,
    brand: "fleetlever",
  },
};

export function parseFleetLeverEdition(value: string | undefined): FleetLeverEdition {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) return "console";
  if (normalized === "elliniko" || normalized === "console" || normalized === "site") return normalized;

  throw new Error(`Invalid FLEETLEVER_EDITION "${value}". Expected elliniko, console, or site.`);
}

export function getFleetLeverEdition(): FleetLeverEdition {
  return parseFleetLeverEdition(process.env.FLEETLEVER_EDITION);
}

export function editionConfig(edition = getFleetLeverEdition()): FleetLeverEditionConfig {
  return editionConfigs[edition];
}
