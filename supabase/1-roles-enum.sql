-- =============================================================
--  LANGKAH 1 dari 2 — TAMBAH ROLE BARU (WAJIB dijalankan SENDIRI dulu)
--
--  Jalankan file ini SENDIRIAN di SQL Editor, lalu klik RUN.
--  Postgres tidak mengizinkan nilai enum baru dipakai pada transaksi yang
--  sama saat ia ditambahkan. Karena itu penambahan role HARUS di-run terpisah
--  dari file 2-attendance.sql (yang memakai role-role ini di policy).
--
--  Setelah ini sukses, BARU jalankan 2-attendance.sql.
-- =============================================================

alter type public.user_role add value if not exists 'wali_kelas';
alter type public.user_role add value if not exists 'guru_mapel';
alter type public.user_role add value if not exists 'pengatur_kebersihan';
