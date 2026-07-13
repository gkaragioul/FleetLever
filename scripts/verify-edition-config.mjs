import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const editionPath = path.join(root, "src", "lib", "fleetlever", "edition.ts");

const requiredTokens = [
  '"elliniko"',
  '"console"',
  '"site"',
  'rootPath: "/main-page"',
  'rootPath: "/fleet-management"',
  'rootPath: "/"',
  "requiresDatabase",
  "allowsMunicipalPortal",
  "allowsCivicDispatch",
  "brand",
  "getFleetLeverEdition",
  "editionConfig",
];

let source;

try {
  source = await readFile(editionPath, "utf8");
} catch {
  console.error(`FAIL edition configuration is missing: ${editionPath}`);
  process.exit(1);
}

const missing = requiredTokens.filter((token) => !source.includes(token));

if (missing.length > 0) {
  console.error(`FAIL edition configuration is missing tokens: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("PASS edition configuration: elliniko, console, site");
