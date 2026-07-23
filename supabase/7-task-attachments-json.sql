-- =============================================================
--  Kolom multi-lampiran untuk tugas (foto + dokumen + URL sekaligus).
--  Jalankan di SQL Editor → RUN. Aman diulang.
-- =============================================================

alter table public.tasks
  add column if not exists attachments jsonb not null default '[]'::jsonb;
