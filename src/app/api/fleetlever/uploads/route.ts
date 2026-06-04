import { getActiveTenantContext } from "@/lib/db/tenant-context";
import { withTenant } from "@/lib/db/client";
import { requireObjectStorageForProduction, uploadObject } from "@/lib/storage/object-storage";
import { requireSuperAdminApiSession } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function sanitizeFileName(value: string) {
  return value.replace(/[^\p{L}\p{N}._ -]+/gu, "-").replace(/\s+/g, " ").trim().slice(0, 140) || "upload";
}

function storageSlug(value: string) {
  return value
    .toLocaleLowerCase("el-GR")
    .replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "upload";
}

function cleanRecordId(value: FormDataEntryValue | null) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function cleanText(value: FormDataEntryValue | null, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 180) : fallback;
}

function dateOrNull(value: FormDataEntryValue | null) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function POST(request: Request) {
  const authError = await requireSuperAdminApiSession();
  if (authError) return authError;

  const storageError = requireObjectStorageForProduction();
  if (storageError) {
    return Response.json({ ok: false, error: storageError.message }, { status: 503 });
  }

  const tenant = await getActiveTenantContext();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, error: "No file selected." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ ok: false, error: "Files must be 10MB or smaller." }, { status: 413 });
  }

  const scope = typeof formData.get("scope") === "string" ? String(formData.get("scope")) : "general";
  const machineCode = typeof formData.get("machineCode") === "string" ? String(formData.get("machineCode")) : "machine";
  const assetId = cleanRecordId(formData.get("assetId"));
  const evidenceTitle = cleanText(formData.get("documentTitle"), safeNameWithoutExtension(file.name));
  const evidenceCategory = cleanText(formData.get("documentCategory"), "Safety document");
  const expiresAt = dateOrNull(formData.get("expiresAt"));
  const safeName = sanitizeFileName(file.name);
  const extension = safeName.includes(".") ? safeName.slice(safeName.lastIndexOf(".")) : "";
  const key = `console/${tenant.organizationId}/${storageSlug(scope)}/${storageSlug(machineCode)}/${crypto.randomUUID()}-${storageSlug(safeName)}${extension}`;
  const stored = await uploadObject({
    key,
    body: Buffer.from(await file.arrayBuffer()),
    contentType: file.type || "application/octet-stream",
    fileName: safeName,
  });

  let documentId: string | null = null;

  if (assetId && process.env.DATABASE_URL) {
    await withTenant(tenant, async (client) => {
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
            expires_at,
            status,
            review_state,
            ai_confidence
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, 'under_review', 'under_review', 0.92)
          returning id
        `,
        [
          tenant.organizationId,
          evidenceTitle,
          evidenceCategory,
          stored.storageKey,
          safeName,
          file.type || "application/octet-stream",
          file.size,
          expiresAt,
        ],
      );

      documentId = document.rows[0].id;

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
          tenant.organizationId,
          documentId,
          stored.storageKey,
          stored.storageProvider,
          stored.storageBucket,
          safeName,
          file.type || "application/octet-stream",
          file.size,
          stored.sha256,
          tenant.profileId,
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
          values ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          tenant.organizationId,
          documentId,
          stored.storageKey,
          stored.storageProvider,
          stored.storageBucket,
          safeName,
          file.size,
          stored.sha256,
          tenant.profileId,
        ],
      );

      await client.query(
        `
          insert into public.document_asset_links (organization_id, document_id, asset_id)
          values ($1, $2, $3)
          on conflict (document_id, asset_id) do nothing
        `,
        [tenant.organizationId, documentId, assetId],
      );

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
          values ($1, $2, 'document.evidence_uploaded', 'documents', $3, $4::jsonb)
        `,
        [
          tenant.organizationId,
          tenant.profileId,
          documentId,
          JSON.stringify({ assetId, machineCode, evidenceTitle, evidenceCategory, storageKey: stored.storageKey }),
        ],
      );
    });
  }

  return Response.json({
    ok: true,
    documentId,
    file: {
      name: safeName,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      storageKey: stored.storageKey,
      storageProvider: stored.storageProvider,
      storageBucket: stored.storageBucket,
      sha256: stored.sha256,
    },
  });
}

function safeNameWithoutExtension(value: string) {
  const safeName = sanitizeFileName(value);
  const dotIndex = safeName.lastIndexOf(".");
  return dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName;
}
