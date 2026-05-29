import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

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
  const client = await pool.connect();

  try {
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
