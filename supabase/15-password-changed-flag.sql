-- =============================================================
--  Penanda: siswa sudah mengganti password sendiri.
--  Password asli TIDAK bisa disimpan (di-hash oleh Auth). Kolom ini hanya
--  menandai bahwa password default sudah tidak berlaku lagi.
--  Jalankan di SQL Editor → RUN. Aman diulang.
-- =============================================================

alter table public.student_credentials
  add column if not exists password_changed boolean not null default false;
