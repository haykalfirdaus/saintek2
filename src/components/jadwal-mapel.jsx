'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { subjectIcon } from '@/lib/subject-icons'
import { WEEKDAY_KEYS, getJakartaNow, dayKeyFromIndex } from '@/lib/utils'

const LABEL = { senin: 'Sen', selasa: 'Sel', rabu: 'Rab', kamis: 'Kam', jumat: 'Jum', sabtu: 'Sab' }

/*
  Jadwal mapel dengan pemilih hari (Sen–Sab). Default ke hari ini; kalau hari ini
  Minggu/libur, jatuh ke Senin. Data semua hari sudah diambil server-side
  (mapelPerHari), jadi ganti hari tidak perlu fetch ulang.
*/
export function JadwalMapel({ mapelPerHari = {} }) {
  const todayKey = dayKeyFromIndex(getJakartaNow().dayIndex) // null pada Minggu
  const [active, setActive] = useState(todayKey || 'senin')

  const items = mapelPerHari[active] ?? []

  return (
    <div className="glass glass-lift p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span className="icon-chip h-9 w-9">
            <CalendarDays className="h-[18px] w-[18px]" />
          </span>
          <span className="text-[15px] font-bold">Jadwal Mapel</span>
        </span>
        {items.length > 0 && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {items.length} mapel
          </span>
        )}
      </div>

      {/* Pemilih hari */}
      <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {WEEKDAY_KEYS.map((day) => {
          const isActive = day === active
          const isToday = day === todayKey
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActive(day)}
              aria-pressed={isActive}
              className={
                'relative shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ' +
                (isActive
                  ? 'bg-primary text-primary-foreground shadow-card'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground')
              }
            >
              {LABEL[day]}
              {isToday && (
                <span
                  className={
                    'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-background ' +
                    (isActive ? 'bg-primary-foreground' : 'bg-primary')
                  }
                  aria-label="hari ini"
                />
              )}
            </button>
          )
        })}
      </div>

      {items.length ? (
        <ol className="relative space-y-1">
          {items.map((m, i) => {
            const Icon = subjectIcon(m)
            const last = i === items.length - 1
            return (
              <li key={i} className="relative flex items-center gap-3 py-1.5">
                {!last && (
                  <span className="absolute left-[17px] top-[38px] h-[calc(100%-20px)] w-0.5 bg-border" />
                )}
                <span className="z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/8 text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground">{i + 1}.</span>
                  <span className="text-sm font-semibold">{m}</span>
                </span>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada jadwal untuk hari ini.</p>
      )}
    </div>
  )
}
