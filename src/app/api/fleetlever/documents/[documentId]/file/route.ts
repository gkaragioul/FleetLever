import { getActiveTenantContext } from "@/lib/db/tenant-context";
import { withTenant } from "@/lib/db/client";
import { readObject } from "@/lib/storage/object-storage";
import { requireSuperAdminApiSession } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

function contentDisposition(fileName: string) {
  const encoded = encodeURIComponent(fileName).replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");
  return `attachment; filename="${fileName.replace(/"/g, "'")}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  const authError = await requireSuperAdminApiSession();
  if (authError) return authError;

  const { documentId } = await context.params;
  const tenant = await getActiveTenantContext();

  const file = await withTenant(tenant, async (client) => {
    const result = await client.query<{
      file_name: string;
      mime_type: string;
      file_size_bytes: number;
      storage_key: string;
      storage_provider: string;
      storage_bucket: string | null;
      content: Buffer;
    }>(
      `
        select
          file.file_name,
          file.mime_type,
          file.file_size_bytes,
          file.storage_key,
          file.storage_provider,
          file.storage_bucket,
          file.content
        from public.document_files file
        join public.documents document on document.id = file.document_id
        where file.document_id = $1
          and file.organization_id = $2
          and document.archived_at is null
        order by file.created_at desc
        limit 1
      `,
      [documentId, tenant.organizationId],
    );

    return result.rows[0] ?? null;
  });

  if (!file) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  const content = file.content ?? (await readObject(file.storage_key, file.storage_provider, file.storage_bucket));

  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Length": String(file.file_size_bytes),
      "Content-Disposition": contentDisposition(file.file_name),
      "Cache-Control": "private, max-age=60",
    },
  });
}
