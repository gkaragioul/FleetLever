import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const componentPath = path.join(root, "src", "components", "fleetlever", "construction-prototype.tsx");
const configPath = path.join(root, "next.config.ts");

const [componentSource, configSource] = await Promise.all([
  readFile(componentPath, "utf8"),
  readFile(configPath, "utf8"),
]);

const requiredComponentTokens = [
  "isMunicipalConsole",
  "FleetLeverLogo",
  "standaloneSeedWorksites",
  "standaloneSeedMachines",
  'code: "CR-04"',
  'code: "EX-12"',
  'code: "TR-08"',
  'code: "LD-03"',
  'code: "GN-02"',
  "/fleetlever/machines/cr04-crane.jpg",
  "Πακέτα εργασίας",
  "FleetLever Demo",
];

const missing = requiredComponentTokens.filter((token) => !componentSource.includes(token));

if (missing.length > 0) {
  console.error(`FAIL standalone console profile is missing: ${missing.join(", ")}`);
  process.exit(1);
}

if (!configSource.includes("NEXT_PUBLIC_FLEETLEVER_EDITION")) {
  console.error("FAIL the selected edition must be exposed to the client bundle");
  process.exit(1);
}

console.log("PASS standalone FleetLever console profile");
