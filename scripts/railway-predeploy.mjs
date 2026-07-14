import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";

if (process.env.FLEETLEVER_EDITION === "site") {
  console.log("Marketing edition: database migration skipped.");
  process.exit(0);
}

const migrationScript = fileURLToPath(new URL("./migrate.mjs", import.meta.url));
const migration = spawn(process.execPath, [migrationScript], {
  env: process.env,
  stdio: "inherit",
});

migration.on("error", (error) => {
  console.error("Unable to start database migrations:", error);
  process.exit(1);
});

migration.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
