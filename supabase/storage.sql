-- =============================================================
--  STORAGE BUCKETS & POLICIES
--  Jalankan di SQL Editor SETELAH schema.sql.
--  Buckets:
--    - gallery : foto galeri kelas (publik boleh upload tanpa login)
--    - tasks   : foto lampiran tugas (admin)
--    - announcements : media pengumuman (admin)
-- =============================================================

insert into storage.buckets (id, name, public)
values
  ('gallery', 'gallery', true),
  ('tasks', 'tasks', true),
  ('announcements', 'announcements', true)
on conflict (id) do nothing;

-- ---------- Baca publik untuk semua bucket ----------
drop policy if exists "public read gallery" on storage.objects;
create policy "public read gallery" on storage.objects
  for select using (bucket_id in ('gallery','tasks','announcements'));

-- ---------- GALLERY: publik boleh upload (tanpa login) ----------
-- Batasi ke bucket gallery + folder 'public/' agar terkontrol.
drop policy if exists "public upload gallery" on storage.objects;
create policy "public upload gallery" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'gallery');

-- ---------- TASKS & ANNOUNCEMENTS: hanya user login (admin) ----------
drop policy if exists "auth upload tasks ann" on storage.objects;
create policy "auth upload tasks ann" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('tasks','announcements'));

-- ---------- Admin boleh update/hapus semua object ----------
drop policy if exists "admin update objects" on storage.objects;
create policy "admin update objects" on storage.objects
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin delete objects" on storage.objects;
create policy "admin delete objects" on storage.objects
  for delete to authenticated using (public.is_admin());
