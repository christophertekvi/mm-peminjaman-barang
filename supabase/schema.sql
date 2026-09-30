create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  role text not null default 'admin'
);

create table items (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text,
  brand text,
  serial_number text,
  condition text not null default 'baik',
  status text not null default 'tersedia'
    check (status in ('tersedia','dipinjam','perawatan','hilang')),
  photo_url text,
  notes text
);

create table loans (
  id uuid primary key default gen_random_uuid(),
  processed_by uuid references users(id),
  borrower_name text not null,
  borrower_department text not null,
  borrower_phone text not null,
  loan_date date not null default current_date,
  due_date date not null,
  return_date date,
  status text not null default 'aktif' check (status in ('aktif','selesai')),
  signature_out_url text,
  signature_in_url text,
  notes text
);

create table loan_items (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  item_id uuid not null references items(id),
  condition_out text,
  condition_in text,
  notes text
);

alter table users enable row level security;
alter table items enable row level security;
alter table loans enable row level security;
alter table loan_items enable row level security;

insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

insert into items (code, name, category) values
  ('CAM-001', 'Kamera mirrorless A', 'Kamera'),
  ('TRP-001', 'Tripod video', 'Tripod'),
  ('MIC-001', 'Wireless mic set', 'Audio');
