# XI Saintek 2 — Website Kelas

Website kelas mobile-first: tugas, kas, piket, jadwal mapel, galeri, pengumuman, dan admin panel 4-role.

**Stack:** Next.js (App Router) · Tailwind CSS · Supabase (PostgreSQL + Auth + Storage) · Deploy Vercel.

---

## ✨ Fitur
- **Landing:** popup pengumuman ("Okeii Noted"), tanggal & mapel real-time (auto deteksi hari), tugas, pengumuman, piket, kas menunggak, galeri singkat + upload publik.
- **Bottom nav** fixed (thumb-zone): Home · Tugas · Kas · Galeri.
- **Halaman Kas:** filter Belum / Sudah / Semua, urut tunggakan terbesar. Aturan Rp5.000/minggu tiap Kamis.
- **Galeri:** 10 foto slideshow auto-swipe + 4 foto frame statis (14 total).
- **Dark / Light mode** penuh (semua token warna, border, shadow, card).
- **4 Role admin:** Developer · Sekretaris · Bendahara · Ketua/Wakil.

---

## 1) Setup Lokal

```bash
# 1. Install dependencies
npm install

# 2. Siapkan environment
cp .env.example .env.local
#   lalu isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#   dan SUPABASE_SERVICE_ROLE_KEY (lihat langkah 2 di bawah).

# 3. Jalankan
npm run dev          # http://localhost:3000
```

---

## 2) Setup Supabase

1. Buat project di <https://supabase.com> → **New Project**.
2. **SQL Editor** → tempel & jalankan `supabase/schema.sql` (tables, roles, RLS, functions).
3. **SQL Editor** → jalankan `supabase/storage.sql` (buckets `gallery`, `tasks`, `announcements` + policy).
4. **Project Settings → API** → salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ rahasia, server-only).
5. **Buat akun Developer pertama** (Authentication → Users → Add user, centang *Auto Confirm*).
   Lalu di SQL Editor, jadikan developer:
   ```sql
   update public.profiles set role = 'developer'
   where id = (select id from auth.users where email = 'EMAIL_KAMU');
   ```
   Setelah itu, akun Sekretaris/Bendahara/Ketua bisa dibuat dari **Panel Akun** di web.
6. **Set tanggal mulai kas** (opsional, default hari ini):
   ```sql
   update public.kas_settings set start_date = '2025-07-01' where id = 1;
   ```

### Catatan RLS & Keamanan
- Semua tabel **RLS aktif**. Baca publik untuk data yang tampil di landing; tulis hanya untuk role terkait.
- Popup besar hanya bisa dibuat **developer** (dijaga trigger DB).
- Ganti password admin dilakukan lewat route server `/api/admin/accounts` memakai **service-role key** (tidak pernah ke browser).

---

## 3) Cleanup sebelum Deploy

```bash
npm run cleanup      # hapus .next, cache, boilerplate — aman, tidak sentuh source/.claude
```

---

## 4) Deploy: GitHub → Vercel

```bash
git init
git add .
git commit -m "init: website XI Saintek 2"
git branch -M main
git remote add origin https://github.com/USERNAME/xi-saintek-2.git
git push -u origin main
```

Di **Vercel**:
1. **Add New → Project** → import repo GitHub.
2. Framework otomatis terdeteksi **Next.js**.
3. **Environment Variables** → tambahkan (Production + Preview):
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
4. **Deploy.** Selesai — tiap `git push` ke `main` auto-deploy.

> Tambahan: di Supabase **Authentication → URL Configuration**, set **Site URL** ke domain Vercel kamu.

---

## Struktur Folder
```
src/
├─ app/
│  ├─ page.jsx                # Landing
│  ├─ tugas/ kas/ galeri/     # Halaman publik + bottom nav
│  ├─ admin/                  # Login, dashboard, panels/, actions
│  └─ api/admin/accounts/     # Route service-role (ganti password)
├─ components/                # bottom-nav, gallery-slider, popup, theme, dll
├─ lib/
│  ├─ supabase/               # client, server, admin, middleware
│  ├─ utils.js roles.js data.js upload.js
├─ proxy.js                   # session refresh + guard /admin (Next 16 proxy)
supabase/
├─ schema.sql  storage.sql    # jalankan di SQL Editor
scripts/cleanup.mjs
```

## Perintah
| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Dev server |
| `npm run build` | Build produksi |
| `npm start` | Jalankan hasil build |
| `npm run cleanup` | Bersihkan artefak sebelum deploy |
