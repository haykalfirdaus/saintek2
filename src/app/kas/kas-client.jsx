'use client'

import { useMemo, useState } from 'react'
import { formatRupiah } from '@/lib/utils'
import { cn } from '@/lib/utils'

const FILTERS = [
  { key: 'belum', label: 'Belum Bayar' },
  { key: 'sudah', label: 'Sudah Bayar' },
  { key: 'semua', label: 'Semua' },
]

// Kas status with filter. "Belum" sorted by largest arrears (RPC already sorts).
export function KasClient({ rows }) {
  const [filter, setFilter] = useState('belum')

  const list = useMemo(() => {
    if (filter === 'belum') return rows.filter((r) => r.arrears > 0)
    if (filter === 'sudah') return rows.filter((r) => r.arrears === 0)
    return rows
  }, [rows, filter])

  const totalTunggakan = rows.reduce((s, r) => s + (r.arrears || 0), 0)

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="text-sm text-muted-foreground">Total tunggakan kelas</p>
        <p className="text-2xl font-bold text-destructive">{formatRupiah(totalTunggakan)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Aturan: Rp5.000 / minggu, ditagih tiap Kamis.
        </p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'tap-target flex-1 rounded-lg border px-2 text-sm font-medium transition',
              filter === f.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length ? (
        <ul className="card divide-y divide-border">
          {list.map((r) => (
            <li key={r.student_id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">
                {r.nama} <span className="text-muted-foreground">[{r.no_absen}]</span>
              </span>
              {r.arrears > 0 ? (
                <span className="text-sm font-semibold text-destructive">
                  {formatRupiah(r.arrears)}
                </span>
              ) : (
                <span className="rounded-md bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                  Lunas
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="card p-4 text-center text-sm text-muted-foreground">Tidak ada data.</p>
      )}
    </div>
  )
}
