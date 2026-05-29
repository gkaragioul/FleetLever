import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

try {
  const result = await pool.query(`
    select
      current_database() as database,
      current_user as user,
      version() as version,
      now() as checked_at
  `);

  console.log(JSON.stringify(result.rows[0], null, 2));
} finally {
  await pool.end();
}
