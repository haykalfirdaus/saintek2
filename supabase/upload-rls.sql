-- =============================================================
--  UPLOAD LANJUTAN — RLS Supabase Storage + kolom lampiran tugas
--  Jalankan di SQL Editor SETELAH schema.sql & storage.sql.
--
--  Aturan hak akses UPLOAD (insert object):
--    HANYA role: developer, sekretaris, ketua  (ketua mencakup Ketua & Wakil).
--    Dikunci di RLS Storage — Bendahara / Wali Kelas / Guru Mapel / Siswa
--    tidak bisa insert walau UI-nya ditembus.
-- =============================================================

-- Helper: apakah user login termasuk role yang boleh upload.
create or replace function public.can_upload()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role() in ('developer','sekretaris','ketua');
$$;

-- -------------------------------------------------------------
--  BUCKET privat khusus dokumen/lampiran admin (opsional tapi rapi).
--  'gallery' tetap boleh upload publik (lihat storage.sql).
--  'tasks' & 'announcements' → hanya role upload di bawah.
-- -------------------------------------------------------------

-- Ganti policy insert lama untuk tasks/announcements: batasi ke can_upload().
drop policy if exists "auth upload tasks ann" on storage.objects;
create policy "upload roles only (tasks/ann)" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('tasks','announcements')
    and public.can_upload()
  );

-- Update/hapus object di tasks/announcements → hanya role upload.
drop policy if exists "admin update objects" on storage.objects;
create policy "upload roles update objects" on storage.objects
  for update to authenticated
  using (public.can_upload())
  with check (public.can_upload());

drop policy if exists "admin delete objects" on storage.objects;
create policy "upload roles delete objects" on storage.objects
  for delete to authenticated
  using (public.can_upload());

-- Catatan: policy "public upload gallery" & "public read gallery" dari
-- storage.sql dibiarkan — galeri memang boleh upload publik tanpa login.

-- =============================================================
--  Kolom lampiran fleksibel di tabel tasks (foto/dokumen/URL).
--  photo_url sudah ada (foto). Tambah metadata dokumen umum.
-- =============================================================
alter table public.tasks
  add column if not exists attachment_url  text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;   -- MIME atau '' untuk URL

-- Guard di level tabel: hanya role upload yang boleh menaruh attachment.
-- (RLS tasks sudah membatasi write ke developer/sekretaris/ketua; ini
--  lapisan tambahan agar bendahara tak menyelipkan lampiran via role lain.)
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
