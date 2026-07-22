'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { WEEKDAY_KEYS } from '@/lib/utils'
import { X } from 'lucide-react'

const LABEL = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu' }

// Input Piket: dropdown pilih siswa per hari. Perubahan di-staging dulu,
// baru masuk DB saat tombol "Simpan" ditekan.
export function PanelPiket() {
  const supabase = createClient()
  const [students, setStudents] = useState([])
  const [saved, setSaved] = useState({})   // day -> [student_id]  (kondisi di DB)
  const [draft, setDraft] = useState({})    // day -> [student_id]  (editan sementara)
  const [savingDay, setSavingDay] = useState(null)
  const [toast, setToast] = useState(null)

  async function load() {
    const [{ data: st }, { data: pk }] = await Promise.all([
      supabase.from('students').select('*').order('no_absen'),
      supabase.from('piket').select('day_key, student_id'),
    ])
    setStudents(st ?? [])
    const grp = {}
    WEEKDAY_KEYS.forEach((d) => (grp[d] = []))
    ;(pk ?? []).forEach((r) => { grp[r.day_key]?.push(r.student_id) })
    setSaved(grp)
    setDraft(structuredClone(grp))
  }
  useEffect(() => { load() }, [])

  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 2000) }

  function namaOf(id) {
    const s = students.find((x) => x.id === id)
    return s ? `${s.nama}` : id
  }

  function addToDraft(day, studentId) {
    if (!studentId) return
    setDraft((d) => {
      if (d[day]?.includes(studentId)) return d
      return { ...d, [day]: [...(d[day] || []), studentId] }
    })
  }
  function removeFromDraft(day, studentId) {
    setDraft((d) => ({ ...d, [day]: (d[day] || []).filter((id) => id !== studentId) }))
  }

  // apakah draft hari ini beda dari yang tersimpan?
  const dirty = useMemo(() => {
    const res = {}
    for (const day of WEEKDAY_KEYS) {
      const a = [...(saved[day] || [])].sort()
      const b = [...(draft[day] || [])].sort()
      res[day] = JSON.stringify(a) !== JSON.stringify(b)
    }
    return res
  }, [saved, draft])

  async function save(day) {
    setSavingDay(day)
    try {
      // strategi sederhana & aman: hapus semua baris hari itu, lalu insert ulang dari draft.
      const { error: delErr } = await supabase.from('piket').delete().eq('day_key', day)
      if (delErr) throw delErr
      const rows = (draft[day] || []).map((student_id) => ({ day_key: day, student_id }))
      if (rows.length) {
        const { error: insErr } = await supabase.from('piket').insert(rows)
        if (insErr) throw insErr
      }
      setSaved((s) => ({ ...s, [day]: [...(draft[day] || [])] }))
      notify(`Piket ${LABEL[day]} disimpan`)
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setSavingDay(null)
    }
  }

  return (
    <div>
      <PanelHeader title="Jadwal Piket" desc="Pilih siswa tiap hari, lalu tekan Simpan." />
      <Toast {...(toast || {})} />
      <div className="space-y-4">
        {WEEKDAY_KEYS.map((day) => (
          <div key={day} className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{LABEL[day]}</p>
              {dirty[day] && (
                <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                  Belum disimpan
                </span>
              )}
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {(draft[day] || []).map((id) => (
                <span key={id} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm">
                  {namaOf(id)}
                  <button onClick={() => removeFromDraft(day, id)} className="text-destructive" aria-label="Hapus">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {!(draft[day] || []).length && (
                <span className="text-sm text-muted-foreground">Belum ada.</span>
              )}
            </div>

            <div className="flex gap-2">
              <select
                className="input-field"
                value=""
                onChange={(e) => { addToDraft(day, e.target.value); e.target.value = '' }}
              >
                <option value="" disabled>+ Tambah siswa…</option>
                {students
                  .filter((s) => !(draft[day] || []).includes(s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.no_absen}. {s.nama}</option>
                  ))}
              </select>
              <SaveButton
                loading={savingDay === day}
                disabled={!dirty[day] || savingDay === day}
                onClick={() => save(day)}
              >
                Simpan
              </SaveButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
