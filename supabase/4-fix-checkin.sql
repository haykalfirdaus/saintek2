-- =============================================================
--  FIX — bug "unrecognized format() type specifier" saat absen.
--  Postgres format() hanya kenal %s / %I / %L (bukan %.0f gaya C).
--  Jalankan file ini untuk memperbarui fungsi check_in yang sudah ada.
--  Aman dijalankan berulang.
-- =============================================================

create or replace function public.check_in(p_lat double precision, p_lng double precision)
returns table (ok boolean, distance_m int, message text)
language plpgsql security definer set search_path = public as $$
declare
  s_lat double precision; s_lng double precision; r int;
  d double precision; sid uuid; today date;
begin
  sid := public.current_student_id();
  if sid is null then
    return query select false, null::int, 'Akun tidak terhubung ke data siswa.'; return;
  end if;

  select school_lat, school_lng, radius_m into s_lat, s_lng, r
    from public.app_settings where id = 1;

  d := 2 * 6371000 * asin(sqrt(
        power(sin(radians(p_lat - s_lat) / 2), 2) +
        cos(radians(s_lat)) * cos(radians(p_lat)) *
        power(sin(radians(p_lng - s_lng) / 2), 2)
      ));

  if d > r then
    return query select false, round(d)::int,
      format('Di luar radius (%s m dari %s m). Absen ditolak.', round(d)::int, r); return;
  end if;

  today := (now() at time zone 'Asia/Makassar')::date;

  insert into public.attendance (student_id, tanggal, status, method, lat, lng, distance_m)
  values (sid, today, 'hadir', 'geo', p_lat, p_lng, round(d)::int)
  on conflict (student_id, tanggal) do nothing;

  return query select true, round(d)::int, 'Absen berhasil dicatat.';
end $$;
