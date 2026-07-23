-- =============================================================
--  TAMBAHAN — status 'dispen' pada absensi.
--  Jalankan HANYA jika kamu sudah pernah menjalankan 2-attendance.sql
--  versi lama (yang belum punya 'dispen'). Aman dijalankan berulang.
-- =============================================================

alter table public.attendance drop constraint if exists attendance_status_check;
alter table public.attendance
  add constraint attendance_status_check
  check (status in ('hadir','izin','sakit','dispen','alpha'));
