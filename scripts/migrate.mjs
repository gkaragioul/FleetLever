import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const { Pool } = pg;

const databaseUrls = [
  process.env.MIGRATION_DATABASE_URL,
  process.env.DATABASE_PUBLIC_URL,
  process.env.DATABASE_URL,
].filter(Boolean);
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);

if (!databaseUrls.length) {
  console.error("MIGRATION_DATABASE_URL, DATABASE_PUBLIC_URL, or DATABASE_URL is required.");
  process.exit(1);
}

if (process.env.SEED_DEMO === "true" && isProduction && process.env.FLEETLEVER_ALLOW_PRODUCTION_DEMO_SEED !== "true") {
  console.error("Refusing to seed demo data in production. Set FLEETLEVER_ALLOW_PRODUCTION_DEMO_SEED=true only for an intentional staging/demo environment.");
  process.exit(1);
}

function createPool(databaseUrl) {
  return new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });
}

function connectionHost(databaseUrl) {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return "unknown-host";
  }
}

async function connectWithFallback() {
  let lastError;

  for (const databaseUrl of [...new Set(databaseUrls)]) {
    const pool = createPool(databaseUrl);

    try {
      const client = await pool.connect();
      return { client, pool, databaseUrl };
    } catch (error) {
      await pool.end().catch(() => {});
      lastError = error;
      const hostname = connectionHost(databaseUrl);

      if (hostname.endsWith(".railway.internal")) {
        console.warn(`Could not reach ${hostname}; trying the next configured database URL.`);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function appliedVersions(client) {
  const result = await client.query("select version from public.schema_migrations order by version");
  return new Set(result.rows.map((row) => row.version));
}

async function runSqlDirectory(client, directory, tableName = "schema_migrations") {
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  const applied = tableName === "schema_migrations" ? await appliedVersions(client) : new Set();

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");

    if (applied.has(version)) {
      console.log(`skip ${file}`);
      continue;
    }

    const sql = await readFile(join(directory, file), "utf8");
    console.log(`apply ${file}`);
    await client.query(sql);

    if (tableName === "schema_migrations") {
      await client.query("insert into public.schema_migrations (version) values ($1)", [version]);
    }
  }
}

async function main() {
  const { client, pool, databaseUrl } = await connectWithFallback();

  try {
    console.log(`using database host ${connectionHost(databaseUrl)}`);
    await client.query("select pg_advisory_lock(hashtext('fleetlever_migrations'))");
    await ensureMigrationTable(client);
    await runSqlDirectory(client, join(process.cwd(), "db", "migrations"));

    if (process.env.SEED_DEMO === "true") {
      await runSqlDirectory(client, join(process.cwd(), "db", "seeds"), "seeds");
    }

    console.log("database is up to date");
  } finally {
    await client.query("select pg_advisory_unlock(hashtext('fleetlever_migrations'))").catch(() => {});
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
