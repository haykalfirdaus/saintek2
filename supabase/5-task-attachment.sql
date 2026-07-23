-- =============================================================
--  FIX — kolom lampiran di tabel tasks belum ada.
--  Gejala: "Could not find the 'attachment_name' column of 'tasks'".
--  Jalankan file ini di SQL Editor → RUN. Aman dijalankan berulang.
--  (Ini bagian dari upload-rls.sql; dipisah agar mudah dijalankan.)
-- =============================================================

alter table public.tasks
  add column if not exists attachment_url  text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;   -- MIME atau '' untuk URL
