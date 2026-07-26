-- =============================================================
--  Absensi admin (developer/sekretaris) juga libur hari Minggu.
--  dev_set_attendance menolak bila tanggal target jatuh di Minggu,
--  supaya tidak bisa ditembus lewat panggilan langsung, bukan cuma UI.
--
--  extract(dow from p_tanggal): 0 = Minggu, 1 = Senin, ... 6 = Sabtu.
--
--  Jalankan di Supabase SQL Editor → RUN. Aman diulang.
--  PRASYARAT: 10-sekretaris-absen.sql sudah dijalankan.
-- =============================================================

create or replace function public.dev_set_attendance(
  p_student uuid, p_tanggal date, p_status text
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_role() not in ('developer','sekretaris') then
    raise exception 'Hanya developer / sekretaris yang boleh mengubah absensi';
  end if;
  if extract(dow from p_tanggal) = 0 then
    raise exception 'Absensi libur hari Minggu. Hanya Senin sampai Sabtu.';
  end if;
  insert into public.attendance (student_id, tanggal, status, method, lat, lng, distance_m, deskripsi, foto_url)
  values (p_student, p_tanggal, p_status, 'manual', null, null, null, null, null)
  on conflict (student_id, tanggal) do update
    set status = excluded.status,
        method = 'manual',
        lat = null, lng = null, distance_m = null,
        deskripsi = null, foto_url = null;
end $$;
