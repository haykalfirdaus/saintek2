-- =============================================================
--  Guru Mapel boleh MELIHAT absensi (read-only).
--  Jalankan di SQL Editor → RUN. Aman diulang.
--  PRASYARAT: 8-absen-izin-lock.sql & 9-attendance-start-date.sql.
-- =============================================================

-- Tambah guru_mapel ke policy baca absensi.
drop policy if exists "att read" on public.attendance;
create policy "att read" on public.attendance
  for select using (
    public.current_role() in ('developer','sekretaris','ketua','wali_kelas','guru_mapel')
    or student_id = public.current_student_id()
  );

-- attendance_range: izinkan guru_mapel (tetap tipe return terbaru dari 8/9).
drop function if exists public.attendance_range(date, date);
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
    and public.current_role() in ('developer','sekretaris','ketua','wali_kelas','guru_mapel')
  order by a.tanggal desc, s.no_absen asc;
$$;
