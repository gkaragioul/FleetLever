"use server";

import { revalidatePath } from "next/cache";
import { runTenantMutation } from "@/lib/db/fleetlever-data";

export type ActionResult = {
  ok: boolean;
  message: string;
};

function text(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function dateOrNull(formData: FormData, key: string) {
  const value = text(formData, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function centsOrNull(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const numeric = Number(value.replace(",", "."));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : null;
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

function refresh() {
  revalidatePath("/");
}

export async function createAsset(formData: FormData): Promise<ActionResult> {
  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const name = text(formData, "name");
  const code = text(formData, "code").toUpperCase();
  const assetType = text(formData, "assetType", "Van");

  if (!name || !code) {
    return { ok: false, message: "Συμπλήρωσε κωδικό και όνομα παγίου." };
  }

  await runTenantMutation(async (client, context) => {
    await client.query(
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
        values ($1, $2, $3, $4, $5, $6, $7, 'attention', $8)
      `,
      [
        context.organizationId,
        name,
        code,
        assetType,
        nullableText(formData, "plate"),
        nullableText(formData, "serial"),
        text(formData, "ownership", "owned"),
        nullableText(formData, "department"),
      ],
    );
  });

  refresh();
  return { ok: true, message: `Το πάγιο ${code} καταχωρήθηκε.` };
}

export async function createDocument(formData: FormData): Promise<ActionResult> {
  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const title = text(formData, "title");
  const category = text(formData, "category", "Insurance");
  const assetId = text(formData, "assetId");
  const operatorId = text(formData, "operatorId");

  if (!title) {
    return { ok: false, message: "Συμπλήρωσε τίτλο εγγράφου." };
  }

  await runTenantMutation(async (client, context) => {
    const storageKey = `uploads/${crypto.randomUUID()}-${title.toLocaleLowerCase("el-GR").replace(/[^a-z0-9α-ωάέήίόύώϊϋΐΰ]+/giu, "-")}.pdf`;
    const document = await client.query<{ id: string }>(
      `
        insert into public.documents (
          organization_id,
          title,
          category,
          storage_key,
          file_name,
          mime_type,
          issued_at,
          expires_at,
          status,
          review_state,
          ai_confidence
        )
        values ($1, $2, $3, $4, $5, 'application/pdf', $6, $7, 'under_review', 'under_review', 0.72)
        returning id
      `,
      [
        context.organizationId,
        title,
        category,
        storageKey,
        `${title}.pdf`,
        dateOrNull(formData, "issuedAt"),
        dateOrNull(formData, "expiresAt"),
      ],
    );

    const documentId = document.rows[0].id;

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
  });

  refresh();
  return { ok: true, message: "Το έγγραφο μπήκε σε έλεγχο." };
}

export async function approveDocument(formData: FormData): Promise<ActionResult> {
  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const documentId = text(formData, "documentId");
  if (!documentId) return { ok: false, message: "Δεν βρέθηκε έγγραφο." };

  await runTenantMutation(async (client) => {
    await client.query(
      `
        update public.documents
        set review_state = 'approved',
            status = case
              when expires_at is not null and expires_at < current_date then 'expired'
              when expires_at is not null and expires_at <= current_date + interval '7 days' then 'critical'
              when expires_at is not null and expires_at <= current_date + interval '30 days' then 'warning'
              else 'valid'
            end
        where id = $1
      `,
      [documentId],
    );
  });

  refresh();
  return { ok: true, message: "Το έγγραφο εγκρίθηκε." };
}

export async function renewDocument(formData: FormData): Promise<ActionResult> {
  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const documentId = text(formData, "documentId");
  const expiresAt = dateOrNull(formData, "expiresAt");
  if (!documentId || !expiresAt) {
    return { ok: false, message: "Δώσε νέα ημερομηνία λήξης." };
  }

  await runTenantMutation(async (client) => {
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
  });

  refresh();
  return { ok: true, message: "Η λήξη ανανεώθηκε." };
}

export async function createMaintenanceTask(formData: FormData): Promise<ActionResult> {
  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const title = text(formData, "title");
  const assetId = text(formData, "assetId");
  if (!title || !assetId) {
    return { ok: false, message: "Συμπλήρωσε πάγιο και εργασία." };
  }

  await runTenantMutation(async (client, context) => {
    await client.query(
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
  });

  refresh();
  return { ok: true, message: "Η εργασία συντήρησης δημιουργήθηκε." };
}

export async function assignMaintenanceTask(formData: FormData): Promise<ActionResult> {
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
  });

  refresh();
  return { ok: true, message: "Η εργασία ανατέθηκε." };
}

export async function createIssue(formData: FormData): Promise<ActionResult> {
  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const title = text(formData, "title");
  const assetId = text(formData, "assetId");
  if (!title || !assetId) {
    return { ok: false, message: "Συμπλήρωσε πάγιο και περιγραφή βλάβης." };
  }

  await runTenantMutation(async (client, context) => {
    await client.query(
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
      `,
      [
        context.organizationId,
        assetId,
        context.profileId,
        title,
        nullableText(formData, "description"),
        text(formData, "severity", "medium"),
        formData.get("blocking") === "on",
      ],
    );
  });

  refresh();
  return { ok: true, message: "Η βλάβη καταχωρήθηκε." };
}

export async function createOperator(formData: FormData): Promise<ActionResult> {
  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const name = text(formData, "name");
  if (!name) return { ok: false, message: "Συμπλήρωσε όνομα χειριστή." };

  await runTenantMutation(async (client, context) => {
    await client.query(
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
  });

  refresh();
  return { ok: true, message: "Ο χειριστής καταχωρήθηκε." };
}

export async function createComplianceRule(formData: FormData): Promise<ActionResult> {
  const missingDb = requireDatabase();
  if (missingDb) return missingDb;

  const assetType = text(formData, "assetType");
  const categories = text(formData, "categories")
    .split(",")
    .map((item) => item.trim())
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
  });

  refresh();
  return { ok: true, message: "Ο κανόνας συμμόρφωσης ενημερώθηκε." };
}
