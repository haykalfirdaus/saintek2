-- =============================================================
--  Simpan ROLE pembuat pada tugas & pengumuman, lalu tampilkan di publik.
--  Pakai kolom denormalisasi `created_by_role` yang diisi trigger dari
--  profiles saat insert — supaya anon (publik) bisa baca tanpa akses profiles.
--  Jalankan di SQL Editor → RUN. Aman diulang.
-- =============================================================

alter table public.tasks
  add column if not exists created_by_role public.user_role;
alter table public.announcements
  add column if not exists created_by_role public.user_role;

-- Trigger: saat insert, isi created_by = auth.uid() (kalau kosong) dan
-- created_by_role = role pembuat dari profiles.
create or replace function public.set_creator_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  select role into new.created_by_role
    from public.profiles where id = coalesce(new.created_by, auth.uid());
  return new;
end $$;

drop trigger if exists trg_tasks_creator on public.tasks;
create trigger trg_tasks_creator
  before insert on public.tasks
  for each row execute function public.set_creator_role();

drop trigger if exists trg_ann_creator on public.announcements;
create trigger trg_ann_creator
  before insert on public.announcements
  for each row execute function public.set_creator_role();
