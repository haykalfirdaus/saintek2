-- =============================================================
--  ALL-IN-ONE FIX — jalankan SEKALIGUS di Supabase SQL Editor → RUN.
--  Mencakup:
--    (1) Fix bug absen  : check_in() pakai %s (bukan %.0f gaya C)
--    (2) Lampiran tugas : kolom attachment_* di tasks + guard
--    (3) RLS Storage     : upload file hanya developer/sekretaris/ketua
--    (4) Status 'dispen' : tambah ke CHECK constraint attendance
--  Aman dijalankan berulang (idempotent).
--
--  PRASYARAT: schema.sql, storage.sql, 1-roles-enum.sql, 2-attendance.sql
--  sudah dijalankan sebelumnya.
-- =============================================================


-- =============================================================
--  (1) FIX BUG ABSEN — "unrecognized format() type specifier"
--      Postgres format() hanya kenal %s / %I / %L.
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
      format('Di luar radius (%s m dari %s m). Absen ditolak.', round(d)::int, r); return;
  end if;

  today := (now() at time zone 'Asia/Makassar')::date;

  insert into public.attendance (student_id, tanggal, status, method, lat, lng, distance_m)
  values (sid, today, 'hadir', 'geo', p_lat, p_lng, round(d)::int)
  on conflict (student_id, tanggal) do nothing;

  return query select true, round(d)::int, 'Absen berhasil dicatat.';
end $$;


-- =============================================================
--  (2) LAMPIRAN TUGAS — kolom attachment_* di tabel tasks
--      Fix: "Could not find the 'attachment_name' column of 'tasks'".
-- =============================================================
alter table public.tasks
  add column if not exists attachment_url  text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;   -- MIME atau '' untuk URL


-- =============================================================
--  (3) RLS STORAGE — upload file HANYA developer / sekretaris / ketua
-- =============================================================
-- Helper: role yang boleh upload.
create or replace function public.can_upload()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role() in ('developer','sekretaris','ketua');
$$;

-- INSERT object ke bucket tasks/announcements → hanya role upload.
drop policy if exists "auth upload tasks ann" on storage.objects;
drop policy if exists "upload roles only (tasks/ann)" on storage.objects;
create policy "upload roles only (tasks/ann)" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('tasks','announcements')
    and public.can_upload()
  );

-- UPDATE object → hanya role upload.
drop policy if exists "admin update objects" on storage.objects;
drop policy if exists "upload roles update objects" on storage.objects;
create policy "upload roles update objects" on storage.objects
  for update to authenticated
  using (public.can_upload())
  with check (public.can_upload());

-- DELETE object → hanya role upload.
drop policy if exists "admin delete objects" on storage.objects;
drop policy if exists "upload roles delete objects" on storage.objects;
create policy "upload roles delete objects" on storage.objects
  for delete to authenticated
  using (public.can_upload());

-- Guard level-tabel: hanya role upload yang boleh menaruh lampiran di tasks.
create or replace function public.guard_task_attachment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.attachment_url is not null or new.photo_url is not null)
     and not public.can_upload() then
    raise exception 'Role ini tidak diizinkan mengunggah lampiran';
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_task_attachment on public.tasks;
create trigger trg_guard_task_attachment
  before insert or update on public.tasks
  for each row execute function public.guard_task_attachment();


-- =============================================================
--  (4) STATUS 'dispen' — tambah ke CHECK constraint attendance
-- =============================================================
alter table public.attendance drop constraint if exists attendance_status_check;
alter table public.attendance
  add constraint attendance_status_check
  check (status in ('hadir','izin','sakit','dispen','alpha'));
