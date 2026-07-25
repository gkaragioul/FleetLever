"use server";

import { revalidatePath } from "next/cache";
import type { PoolClient } from "pg";
import {
  type DocumentCategory,
  type FleetLeverData,
  type Severity,
  documentStatus,
  formatDate,
} from "@/lib/fleetlever";
import { getFleetLeverData, runTenantMutation } from "@/lib/db/fleetlever-data";
import type { TenantContext } from "@/lib/db/queries";
import { getFleetLeverAccessSession } from "@/lib/auth/access";
import { setActiveTenantContext } from "@/lib/db/tenant-context";
import { requireObjectStorageForProduction, uploadObject } from "@/lib/storage/object-storage";

export type ActionResult = {
  ok: boolean;
  message: string;
  data?: unknown;
};

function text(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

const documentCategories = new Set<DocumentCategory>([
  "KTEO",
  "Insurance",
  "Permit",
  "Lifting certificate",
  "Periodic inspection",
  "Operator license",
  "Maintenance invoice",
  "Safety document",
]);

const severities = new Set<Severity>(["low", "medium", "high", "critical"]);

function documentCategory(value: string, fallback: DocumentCategory = "Insurance") {
  return documentCategories.has(value as DocumentCategory) ? (value as DocumentCategory) : fallback;
}

function severity(value: string, fallback: Severity = "medium") {
  return severities.has(value as Severity) ? (value as Severity) : fallback;
}

function dateOrNull(formData: FormData, key: string) {
  const value = text(formData, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function maybeDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function centsOrNull(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const numeric = Number(value.replace(",", "."));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : null;
}

function safeJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeFileName(value: string) {
  return value.replace(/[^\p{L}\p{N}._ -]+/gu, "-").replace(/\s+/g, " ").trim().slice(0, 140) || "document";
}

function storageSlug(value: string) {
  return value
    .toLocaleLowerCase("el-GR")
    .replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "document";
}

function uploadedFile(formData: FormData) {
  const value = formData.get("file");
  return value instanceof File && value.size > 0 ? value : null;
}

const allowedDocumentExtensions = new Set([
  ".csv",
  ".doc",
  ".docx",
  ".heic",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".webp",
  ".xls",
  ".xlsx",
]);

function validateDocumentFile(file: File | null): ActionResult | null {
  if (!file) return null;

  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, message: "Το αρχείο πρέπει να είναι έως 10MB." };
  }

  const safeName = sanitizeFileName(file.name);
  const extension = safeName.includes(".") ? safeName.slice(safeName.lastIndexOf(".")).toLowerCase() : "";

  if (!allowedDocumentExtensions.has(extension)) {
    return { ok: false, message: "Υποστηρίζονται PDF, εικόνες, CSV, Excel και Word αρχεία." };
  }

  return null;
}

function documentStatusSql() {
  return `
    status = case
      when expires_at is not null and expires_at < current_date then 'expired'
      when expires_at is not null and expires_at <= current_date + interval '7 days' then 'critical'
      when expires_at is not null and expires_at <= current_date + interval '30 days' then 'warning'
      else 'valid'
    end
  `;
}

function requireDatabase() {
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      message: "Δεν υπάρχει DATABASE_URL σε αυτό το περιβάλλον.",
    };
  }

  return null;
}

/**
 * Server actions are POST endpoints in their own right: the page-level session checks do not
 * cover them, so every action has to establish access on its own before touching tenant data.
 */
async function requireMutationAccess(): Promise<ActionResult | null> {
  const session = await getFleetLeverAccessSession().catch(() => null);

  if (!session) {
    return {
      ok: false,
      message: "Δεν έχεις πρόσβαση σε αυτή την ενέργεια. Συνδέσου ξανά.",
    };
  }

  if (session.kind === "account" && !session.account.trial.active) {
    return {
      ok: false,
      message: "Η πρόσβαση στο FleetLever έχει λήξει.",
    };
  }

  return null;
}

/** For actions that reach outside a single tenant and so must not be available to tenant users. */
async function requireSuperAdminAccess(): Promise<ActionResult | null> {
  const session = await getFleetLeverAccessSession().catch(() => null);

  if (session?.kind !== "super_admin") {
    return {
      ok: false,
      message: "Η ενέργεια απαιτεί λογαριασμό διαχειριστή.",
    };
  }

  return null;
}

async function writeAudit(
  client: { query: (sql: string, values?: unknown[]) => Promise<unknown> },
  context: TenantContext,
  action: string,
  recordTable: string,
  recordId?: string | null,
  metadata: Record<string, unknown> = {},
) {
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
      values ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [context.organizationId, context.profileId, action, recordTable, recordId ?? null, JSON.stringify(metadata)],
  );
}

function refresh() {
  revalidatePath("/");
}

async function syncAssetIssueStatus(client: PoolClient, assetId: string) {
  await client.query(
    `
      update public.assets asset
      set status = case
        when exists (
          select 1
          from public.issues issue
          where issue.asset_id = asset.id
            and issue.blocking_asset
            and issue.status not in ('resolved', 'closed')
        ) then 'blocked'
        when exists (
          select 1
          from public.issues issue
          where issue.asset_id = asset.id
            and issue.status not in ('resolved', 'closed')
        ) and asset.status = 'ready' then 'attention'
        when asset.status = 'blocked' then 'attention'
        else asset.status
      end
      where asset.id = $1
    `,
    [assetId],
  );
}

export async function createAsset(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const name = text(formData, "name");
  const code = text(formData, "code").toUpperCase();
  const assetType = text(formData, "assetType", "Van");
  const operatorId = nullableText(formData, "operatorId");

  if (!name || !code) {
    return { ok: false, message: "Συμπλήρωσε κωδικό και όνομα παγίου." };
  }

  await runTenantMutation(async (client, context) => {
    const asset = await client.query<{ id: string }>(
      `
        insert into public.assets (
          organization_id,
          assigned_operator_id,
          name,
          internal_code,
          asset_type,
          plate_number,
          serial_number,
          ownership_type,
          status,
          department
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, 'attention', $9)
        returning id
      `,
      [
        context.organizationId,
        operatorId,
        name,
        code,
        assetType,
        nullableText(formData, "plate"),
        nullableText(formData, "serial"),
        text(formData, "ownership", "owned"),
        nullableText(formData, "department"),
      ],
    );

    if (operatorId) {
      await client.query(
        `
          insert into public.operator_assignments (organization_id, operator_id, asset_id)
          values ($1, $2, $3)
        `,
        [context.organizationId, operatorId, asset.rows[0].id],
      );
    }

    await writeAudit(client, context, "asset.created", "assets", asset.rows[0].id, { code, name, assetType });
  });

  refresh();
  return { ok: true, message: `Το πάγιο ${code} καταχωρήθηκε.` };
}

export async function updateAsset(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const assetId = text(formData, "assetId");
  const name = text(formData, "name");
  const code = text(formData, "code").toUpperCase();
  const assetType = text(formData, "assetType", "Van");
  const operatorId = nullableText(formData, "operatorId");

  if (!assetId || !name || !code) {
    return { ok: false, message: "Συμπλήρωσε κωδικό και όνομα παγίου." };
  }

  await runTenantMutation(async (client, context) => {
    await client.query(
      `
        update public.assets
        set name = $2,
            internal_code = $3,
            asset_type = $4,
            plate_number = $5,
            serial_number = $6,
            ownership_type = $7,
            department = $8,
            assigned_operator_id = $9
        where id = $1
      `,
      [
        assetId,
        name,
        code,
        assetType,
        nullableText(formData, "plate"),
        nullableText(formData, "serial"),
        text(formData, "ownership", "owned"),
        nullableText(formData, "department"),
        operatorId,
      ],
    );

    await client.query(
      `
        update public.operator_assignments
        set assigned_until = current_date
        where asset_id = $1
          and organization_id = $2
          and assigned_until is null
      `,
      [assetId, context.organizationId],
    );

    if (operatorId) {
      await client.query(
        `
          insert into public.operator_assignments (organization_id, operator_id, asset_id)
          values ($1, $2, $3)
        `,
        [context.organizationId, operatorId, assetId],
      );
    }

    await writeAudit(client, context, "asset.updated", "assets", assetId, { code, name, assetType });
  });

  refresh();
  return { ok: true, message: `Το πάγιο ${code} ενημερώθηκε.` };
}

export async function archiveAsset(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const assetId = text(formData, "assetId");
  if (!assetId) return { ok: false, message: "Δεν βρέθηκε πάγιο." };

  await runTenantMutation(async (client, context) => {
    await client.query(
      `
        update public.assets
        set archived_at = now(),
            status = 'inactive'
        where id = $1
      `,
      [assetId],
    );
    await writeAudit(client, context, "asset.archived", "assets", assetId);
  });

  refresh();
  return { ok: true, message: "Το πάγιο αρχειοθετήθηκε." };
}

export async function createDocument(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const title = text(formData, "title");
  const category = documentCategory(text(formData, "category", "Insurance"));
  const assetId = text(formData, "assetId");
  const operatorId = text(formData, "operatorId");
  const file = uploadedFile(formData);
  const issuedAt = dateOrNull(formData, "issuedAt");
  const expiresAt = dateOrNull(formData, "expiresAt");

  if (!title) {
    return { ok: false, message: "Συμπλήρωσε τίτλο εγγράφου." };
  }

  const fileError = validateDocumentFile(file);
  if (fileError) return fileError;

  if (file) {
    const storageError = requireObjectStorageForProduction();
    if (storageError) return storageError;
  }

  if (issuedAt && expiresAt && expiresAt < issuedAt) {
    return { ok: false, message: "Η λήξη δεν μπορεί να είναι πριν την έκδοση." };
  }

  await runTenantMutation(async (client, context) => {
    const safeName = sanitizeFileName(file?.name ?? `${title}.pdf`);
    const extension = safeName.includes(".") ? safeName.slice(safeName.lastIndexOf(".")) : ".pdf";
    const storageKey = `uploads/${context.organizationId}/${crypto.randomUUID()}-${storageSlug(title)}${extension}`;
    const fileSize = file?.size ?? null;
    const mimeType = file?.type || "application/pdf";
    const storedFile = file
      ? await uploadObject({
          key: storageKey,
          body: Buffer.from(await file.arrayBuffer()),
          contentType: mimeType,
          fileName: safeName,
        })
      : null;
    const document = await client.query<{ id: string }>(
      `
        insert into public.documents (
          organization_id,
          title,
          category,
          storage_key,
          file_name,
          mime_type,
          file_size_bytes,
          issued_at,
          expires_at,
          status,
          review_state,
          ai_confidence
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'under_review', 'under_review', 0.72)
        returning id
      `,
      [
        context.organizationId,
        title,
        category,
        storageKey,
        safeName,
        mimeType,
        fileSize,
        issuedAt,
        expiresAt,
      ],
    );

    const documentId = document.rows[0].id;

    if (file && storedFile) {
      await client.query(
        `
          insert into public.document_files (
            organization_id,
            document_id,
            storage_key,
            storage_provider,
            storage_bucket,
            file_name,
            mime_type,
            file_size_bytes,
            content_sha256,
            uploaded_by_profile_id
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          context.organizationId,
          documentId,
          storedFile.storageKey,
          storedFile.storageProvider,
          storedFile.storageBucket,
          safeName,
          mimeType,
          file.size,
          storedFile.sha256,
          context.profileId,
        ],
      );

      await client.query(
        `
          insert into public.document_versions (
            organization_id,
            document_id,
            version_number,
            storage_key,
            storage_provider,
            storage_bucket,
            file_name,
            file_size_bytes,
            content_sha256,
            uploaded_by_profile_id
          )
          values ($1, $2, 1, $3, $4, $5, $6, $7, $8)
        `,
        [
          context.organizationId,
          documentId,
          storedFile.storageKey,
          storedFile.storageProvider,
          storedFile.storageBucket,
          safeName,
          file.size,
          storedFile.sha256,
          context.profileId,
        ],
      );
    }

    if (assetId) {
      await client.query(
        `
          insert into public.document_asset_links (organization_id, document_id, asset_id)
          values ($1, $2, $3)
          on conflict (document_id, asset_id) do nothing
        `,
        [context.organizationId, documentId, assetId],
      );
    }

    if (operatorId) {
      await client.query(
        `
          insert into public.document_operator_links (organization_id, document_id, operator_id)
          values ($1, $2, $3)
          on conflict (document_id, operator_id) do nothing
        `,
        [context.organizationId, documentId, operatorId],
      );
    }

    await writeAudit(client, context, "document.created", "documents", documentId, {
      title,
      category,
      assetId: assetId || null,
      operatorId: operatorId || null,
      hasFile: Boolean(file),
    });
  });

  refresh();
  return { ok: true, message: file ? "Το έγγραφο ανέβηκε και μπήκε σε έλεγχο." : "Το έγγραφο μπήκε σε έλεγχο." };
}

export async function approveDocument(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const documentId = text(formData, "documentId");
  if (!documentId) return { ok: false, message: "Δεν βρέθηκε έγγραφο." };

  await runTenantMutation(async (client, context) => {
    await client.query(
      `
        update public.documents
        set review_state = 'approved',
            ${documentStatusSql()}
        where id = $1
      `,
      [documentId],
    );
    await writeAudit(client, context, "document.approved", "documents", documentId);
  });

  refresh();
  return { ok: true, message: "Το έγγραφο εγκρίθηκε." };
}

export async function updateDocument(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const documentId = text(formData, "documentId");
  const title = text(formData, "title");
  const category = documentCategory(text(formData, "category", "Insurance"));
  const assetId = text(formData, "assetId");
  const operatorId = text(formData, "operatorId");
  const file = uploadedFile(formData);
  const issuedAt = dateOrNull(formData, "issuedAt");
  const expiresAt = dateOrNull(formData, "expiresAt");

  if (!documentId || !title) {
    return { ok: false, message: "Συμπλήρωσε τίτλο εγγράφου." };
  }

  const fileError = validateDocumentFile(file);
  if (fileError) return fileError;

  if (file) {
    const storageError = requireObjectStorageForProduction();
    if (storageError) return storageError;
  }

  if (issuedAt && expiresAt && expiresAt < issuedAt) {
    return { ok: false, message: "Η λήξη δεν μπορεί να είναι πριν την έκδοση." };
  }

  await runTenantMutation(async (client, context) => {
    let storageKey: string | null = null;
    let safeName: string | null = null;
    let mimeType: string | null = null;
    let storedFile: Awaited<ReturnType<typeof uploadObject>> | null = null;

    if (file) {
      safeName = sanitizeFileName(file.name);
      const extension = safeName.includes(".") ? safeName.slice(safeName.lastIndexOf(".")) : ".pdf";
      storageKey = `uploads/${context.organizationId}/${crypto.randomUUID()}-${storageSlug(title)}${extension}`;
      mimeType = file.type || "application/octet-stream";
      storedFile = await uploadObject({
        key: storageKey,
        body: Buffer.from(await file.arrayBuffer()),
        contentType: mimeType,
        fileName: safeName,
      });
    }

    await client.query(
      `
        update public.documents
        set title = $2,
            category = $3,
            issued_at = $4,
            expires_at = $5,
            review_state = case when $6::boolean then 'under_review' else review_state end,
            status = case
              when $6::boolean then 'under_review'
              when $5::date is not null and $5::date < current_date then 'expired'
              when $5::date is not null and $5::date <= current_date + interval '7 days' then 'critical'
              when $5::date is not null and $5::date <= current_date + interval '30 days' then 'warning'
              else 'valid'
            end,
            storage_key = coalesce($7, storage_key),
            file_name = coalesce($8, file_name),
            mime_type = coalesce($9, mime_type),
            file_size_bytes = coalesce($10, file_size_bytes)
        where id = $1
      `,
      [
        documentId,
        title,
        category,
        issuedAt,
        expiresAt,
        Boolean(file),
        storageKey,
        safeName,
        mimeType,
        file?.size ?? null,
      ],
    );

    await client.query("delete from public.document_asset_links where document_id = $1", [documentId]);
    await client.query("delete from public.document_operator_links where document_id = $1", [documentId]);

    if (assetId) {
      await client.query(
        `
          insert into public.document_asset_links (organization_id, document_id, asset_id)
          values ($1, $2, $3)
          on conflict (document_id, asset_id) do nothing
        `,
        [context.organizationId, documentId, assetId],
      );
    }

    if (operatorId) {
      await client.query(
        `
          insert into public.document_operator_links (organization_id, document_id, operator_id)
          values ($1, $2, $3)
          on conflict (document_id, operator_id) do nothing
        `,
        [context.organizationId, documentId, operatorId],
      );
    }

    if (file && storageKey && safeName && mimeType && storedFile) {
      const version = await client.query<{ version_number: number }>(
        `
          select coalesce(max(version_number), 0) + 1 as version_number
          from public.document_versions
          where document_id = $1
        `,
        [documentId],
      );

      await client.query(
        `
          insert into public.document_files (
            organization_id,
            document_id,
            storage_key,
            storage_provider,
            storage_bucket,
            file_name,
            mime_type,
            file_size_bytes,
            content_sha256,
            uploaded_by_profile_id
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          context.organizationId,
          documentId,
          storedFile.storageKey,
          storedFile.storageProvider,
          storedFile.storageBucket,
          safeName,
          mimeType,
          file.size,
          storedFile.sha256,
          context.profileId,
        ],
      );

      await client.query(
        `
          insert into public.document_versions (
            organization_id,
            document_id,
            version_number,
            storage_key,
            storage_provider,
            storage_bucket,
            file_name,
            file_size_bytes,
            content_sha256,
            uploaded_by_profile_id
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          context.organizationId,
          documentId,
          version.rows[0]?.version_number ?? 1,
          storedFile.storageKey,
          storedFile.storageProvider,
          storedFile.storageBucket,
          safeName,
          file.size,
          storedFile.sha256,
          context.profileId,
        ],
      );
    }

    await writeAudit(client, context, "document.updated", "documents", documentId, {
      title,
      category,
      assetId: assetId || null,
      operatorId: operatorId || null,
      replacedFile: Boolean(file),
    });
  });

  refresh();
  return { ok: true, message: file ? "Το έγγραφο ενημερώθηκε και μπήκε ξανά σε έλεγχο." : "Το έγγραφο ενημερώθηκε." };
}

export async function archiveDocument(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const documentId = text(formData, "documentId");
  if (!documentId) return { ok: false, message: "Δεν βρέθηκε έγγραφο." };

  await runTenantMutation(async (client, context) => {
    await client.query("update public.documents set archived_at = now() where id = $1", [documentId]);
    await writeAudit(client, context, "document.archived", "documents", documentId);
  });

  refresh();
  return { ok: true, message: "Το έγγραφο αρχειοθετήθηκε." };
}

export async function renewDocument(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const documentId = text(formData, "documentId");
  const expiresAt = dateOrNull(formData, "expiresAt");
  if (!documentId || !expiresAt) {
    return { ok: false, message: "Δώσε νέα ημερομηνία λήξης." };
  }

  await runTenantMutation(async (client, context) => {
    await client.query(
      `
        update public.documents
        set expires_at = $2,
            review_state = 'approved',
            status = 'valid'
        where id = $1
      `,
      [documentId, expiresAt],
    );
    await writeAudit(client, context, "document.renewed", "documents", documentId, { expiresAt });
  });

  refresh();
  return { ok: true, message: "Η λήξη ανανεώθηκε." };
}

export async function createMaintenanceTask(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const title = text(formData, "title");
  const assetId = text(formData, "assetId");
  if (!title || !assetId) {
    return { ok: false, message: "Συμπλήρωσε πάγιο και εργασία." };
  }

  await runTenantMutation(async (client, context) => {
    const task = await client.query<{ id: string }>(
      `
        insert into public.maintenance_tasks (
          organization_id,
          asset_id,
          title,
          status,
          due_at,
          cost_cents,
          assigned_to_profile_id
        )
        values ($1, $2, $3, 'scheduled', $4, $5, $6)
        returning id
      `,
      [
        context.organizationId,
        assetId,
        title,
        dateOrNull(formData, "dueAt"),
        centsOrNull(formData, "cost"),
        context.profileId,
      ],
    );
    await writeAudit(client, context, "maintenance.created", "maintenance_tasks", task.rows[0].id, {
      assetId,
      title,
    });
  });

  refresh();
  return { ok: true, message: "Η εργασία συντήρησης δημιουργήθηκε." };
}

export async function assignMaintenanceTask(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const taskId = text(formData, "taskId");
  if (!taskId) return { ok: false, message: "Δεν βρέθηκε εργασία." };

  await runTenantMutation(async (client, context) => {
    await client.query(
      `
        update public.maintenance_tasks
        set assigned_to_profile_id = $2,
            status = case when status = 'scheduled' then 'in_progress' else status end
        where id = $1
      `,
      [taskId, context.profileId],
    );
    await writeAudit(client, context, "maintenance.assigned", "maintenance_tasks", taskId);
  });

  refresh();
  return { ok: true, message: "Η εργασία ανατέθηκε." };
}

export async function updateMaintenanceTask(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const taskId = text(formData, "taskId");
  const title = text(formData, "title");
  const assetId = text(formData, "assetId");
  if (!taskId || !title || !assetId) {
    return { ok: false, message: "Συμπλήρωσε πάγιο και εργασία." };
  }

  await runTenantMutation(async (client, context) => {
    await client.query(
      `
        update public.maintenance_tasks
        set asset_id = $2,
            title = $3,
            due_at = $4,
            cost_cents = $5
        where id = $1
      `,
      [taskId, assetId, title, dateOrNull(formData, "dueAt"), centsOrNull(formData, "cost")],
    );
    await writeAudit(client, context, "maintenance.updated", "maintenance_tasks", taskId, { assetId, title });
  });

  refresh();
  return { ok: true, message: "Η εργασία ενημερώθηκε." };
}

export async function completeMaintenanceTask(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const taskId = text(formData, "taskId");
  if (!taskId) return { ok: false, message: "Δεν βρέθηκε εργασία." };

  await runTenantMutation(async (client, context) => {
    const task = await client.query<{
      id: string;
      asset_id: string;
      title: string;
      cost_cents: number | null;
    }>(
      `
        update public.maintenance_tasks
        set status = 'completed',
            completed_at = now()
        where id = $1
        returning id, asset_id, title, cost_cents
      `,
      [taskId],
    );

    const completed = task.rows[0];
    if (completed) {
      await client.query(
        `
          insert into public.maintenance_records (
            organization_id,
            task_id,
            asset_id,
            title,
            cost_cents,
            notes
          )
          values ($1, $2, $3, $4, $5, $6)
        `,
        [
          context.organizationId,
          completed.id,
          completed.asset_id,
          completed.title,
          completed.cost_cents,
          nullableText(formData, "notes"),
        ],
      );
      await writeAudit(client, context, "maintenance.completed", "maintenance_tasks", completed.id, {
        assetId: completed.asset_id,
        title: completed.title,
      });
    }
  });

  refresh();
  return { ok: true, message: "Η εργασία ολοκληρώθηκε." };
}

export async function createIssue(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const title = text(formData, "title");
  const assetId = text(formData, "assetId");
  if (!title || !assetId) {
    return { ok: false, message: "Συμπλήρωσε πάγιο και περιγραφή βλάβης." };
  }

  await runTenantMutation(async (client, context) => {
    const blocking = formData.get("blocking") === "on";

    const issue = await client.query<{ id: string }>(
      `
        insert into public.issues (
          organization_id,
          asset_id,
          assigned_to_profile_id,
          title,
          description,
          severity,
          status,
          blocking_asset
        )
        values ($1, $2, $3, $4, $5, $6, 'open', $7)
        returning id
      `,
      [
        context.organizationId,
        assetId,
        context.profileId,
        title,
        nullableText(formData, "description"),
        severity(text(formData, "severity", "medium")),
        blocking,
      ],
    );

    await syncAssetIssueStatus(client, assetId);
    await writeAudit(client, context, "issue.created", "issues", issue.rows[0].id, {
      assetId,
      title,
      blocking,
    });
  });

  refresh();
  return { ok: true, message: "Η βλάβη καταχωρήθηκε." };
}

export async function updateIssue(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const issueId = text(formData, "issueId");
  const title = text(formData, "title");
  const assetId = text(formData, "assetId");

  if (!issueId || !title || !assetId) {
    return { ok: false, message: "Συμπλήρωσε πάγιο και περιγραφή βλάβης." };
  }

  await runTenantMutation(async (client, context) => {
    const existing = await client.query<{ asset_id: string }>(
      "select asset_id from public.issues where id = $1",
      [issueId],
    );
    const previousAssetId = existing.rows[0]?.asset_id;
    const blocking = formData.get("blocking") === "on";

    await client.query(
      `
        update public.issues
        set asset_id = $2,
            title = $3,
            description = $4,
            severity = $5,
            blocking_asset = $6,
            status = case when status = 'resolved' then 'open' else status end
        where id = $1
      `,
      [
        issueId,
        assetId,
        title,
        nullableText(formData, "description"),
        severity(text(formData, "severity", "medium")),
        blocking,
      ],
    );

    await syncAssetIssueStatus(client, assetId);
    if (previousAssetId && previousAssetId !== assetId) {
      await syncAssetIssueStatus(client, previousAssetId);
    }
    await writeAudit(client, context, "issue.updated", "issues", issueId, { assetId, title, blocking });
  });

  refresh();
  return { ok: true, message: "Η βλάβη ενημερώθηκε." };
}

export async function resolveIssue(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const issueId = text(formData, "issueId");
  if (!issueId) return { ok: false, message: "Δεν βρέθηκε βλάβη." };

  await runTenantMutation(async (client, context) => {
    const result = await client.query<{ asset_id: string }>(
      `
        update public.issues
        set status = 'resolved',
            blocking_asset = false,
            resolved_at = now()
        where id = $1
        returning asset_id
      `,
      [issueId],
    );

    const assetId = result.rows[0]?.asset_id;
    if (assetId) {
      await syncAssetIssueStatus(client, assetId);
    }
    await writeAudit(client, context, "issue.resolved", "issues", issueId, { assetId: assetId ?? null });
  });

  refresh();
  return { ok: true, message: "Η βλάβη έκλεισε." };
}

export async function createOperator(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const name = text(formData, "name");
  if (!name) return { ok: false, message: "Συμπλήρωσε όνομα χειριστή." };

  await runTenantMutation(async (client, context) => {
    const operator = await client.query<{ id: string }>(
      `
        insert into public.operators (
          organization_id,
          full_name,
          phone,
          role_title,
          license_categories,
          license_expires_at
        )
        values ($1, $2, $3, $4, $5, $6)
        returning id
      `,
      [
        context.organizationId,
        name,
        nullableText(formData, "phone"),
        nullableText(formData, "role"),
        text(formData, "licenseCategories")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        dateOrNull(formData, "licenseExpiresAt"),
      ],
    );
    await writeAudit(client, context, "operator.created", "operators", operator.rows[0].id, { name });
  });

  refresh();
  return { ok: true, message: "Ο χειριστής καταχωρήθηκε." };
}

export async function updateOperator(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const operatorId = text(formData, "operatorId");
  const name = text(formData, "name");
  if (!operatorId || !name) return { ok: false, message: "Συμπλήρωσε όνομα χειριστή." };

  await runTenantMutation(async (client, context) => {
    await client.query(
      `
        update public.operators
        set full_name = $2,
            phone = $3,
            role_title = $4,
            license_categories = $5,
            license_expires_at = $6
        where id = $1
      `,
      [
        operatorId,
        name,
        nullableText(formData, "phone"),
        nullableText(formData, "role"),
        text(formData, "licenseCategories")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        dateOrNull(formData, "licenseExpiresAt"),
      ],
    );
    await writeAudit(client, context, "operator.updated", "operators", operatorId, { name });
  });

  refresh();
  return { ok: true, message: "Ο χειριστής ενημερώθηκε." };
}

export async function archiveOperator(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const operatorId = text(formData, "operatorId");
  if (!operatorId) return { ok: false, message: "Δεν βρέθηκε χειριστής." };

  await runTenantMutation(async (client, context) => {
    await client.query("update public.assets set assigned_operator_id = null where assigned_operator_id = $1", [operatorId]);
    await client.query("update public.operators set archived_at = now() where id = $1", [operatorId]);
    await writeAudit(client, context, "operator.archived", "operators", operatorId);
  });

  refresh();
  return { ok: true, message: "Ο χειριστής αρχειοθετήθηκε." };
}

export async function createComplianceRule(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const assetType = text(formData, "assetType");
  const categories = text(formData, "categories")
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is DocumentCategory => documentCategories.has(item as DocumentCategory))
    .filter(Boolean);

  if (!assetType || !categories.length) {
    return { ok: false, message: "Συμπλήρωσε τύπο παγίου και κατηγορίες." };
  }

  await runTenantMutation(async (client, context) => {
    const template = await client.query<{ id: string }>(
      `
        insert into public.compliance_templates (organization_id, asset_type, name, is_default)
        values ($1, $2, $3, true)
        on conflict (organization_id, asset_type, name) do update
        set is_default = excluded.is_default
        returning id
      `,
      [context.organizationId, assetType, `${assetType} default`],
    );

    for (const category of categories) {
      await client.query(
        `
          insert into public.compliance_template_requirements (organization_id, template_id, document_category)
          values ($1, $2, $3)
          on conflict (template_id, document_category) do nothing
        `,
        [context.organizationId, template.rows[0].id, category],
      );
    }
    await writeAudit(client, context, "compliance_rule.upserted", "compliance_templates", template.rows[0].id, {
      assetType,
      categories,
    });
  });

  refresh();
  return { ok: true, message: "Ο κανόνας συμμόρφωσης ενημερώθηκε." };
}

export async function importFleetRows(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const importType = text(formData, "importType", "assets_csv");
  const sourceName = text(formData, "sourceName", "manual-import.csv");
  const rows = safeJsonArray(text(formData, "rowsJson")).slice(0, 100);

  if (!rows.length) {
    return { ok: false, message: "Δεν υπάρχουν γραμμές για εισαγωγή." };
  }

  let imported = 0;
  let skipped = 0;

  await runTenantMutation(async (client, context) => {
    const importRecord = await client.query<{ id: string }>(
      `
        insert into public.imports (
          organization_id,
          created_by_profile_id,
          import_type,
          status,
          source_name,
          summary
        )
        values ($1, $2, $3, 'completed', $4, $5)
        returning id
      `,
      [
        context.organizationId,
        context.profileId,
        importType === "documents_csv" ? "documents_csv" : "assets_csv",
        sourceName,
        JSON.stringify({ rows: rows.length }),
      ],
    );
    const importId = importRecord.rows[0].id;

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] as Record<string, unknown>;
      const normalized = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]),
      );

      let status = "skipped";
      let errorMessage: string | null = null;
      let createdTable: string | null = null;
      let createdId: string | null = null;

      if (importType === "documents_csv") {
        const title = String(normalized.title ?? normalized.τίτλος ?? "").trim();
        const category = documentCategory(String(normalized.category ?? normalized.κατηγορία ?? "Insurance").trim());
        const assetCode = String(normalized.assetCode ?? normalized.asset ?? normalized.πάγιο ?? "").trim();
        const expiresAt = maybeDate(normalized.expiresAt ?? normalized.expiry ?? normalized.λήξη);

        if (!title) {
          errorMessage = "Λείπει τίτλος εγγράφου.";
        } else {
          const asset = assetCode
            ? await client.query<{ id: string }>(
                `
                  select id
                  from public.assets
                  where organization_id = $1
                    and upper(internal_code) = upper($2)
                    and archived_at is null
                  limit 1
                `,
                [context.organizationId, assetCode],
              )
            : { rows: [] };
          const storageKey = `imports/${context.organizationId}/${crypto.randomUUID()}-${storageSlug(title)}.pdf`;
          const document = await client.query<{ id: string }>(
            `
              insert into public.documents (
                organization_id,
                title,
                category,
                storage_key,
                file_name,
                mime_type,
                expires_at,
                status,
                review_state,
                ai_confidence
              )
              values ($1, $2, $3, $4, $5, 'application/pdf', $6, 'under_review', 'under_review', 0.68)
              returning id
            `,
            [context.organizationId, title, category, storageKey, `${sanitizeFileName(title)}.pdf`, expiresAt],
          );
          createdTable = "documents";
          createdId = document.rows[0].id;
          status = "imported";
          imported += 1;

          if (asset.rows[0]?.id) {
            await client.query(
              `
                insert into public.document_asset_links (organization_id, document_id, asset_id)
                values ($1, $2, $3)
                on conflict (document_id, asset_id) do nothing
              `,
              [context.organizationId, createdId, asset.rows[0].id],
            );
          }
        }
      } else {
        const code = String(normalized.code ?? normalized.internal_code ?? normalized.κωδικός ?? "").trim().toUpperCase();
        const name = String(normalized.name ?? normalized.όνομα ?? "").trim();
        const assetType = String(normalized.type ?? normalized.assetType ?? normalized.τύπος ?? "Van").trim();

        if (!code || !name) {
          errorMessage = "Λείπει κωδικός ή όνομα παγίου.";
        } else {
          const asset = await client.query<{ id: string }>(
            `
              insert into public.assets (
                organization_id,
                name,
                internal_code,
                asset_type,
                plate_number,
                serial_number,
                ownership_type,
                status,
                department
              )
              values ($1, $2, $3, $4, $5, $6, 'owned', 'attention', $7)
              on conflict (organization_id, internal_code) do nothing
              returning id
            `,
            [
              context.organizationId,
              name,
              code,
              assetType,
              String(normalized.plate ?? normalized.πινακίδα ?? "").trim() || null,
              String(normalized.serial ?? normalized.σειριακό ?? "").trim() || null,
              String(normalized.department ?? normalized.τμήμα ?? assetType).trim() || assetType,
            ],
          );

          if (asset.rows[0]?.id) {
            createdTable = "assets";
            createdId = asset.rows[0].id;
            status = "imported";
            imported += 1;
          } else {
            errorMessage = "Υπάρχει ήδη πάγιο με αυτόν τον κωδικό.";
          }
        }
      }

      if (status !== "imported") {
        skipped += 1;
      }

      await client.query(
        `
          insert into public.import_rows (
            organization_id,
            import_id,
            row_number,
            raw_data,
            normalized_data,
            confidence,
            status,
            error_message,
            created_record_table,
            created_record_id
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
        [
          context.organizationId,
          importId,
          index + 1,
          JSON.stringify(row),
          JSON.stringify(normalized),
          status === "imported" ? 0.86 : 0.42,
          status,
          errorMessage,
          createdTable,
          createdId,
        ],
      );
    }

    await client.query(
      `
        update public.imports
        set summary = $2
        where id = $1
      `,
      [importId, JSON.stringify({ rows: rows.length, imported, skipped })],
    );
    await writeAudit(client, context, "import.completed", "imports", importId, { importType, sourceName, imported, skipped });
  });

  refresh();
  return { ok: true, message: `Η εισαγωγή ολοκληρώθηκε: ${imported} νέες εγγραφές, ${skipped} παραλείψεις.` };
}

export async function recordReport(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const reportType = text(formData, "reportType", "readiness");
  const title = text(formData, "title", "FleetLever report");

  await runTenantMutation(async (client, context) => {
    const report = await client.query<{ id: string }>(
      `
        insert into public.reports (
          organization_id,
          created_by_profile_id,
          report_type,
          title,
          filters,
          generated_at
        )
        values ($1, $2, $3, $4, $5, now())
        returning id
      `,
      [
        context.organizationId,
        context.profileId,
        reportType,
        title,
        JSON.stringify({ generatedFrom: "reports-panel" }),
      ],
    );
    await writeAudit(client, context, "report.generated", "reports", report.rows[0].id, { reportType, title });
  });

  refresh();
  return { ok: true, message: "Η αναφορά καταγράφηκε." };
}

export async function switchWorkspace(formData: FormData): Promise<ActionResult> {
  // This rewrites the active tenant cookies, so it must never be reachable by a tenant user.
  const denied = await requireSuperAdminAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const organizationId = text(formData, "organizationId");
  const profileId = text(formData, "profileId");

  if (!organizationId || !profileId) {
    return { ok: false, message: "Συμπλήρωσε organization και profile id." };
  }

  await setActiveTenantContext({ organizationId, profileId });
  refresh();

  return { ok: true, message: "Το workspace άλλαξε." };
}

type CopilotCitation = {
  table: "assets" | "documents" | "issues" | "maintenance_tasks";
  id: string;
  title: string;
  excerpt: string;
};

function buildCopilotResponse(question: string, data: FleetLeverData) {
  const normalized = question.toLocaleLowerCase("el-GR");
  const blockers = data.issues.filter((issue) => issue.blocking);
  const attentionDocuments = data.documents.filter((document) =>
    ["expired", "critical", "warning"].includes(documentStatus(document)) || document.reviewState === "under review",
  );
  const overdueTasks = data.maintenanceTasks.filter((task) => task.status === "overdue");
  const requestedAsset = data.assets.find((asset) => normalized.includes(asset.code.toLocaleLowerCase("el-GR")));
  const citations: CopilotCitation[] = [];

  if (requestedAsset) {
    const assetDocuments = attentionDocuments.filter((document) => document.assetId === requestedAsset.id);
    const assetIssues = data.issues.filter((issue) => issue.assetId === requestedAsset.id);
    const assetTasks = data.maintenanceTasks.filter((task) => task.assetId === requestedAsset.id);

    citations.push({
      table: "assets",
      id: requestedAsset.id,
      title: requestedAsset.code,
      excerpt: requestedAsset.name,
    });
    for (const document of assetDocuments.slice(0, 2)) {
      citations.push({
        table: "documents",
        id: document.id,
        title: document.title,
        excerpt: document.expiresAt ? `${documentStatus(document)} · ${formatDate(document.expiresAt)}` : "Χωρίς λήξη",
      });
    }
    for (const issue of assetIssues.slice(0, 2)) {
      citations.push({
        table: "issues",
        id: issue.id,
        title: issue.title,
        excerpt: issue.blocking ? "Μπλοκάρει ανάθεση" : issue.status,
      });
    }
    for (const task of assetTasks.slice(0, 1)) {
      citations.push({
        table: "maintenance_tasks",
        id: task.id,
        title: task.title,
        excerpt: `${task.status} · ${formatDate(task.dueAt)}`,
      });
    }

    const nextStep =
      assetIssues.some((issue) => issue.blocking)
        ? "κλείσιμο της blocking βλάβης"
        : assetDocuments.length
          ? "ανανέωση ή έγκριση εγγράφου"
          : assetTasks.some((task) => task.status === "overdue")
            ? "ολοκλήρωση εκπρόθεσμης συντήρησης"
            : "ανάθεση";

    return {
      answer: `${requestedAsset.code}: η επόμενη ενέργεια είναι ${nextStep}. Κατάσταση παγίου: ${requestedAsset.status}. ${
        assetDocuments.length ? `Έγγραφα που θέλουν προσοχή: ${assetDocuments.map((document) => document.title).join(", ")}. ` : ""
      }${assetIssues.length ? `Ανοιχτές βλάβες: ${assetIssues.map((issue) => issue.title).join(", ")}. ` : ""}${
        assetTasks.length ? `Συντήρηση: ${assetTasks.map((task) => task.title).join(", ")}.` : ""
      }`,
      citations,
      suggestions: ["Άνοιγμα παγίου", "Ανέβασμα εγγράφου", "Νέα εργασία"],
    };
  }

  if (normalized.includes("service") || normalized.includes("συντήρηση") || normalized.includes("εργασία")) {
    overdueTasks.slice(0, 3).forEach((task) =>
      citations.push({
        table: "maintenance_tasks",
        id: task.id,
        title: task.title,
        excerpt: `${task.status} · ${formatDate(task.dueAt)}`,
      }),
    );

    return {
      answer: overdueTasks.length
        ? `Υπάρχουν ${overdueTasks.length} εκπρόθεσμες εργασίες. Πρώτη προτεραιότητα: ${overdueTasks[0].title}.`
        : "Δεν υπάρχουν εκπρόθεσμες εργασίες αυτή τη στιγμή. Κοίτα τις προγραμματισμένες για επόμενη ανάθεση.",
      citations,
      suggestions: ["Νέα εργασία", "Φίλτρο εκπρόθεσμων", "Πάγια με χαμηλή ετοιμότητα"],
    };
  }

  if (normalized.includes("έγγρα") || normalized.includes("kteo") || normalized.includes("λήξ")) {
    attentionDocuments.slice(0, 4).forEach((document) =>
      citations.push({
        table: "documents",
        id: document.id,
        title: document.title,
        excerpt: document.expiresAt ? `${documentStatus(document)} · ${formatDate(document.expiresAt)}` : "Σε έλεγχο",
      }),
    );

    return {
      answer: attentionDocuments.length
        ? `Η ουρά εγγράφων έχει ${attentionDocuments.length} στοιχεία που θέλουν ενέργεια. Ξεκίνα από ${attentionDocuments[0].title}.`
        : "Δεν υπάρχουν έγγραφα που θέλουν άμεση ενέργεια.",
      citations,
      suggestions: ["Ανανέωση εγγράφου", "Έγκριση σε έλεγχο", "Μαζικό ανέβασμα"],
    };
  }

  blockers.slice(0, 3).forEach((issue) =>
    citations.push({
      table: "issues",
      id: issue.id,
      title: issue.title,
      excerpt: "Μπλοκάρει ανάθεση",
    }),
  );
  attentionDocuments.slice(0, 2).forEach((document) =>
    citations.push({
      table: "documents",
      id: document.id,
      title: document.title,
      excerpt: document.expiresAt ? `${documentStatus(document)} · ${formatDate(document.expiresAt)}` : "Σε έλεγχο",
    }),
  );

  return {
    answer: `Σήμερα βλέπω ${blockers.length} blockers, ${attentionDocuments.length} έγγραφα που θέλουν ενέργεια και ${overdueTasks.length} εκπρόθεσμες εργασίες. Κλείσε πρώτα τα blocking πάγια και μετά τις λήξεις των επόμενων ημερών.`,
    citations,
    suggestions: ["Δείξε blockers", "Έγγραφα με λήξη", "Εκπρόθεσμο service"],
  };
}

export async function askCopilot(formData: FormData): Promise<ActionResult> {
  const denied = await requireMutationAccess();
  if (denied) return denied;

  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const question = text(formData, "question");
  if (!question) return { ok: false, message: "Γράψε μια ερώτηση για το Copilot." };

  const data = await getFleetLeverData();
  const response = buildCopilotResponse(question, data);
  let activeConversationId = text(formData, "conversationId");

  await runTenantMutation(async (client, context) => {
    const conversation = activeConversationId
      ? { rows: [{ id: activeConversationId }] }
      : await client.query<{ id: string }>(
          `
            insert into public.ai_conversations (organization_id, profile_id, title, mode)
            values ($1, $2, $3, 'asset_analyst')
            returning id
          `,
          [context.organizationId, context.profileId, question.slice(0, 80)],
        );

    activeConversationId = conversation.rows[0].id;

    await client.query(
      `
        insert into public.ai_messages (organization_id, conversation_id, profile_id, role, content, model)
        values ($1, $2, $3, 'user', $4, 'fleetlever-rules-v1')
      `,
      [context.organizationId, activeConversationId, context.profileId, question],
    );

    const assistantMessage = await client.query<{ id: string }>(
      `
        insert into public.ai_messages (organization_id, conversation_id, profile_id, role, content, model)
        values ($1, $2, $3, 'assistant', $4, 'fleetlever-rules-v1')
        returning id
      `,
      [context.organizationId, activeConversationId, context.profileId, response.answer],
    );

    for (const citation of response.citations.slice(0, 6)) {
      await client.query(
        `
          insert into public.ai_citations (organization_id, message_id, record_table, record_id, title, excerpt)
          values ($1, $2, $3, $4, $5, $6)
        `,
        [context.organizationId, assistantMessage.rows[0].id, citation.table, citation.id, citation.title, citation.excerpt],
      );
    }

    response.citations = response.citations.slice(0, 6);
    await writeAudit(client, context, "copilot.answered", "ai_conversations", activeConversationId, {
      question: question.slice(0, 160),
      citations: response.citations.length,
    });
  });

  return { ok: true, message: "Το Copilot απάντησε.", data: { ...response, conversationId: activeConversationId } };
}
