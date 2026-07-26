import { LiveHeader } from '@/components/live-header'
import { AppShell } from '@/components/app-shell'
import { AnnouncementPopup } from '@/components/announcement-popup'
import { GallerySlider } from '@/components/gallery-slider'
import { ZoomableImage } from '@/components/zoomable-image'
import { TaskCard } from '@/components/task-card'
import { RoleBadge } from '@/components/ui-bits'
import { KasReminder } from '@/components/kas-reminder'
import { subjectIcon } from '@/lib/subject-icons'
import { LottieIcon } from '@/components/lottie-icon'
import { getLandingData } from '@/lib/data'
import { formatRupiah } from '@/lib/utils'
import {
  ClipboardList,
  Megaphone,
  Brush,
  Wallet,
  Images,
  ArrowRight,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from 'lucide-react'
import Link from 'next/link'

// ISR: cache halaman & revalidate tiap 30 detik → navigasi instan, data tetap fresh.
export const revalidate = 30

export default async function HomePage() {
  const data = await getLandingData()

  return (
    <AppShell>
      <AnnouncementPopup popup={data.popup} />
      <LiveHeader mapelHariIni={data.mapelHariIni} libur={data.holiday || (data.isLibur ? {} : null)} />

      <KasReminder />

      <main className="app-container pb-nav space-y-6 py-5 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0">
        {/* ===== KOLOM UTAMA (desktop): Aktivitas + Jadwal ===== */}
        <div className="space-y-6 lg:col-span-8">
        {/* ============ SEGMEN: AKTIVITAS PENTING ============ */}
        <section className="ch-rise space-y-3">
          <div className="segment-label">
            <h2>Aktivitas Penting</h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
          {/* PENGUMUMAN */}
          <div className="glass glass-lift p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="icon-chip h-9 w-9">
                  <LottieIcon src="/lottie/bell.json" fallback={Megaphone} className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[15px] font-bold">Pengumuman Kelas</span>
              </span>
            </div>
            {data.pengumuman.length ? (
              <div className="space-y-3">
                {data.pengumuman.map((a) => (
                  <article
                    key={a.id}
                    className="rounded-xl border border-border bg-card/50 p-3.5"
                  >
                    {a.judul && <h3 className="font-semibold">{a.judul}</h3>}
                    <p className="whitespace-pre-wrap text-sm text-card-foreground">{a.isi}</p>
                    {a.dari && (
                      <p className="mt-2 text-xs text-muted-foreground">- {a.dari}</p>
                    )}
                    {a.created_by_role && (
                      <div className="mt-2"><RoleBadge role={a.created_by_role} /></div>
                    )}
                    {Array.isArray(a.media_urls) && a.media_urls.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {a.media_urls.map((u, i) => (
                          <ZoomableImage key={i} src={u} alt="" className="h-28 w-full rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
            )}
          </div>

          {/* TUGAS */}
          <div className="glass p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="icon-chip-accent h-9 w-9">
                  <LottieIcon src="/lottie/check.json" fallback={ClipboardList} className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[15px] font-bold">Daftar Tugas</span>
              </span>
              <Link href="/tugas" className="flex items-center gap-1 text-xs font-bold text-primary">
                Lihat semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {data.tugas.length ? (
              <div className="space-y-3">
                {data.tugas.slice(0, 3).map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada tugas aktif.</p>
            )}
          </div>
          </div>
        </section>

        {/* ============ SEGMEN: JADWAL DAN ROTASI ============ */}
        <section className="ch-rise space-y-3" style={{ animationDelay: '80ms' }}>
          <div className="segment-label">
            <h2>Jadwal dan Rotasi</h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
          {/* JADWAL MAPEL (timeline) */}
          <div className="glass glass-lift p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="icon-chip h-9 w-9">
                  <CalendarDays className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[15px] font-bold">Jadwal Mapel</span>
              </span>
              {!data.isLibur && data.mapelHariIni.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {data.mapelHariIni.length} mapel
                </span>
              )}
            </div>
            {data.isLibur ? (
              <p className="text-sm text-muted-foreground">Libur — tidak ada jadwal.</p>
            ) : data.mapelHariIni.length ? (
              <ol className="relative space-y-1">
                {data.mapelHariIni.map((m, i) => {
                  const Icon = subjectIcon(m)
                  const last = i === data.mapelHariIni.length - 1
                  return (
                    <li key={i} className="relative flex items-center gap-3 py-1.5">
                      {!last && (
                        <span className="absolute left-[17px] top-[38px] h-[calc(100%-20px)] w-0.5 bg-border" />
                      )}
                      <span className="z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/8 text-primary">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {i + 1}.
                        </span>
                        <span className="text-sm font-semibold">{m}</span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada jadwal.</p>
            )}
          </div>

          {/* PIKET */}
          <div className="glass glass-lift p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="icon-chip-accent h-9 w-9">
                <LottieIcon src="/lottie/broom.json" fallback={Brush} className="h-[18px] w-[18px]" />
              </span>
              <span className="text-[15px] font-bold">Piket Hari Ini</span>
            </div>
            {data.isLibur ? (
              <p className="text-sm text-muted-foreground">Libur — tidak ada piket.</p>
            ) : data.piketHariIni.length ? (
              <div className="flex flex-wrap gap-2">
                {data.piketHariIni.map((s) => (
                  <span
                    key={s.no_absen}
                    className="rounded-full border border-accent/30 bg-accent/12 px-3 py-1 text-sm font-medium text-foreground"
                  >
                    {s.nama}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada jadwal piket.</p>
            )}
          </div>
          </div>
        </section>
        </div>

        {/* ===== KOLOM SAMPING (desktop): Kas + Galeri ===== */}
        <div className="space-y-6 lg:col-span-4">
        {/* ============ SEGMEN: KAS & GALERI ============ */}
        <section className="ch-rise space-y-3" style={{ animationDelay: '160ms' }}>
          <div className="segment-label">
            <h2>Kas dan Galeri</h2>
          </div>

          {/* KAS */}
          <div className="glass glass-lift p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="icon-chip h-9 w-9">
                  <Wallet className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[15px] font-bold">Kas Kelas</span>
              </span>
              <Link href="/kas" className="flex items-center gap-1 text-xs font-bold text-primary">
                Detail <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Ringkasan status minggu berjalan */}
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-bold leading-none">{data.kasSummary.sudahLunas}</p>
                  <p className="text-xs text-muted-foreground">Sudah bayar</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/15 text-destructive">
                  <XCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-bold leading-none">{data.kasSummary.belumLunas}</p>
                  <p className="text-xs text-muted-foreground">Belum bayar</p>
                </div>
              </div>
            </div>

            {!data.kasSummary.currentWeek && (
              <p className="mb-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                Kas belum mulai ditagih.
              </p>
            )}

            {data.menunggak.length ? (
              <div className="rounded-xl border border-border bg-card/50">
                <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                  {data.menunggak.map((r) => (
                    <li key={r.student_id} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm">
                        {r.nama} <span className="text-muted-foreground">[{r.no_absen}]</span>
                      </span>
                      <span className="text-sm font-semibold text-destructive">
                        {formatRupiah(r.arrears)}
                      </span>
                    </li>
                  ))}
                </ul>
                {data.menunggak.length > 6 && (
                  <p className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
                    {data.menunggak.length} siswa menunggak — geser untuk lihat semua
                  </p>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" /> Tidak ada tunggakan.
              </p>
            )}
          </div>

          {/* GALERI SINGKAT */}
          <div className="glass glass-lift p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="icon-chip-accent h-9 w-9">
                  <Images className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[15px] font-bold">Galeri Kelas</span>
              </span>
              <Link href="/galeri" className="flex items-center gap-1 text-xs font-bold text-primary">
                Semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <GallerySlider photos={data.galeri.slice(0, 10)} />
          </div>
        </section>
        </div>
      </main>
    </AppShell>
  )
}
