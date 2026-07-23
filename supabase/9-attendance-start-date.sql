-- =============================================================
--  Tanggal mulai absensi — absen hanya boleh sejak tanggal ini.
--  Default 2026-07-23. Ubah kapan saja lewat SQL Editor:
--      update public.app_settings set attendance_start = '2026-07-23' where id = 1;
--  Jalankan file ini → RUN. Aman diulang.
-- =============================================================

alter table public.app_settings
  add column if not exists attendance_start date not null default '2026-07-23';

-- ---------- check_in: tolak bila sebelum tanggal mulai ----------
create or replace function public.check_in(p_lat double precision, p_lng double precision)
returns table (ok boolean, distance_m int, message text)
language plpgsql security definer set search_path = public as $$
declare
  s_lat double precision; s_lng double precision; r int; start_d date;
  d double precision; sid uuid; today date;
begin
  sid := public.current_student_id();
  if sid is null then
    return query select false, null::int, 'Akun tidak terhubung ke data siswa.'; return;
  end if;

  select school_lat, school_lng, radius_m, attendance_start
    into s_lat, s_lng, r, start_d
    from public.app_settings where id = 1;

  today := (now() at time zone 'Asia/Makassar')::date;
  if today < start_d then
    return query select false, null::int,
      format('Absensi belum dibuka (mulai %s).', to_char(start_d, 'DD Mon YYYY')); return;
  end if;

  d := 2 * 6371000 * asin(sqrt(
        power(sin(radians(p_lat - s_lat) / 2), 2) +
        cos(radians(s_lat)) * cos(radians(p_lat)) *
        power(sin(radians(p_lng - s_lng) / 2), 2)
      ));

  if d > r then
    return query select false, round(d)::int,
      format('Di luar radius (%s m dari %s m). Absen ditolak.', round(d)::int, r); return;
  end if;

  insert into public.attendance (student_id, tanggal, status, method, lat, lng, distance_m)
  values (sid, today, 'hadir', 'geo', p_lat, p_lng, round(d)::int)
  on conflict (student_id, tanggal) do nothing;

  return query select true, round(d)::int, 'Absen berhasil dicatat.';
end $$;

-- ---------- self_report: tolak bila sebelum tanggal mulai ----------
create or replace function public.self_report(
  p_status text, p_deskripsi text default null, p_foto_url text default null
)
returns table (ok boolean, message text)
language plpgsql security definer set search_path = public as $$
declare sid uuid; today date; start_d date;
begin
  sid := public.current_student_id();
  if sid is null then
    return query select false, 'Akun tidak terhubung ke data siswa.'; return;
  end if;
  if p_status not in ('izin','sakit','dispen') then
    return query select false, 'Status tidak valid.'; return;
  end if;

  select attendance_start into start_d from public.app_settings where id = 1;
  today := (now() at time zone 'Asia/Makassar')::date;
  if today < start_d then
    return query select false,
      format('Absensi belum dibuka (mulai %s).', to_char(start_d, 'DD Mon YYYY')); return;
  end if;

  insert into public.attendance (student_id, tanggal, status, method, deskripsi, foto_url)
  values (sid, today, p_status, 'self', nullif(trim(p_deskripsi),''), nullif(trim(p_foto_url),''))
  on conflict (student_id, tanggal) do nothing;

  if not found then
    return query select false, 'Kamu sudah absen hari ini (terkunci).'; return;
  end if;
  return query select true, 'Berhasil dicatat.';
end $$;
