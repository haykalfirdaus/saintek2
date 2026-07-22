-- =============================================================
--  XI SAINTEK 2 — Supabase schema, roles, RLS, storage, functions
--  Jalankan seluruh file ini di Supabase Dashboard > SQL Editor.
-- =============================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enum roles ----------
do $$ begin
  create type public.user_role as enum ('developer','sekretaris','bendahara','ketua');
exception when duplicate_object then null; end $$;

-- =============================================================
--  PROFILES  (1:1 dengan auth.users) — menyimpan role admin
-- =============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'ketua',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Helper: role user yang sedang login (SECURITY DEFINER agar tidak rekursif di RLS).
create or replace function public.current_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- Auto-buat profil saat user baru dibuat di Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'ketua')
  ) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles policies
drop policy if exists "profiles read own or dev" on public.profiles;
create policy "profiles read own or dev" on public.profiles
  for select using (id = auth.uid() or public.current_role() = 'developer');

drop policy if exists "profiles dev manage" on public.profiles;
create policy "profiles dev manage" on public.profiles
  for all using (public.current_role() = 'developer')
  with check (public.current_role() = 'developer');

-- =============================================================
--  SISWA
-- =============================================================
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  no_absen int not null,
  nama text not null,
  created_at timestamptz not null default now(),
  unique (no_absen)
);
alter table public.students enable row level security;

drop policy if exists "students public read" on public.students;
create policy "students public read" on public.students for select using (true);

drop policy if exists "students admin write" on public.students;
create policy "students admin write" on public.students
  for all using (public.current_role() in ('developer','sekretaris','ketua'))
  with check (public.current_role() in ('developer','sekretaris','ketua'));

-- =============================================================
--  MAPEL (jadwal pelajaran Senin-Sabtu)
--  day_key: 'senin'..'sabtu'  |  items: array urutan mapel
-- =============================================================
create table if not exists public.schedules (
  day_key text primary key
    check (day_key in ('senin','selasa','rabu','kamis','jumat','sabtu')),
  items text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.schedules enable row level security;

drop policy if exists "schedules public read" on public.schedules;
create policy "schedules public read" on public.schedules for select using (true);

drop policy if exists "schedules admin write" on public.schedules;
create policy "schedules admin write" on public.schedules
  for all using (public.current_role() in ('developer','sekretaris','ketua'))
  with check (public.current_role() in ('developer','sekretaris','ketua'));

-- =============================================================
--  PIKET (petugas piket per hari)
-- =============================================================
create table if not exists public.piket (
  id uuid primary key default gen_random_uuid(),
  day_key text not null
    check (day_key in ('senin','selasa','rabu','kamis','jumat','sabtu')),
  student_id uuid not null references public.students(id) on delete cascade,
  unique (day_key, student_id)
);
alter table public.piket enable row level security;

drop policy if exists "piket public read" on public.piket;
create policy "piket public read" on public.piket for select using (true);

drop policy if exists "piket admin write" on public.piket;
create policy "piket admin write" on public.piket
  for all using (public.current_role() in ('developer','sekretaris','ketua'))
  with check (public.current_role() in ('developer','sekretaris','ketua'));

-- =============================================================
--  HARI LIBUR EKSTRA (default hanya Minggu; ini tambahan)
-- =============================================================
create table if not exists public.holidays (
  tanggal date primary key,
  keterangan text,
  created_at timestamptz not null default now()
);
alter table public.holidays enable row level security;

drop policy if exists "holidays public read" on public.holidays;
create policy "holidays public read" on public.holidays for select using (true);

drop policy if exists "holidays admin write" on public.holidays;
create policy "holidays admin write" on public.holidays
  for all using (public.current_role() in ('developer','sekretaris','ketua'))
  with check (public.current_role() in ('developer','sekretaris','ketua'));

-- =============================================================
--  TUGAS
--  deadline_type: 'range' (mulai-selesai) atau 'exact' (jam pasti)
-- =============================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  mapel text not null,
  isi text,
  photo_url text,
  deadline_type text not null default 'exact' check (deadline_type in ('range','exact')),
  deadline_start timestamptz,
  deadline_end timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.tasks enable row level security;

drop policy if exists "tasks public read" on public.tasks;
create policy "tasks public read" on public.tasks for select using (true);

drop policy if exists "tasks admin write" on public.tasks;
create policy "tasks admin write" on public.tasks
  for all using (public.current_role() in ('developer','sekretaris'))
  with check (public.current_role() in ('developer','sekretaris'));

-- =============================================================
--  PENGUMUMAN  (biasa + popup besar)
--  kind: 'biasa' | 'popup'
-- =============================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'biasa' check (kind in ('biasa','popup')),
  dari text,                       -- "Dari Siapa" (opsional)
  judul text,
  isi text not null,
  media_urls text[] default '{}',  -- multi foto / file
  active_from timestamptz,         -- masa berlaku mulai
  active_until timestamptz,        -- masa berlaku selesai
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;

drop policy if exists "ann public read" on public.announcements;
create policy "ann public read" on public.announcements for select using (true);

-- Semua role admin boleh menambah pengumuman biasa; popup hanya developer (dicek di app + trigger di bawah).
drop policy if exists "ann admin write" on public.announcements;
create policy "ann admin write" on public.announcements
  for all using (public.is_admin())
  with check (public.is_admin());

-- Guard: hanya developer yang boleh membuat/mengubah kind='popup'.
create or replace function public.guard_popup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'popup' and public.current_role() <> 'developer' then
    raise exception 'Hanya developer yang boleh membuat popup besar';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_popup on public.announcements;
create trigger trg_guard_popup before insert or update on public.announcements
  for each row execute function public.guard_popup();

-- =============================================================
--  KAS
--  Aturan: Rp5.000/minggu, tagihan tiap Kamis.
--  kas_settings.start_date = tanggal mulai penagihan kas kelas.
--  kas_payments = catatan pembayaran per minggu (tanggal Kamis) per siswa.
-- =============================================================
create table if not exists public.kas_settings (
  id int primary key default 1 check (id = 1),
  start_date date not null default current_date,
  amount_per_week int not null default 5000
);
alter table public.kas_settings enable row level security;
insert into public.kas_settings (id) values (1) on conflict do nothing;

drop policy if exists "kas_settings public read" on public.kas_settings;
create policy "kas_settings public read" on public.kas_settings for select using (true);
drop policy if exists "kas_settings write" on public.kas_settings;
create policy "kas_settings write" on public.kas_settings
  for all using (public.current_role() in ('developer','bendahara'))
  with check (public.current_role() in ('developer','bendahara'));

create table if not exists public.kas_payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  week_date date not null,           -- tanggal Kamis minggu tsb
  paid boolean not null default true,
  amount int not null default 5000,
  created_at timestamptz not null default now(),
  unique (student_id, week_date)
);
alter table public.kas_payments enable row level security;

drop policy if exists "kas public read" on public.kas_payments;
create policy "kas public read" on public.kas_payments for select using (true);

drop policy if exists "kas write" on public.kas_payments;
create policy "kas write" on public.kas_payments
  for all using (public.current_role() in ('developer','bendahara'))
  with check (public.current_role() in ('developer','bendahara'));

-- =============================================================
--  GALERI (metadata foto; file di Storage bucket 'gallery')
--  in_slider = true untuk 10 foto slideshow; false untuk 4 foto frame statis.
-- =============================================================
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text,
  in_slider boolean not null default true,
  sort_order int not null default 0,
  uploaded_by_public boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.gallery enable row level security;

drop policy if exists "gallery public read" on public.gallery;
create policy "gallery public read" on public.gallery for select using (true);

-- Publik boleh INSERT metadata (upload foto tanpa login), tapi tidak boleh update/hapus.
drop policy if exists "gallery public insert" on public.gallery;
create policy "gallery public insert" on public.gallery
  for insert with check (uploaded_by_public = true);

drop policy if exists "gallery admin manage" on public.gallery;
create policy "gallery admin manage" on public.gallery
  for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================
--  RPC: rekap tunggakan kas (dipakai landing & halaman kas)
--  Menghitung jumlah Kamis sejak start_date s/d hari ini, dikurangi minggu yang sudah dibayar.
-- =============================================================
create or replace function public.kas_arrears()
returns table (student_id uuid, nama text, no_absen int, weeks_due int, weeks_paid int, arrears int)
language sql stable security definer set search_path = public as $$
  with s as (select start_date, amount_per_week from public.kas_settings where id = 1),
  thursdays as (
    select count(*)::int as total_weeks
    from generate_series(
      (select start_date from s),
      (current_date at time zone 'Asia/Jakarta')::date,
      interval '1 day'
    ) d
    where extract(dow from d) = 4        -- 4 = Kamis
  )
  select st.id, st.nama, st.no_absen,
         (select total_weeks from thursdays) as weeks_due,
         coalesce(p.paid_count,0) as weeks_paid,
         greatest((select total_weeks from thursdays) - coalesce(p.paid_count,0), 0)
           * (select amount_per_week from s) as arrears
  from public.students st
  left join (
    select student_id, count(*)::int as paid_count
    from public.kas_payments where paid = true
    group by student_id
  ) p on p.student_id = st.id
  order by arrears desc, st.no_absen asc;
$$;

-- =============================================================
--  RPC: bulk insert siswa dari paste Excel (satu nama per baris)
-- =============================================================
create or replace function public.bulk_insert_students(names text[])
returns int language plpgsql security definer set search_path = public as $$
declare
  n text; i int; start_no int; inserted int := 0;
begin
  if public.current_role() not in ('developer','sekretaris','ketua') then
    raise exception 'Tidak diizinkan';
  end if;
  select coalesce(max(no_absen),0) into start_no from public.students;
  i := start_no;
  foreach n in array names loop
    n := trim(n);
    if length(n) = 0 then continue; end if;
    i := i + 1;
    insert into public.students (no_absen, nama) values (i, n)
      on conflict (no_absen) do nothing;
    inserted := inserted + 1;
  end loop;
  return inserted;
end $$;
