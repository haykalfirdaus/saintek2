-- =============================================================
--  LANGKAH 2 dari 2 — ABSENSI + LOGIN SISWA + RLS ROLE BARU
--
--  PRASYARAT: jalankan dulu 1-roles-enum.sql sampai sukses.
--  Lalu jalankan SELURUH file ini di SQL Editor (boleh sekaligus).
--
--  Isi:
--    - trigger auth (jangan buat profil admin utk akun siswa)
--    - students: kolom auth_user_id + nickname
--    - student_credentials, attendance, app_settings
--    - RPC: check_in (absen geolocation), attendance_range (rekap)
--    - RLS role baru: wali_kelas (read-only), guru_mapel (tugas),
--      pengatur_kebersihan (piket)
-- =============================================================

-- ---------- Trigger auth: JANGAN buat profil admin utk akun siswa ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce((new.raw_user_meta_data->>'is_student')::boolean, false) then
    return new;   -- akun siswa: tidak masuk profiles (bukan admin)
  end if;
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'ketua')
  ) on conflict (id) do nothing;
  return new;
end $$;

-- ---------- Pengaturan lokasi sekolah (utk validasi geolocation) ----------
create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  school_lat double precision not null default -8.582858006646104,
  school_lng double precision not null default 116.09685855414219,
  radius_m   int not null default 100
);
alter table public.app_settings enable row level security;
insert into public.app_settings (id) values (1) on conflict do nothing;

drop policy if exists "app_settings read" on public.app_settings;
create policy "app_settings read" on public.app_settings for select using (true);
drop policy if exists "app_settings write" on public.app_settings;
create policy "app_settings write" on public.app_settings
  for all using (public.current_role() = 'developer')
  with check (public.current_role() = 'developer');

-- ---------- students: link akun login + nickname ----------
alter table public.students
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null,
  add column if not exists nickname text;

-- Helper: student_id milik user yang sedang login (anti-rekursi RLS).
create or replace function public.current_student_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.students where auth_user_id = auth.uid();
$$;

-- Siswa boleh update HANYA nickname miliknya (nama & no_absen dikunci).
create or replace function public.set_my_nickname(new_nick text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.students
    set nickname = nullif(trim(new_nick), '')
    where auth_user_id = auth.uid();
end $$;

-- ---------- student_credentials: kredensial default utk dibagikan ----------
create table if not exists public.student_credentials (
  student_id uuid primary key references public.students(id) on delete cascade,
  email text not null,
  default_password text not null,
  created_at timestamptz not null default now()
);
alter table public.student_credentials enable row level security;

drop policy if exists "cred admin read" on public.student_credentials;
create policy "cred admin read" on public.student_credentials
  for select using (public.current_role() in ('developer','sekretaris'));
drop policy if exists "cred admin write" on public.student_credentials;
create policy "cred admin write" on public.student_credentials
  for all using (public.current_role() in ('developer','sekretaris'))
  with check (public.current_role() in ('developer','sekretaris'));

-- =============================================================
--  ATTENDANCE — catatan absen harian
--  status: 'hadir' | 'izin' | 'sakit' | 'alpha'
-- =============================================================
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  tanggal date not null,
  status text not null default 'hadir' check (status in ('hadir','izin','sakit','alpha')),
  method text not null default 'geo' check (method in ('geo','manual')),
  lat double precision,
  lng double precision,
  distance_m int,
  note text,
  created_at timestamptz not null default now(),
  unique (student_id, tanggal)
);
alter table public.attendance enable row level security;
create index if not exists attendance_tanggal_idx on public.attendance (tanggal);

-- Baca: admin (dev/sekretaris/ketua) + wali_kelas + siswa (miliknya).
drop policy if exists "att read" on public.attendance;
create policy "att read" on public.attendance
  for select using (
    public.current_role() in ('developer','sekretaris','ketua','wali_kelas')
    or student_id = public.current_student_id()
  );

-- Siswa INSERT absen HANYA utk dirinya, tanggal hari ini (WITA), method 'geo'.
drop policy if exists "att student insert" on public.attendance;
create policy "att student insert" on public.attendance
  for insert to authenticated
  with check (
    student_id = public.current_student_id()
    and method = 'geo'
    and tanggal = (now() at time zone 'Asia/Makassar')::date
  );

-- Admin (dev/sekretaris/ketua) kelola penuh (input/edit/hapus manual).
drop policy if exists "att admin manage" on public.attendance;
create policy "att admin manage" on public.attendance
  for all using (public.current_role() in ('developer','sekretaris','ketua'))
  with check (public.current_role() in ('developer','sekretaris','ketua'));

-- =============================================================
--  RPC: absen via geolocation (haversine, tolak di luar radius)
-- =============================================================
create or replace function public.check_in(p_lat double precision, p_lng double precision)
returns table (ok boolean, distance_m int, message text)
language plpgsql security definer set search_path = public as $$
declare
  s_lat double precision; s_lng double precision; r int;
  d double precision; sid uuid; today date;
begin
  sid := public.current_student_id();
  if sid is null then
    return query select false, null::int, 'Akun tidak terhubung ke data siswa.'; return;
  end if;

  select school_lat, school_lng, radius_m into s_lat, s_lng, r
    from public.app_settings where id = 1;

  d := 2 * 6371000 * asin(sqrt(
        power(sin(radians(p_lat - s_lat) / 2), 2) +
        cos(radians(s_lat)) * cos(radians(p_lat)) *
        power(sin(radians(p_lng - s_lng) / 2), 2)
      ));

  if d > r then
    return query select false, round(d)::int,
      format('Di luar radius (%.0f m dari %s m). Absen ditolak.', d, r); return;
  end if;

  today := (now() at time zone 'Asia/Makassar')::date;

  insert into public.attendance (student_id, tanggal, status, method, lat, lng, distance_m)
  values (sid, today, 'hadir', 'geo', p_lat, p_lng, round(d)::int)
  on conflict (student_id, tanggal) do nothing;

  return query select true, round(d)::int, 'Absen berhasil dicatat.';
end $$;

-- =============================================================
--  RPC: rekap absensi rentang tanggal (panel admin)
-- =============================================================
create or replace function public.attendance_range(p_from date, p_to date)
returns table (
  id uuid, student_id uuid, nama text, no_absen int,
  tanggal date, status text, method text, distance_m int, note text
)
language sql stable security definer set search_path = public as $$
  select a.id, a.student_id, s.nama, s.no_absen,
         a.tanggal, a.status, a.method, a.distance_m, a.note
  from public.attendance a
  join public.students s on s.id = a.student_id
  where a.tanggal between p_from and p_to
    and public.current_role() in ('developer','sekretaris','ketua','wali_kelas')
  order by a.tanggal desc, s.no_absen asc;
$$;

-- =============================================================
--  RLS role baru pada tabel yang sudah ada
--   - wali_kelas          : READ-ONLY (otomatis lewat "public read"; tidak
--                           ditambahkan ke policy write mana pun).
--   - pengatur_kebersihan : hanya piket.
--   - guru_mapel          : hanya tugas.
-- =============================================================
drop policy if exists "piket kebersihan write" on public.piket;
create policy "piket kebersihan write" on public.piket
  for all using (public.current_role() = 'pengatur_kebersihan')
  with check (public.current_role() = 'pengatur_kebersihan');

drop policy if exists "tasks guru_mapel write" on public.tasks;
create policy "tasks guru_mapel write" on public.tasks
  for all using (public.current_role() = 'guru_mapel')
  with check (public.current_role() = 'guru_mapel');
