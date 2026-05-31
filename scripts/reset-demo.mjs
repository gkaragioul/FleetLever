import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import nextEnv from "@next/env";

const { Pool } = pg;
const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const demoOrganizationId = "00000000-0000-4000-8000-000000000001";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

const tablesWithRls = [
  "profiles",
  "organizations",
  "organization_members",
  "locations",
  "operators",
  "assets",
  "documents",
  "document_files",
  "document_asset_links",
  "document_operator_links",
  "compliance_templates",
  "compliance_template_requirements",
  "maintenance_tasks",
  "maintenance_records",
  "issues",
  "imports",
  "import_rows",
  "ai_conversations",
  "ai_messages",
  "ai_citations",
  "reports",
  "audit_logs",
];

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function setRls(client, enabled) {
  for (const table of tablesWithRls) {
    const exists = await client.query("select to_regclass($1) is not null as exists", [`public.${table}`]);
    if (!exists.rows[0]?.exists) continue;

    await client.query(`alter table public.${quoteIdentifier(table)} ${enabled ? "enable" : "disable"} row level security`);
    if (enabled) {
      await client.query(`alter table public.${quoteIdentifier(table)} force row level security`);
    }
  }
}

const client = await pool.connect();

try {
  await client.query("begin");
  await setRls(client, false);
  await client.query("delete from public.organizations where id = $1", [demoOrganizationId]);
  await client.query("commit");

  const seedSql = await readFile(join(process.cwd(), "db", "seeds", "0001_demo_organization.sql"), "utf8");
  await client.query(seedSql);

  console.log(`Demo tenant reset: ${demoOrganizationId}`);
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await setRls(client, true).catch(() => {});
  client.release();
  await pool.end();
}
