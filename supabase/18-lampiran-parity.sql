-- =============================================================
--  LAMPIRAN PARITY — samakan lampiran Pengumuman/Popup dengan Tugas,
--  dan izinkan Guru Mapel mengunggah lampiran.
--  Jalankan di Supabase SQL Editor → RUN. Aman diulang.
-- =============================================================

-- 1) Kolom multi-lampiran untuk announcements (mirror pola tasks.attachments).
--    Sumber kebenaran baru; media_urls[] tetap diisi utk kompat pembaca lama.
alter table public.announcements
  add column if not exists attachments jsonb not null default '[]'::jsonb;

-- 2) Izinkan guru_mapel mengunggah lampiran.
--    can_upload() dipakai oleh:
--      - Storage RLS insert/update/delete bucket tasks/announcements (upload-rls.sql)
--      - trigger guard_task_attachment pada tabel tasks
--    Tanpa perubahan ini, upload lampiran tugas oleh guru_mapel akan gagal di
--    Storage RLS DAN insert/update tugas ditolak trigger.
create or replace function public.can_upload()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role() in ('developer','sekretaris','ketua','guru_mapel');
$$;
