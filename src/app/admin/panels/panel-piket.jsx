'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast } from '@/components/ui-bits'
import { WEEKDAY_KEYS } from '@/lib/utils'
import { Plus, X } from 'lucide-react'

const LABEL = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu' }

// Input Piket: dropdown pilih siswa untuk tiap hari Senin–Sabtu.
export function PanelPiket() {
  const supabase = createClient()
  const [students, setStudents] = useState([])
  const [piket, setPiket] = useState({}) // day -> [{id, student_id, nama}]
  const [toast, setToast] = useState(null)

  async function load() {
    const [{ data: st }, { data: pk }] = await Promise.all([
      supabase.from('students').select('*').order('no_absen'),
      supabase.from('piket').select('id, day_key, student_id, students(nama, no_absen)'),
    ])
    setStudents(st ?? [])
    const grp = {}
    WEEKDAY_KEYS.forEach((d) => (grp[d] = []))
    ;(pk ?? []).forEach((r) => {
      grp[r.day_key]?.push({ id: r.id, student_id: r.student_id, nama: r.students?.nama })
    })
    setPiket(grp)
  }
  useEffect(() => { load() }, [])

  function notify(msg, type = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2000)
  }

  async function add(day, studentId) {
    if (!studentId) return
    const { error } = await supabase.from('piket').insert({ day_key: day, student_id: studentId })
    if (error) return notify(error.message, 'error')
    load()
  }

  async function remove(id) {
    const { error } = await supabase.from('piket').delete().eq('id', id)
    if (error) return notify(error.message, 'error')
    load()
  }

  return (
    <div>
      <PanelHeader title="Jadwal Piket" desc="Pilih siswa untuk tiap hari." />
      <Toast {...(toast || {})} />
      <div className="space-y-4">
        {WEEKDAY_KEYS.map((day) => (
          <div key={day} className="card p-4">
            <p className="mb-2 font-semibold">{LABEL[day]}</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {(piket[day] || []).map((p) => (
                <span key={p.id} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm">
                  {p.nama}
                  <button onClick={() => remove(p.id)} className="text-destructive" aria-label="Hapus">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {!(piket[day] || []).length && (
                <span className="text-sm text-muted-foreground">Belum ada.</span>
              )}
            </div>
            <div className="flex gap-2">
              <select
                className="input-field"
                defaultValue=""
                onChange={(e) => { add(day, e.target.value); e.target.value = '' }}
              >
                <option value="" disabled>+ Tambah siswa…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.no_absen}. {s.nama}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
