begin;

alter table public.document_files
  add column if not exists storage_provider text not null default 'postgres-bytea',
  add column if not exists storage_bucket text,
  add column if not exists content_sha256 text;

alter table public.document_files
  alter column content drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'document_files_storage_provider_check'
      and conrelid = 'public.document_files'::regclass
  ) then
    alter table public.document_files
      add constraint document_files_storage_provider_check
      check (storage_provider in ('postgres-bytea', 'railway-bucket', 'local-file'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'document_files_content_or_object_check'
      and conrelid = 'public.document_files'::regclass
  ) then
    alter table public.document_files
      add constraint document_files_content_or_object_check
      check (content is not null or storage_provider in ('railway-bucket', 'local-file'));
  end if;
end $$;

alter table public.document_versions
  add column if not exists storage_provider text not null default 'postgres-bytea',
  add column if not exists storage_bucket text,
  add column if not exists content_sha256 text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'document_versions_storage_provider_check'
      and conrelid = 'public.document_versions'::regclass
  ) then
    alter table public.document_versions
      add constraint document_versions_storage_provider_check
      check (storage_provider in ('postgres-bytea', 'railway-bucket', 'local-file'));
  end if;
end $$;

commit;
