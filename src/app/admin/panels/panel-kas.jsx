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

  // Build the list of Thursdays within the last ~1 month.
  useEffect(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    const list = []
    const cur = new Date(now)
    while (cur.getDay() !== 4) cur.setDate(cur.getDate() - 1) // back to last Thursday
    for (let i = 0; i < 5; i++) { // ~5 Kamis (>=1 bulan)
      list.push(toISODate(cur))
      cur.setDate(cur.getDate() - 7)
    }
    setWeeks(list)
    setActiveWeek(list[0])
  }, [])

  async function load() {
    const [{ data: st }, { data: pay }] = await Promise.all([
      supabase.from('students').select('*').order('no_absen'),
      supabase.from('kas_payments').select('*').eq('paid', true),
    ])
    setStudents(st ?? [])
    const map = {}
    ;(pay ?? []).forEach((p) => { map[`${p.student_id}|${p.week_date}`] = true })
    setPayments(map)
  }
  useEffect(() => { load() }, [])

  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 1500) }

  async function toggle(studentId, checked) {
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

  const rekap = useMemo(() => {
    // Rekap 1 bulan terakhir: total terkumpul dari minggu-minggu yang tampil.
    let total = 0
    for (const w of weeks) {
      for (const s of students) if (payments[`${s.id}|${w}`]) total += 5000
    }
    return total
  }, [weeks, students, payments])

  return (
    <div>
      <PanelHeader title="Absensi Kas" desc="Centang = Bayar. Kosong = Nunggak." />
      <Toast {...(toast || {})} />

      <div className="card mb-3 p-4">
        <p className="text-sm text-muted-foreground">Rekap 1 bulan terakhir (terkumpul)</p>
        <p className="text-2xl font-bold text-success">{formatRupiah(rekap)}</p>
      </div>

      {/* Pilih minggu (Kamis) */}
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {weeks.map((w) => (
          <button key={w} onClick={() => setActiveWeek(w)}
            className={'shrink-0 rounded-lg border px-3 py-2 text-sm ' +
              (activeWeek === w ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}>
            {new Date(w + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-border">
        {students.map((s) => {
          const checked = !!payments[`${s.id}|${activeWeek}`]
          return (
            <label key={s.id} className="flex cursor-pointer items-center justify-between px-4 py-3">
              <span className="text-sm">{s.no_absen}. {s.nama}</span>
              <input type="checkbox" checked={checked}
                onChange={(e) => toggle(s.id, e.target.checked)}
                className="h-6 w-6 accent-[hsl(var(--primary))]" />
            </label>
          )
        })}
      </div>
    </div>
  )
}
