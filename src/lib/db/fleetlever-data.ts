import type pg from "pg";
import {
  type Asset,
  type AssetStatus,
  type ComplianceTemplate,
  type DocumentCategory,
  type FleetDocument,
  type FleetLeverData,
  type Issue,
  type MaintenanceTask,
  type Operator,
  fallbackFleetData,
} from "@/lib/fleetlever";
import { withTenant } from "@/lib/db/client";
import type { TenantContext } from "@/lib/db/queries";
import { getActiveTenantContext } from "@/lib/db/tenant-context";
import { requireActiveFleetLeverMutationSession } from "@/lib/auth/access";

type Queryable = pg.PoolClient;

function dateString(value: unknown) {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function numberOrUndefined(value: unknown) {
  if (value === null || value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function reviewState(value: string): FleetDocument["reviewState"] {
  return value === "under_review" ? "under review" : "approved";
}

function taskStatus(value: string): MaintenanceTask["status"] {
  if (value === "in_progress") return "in progress";
  if (value === "overdue" || value === "completed" || value === "scheduled") return value;
  return "scheduled";
}

function issueStatus(value: string): Issue["status"] {
  if (value === "in_progress") return "in progress";
  if (value === "triaged" || value === "waiting" || value === "resolved" || value === "open") return value;
  return "open";
}

async function queryFleetLeverData(client: Queryable, context: TenantContext): Promise<FleetLeverData> {
  const organizationResult = await client.query(
    `
      select id, name, locale, timezone, currency
      from public.organizations
      where id = $1
      limit 1
    `,
    [context.organizationId],
  );
  const locationResult = await client.query(
    `
      select id, name
      from public.locations
      where organization_id = $1
      order by case when lower(name) = 'athens depot' then 0 else 1 end, name
      limit 1
    `,
    [context.organizationId],
  );
  const sessionResult = await client.query(
    `
      select
        profile.id,
        profile.full_name,
        members.role
      from public.profiles profile
      join public.organization_members members on members.profile_id = profile.id
      where profile.id = $2
        and members.organization_id = $1
        and members.status = 'active'
      limit 1
    `,
    [context.organizationId, context.profileId],
  );
  const assetResult = await client.query(
    `
      select
        asset.id,
        asset.name,
        asset.internal_code,
        asset.asset_type,
        asset.plate_number,
        asset.serial_number,
        asset.department,
        asset.ownership_type,
        asset.status,
        asset.current_hours,
        asset.current_mileage,
        asset.assigned_operator_id,
        location.name as location_name,
        operator.full_name as operator_name
      from public.assets asset
      left join public.locations location on location.id = asset.location_id
      left join public.operators operator on operator.id = asset.assigned_operator_id
      where asset.archived_at is null
        and asset.organization_id = $1
      order by asset.internal_code
    `,
    [context.organizationId],
  );
  const documentResult = await client.query(
    `
      select
        document.id,
        document.title,
        document.category,
        document.storage_key,
        document.file_name,
        document.file_size_bytes,
        document.issued_at,
        document.expires_at,
        document.review_state,
        document.ai_confidence,
        exists (
          select 1
          from public.document_files file
          where file.document_id = document.id
            and file.organization_id = document.organization_id
        ) as has_file,
        linked_asset.asset_id,
        linked_asset.asset_code,
        linked_operator.operator_name
      from public.documents document
      left join lateral (
        select link.asset_id, asset.internal_code as asset_code
        from public.document_asset_links link
        join public.assets asset on asset.id = link.asset_id
        where link.document_id = document.id
        order by asset.internal_code
        limit 1
      ) linked_asset on true
      left join lateral (
        select operator.full_name as operator_name
        from public.document_operator_links link
        join public.operators operator on operator.id = link.operator_id
        where link.document_id = document.id
        order by operator.full_name
        limit 1
      ) linked_operator on true
      where document.archived_at is null
        and document.organization_id = $1
      order by
        case when document.expires_at is null then 1 else 0 end,
        document.expires_at,
        document.title
    `,
    [context.organizationId],
  );
  const maintenanceResult = await client.query(
    `
      select
        task.id,
        task.asset_id,
        task.title,
        task.due_at,
        task.status,
        task.cost_cents,
        profile.full_name as owner_name
      from public.maintenance_tasks task
      left join public.profiles profile on profile.id = task.assigned_to_profile_id
      where task.status not in ('completed', 'cancelled')
        and task.organization_id = $1
      order by task.due_at nulls last, task.created_at desc
    `,
    [context.organizationId],
  );
  const issueResult = await client.query(
    `
      select
        issue.id,
        issue.asset_id,
        issue.title,
        issue.severity,
        issue.status,
        issue.blocking_asset,
        issue.created_at,
        profile.full_name as assignee_name
      from public.issues issue
      left join public.profiles profile on profile.id = issue.assigned_to_profile_id
      where issue.status not in ('resolved', 'closed')
        and issue.organization_id = $1
      order by issue.blocking_asset desc, issue.created_at desc
    `,
    [context.organizationId],
  );
  const operatorResult = await client.query(
    `
      select
        operator.id,
        operator.full_name,
        operator.role_title,
        operator.phone,
        operator.license_categories,
        operator.license_expires_at,
        coalesce(array_remove(array_agg(asset.id order by asset.internal_code), null), '{}') as assigned_asset_ids
      from public.operators operator
      left join public.assets asset on asset.assigned_operator_id = operator.id and asset.archived_at is null
      where operator.archived_at is null
        and operator.organization_id = $1
      group by operator.id
      order by operator.full_name
    `,
    [context.organizationId],
  );
  const templateResult = await client.query(
    `
      select
        template.id,
        template.asset_type,
        coalesce(array_remove(array_agg(requirement.document_category order by requirement.document_category), null), '{}') as required_categories
      from public.compliance_templates template
      left join public.compliance_template_requirements requirement on requirement.template_id = template.id
      where template.is_default
        and template.organization_id = $1
      group by template.id
      order by template.asset_type
    `,
    [context.organizationId],
  );

  const assets: Asset[] = assetResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.internal_code,
    type: row.asset_type,
    plate: row.plate_number ?? undefined,
    serial: row.serial_number ?? undefined,
    location: row.location_name ?? "No location",
    department: row.department ?? row.asset_type,
    operatorId: row.assigned_operator_id ?? undefined,
    operator: row.operator_name ?? "Unassigned",
    status: row.status as AssetStatus,
    ownership: row.ownership_type,
    hours: numberOrUndefined(row.current_hours),
    mileage: numberOrUndefined(row.current_mileage),
  }));

  const documents: FleetDocument[] = documentResult.rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category as DocumentCategory,
    assetId: row.asset_id ?? undefined,
    assetCode: row.asset_code ?? undefined,
    operator: row.operator_name ?? undefined,
    issuedAt: dateString(row.issued_at),
    expiresAt: dateString(row.expires_at),
    reviewState: reviewState(row.review_state),
    confidence: row.ai_confidence === null ? 0 : Number(row.ai_confidence),
    fileName: row.file_name,
    fileSize: numberOrUndefined(row.file_size_bytes),
    storageKey: row.storage_key,
    hasFile: Boolean(row.has_file),
  }));

  const maintenanceTasks: MaintenanceTask[] = maintenanceResult.rows.map((row) => ({
    id: row.id,
    assetId: row.asset_id,
    title: row.title,
    dueAt: dateString(row.due_at) ?? new Date().toISOString().slice(0, 10),
    status: taskStatus(row.status),
    owner: row.owner_name ?? "Unassigned",
    cost: row.cost_cents === null ? undefined : Math.round(Number(row.cost_cents) / 100),
  }));

  const issues: Issue[] = issueResult.rows.map((row) => ({
    id: row.id,
    assetId: row.asset_id,
    title: row.title,
    severity: row.severity,
    status: issueStatus(row.status),
    blocking: Boolean(row.blocking_asset),
    assignee: row.assignee_name ?? "Unassigned",
    openedAt: dateString(row.created_at) ?? new Date().toISOString().slice(0, 10),
  }));

  const operators: Operator[] = operatorResult.rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    role: row.role_title ?? "Operator",
    phone: row.phone ?? "",
    licenseCategories: row.license_categories ?? [],
    licenseExpiresAt: dateString(row.license_expires_at) ?? new Date().toISOString().slice(0, 10),
    assignedAssetIds: row.assigned_asset_ids ?? [],
  }));

  const complianceTemplates: ComplianceTemplate[] = templateResult.rows.map((row) => ({
    id: row.id,
    assetType: row.asset_type,
    requiredCategories: row.required_categories ?? [],
  }));

  const organization = organizationResult.rows[0] ?? fallbackFleetData.organization;
  const location = locationResult.rows[0];
  const session = sessionResult.rows[0];

  return {
    runtime: {
      dataSource: "database",
    },
    organization: {
      id: organization.id,
      name: organization.name,
      locale: organization.locale,
      timezone: organization.timezone,
      currency: organization.currency,
    },
    session: {
      organizationId: context.organizationId,
      profileId: context.profileId,
      profileName: session?.full_name ?? "User",
      role: session?.role ?? "member",
    },
    location: {
      id: location?.id,
      name: location?.name ?? fallbackFleetData.location.name,
      assetCount: assets.length,
      operatorCount: operators.length,
    },
    assets,
    documents,
    maintenanceTasks,
    issues,
    operators,
    complianceTemplates,
  };
}

export async function getFleetLeverData(context?: TenantContext): Promise<FleetLeverData> {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT) {
      throw new Error("DATABASE_URL is required in production.");
    }

    return fallbackFleetData;
  }

  const activeContext = context ?? await getActiveTenantContext();
  return withTenant(activeContext, (client) => queryFleetLeverData(client, activeContext));
}

export async function runTenantMutation<T>(
  callback: (client: Queryable, context: TenantContext) => Promise<T>,
  context?: TenantContext,
) {
  const session = await requireActiveFleetLeverMutationSession();
  const activeContext = session.kind === "account"
    ? { organizationId: session.account.organizationId, profileId: session.account.profileId }
    : context ?? await getActiveTenantContext();

  if (
    session.kind === "account"
    && context
    && (context.organizationId !== activeContext.organizationId || context.profileId !== activeContext.profileId)
  ) {
    throw new Error("Authenticated tenant context mismatch.");
  }

  return withTenant(activeContext, async (client) => callback(client, activeContext));
}
