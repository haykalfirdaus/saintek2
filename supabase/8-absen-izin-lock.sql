-- =============================================================
--  ABSEN LANJUTAN — izin/sakit/dispen + foto + kunci + edit developer-only
--  Jalankan di SQL Editor → RUN. Aman diulang.
--  PRASYARAT: 2-attendance.sql sudah dijalankan.
-- =============================================================

-- ---------- Kolom baru di attendance ----------
alter table public.attendance
  add column if not exists deskripsi text,     -- alasan izin/sakit/dispen
  add column if not exists foto_url  text;      -- surat izin/dispen/dokter (opsional)

-- method: 'geo' (hadir via lokasi) | 'self' (izin/sakit/dispen dari siswa) | 'manual' (developer)
alter table public.attendance drop constraint if exists attendance_method_check;
alter table public.attendance
  add constraint attendance_method_check check (method in ('geo','self','manual'));

-- Pastikan status 'dispen' termasuk.
alter table public.attendance drop constraint if exists attendance_status_check;
alter table public.attendance
  add constraint attendance_status_check check (status in ('hadir','izin','sakit','dispen','alpha'));

-- ---------- Bucket foto absensi (surat izin/dispen/dokter) ----------
insert into storage.buckets (id, name, public)
values ('attendance', 'attendance', true)
on conflict (id) do nothing;

drop policy if exists "public read attendance" on storage.objects;
create policy "public read attendance" on storage.objects
  for select using (bucket_id = 'attendance');

-- Siswa (authenticated) boleh upload foto ke bucket attendance.
drop policy if exists "student upload attendance" on storage.objects;
create policy "student upload attendance" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attendance');

-- =============================================================
--  RLS attendance — atur ulang
--   - Baca : dev/sekretaris/ketua/wali_kelas (semua) + siswa (miliknya).
--   - Insert siswa : utk dirinya sendiri, tanggal hari ini (WITA).
--        * status 'hadir' hanya via method 'geo'
--        * status izin/sakit/dispen via method 'self'
--   - Update/Delete : HANYA developer.
-- =============================================================
drop policy if exists "att read" on public.attendance;
create policy "att read" on public.attendance
  for select using (
    public.current_role() in ('developer','sekretaris','ketua','wali_kelas')
    or student_id = public.current_student_id()
  );

-- Hapus policy lama yang mungkin ada.
drop policy if exists "att student insert" on public.attendance;
drop policy if exists "att admin manage" on public.attendance;

-- Siswa insert absen sendiri (hadir=geo, atau izin/sakit/dispen=self).
create policy "att student insert" on public.attendance
  for insert to authenticated
  with check (
    student_id = public.current_student_id()
    and tanggal = (now() at time zone 'Asia/Makassar')::date
    and (
      (status = 'hadir'  and method = 'geo')
      or (status in ('izin','sakit','dispen') and method = 'self')
    )
  );

-- Developer boleh INSERT manual (input mewakili siswa).
drop policy if exists "att dev insert" on public.attendance;
create policy "att dev insert" on public.attendance
  for insert to authenticated
  with check (public.current_role() = 'developer');

-- Update & delete HANYA developer (admin lain read-only).
drop policy if exists "att dev update" on public.attendance;
create policy "att dev update" on public.attendance
  for update to authenticated
  using (public.current_role() = 'developer')
  with check (public.current_role() = 'developer');

drop policy if exists "att dev delete" on public.attendance;
create policy "att dev delete" on public.attendance
  for delete to authenticated
  using (public.current_role() = 'developer');

-- =============================================================
--  RPC: absen izin/sakit/dispen mandiri (siswa)
--  Tidak butuh lokasi. Menyimpan deskripsi + foto opsional.
-- =============================================================
create or replace function public.self_report(
  p_status text, p_deskripsi text default null, p_foto_url text default null
)
returns table (ok boolean, message text)
language plpgsql security definer set search_path = public as $$
declare sid uuid; today date;
begin
  sid := public.current_student_id();
  if sid is null then
    return query select false, 'Akun tidak terhubung ke data siswa.'; return;
  end if;
  if p_status not in ('izin','sakit','dispen') then
    return query select false, 'Status tidak valid.'; return;
  end if;

  today := (now() at time zone 'Asia/Makassar')::date;

  insert into public.attendance (student_id, tanggal, status, method, deskripsi, foto_url)
  values (sid, today, p_status, 'self', nullif(trim(p_deskripsi),''), nullif(trim(p_foto_url),''))
  on conflict (student_id, tanggal) do nothing;

  -- Kalau sudah ada (terkunci), beri tahu.
  if not found then
    return query select false, 'Kamu sudah absen hari ini (terkunci).'; return;
  end if;
  return query select true, 'Berhasil dicatat.';
end $$;

-- =============================================================
--  RPC set manual (DEVELOPER) — reset field geo/self saat diubah manual.
--  Dipakai panel admin agar aturan "geo/izin/sakit/dispen di-reset" konsisten.
-- =============================================================
create or replace function public.dev_set_attendance(
  p_student uuid, p_tanggal date, p_status text
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_role() <> 'developer' then
    raise exception 'Hanya developer yang boleh mengubah absensi';
  end if;
  insert into public.attendance (student_id, tanggal, status, method, lat, lng, distance_m, deskripsi, foto_url)
  values (p_student, p_tanggal, p_status, 'manual', null, null, null, null, null)
  on conflict (student_id, tanggal) do update
    set status = excluded.status,
        method = 'manual',
        lat = null, lng = null, distance_m = null,
        deskripsi = null, foto_url = null;
end $$;

-- =============================================================
--  RPC rekap — sertakan waktu absen, lokasi, deskripsi, foto (utk export).
-- =============================================================
create or replace function public.attendance_range(p_from date, p_to date)
returns table (
  id uuid, student_id uuid, nama text, no_absen int,
  tanggal date, status text, method text, distance_m int,
  lat double precision, lng double precision,
  deskripsi text, foto_url text, waktu timestamptz
)
language sql stable security definer set search_path = public as $$
  select a.id, a.student_id, s.nama, s.no_absen,
         a.tanggal, a.status, a.method, a.distance_m,
         a.lat, a.lng, a.deskripsi, a.foto_url, a.created_at
  from public.attendance a
  join public.students s on s.id = a.student_id
  where a.tanggal between p_from and p_to
    and public.current_role() in ('developer','sekretaris','ketua','wali_kelas')
  order by a.tanggal desc, s.no_absen asc;
$$;
