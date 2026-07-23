-- =============================================================
--  Auto-hapus foto surat absensi di Storage saat:
--    - status/foto absen diganti (foto_url berubah atau jadi null), atau
--    - baris absensi dihapus.
--  Mencegah file yatim menumpuk di bucket 'attendance'.
--  Jalankan di SQL Editor → RUN. Aman diulang.
-- =============================================================

-- Ambil path object di dalam bucket dari public URL.
create or replace function public.storage_path_from_url(p_url text, p_bucket text)
returns text language sql immutable as $$
  select case
    when p_url is null then null
    else nullif(split_part(p_url, '/storage/v1/object/public/' || p_bucket || '/', 2), '')
  end;
$$;

-- Trigger function: hapus file lama di bucket 'attendance'.
create or replace function public.cleanup_attendance_foto()
returns trigger language plpgsql security definer set search_path = public, storage as $$
declare old_path text;
begin
  -- UPDATE: hanya jika foto_url berubah (termasuk jadi null).
  if (tg_op = 'UPDATE') then
    if new.foto_url is distinct from old.foto_url and old.foto_url is not null then
      old_path := public.storage_path_from_url(old.foto_url, 'attendance');
      if old_path is not null then
        delete from storage.objects where bucket_id = 'attendance' and name = old_path;
      end if;
    end if;
    return new;
  end if;

  -- DELETE: hapus file jika ada.
  if (tg_op = 'DELETE') then
    if old.foto_url is not null then
      old_path := public.storage_path_from_url(old.foto_url, 'attendance');
      if old_path is not null then
        delete from storage.objects where bucket_id = 'attendance' and name = old_path;
      end if;
    end if;
    return old;
  end if;

  return null;
end $$;

drop trigger if exists trg_cleanup_attendance_foto on public.attendance;
create trigger trg_cleanup_attendance_foto
  after update or delete on public.attendance
  for each row execute function public.cleanup_attendance_foto();
