'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Palmtree } from 'lucide-react'
import { formatTanggalLengkap, getJakartaNow } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

// Real-time date/day header (WIB). Updates every minute.
export function LiveHeader({ mapelHariIni = [], libur = null }) {
  const [now, setNow] = useState(() => getJakartaNow())

  useEffect(() => {
    const id = setInterval(() => setNow(getJakartaNow()), 30_000)
    return () => clearInterval(id)
  }, [])

  const isMinggu = now.dayIndex === 0
  const isLibur = isMinggu || !!libur

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto max-w-md px-4 py-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              XI Saintek 2
            </p>
            <h1 className="mt-0.5 text-lg font-bold leading-tight">
              {now.dayName}
            </h1>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatTanggalLengkap(now.date)}
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="mt-3">
          {isLibur ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground">
              <Palmtree className="h-4 w-4" /> Sedang Libur
              {libur?.keterangan ? ` — ${libur.keterangan}` : isMinggu ? ' (Minggu)' : ''}
            </div>
          ) : (
            <div>
              <p className="section-title mb-1">Mapel Hari Ini</p>
              {mapelHariIni.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {mapelHariIni.map((m, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-card-foreground"
                    >
                      {i + 1}. {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada jadwal.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
