begin;

create table if not exists public.document_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  storage_key text not null,
  file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  content bytea not null,
  uploaded_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, storage_key)
);

create index if not exists document_files_document_idx
  on public.document_files (organization_id, document_id, created_at desc);

alter table public.document_files enable row level security;
alter table public.document_files force row level security;

create policy document_files_tenant_select on public.document_files
for select
using (organization_id = app_private.current_organization_id());

create policy document_files_tenant_insert on public.document_files
for insert
with check (organization_id = app_private.current_organization_id());

create policy document_files_tenant_update on public.document_files
for update
using (organization_id = app_private.current_organization_id())
with check (organization_id = app_private.current_organization_id());

create policy document_files_tenant_delete on public.document_files
for delete
using (organization_id = app_private.current_organization_id());

commit;
