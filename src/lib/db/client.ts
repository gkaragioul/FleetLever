import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDbPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured.");
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return pool;
}

export async function withTenant<T>(
  context: { organizationId: string; profileId: string },
  callback: (client: pg.PoolClient) => Promise<T>,
) {
  const client = await getDbPool().connect();

  try {
    await client.query("begin");
    await client.query("select set_config('app.current_organization_id', $1, true)", [context.organizationId]);
    await client.query("select set_config('app.current_profile_id', $1, true)", [context.profileId]);

    const membership = await client.query(
      `
        select 1
        from public.organization_members
        where organization_id = $1
          and profile_id = $2
          and status = 'active'
        limit 1
      `,
      [context.organizationId, context.profileId],
    );

    if (membership.rowCount !== 1) {
      throw new Error("Profile is not an active member of this organization.");
    }

    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
