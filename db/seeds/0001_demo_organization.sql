begin;

alter table public.profiles disable row level security;
alter table public.organizations disable row level security;
alter table public.organization_members disable row level security;
alter table public.locations disable row level security;
alter table public.operators disable row level security;
alter table public.assets disable row level security;
alter table public.documents disable row level security;
alter table public.document_asset_links disable row level security;
alter table public.document_operator_links disable row level security;
alter table public.compliance_templates disable row level security;
alter table public.compliance_template_requirements disable row level security;
alter table public.maintenance_tasks disable row level security;
alter table public.issues disable row level security;

insert into public.organizations (id, name, legal_name, timezone, currency, locale, status)
values ('00000000-0000-4000-8000-000000000001', 'Demo ΑΕ', 'Demo Ανώνυμη Εταιρεία', 'Europe/Athens', 'EUR', 'el-GR', 'trial')
on conflict (id) do nothing;

insert into public.profiles (id, auth_subject, email, full_name, phone)
values
  ('00000000-0000-4000-8000-000000000101', 'demo:george', 'george@example.local', 'Γιώργος Καραγκιουλές', '+30 210 0000 000'),
  ('00000000-0000-4000-8000-000000000102', 'demo:office', 'office@example.local', 'Office Team', null),
  ('00000000-0000-4000-8000-000000000103', 'demo:mechanic', 'mechanic@example.local', 'Service Team', null)
on conflict (id) do nothing;

insert into public.organization_members (organization_id, profile_id, role)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'owner'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'office_staff'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'maintenance_manager')
on conflict (organization_id, profile_id) do nothing;

insert into public.locations (id, organization_id, name, city, kind)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'Athens Depot', 'Athens', 'depot'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', 'Aspropyrgos Yard', 'Aspropyrgos', 'yard'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', 'Koropi Project', 'Koropi', 'project')
on conflict (organization_id, name) do nothing;

insert into public.operators (id, organization_id, full_name, phone, role_title, license_categories, license_expires_at)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', 'Nikos Papadakis', '+30 210 0000 004', 'Crane operator', array['Crane','Lifting'], '2026-06-10'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', 'Eleni Mavrou', '+30 210 0000 012', 'Bus driver', array['D','Passenger transport'], '2027-02-18'),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000001', 'Kostas Antoniou', '+30 210 0000 001', 'Machine operator', array['Earthmoving'], '2026-09-04')
on conflict (id) do nothing;

insert into public.assets (
  id, organization_id, location_id, assigned_operator_id, name, internal_code, asset_type,
  plate_number, serial_number, ownership_type, status, current_hours, current_mileage
)
values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000301', 'Liebherr LTM 1040', 'CR-04', 'Crane', 'DEM-0001', 'LTM1040-19-GR', 'owned', 'attention', 6420, null),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000302', 'Mercedes Tourismo', 'B-12', 'Bus', 'DEM-0002', 'WDB632-T12', 'leased', 'blocked', null, 218400),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', null, 'Toyota 8FG Forklift', 'FL-02', 'Forklift', null, '8FG-55621', 'owned', 'attention', 3810, null),
  ('00000000-0000-4000-8000-000000000404', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000303', 'CAT 320 Excavator', 'EX-01', 'Excavator', null, 'CAT0320ZK', 'rented', 'blocked', 7050, null),
  ('00000000-0000-4000-8000-000000000405', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', null, 'Ford Transit Service Van', 'V-07', 'Van', 'DEM-0003', 'WF0XXXTTG', 'owned', 'ready', null, 92400)
on conflict (organization_id, internal_code) do nothing;

insert into public.compliance_templates (id, organization_id, asset_type, name, is_default)
values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000001', 'Crane', 'Crane default', true),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000001', 'Bus', 'Bus default', true),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000001', 'Forklift', 'Forklift default', true),
  ('00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000001', 'Van', 'Van default', true),
  ('00000000-0000-4000-8000-000000000505', '00000000-0000-4000-8000-000000000001', 'Excavator', 'Excavator default', true)
on conflict (organization_id, asset_type, name) do nothing;

insert into public.compliance_template_requirements (organization_id, template_id, document_category)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000501', 'Insurance'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000501', 'Lifting certificate'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000501', 'Periodic inspection'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000502', 'KTEO'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000502', 'Insurance'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000502', 'Permit'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000503', 'Periodic inspection'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000503', 'Safety document'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000504', 'KTEO'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000504', 'Insurance'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000505', 'Insurance'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000505', 'Periodic inspection'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000505', 'Safety document')
on conflict (template_id, document_category) do nothing;

insert into public.documents (id, organization_id, title, category, storage_key, file_name, mime_type, issued_at, expires_at, status, review_state, ai_confidence)
values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000001', 'CR-04 πιστοποιητικό ανύψωσης', 'Lifting certificate', 'demo/cr04-lifting.pdf', 'cr04-lifting.pdf', 'application/pdf', '2025-06-03', '2026-06-03', 'critical', 'approved', 0.980),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000001', 'B-12 έλεγχος KTEO', 'KTEO', 'demo/b12-kteo.pdf', 'b12-kteo.pdf', 'application/pdf', '2025-05-20', '2026-05-20', 'expired', 'approved', 0.960),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000001', 'FL-02 περιοδικός έλεγχος', 'Periodic inspection', 'demo/fl02-inspection.pdf', 'fl02-inspection.pdf', 'application/pdf', '2025-12-01', '2026-06-18', 'warning', 'under_review', 0.740),
  ('00000000-0000-4000-8000-000000000604', '00000000-0000-4000-8000-000000000001', 'Άδεια χειριστή Νίκου Παπαδάκη', 'Operator license', 'demo/nikos-license.pdf', 'nikos-license.pdf', 'application/pdf', '2023-08-11', '2026-06-10', 'warning', 'approved', 0.910)
on conflict (organization_id, storage_key) do nothing;

insert into public.document_asset_links (organization_id, document_id, asset_id)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000401'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000402'),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000403')
on conflict (document_id, asset_id) do nothing;

insert into public.document_operator_links (organization_id, document_id, operator_id)
values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000604', '00000000-0000-4000-8000-000000000301')
on conflict (document_id, operator_id) do nothing;

insert into public.maintenance_tasks (id, organization_id, asset_id, title, status, due_at, assigned_to_profile_id, cost_cents)
values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000403', 'Έλεγχος υδραυλικών λαδιών και φρένων', 'overdue', '2026-05-24', '00000000-0000-4000-8000-000000000103', 36000),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000401', 'Προετοιμασία ελέγχου μπούμας', 'scheduled', '2026-06-01', '00000000-0000-4000-8000-000000000103', null)
on conflict (id) do nothing;

insert into public.issues (id, organization_id, asset_id, assigned_to_profile_id, title, severity, status, blocking_asset, created_at)
values
  ('00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000404', '00000000-0000-4000-8000-000000000103', 'Πτώση υδραυλικής πίεσης υπό φορτίο', 'critical', 'in_progress', true, '2026-05-28 09:00:00+03'),
  ('00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000102', 'Ληγμένο KTEO, δεν μπορεί να μπει σε διαδρομή Σαββατοκύριακου', 'high', 'triaged', true, '2026-05-27 09:00:00+03')
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.organizations enable row level security;
alter table public.organizations force row level security;
alter table public.organization_members enable row level security;
alter table public.organization_members force row level security;
alter table public.locations enable row level security;
alter table public.locations force row level security;
alter table public.operators enable row level security;
alter table public.operators force row level security;
alter table public.assets enable row level security;
alter table public.assets force row level security;
alter table public.documents enable row level security;
alter table public.documents force row level security;
alter table public.document_asset_links enable row level security;
alter table public.document_asset_links force row level security;
alter table public.document_operator_links enable row level security;
alter table public.document_operator_links force row level security;
alter table public.compliance_templates enable row level security;
alter table public.compliance_templates force row level security;
alter table public.compliance_template_requirements enable row level security;
alter table public.compliance_template_requirements force row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.maintenance_tasks force row level security;
alter table public.issues enable row level security;
alter table public.issues force row level security;

commit;
