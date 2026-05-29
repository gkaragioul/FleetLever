import { withTenant } from "@/lib/db/client";

export type TenantContext = {
  organizationId: string;
  profileId: string;
};

export async function getDashboardSnapshot(context: TenantContext) {
  return withTenant(context, async (client) => {
    const [assets, documents, maintenance, issues, deadlines, assignments] = await Promise.all([
      client.query(`
        select
          count(*)::int as total,
          count(*) filter (where status = 'ready')::int as ready,
          count(*) filter (where status = 'blocked')::int as blocked
        from public.assets
        where archived_at is null
      `),
      client.query(`
        select
          count(*) filter (where status in ('expired', 'critical', 'warning'))::int as needs_attention
        from public.documents
        where archived_at is null
      `),
      client.query(`
        select
          count(*) filter (where status = 'overdue')::int as overdue,
          coalesce(sum(cost_cents), 0)::int as cost_cents
        from public.maintenance_tasks
        where status not in ('completed', 'cancelled')
      `),
      client.query(`
        select
          count(*) filter (where blocking_asset and status not in ('resolved', 'closed'))::int as blocking
        from public.issues
      `),
      client.query(`
        select id, title, expires_at, status
        from public.documents
        where archived_at is null
          and expires_at is not null
          and status in ('expired', 'critical', 'warning')
        order by expires_at asc
        limit 6
      `),
      client.query(`
        select
          issue.id,
          issue.title,
          asset.internal_code,
          profile.full_name as assignee_name
        from public.issues issue
        join public.assets asset on asset.id = issue.asset_id
        left join public.profiles profile on profile.id = issue.assigned_to_profile_id
        where issue.status not in ('resolved', 'closed')
        order by issue.blocking_asset desc, issue.created_at desc
        limit 6
      `),
    ]);

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
