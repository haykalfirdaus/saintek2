import { LiveHeader } from '@/components/live-header'
import { BottomNav } from '@/components/bottom-nav'
import { AnnouncementPopup } from '@/components/announcement-popup'
import { GallerySlider } from '@/components/gallery-slider'
import { ZoomableImage } from '@/components/zoomable-image'
import { TaskCard } from '@/components/task-card'
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
} from 'lucide-react'
import Link from 'next/link'

// ISR: cache halaman & revalidate tiap 30 detik → navigasi instan, data tetap fresh.
export const revalidate = 30

export default async function HomePage() {
  const data = await getLandingData()

  return (
    <div className="pb-nav mx-auto min-h-dvh max-w-md">
      <AnnouncementPopup popup={data.popup} />
      <LiveHeader mapelHariIni={data.mapelHariIni} libur={data.holiday || (data.isLibur ? {} : null)} />

      <main className="space-y-6 px-4 py-5">
        {/* TUGAS */}
        <section>
          <div className="section-title justify-between">
            <span className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Tugas Aktif
            </span>
            <Link href="/tugas" className="text-primary">Lihat semua</Link>
          </div>
          {data.tugas.length ? (
            <div className="space-y-3">
              {data.tugas.slice(0, 3).map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <p className="card p-4 text-sm text-muted-foreground">Tidak ada tugas aktif.</p>
          )}
        </section>

        {/* PENGUMUMAN */}
        <section>
          <div className="section-title">
            <Megaphone className="h-4 w-4" /> Pengumuman
          </div>
          {data.pengumuman.length ? (
            <div className="space-y-3">
              {data.pengumuman.map((a) => (
                <article key={a.id} className="card p-4">
                  {a.judul && <h3 className="font-semibold">{a.judul}</h3>}
                  <p className="whitespace-pre-wrap text-sm text-card-foreground">{a.isi}</p>
                  {a.dari && (
                    <p className="mt-2 text-xs text-muted-foreground">— {a.dari}</p>
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
            <p className="card p-4 text-sm text-muted-foreground">Belum ada pengumuman.</p>
          )}
        </section>

        {/* PIKET */}
        <section>
          <div className="section-title">
            <Brush className="h-4 w-4" /> Piket Hari Ini
          </div>
          {data.isLibur ? (
            <p className="card p-4 text-sm text-muted-foreground">Libur — tidak ada piket.</p>
          ) : data.piketHariIni.length ? (
            <div className="card flex flex-wrap gap-2 p-4">
              {data.piketHariIni.map((s) => (
                <span key={s.no_absen} className="rounded-md bg-muted px-2 py-1 text-sm">
                  {s.nama}
                </span>
              ))}
            </div>
          ) : (
            <p className="card p-4 text-sm text-muted-foreground">Belum ada jadwal piket.</p>
          )}
        </section>

        {/* KAS */}
        <section>
          <div className="section-title justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Kas Kelas
            </span>
            <Link href="/kas" className="text-primary">Detail</Link>
          </div>

          {/* Ringkasan status minggu berjalan */}
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="card flex items-center gap-3 p-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold leading-none">{data.kasSummary.sudahLunas}</p>
                <p className="text-xs text-muted-foreground">Sudah bayar</p>
              </div>
            </div>
            <div className="card flex items-center gap-3 p-3">
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
            <div className="card">
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
            <p className="card flex items-center gap-2 p-4 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Tidak ada tunggakan.
            </p>
          )}
        </section>

        {/* GALERI SINGKAT */}
        <section>
          <div className="section-title justify-between">
            <span className="flex items-center gap-2">
              <Images className="h-4 w-4" /> Galeri Kelas
            </span>
            <Link href="/galeri" className="flex items-center gap-1 text-primary">
              Semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <GallerySlider photos={data.galeri.slice(0, 10)} />
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
