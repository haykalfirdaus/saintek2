-- =============================================================
--  BATALKAN trigger cleanup foto (11) — Supabase melarang DELETE langsung
--  dari storage.objects. Penghapusan file dipindah ke aplikasi (Storage API).
--  Jalankan di SQL Editor → RUN.
-- =============================================================

drop trigger if exists trg_cleanup_attendance_foto on public.attendance;
drop function if exists public.cleanup_attendance_foto();
-- storage_path_from_url dibiarkan (tidak berbahaya), boleh dihapus jika mau:
-- drop function if exists public.storage_path_from_url(text, text);

-- ---------- Izinkan developer/sekretaris HAPUS foto di bucket attendance ----------
-- (penghapusan file dilakukan aplikasi via Storage API saat ganti/hapus absen)
drop policy if exists "admin delete attendance foto" on storage.objects;
create policy "admin delete attendance foto" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attendance'
    and public.current_role() in ('developer','sekretaris')
  );
