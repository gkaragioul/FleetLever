import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const editionPath = path.join(root, "src", "lib", "fleetlever", "edition.ts");
const runnerPath = path.join(root, "scripts", "dev-edition.mjs");
const nextConfigPath = path.join(root, "next.config.ts");

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

const [runnerSource, nextConfigSource] = await Promise.all([
  readFile(runnerPath, "utf8"),
  readFile(nextConfigPath, "utf8"),
]);

if (!runnerSource.includes("FLEETLEVER_DIST_DIR") || !nextConfigSource.includes("FLEETLEVER_DIST_DIR")) {
  console.error("FAIL local editions must use independent Next.js dist directories");
  process.exit(1);
}

console.log("PASS independent Next.js dist directories");

if (!runnerSource.includes('"--webpack"')) {
  console.error("FAIL local edition servers must use Webpack for worktree-safe dependency resolution");
  process.exit(1);
}

console.log("PASS worktree-safe local compiler");

if (!nextConfigSource.includes("turbopack") || !nextConfigSource.includes("root: path.resolve")) {
  console.error("FAIL Turbopack must be rooted explicitly at the active checkout");
  process.exit(1);
}

console.log("PASS explicit Turbopack project root");
