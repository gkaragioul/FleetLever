import { withTenant } from "@/lib/db/client";
import { getActiveTenantContext } from "@/lib/db/tenant-context";

const snapshotKey = "construction-console";

function customizationState(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const value = snapshot as Record<string, unknown>;
  return {
    branding: value.branding ?? null,
    customFieldDefinitions: value.customFieldDefinitions ?? [],
    assetColumnLayout: value.assetColumnLayout ?? [],
  };
}

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
    const previousResult = await client.query<{ snapshot: unknown }>(
      `
        select snapshot
        from public.console_snapshots
        where organization_id = $1
          and snapshot_key = $2
        limit 1
      `,
      [context.organizationId, snapshotKey],
    );
    const previousCustomization = customizationState(previousResult.rows[0]?.snapshot);
    const nextCustomization = customizationState(snapshot);
    const customizationChanged = JSON.stringify(previousCustomization) !== JSON.stringify(nextCustomization);

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

    if (customizationChanged) {
      await client.query(
        `
          insert into public.audit_logs (
            organization_id,
            actor_profile_id,
            action,
            record_table,
            record_id,
            metadata
          )
          values ($1, $2, 'console.customization_updated', 'console_snapshots', $1, $3::jsonb)
        `,
        [
          context.organizationId,
          context.profileId,
          JSON.stringify({
            brandingChanged: JSON.stringify(previousCustomization?.branding) !== JSON.stringify(nextCustomization?.branding),
            customFieldsChanged: JSON.stringify(previousCustomization?.customFieldDefinitions) !== JSON.stringify(nextCustomization?.customFieldDefinitions),
            assetColumnsChanged: JSON.stringify(previousCustomization?.assetColumnLayout) !== JSON.stringify(nextCustomization?.assetColumnLayout),
          }),
        ],
      );
    }
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
