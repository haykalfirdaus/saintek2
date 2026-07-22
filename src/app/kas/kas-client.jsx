'use client'

import { useMemo, useState } from 'react'
import { formatRupiah, cn } from '@/lib/utils'
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'

const FILTERS = [
  { key: 'belum', label: 'Belum Bayar' },
  { key: 'sudah', label: 'Sudah Bayar' },
  { key: 'semua', label: 'Semua' },
]

function tglLabel(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Kas status: nama disembunyikan sampai ditekan "Lihat Daftar".
// Filter Sudah/Belum berdasarkan MINGGU BERJALAN (Kamis terkini), bukan total.
// Tiap orang punya "Selengkapnya" → rincian minggu ke berapa + tanggal bayar.
export function KasClient({ rows, payments = {}, currentWeek = null }) {
  const [filter, setFilter] = useState('belum')
  const [show, setShow] = useState(false)     // daftar disembunyikan default
  const [openId, setOpenId] = useState(null)   // detail per siswa

  // sudah bayar utk minggu berjalan?
  function paidThisWeek(studentId) {
    if (!currentWeek) return false
    return (payments[studentId] || []).some((d) => d.week_date === currentWeek)
  }

  const list = useMemo(() => {
    // Kalau kas belum mulai (belum ada Kamis tagihan), status pakai minggu berjalan.
    if (filter === 'belum') return rows.filter((r) => !paidThisWeek(r.student_id))
    if (filter === 'sudah') return rows.filter((r) => paidThisWeek(r.student_id))
    return rows
  }, [rows, filter, currentWeek, payments])

  const totalTunggakan = rows.reduce((s, r) => s + (r.arrears || 0), 0)

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="text-sm text-muted-foreground">Total tunggakan kelas</p>
        <p className="text-2xl font-bold text-destructive">{formatRupiah(totalTunggakan)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Aturan: Rp5.000 / minggu, ditagih tiap Kamis.
        </p>
        <p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          {currentWeek
            ? `Status "Sudah/Belum" untuk minggu ini: Kamis, ${tglLabel(currentWeek)}`
            : 'Kas belum mulai ditagih (belum ada Kamis sejak tanggal mulai).'}
        </p>
      </div>

      {/* Tombol tampilkan/sembunyikan daftar */}
      <button
        className="btn-ghost w-full"
        onClick={() => { setShow((v) => !v); setOpenId(null) }}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {show ? 'Sembunyikan Daftar' : 'Lihat Daftar Kas'}
      </button>

      {show && (
        <>
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
              {list.map((r) => {
                const detail = payments[r.student_id] || []
                const open = openId === r.student_id
                return (
                  <li key={r.student_id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">
                        {r.nama} <span className="text-muted-foreground">[{r.no_absen}]</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {currentWeek && (
                          paidThisWeek(r.student_id) ? (
                            <span className="rounded-md bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">Sudah</span>
                          ) : (
                            <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">Belum</span>
                          )
                        )}
                        {r.arrears > 0 && (
                          <span className="text-sm font-semibold text-destructive">{formatRupiah(r.arrears)}</span>
                        )}
                        <button
                          onClick={() => setOpenId(open ? null : r.student_id)}
                          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                          aria-label="Selengkapnya"
                        >
                          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">
                        <p className="mb-1 font-medium">
                          Sudah bayar {detail.length} minggu
                          {detail.length > 0 && ` (total ${formatRupiah(detail.reduce((s, d) => s + (d.amount || 5000), 0))})`}
                        </p>
                        {detail.length ? (
                          <ol className="space-y-1">
                            {detail.map((d, i) => (
                              <li key={d.week_date} className="flex justify-between text-muted-foreground">
                                <span>Minggu ke-{i + 1} — {tglLabel(d.week_date)}</span>
                                <span>{formatRupiah(d.amount || 5000)}</span>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-muted-foreground">Belum ada pembayaran tercatat.</p>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="card p-4 text-center text-sm text-muted-foreground">Tidak ada data.</p>
          )}
        </>
      )}
    </div>
  )
}
