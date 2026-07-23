-- =============================================================
--  Sekretaris boleh MENGATUR absensi (seperti developer).
--  Jalankan di SQL Editor → RUN. Aman diulang.
--  PRASYARAT: 8-absen-izin-lock.sql sudah dijalankan.
-- =============================================================

-- ---------- RLS: insert/update/delete oleh developer ATAU sekretaris ----------
drop policy if exists "att dev insert" on public.attendance;
create policy "att admin insert" on public.attendance
  for insert to authenticated
  with check (public.current_role() in ('developer','sekretaris'));

drop policy if exists "att dev update" on public.attendance;
create policy "att admin update" on public.attendance
  for update to authenticated
  using (public.current_role() in ('developer','sekretaris'))
  with check (public.current_role() in ('developer','sekretaris'));

drop policy if exists "att dev delete" on public.attendance;
create policy "att admin delete" on public.attendance
  for delete to authenticated
  using (public.current_role() in ('developer','sekretaris'));

-- ---------- RPC set manual: izinkan developer & sekretaris ----------
create or replace function public.dev_set_attendance(
  p_student uuid, p_tanggal date, p_status text
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_role() not in ('developer','sekretaris') then
    raise exception 'Hanya developer / sekretaris yang boleh mengubah absensi';
  end if;
  insert into public.attendance (student_id, tanggal, status, method, lat, lng, distance_m, deskripsi, foto_url)
  values (p_student, p_tanggal, p_status, 'manual', null, null, null, null, null)
  on conflict (student_id, tanggal) do update
    set status = excluded.status,
        method = 'manual',
        lat = null, lng = null, distance_m = null,
        deskripsi = null, foto_url = null;
end $$;
