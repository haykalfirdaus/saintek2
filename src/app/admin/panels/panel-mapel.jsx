'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { WEEKDAY_KEYS } from '@/lib/utils'

const LABEL = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat', sabtu: 'Sabtu' }

// Input urutan mapel Senin–Sabtu (satu mapel per baris).
export function PanelMapel() {
  const supabase = createClient()
  const [map, setMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.from('schedules').select('*').then(({ data }) => {
      const m = {}
      ;(data ?? []).forEach((r) => { m[r.day_key] = (r.items || []).join('\n') })
      setMap(m)
    })
  }, [])

  async function save(day) {
    setLoading(true)
    const items = (map[day] || '').split('\n').map((s) => s.trim()).filter(Boolean)
    const { error } = await supabase.from('schedules').upsert({ day_key: day, items })
    setLoading(false)
    setToast(error ? { msg: error.message, type: 'error' } : { msg: `Jadwal ${LABEL[day]} disimpan`, type: 'success' })
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div>
      <PanelHeader title="Jadwal Mapel" desc="Satu mapel per baris, urut sesuai jam." />
      <Toast {...(toast || {})} />
      <div className="space-y-4">
        {WEEKDAY_KEYS.map((day) => (
          <div key={day} className="card p-4">
            <p className="mb-2 font-semibold">{LABEL[day]}</p>
            <textarea
              rows={4} className="input-field text-sm"
              value={map[day] || ''}
              onChange={(e) => setMap((m) => ({ ...m, [day]: e.target.value }))}
              placeholder={"Matematika\nFisika\nBahasa Indonesia"}
            />
            <div className="mt-2"><SaveButton loading={loading} onClick={() => save(day)}>Simpan {LABEL[day]}</SaveButton></div>
          </div>
        ))}
      </div>
    </div>
  )
}
