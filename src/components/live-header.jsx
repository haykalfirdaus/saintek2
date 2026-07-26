'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Palmtree, GraduationCap } from 'lucide-react'
import { formatTanggalLengkap, getJakartaNow } from '@/lib/utils'
import { subjectIcon } from '@/lib/subject-icons'
import { MobileDrawer } from './mobile-drawer'

// Real-time date/day header (WITA). Updates every 30s. ClassHub branding.
export function LiveHeader({ mapelHariIni = [], libur = null }) {
  const [now, setNow] = useState(() => getJakartaNow())

  useEffect(() => {
    const id = setInterval(() => setNow(getJakartaNow()), 30_000)
    return () => clearInterval(id)
  }, [])

  const isMinggu = now.dayIndex === 0
  const isLibur = isMinggu || !!libur

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="app-container py-3">
        {/* Brand row — logo hidden on desktop (SideNav already shows it). */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="ch-float grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-elevated">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div className="leading-none">
              <p className="text-[15px] font-extrabold tracking-tight">ClassHub</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                XI Saintek 2 · MAN 2 Mataram
              </p>
            </div>
          </div>
          {/* Desktop: greeting fills the space the logo left. */}
          <p className="hidden text-sm font-semibold text-muted-foreground lg:block">
            Selamat datang di dasbor kelas
          </p>
          {/* Mobile: hamburger opens the nav drawer (theme lives inside it). */}
          <MobileDrawer />
        </div>

        {/* Date */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold leading-tight">{now.dayName}</h1>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatTanggalLengkap(now.date)}
            </p>
          </div>
        </div>

        {/* Mapel hari ini */}
        <div className="mt-3">
          {isLibur ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground">
              <Palmtree className="h-4 w-4" /> Sedang Libur
              {libur?.keterangan ? ` — ${libur.keterangan}` : isMinggu ? ' (Minggu)' : ''}
            </div>
          ) : mapelHariIni.length ? (
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {mapelHariIni.map((m, i) => {
                const Icon = subjectIcon(m)
                return (
                  <span
                    key={i}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-card-foreground shadow-card"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {m}
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada jadwal.</p>
          )}
        </div>
      </div>
    </header>
  )
}
