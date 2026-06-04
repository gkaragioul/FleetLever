import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");

async function copyIfPresent(source, destination) {
  try {
    await cp(source, destination, { recursive: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
}

await mkdir(join(standaloneDir, ".next"), { recursive: true });
await copyIfPresent(join(root, "public"), join(standaloneDir, "public"));
await copyIfPresent(join(root, ".next", "static"), join(standaloneDir, ".next", "static"));

console.log("standalone runtime assets prepared");
