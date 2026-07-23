'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast } from '@/components/ui-bits'
import { exportToExcel } from '@/lib/export-excel'
import {
  CalendarCheck, ChevronLeft, ChevronRight, Download, Loader2,
  Users, Trash2, X,
} from 'lucide-react'

// Label & warna status.
const STATUS = {
  hadir: { label: 'Hadir', cls: 'bg-success/15 text-success' },
  izin: { label: 'Izin', cls: 'bg-primary/15 text-primary' },
  sakit: { label: 'Sakit', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  dispen: { label: 'Dispen', cls: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  alpha: { label: 'Alpha', cls: 'bg-destructive/15 text-destructive' },
}
const STATUS_KEYS = ['hadir', 'izin', 'sakit', 'dispen', 'alpha']

// ---- Date helpers (WITA-agnostic; pakai tanggal lokal browser) ----
function iso(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function startOfWeek(d) {
  // Senin sebagai awal minggu.
  const x = new Date(d); const dow = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function fmtTanggal(isoStr) {
  return new Date(isoStr + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
}
const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// Rekap absensi: Hari Ini / Mingguan / Bulanan + navigasi + export.
export function PanelAbsensi({ role, readOnly }) {
  const supabase = createClient()
  const [mode, setMode] = useState('hari') // 'hari' | 'minggu' | 'bulan'
  const [anchor, setAnchor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  const [rows, setRows] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 2500) }

  // Rentang tanggal aktif berdasarkan mode + anchor.
  const range = useMemo(() => {
    if (mode === 'hari') return { from: iso(anchor), to: iso(anchor) }
    if (mode === 'minggu') {
      const s = startOfWeek(anchor)
      return { from: iso(s), to: iso(addDays(s, 6)) }
    }
    // bulan
    const s = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const e = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    return { from: iso(s), to: iso(e) }
  }, [mode, anchor])

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('attendance_range', { p_from: range.from, p_to: range.to })
    if (error) notify(error.message, 'error')
    setRows(data ?? [])
    setLoading(false)
  }, [range.from, range.to])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    supabase.from('students').select('id, nama, no_absen').order('no_absen').then(({ data }) => setStudents(data ?? []))
  }, [])

  // Navigasi prev/next sesuai mode.
  function shift(dir) {
    setAnchor((a) => {
      if (mode === 'hari') return addDays(a, dir)
      if (mode === 'minggu') return addDays(a, dir * 7)
      return new Date(a.getFullYear(), a.getMonth() + dir, 1)
    })
  }

  // Set/ubah status manual utk tanggal tertentu (mode hari).
  async function setStatus(studentId, tanggal, status) {
    const { error } = await supabase.from('attendance')
      .upsert({ student_id: studentId, tanggal, status, method: 'manual' }, { onConflict: 'student_id,tanggal' })
    if (error) return notify(error.message, 'error')
    load()
  }

  // Hapus catatan absen (via id, atau via student+tanggal di mode hari).
  async function removeById(id) {
    const { error } = await supabase.from('attendance').delete().eq('id', id)
    if (error) return notify(error.message, 'error')
    notify('Data absen dihapus'); load()
  }
  async function removeByStudent(studentId, tanggal) {
    const { error } = await supabase.from('attendance')
      .delete().eq('student_id', studentId).eq('tanggal', tanggal)
    if (error) return notify(error.message, 'error')
    notify('Data absen dihapus'); load()
  }

  // ---- Ringkasan status ----
  const summary = useMemo(() => {
    const s = Object.fromEntries(STATUS_KEYS.map((k) => [k, 0]))
    for (const r of rows) if (s[r.status] != null) s[r.status]++
    return s
  }, [rows])

  // ---- Export ----
  function doExport() {
    if (!rows.length) return notify('Tidak ada data untuk diexport.', 'error')
    const labelRange = mode === 'hari' ? fmtTanggal(range.from)
      : mode === 'minggu' ? `${fmtTanggal(range.from)} – ${fmtTanggal(range.to)}`
        : `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
    exportToExcel({
      filename: `absensi-${range.from}_${range.to}`,
      sheetName: 'Absensi',
      title: `Absensi XI Saintek 2 — ${labelRange}`,
      columns: [
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'no_absen', label: 'No' },
        { key: 'nama', label: 'Nama' },
        { key: 'status', label: 'Status', format: (v) => STATUS[v]?.label || v },
        { key: 'method', label: 'Metode' },
        { key: 'distance_m', label: 'Jarak (m)' },
      ],
      rows,
    })
  }

  // Peta absensi hari ini (mode hari) utk input manual per siswa.
  const todayMap = useMemo(() => {
    const m = new Map()
    for (const r of rows) m.set(r.student_id, r)
    return m
  }, [rows])

  const headerLabel = mode === 'hari' ? fmtTanggal(range.from)
    : mode === 'minggu' ? `${fmtTanggal(range.from)} – ${fmtTanggal(range.to)}`
      : `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`

  return (
    <div>
      <PanelHeader title="Absensi" desc="Rekap kehadiran harian, mingguan & bulanan." />
      <Toast {...(toast || {})} />

      {/* Mode switch */}
      <div className="mb-3 flex gap-2">
        {[['hari', 'Hari Ini'], ['minggu', 'Mingguan'], ['bulan', 'Bulanan']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className={
              'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ' +
              (mode === k ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted')
            }
          >
            {l}
          </button>
        ))}
      </div>

      {/* Navigasi rentang */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <button className="btn-ghost h-10 px-3" onClick={() => shift(-1)} aria-label="Sebelumnya">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="flex items-center gap-2 text-sm font-semibold">
          <CalendarCheck className="h-4 w-4 text-primary" /> {headerLabel}
        </span>
        <button className="btn-ghost h-10 px-3" onClick={() => shift(1)} aria-label="Berikutnya">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Ringkasan + export */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_KEYS.map((k) => (
          <span key={k} className={`rounded-md px-2 py-1 text-xs font-semibold ${STATUS[k].cls}`}>
            {STATUS[k].label}: {summary[k]}
          </span>
        ))}
        <button className="btn-ghost ml-auto h-10 px-3 text-sm" onClick={doExport}>
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : mode === 'hari' ? (
        /* MODE HARI: daftar semua siswa + tombol set status (jika bukan read-only) */
        <div className="card divide-y divide-border">
          {students.map((s) => {
            const rec = todayMap.get(s.id)
            return (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2">
                <span className="w-7 shrink-0 text-xs text-muted-foreground">{s.no_absen}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{s.nama}</span>
                {readOnly ? (
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${rec ? STATUS[rec.status].cls : 'bg-muted text-muted-foreground'}`}>
                    {rec ? STATUS[rec.status].label : '—'}
                  </span>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    {STATUS_KEYS.map((k) => (
                      <button
                        key={k}
                        onClick={() => setStatus(s.id, range.from, k)}
                        className={
                          'rounded px-1.5 py-1 text-[10px] font-semibold transition ' +
                          (rec?.status === k ? STATUS[k].cls + ' ring-1 ring-current' : 'bg-muted text-muted-foreground hover:bg-muted/70')
                        }
                        title={STATUS[k].label}
                      >
                        {STATUS[k].label[0]}
                      </button>
                    ))}
                    {/* Hapus data absen siswa ini utk tanggal terpilih */}
                    <button
                      onClick={() => rec && removeByStudent(s.id, range.from)}
                      disabled={!rec}
                      className="ml-0.5 grid h-7 w-7 place-items-center rounded text-destructive transition hover:bg-destructive/10 disabled:opacity-30"
                      title="Hapus absen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {!students.length && <p className="px-4 py-3 text-sm text-muted-foreground">Belum ada siswa.</p>}
        </div>
      ) : (
        /* MODE MINGGU / BULAN: daftar catatan absensi dalam rentang */
        rows.length ? (
          <div className="card divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-2 px-3 py-2">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{fmtTanggal(r.tanggal)}</span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {r.nama} <span className="text-muted-foreground">[{r.no_absen}]</span>
                </span>
                {r.distance_m != null && <span className="shrink-0 text-[11px] text-muted-foreground">{r.distance_m} m</span>}
                <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${STATUS[r.status]?.cls}`}>
                  {STATUS[r.status]?.label || r.status}
                </span>
                {!readOnly && (
                  <button
                    onClick={() => removeById(r.id)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded text-destructive transition hover:bg-destructive/10"
                    title="Hapus absen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card grid place-items-center gap-2 py-10 text-muted-foreground">
            <Users className="h-7 w-7" />
            <span className="text-sm">Tidak ada absensi pada rentang ini.</span>
          </div>
        )
      )}
    </div>
  )
}
