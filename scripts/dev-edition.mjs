import { spawn } from "node:child_process";
import process from "node:process";

const editions = new Set(["elliniko", "console", "site"]);
const [edition, port] = process.argv.slice(2);

if (!editions.has(edition) || !/^\d{2,5}$/.test(port ?? "")) {
  console.error("Usage: node scripts/dev-edition.mjs <elliniko|console|site> <port>");
  process.exit(1);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npx, ["next", "dev", "--hostname", "127.0.0.1", "--port", port], {
  env: {
    ...process.env,
    FLEETLEVER_EDITION: edition,
  },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Unable to start ${edition} edition:`, error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
