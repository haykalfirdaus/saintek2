'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast } from '@/components/ui-bits'
import { formatRupiah, toISODate } from '@/lib/utils'

// UI Absensi Kas: checkbox per siswa per minggu (Kamis). Rekap 1 bulan terakhir.
export function PanelKas() {
  const supabase = createClient()
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState({}) // `${student_id}|${week}` -> true
  const [weeks, setWeeks] = useState([])
  const [activeWeek, setActiveWeek] = useState('')
  const [toast, setToast] = useState(null)

  const [activeMonth, setActiveMonth] = useState('') // 'YYYY-MM'

  // Semua Kamis dari start_date s/d 6 bulan ke depan. Tiap item diberi nomor
  // minggu yang RESET tiap bulan (Minggu ke-1, ke-2, ...) + label bulan.
  function buildWeeks(startISO) {
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    today.setHours(0, 0, 0, 0)
    const start = new Date((startISO || toISODate(today)) + 'T00:00:00')
    // batas akhir = 6 bulan setelah start
    const end = new Date(start)
    end.setMonth(end.getMonth() + 6)

    const cur = new Date(start)
    while (cur.getDay() !== 4) cur.setDate(cur.getDate() + 1) // Kamis pertama

    const list = []
    const perMonthCount = {} // 'YYYY-MM' -> nomor minggu berjalan
    while (cur <= end) {
      const monthKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
      perMonthCount[monthKey] = (perMonthCount[monthKey] || 0) + 1
      list.push({
        date: toISODate(cur),
        monthKey,
        weekNo: perMonthCount[monthKey], // reset tiap bulan
      })
      cur.setDate(cur.getDate() + 7)
    }
    return list
  }

  async function load() {
    const [{ data: st }, { data: pay }, { data: setting }] = await Promise.all([
      supabase.from('students').select('*').order('no_absen'),
      supabase.from('kas_payments').select('*').eq('paid', true),
      supabase.from('kas_settings').select('start_date').eq('id', 1).maybeSingle(),
    ])
    setStudents(st ?? [])
    const map = {}
    ;(pay ?? []).forEach((p) => { map[`${p.student_id}|${p.week_date}`] = true })
    setPayments(map)

    const list = buildWeeks(setting?.start_date)
    setWeeks(list)

    // default: bulan berjalan kalau ada, kalau tidak bulan pertama
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    const nowKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const months = [...new Set(list.map((w) => w.monthKey))]
    const initialMonth = months.includes(nowKey) ? nowKey : months[0]
    setActiveMonth((prev) => (prev && months.includes(prev) ? prev : initialMonth))

    const inMonth = list.filter((w) => w.monthKey === (activeMonth || initialMonth))
    setActiveWeek((prev) =>
      prev && inMonth.some((w) => w.date === prev) ? prev : inMonth[0]?.date || ''
    )
  }
  useEffect(() => { load() }, [])

  // daftar bulan unik + minggu untuk bulan yang aktif
  const months = useMemo(() => [...new Set(weeks.map((w) => w.monthKey))], [weeks])
  const weeksInMonth = useMemo(
    () => weeks.filter((w) => w.monthKey === activeMonth),
    [weeks, activeMonth]
  )

  function monthLabel(key) {
    if (!key) return ''
    const [y, m] = key.split('-')
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('id-ID', {
      month: 'long', year: 'numeric',
    })
  }

  // saat ganti bulan, pilih minggu pertama bulan itu
  function selectMonth(key) {
    setActiveMonth(key)
    const first = weeks.find((w) => w.monthKey === key)
    if (first) setActiveWeek(first.date)
  }

  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 1500) }

  // Urutan kronologis semua Kamis (ascending) — buildWeeks sudah urut naik.
  const allWeekDates = useMemo(() => weeks.map((w) => w.date), [weeks])

  // Aturan bayar berurutan PER SISWA:
  // - boleh centang minggu ini hanya jika minggu sebelumnya (siswa itu) sudah lunas
  // - boleh batal centang hanya jika minggu sesudahnya belum lunas (cegah bolong)
  function lockInfo(studentId, weekDate) {
    const idx = allWeekDates.indexOf(weekDate)
    const prevDate = idx > 0 ? allWeekDates[idx - 1] : null
    const nextDate = idx < allWeekDates.length - 1 ? allWeekDates[idx + 1] : null
    const prevPaid = prevDate ? !!payments[`${studentId}|${prevDate}`] : true
    const nextPaid = nextDate ? !!payments[`${studentId}|${nextDate}`] : false
    return { prevPaid, nextPaid }
  }

  async function toggle(studentId, checked) {
    const { prevPaid, nextPaid } = lockInfo(studentId, activeWeek)
    if (checked && !prevPaid) {
      return notify('Bayar minggu sebelumnya dulu untuk siswa ini.', 'error')
    }
    if (!checked && nextPaid) {
      return notify('Batalkan centang minggu setelahnya dulu.', 'error')
    }
    const key = `${studentId}|${activeWeek}`
    setPayments((m) => ({ ...m, [key]: checked })) // optimistic
    if (checked) {
      const { error } = await supabase.from('kas_payments')
        .upsert({ student_id: studentId, week_date: activeWeek, paid: true, amount: 5000 },
          { onConflict: 'student_id,week_date' })
      if (error) notify(error.message, 'error')
    } else {
      const { error } = await supabase.from('kas_payments')
        .delete().eq('student_id', studentId).eq('week_date', activeWeek)
      if (error) notify(error.message, 'error')
    }
  }

  // Rekap bulan aktif: total terkumpul dari semua minggu di bulan yang dipilih.
  const rekap = useMemo(() => {
    let total = 0
    for (const w of weeksInMonth) {
      for (const s of students) if (payments[`${s.id}|${w.date}`]) total += 5000
    }
    return total
  }, [weeksInMonth, students, payments])

  const activeWeekMeta = weeksInMonth.find((w) => w.date === activeWeek)

  return (
    <div>
      <PanelHeader title="Absensi Kas" desc="Centang = Bayar. Kosong = Nunggak." />
      <Toast {...(toast || {})} />

      <div className="card mb-3 p-4">
        <p className="text-sm text-muted-foreground">Terkumpul bulan {monthLabel(activeMonth)}</p>
        <p className="text-2xl font-bold text-success">{formatRupiah(rekap)}</p>
      </div>

      {/* Pilih Bulan */}
      <div className="mb-2">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Bulan</p>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {months.map((m) => (
            <button key={m} onClick={() => selectMonth(m)}
              className={'shrink-0 rounded-lg border px-3 py-2 text-sm ' +
                (activeMonth === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}>
              {monthLabel(m)}
            </button>
          ))}
        </div>
      </div>

      {/* Pilih Minggu (reset tiap bulan) */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Minggu</p>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {weeksInMonth.map((w) => (
            <button key={w.date} onClick={() => setActiveWeek(w.date)}
              className={'shrink-0 rounded-lg border px-3 py-2 text-sm ' +
                (activeWeek === w.date ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}>
              Minggu ke-{w.weekNo}
            </button>
          ))}
        </div>
      </div>

      {activeWeekMeta && (
        <p className="mb-2 text-xs text-muted-foreground">
          Kamis, {new Date(activeWeek + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}

      <div className="card divide-y divide-border">
        {students.map((s) => {
          const checked = !!payments[`${s.id}|${activeWeek}`]
          const { prevPaid, nextPaid } = lockInfo(s.id, activeWeek)
          // terkunci: belum boleh centang (minggu lalu nunggak) ATAU
          //           belum boleh batal (minggu depan sudah lunas)
          const locked = !activeWeek || (!checked && !prevPaid) || (checked && nextPaid)
          return (
            <label
              key={s.id}
              className={
                'flex items-center justify-between px-4 py-3 ' +
                (locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')
              }
            >
              <span className="text-sm">
                {s.no_absen}. {s.nama}
                {!checked && !prevPaid && (
                  <span className="ml-2 text-[11px] text-muted-foreground">🔒 nunggak minggu lalu</span>
                )}
              </span>
              <input type="checkbox" checked={checked} disabled={locked}
                onChange={(e) => toggle(s.id, e.target.checked)}
                className="h-6 w-6 accent-[hsl(var(--primary))]" />
            </label>
          )
        })}
      </div>
    </div>
  )
}
