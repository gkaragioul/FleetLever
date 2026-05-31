import { withTenant } from "@/lib/db/client";

export type TenantContext = {
  organizationId: string;
  profileId: string;
};

export async function getDashboardSnapshot(context: TenantContext) {
  return withTenant(context, async (client) => {
    const assets = await client.query(
      `
        select
          count(*)::int as total,
          count(*) filter (where status = 'ready')::int as ready,
          count(*) filter (where status = 'blocked')::int as blocked
        from public.assets
        where archived_at is null
          and organization_id = $1
      `,
      [context.organizationId],
    );
    const documents = await client.query(
      `
        select
          count(*) filter (where status in ('expired', 'critical', 'warning'))::int as needs_attention
        from public.documents
        where archived_at is null
          and organization_id = $1
      `,
      [context.organizationId],
    );
    const maintenance = await client.query(
      `
        select
          count(*) filter (where status = 'overdue')::int as overdue,
          coalesce(sum(cost_cents), 0)::int as cost_cents
        from public.maintenance_tasks
        where status not in ('completed', 'cancelled')
          and organization_id = $1
      `,
      [context.organizationId],
    );
    const issues = await client.query(
      `
        select
          count(*) filter (where blocking_asset and status not in ('resolved', 'closed'))::int as blocking
        from public.issues
        where organization_id = $1
      `,
      [context.organizationId],
    );
    const deadlines = await client.query(
      `
        select id, title, expires_at, status
        from public.documents
        where archived_at is null
          and organization_id = $1
          and expires_at is not null
          and status in ('expired', 'critical', 'warning')
        order by expires_at asc
        limit 6
      `,
      [context.organizationId],
    );
    const assignments = await client.query(
      `
        select
          issue.id,
          issue.title,
          asset.internal_code,
          profile.full_name as assignee_name
        from public.issues issue
        join public.assets asset on asset.id = issue.asset_id
        left join public.profiles profile on profile.id = issue.assigned_to_profile_id
        where issue.status not in ('resolved', 'closed')
          and issue.organization_id = $1
        order by issue.blocking_asset desc, issue.created_at desc
        limit 6
      `,
      [context.organizationId],
    );

    return {
      assets: assets.rows[0],
      documents: documents.rows[0],
      maintenance: maintenance.rows[0],
      issues: issues.rows[0],
      deadlines: deadlines.rows,
      assignments: assignments.rows,
    };
  });
}
