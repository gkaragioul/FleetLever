import { withTenant } from "@/lib/db/client";
import { getActiveTenantContext } from "@/lib/db/tenant-context";

const snapshotKey = "construction-console";

export async function readConsoleSnapshotFromDatabase() {
  const context = await getActiveTenantContext();

  return withTenant(context, async (client) => {
    const result = await client.query<{ snapshot: unknown }>(
      `
        select snapshot
        from public.console_snapshots
        where organization_id = $1
          and snapshot_key = $2
        limit 1
      `,
      [context.organizationId, snapshotKey],
    );

    return result.rows[0]?.snapshot ?? null;
  });
}

export async function writeConsoleSnapshotToDatabase(snapshot: unknown) {
  const context = await getActiveTenantContext();

  await withTenant(context, async (client) => {
    await client.query(
      `
        insert into public.console_snapshots (
          organization_id,
          snapshot_key,
          snapshot,
          updated_by_profile_id
        )
        values ($1, $2, $3::jsonb, $4)
        on conflict (organization_id, snapshot_key)
        do update set
          snapshot = excluded.snapshot,
          updated_by_profile_id = excluded.updated_by_profile_id,
          updated_at = now()
      `,
      [context.organizationId, snapshotKey, JSON.stringify(snapshot), context.profileId],
    );
  });
}

export async function deleteConsoleSnapshotFromDatabase() {
  const context = await getActiveTenantContext();

  await withTenant(context, async (client) => {
    await client.query(
      `
        delete from public.console_snapshots
        where organization_id = $1
          and snapshot_key = $2
      `,
      [context.organizationId, snapshotKey],
    );
  });
}
