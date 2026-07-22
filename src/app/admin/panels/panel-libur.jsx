'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { Trash2, CalendarOff } from 'lucide-react'

// Custom Hari Libur (default libur hanya Minggu). Admin set "Libur Ekstra".
export function PanelLibur() {
  const supabase = createClient()
  const [rows, setRows] = useState([])
  const [tanggal, setTanggal] = useState('')
  const [ket, setKet] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  async function load() {
    const { data } = await supabase.from('holidays').select('*').order('tanggal')
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])

  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 2000) }

  async function add() {
    if (!tanggal) return
    setLoading(true)
    const { error } = await supabase.from('holidays').upsert({ tanggal, keterangan: ket || null })
    setLoading(false)
    if (error) return notify(error.message, 'error')
    setTanggal(''); setKet(''); load()
  }

  async function remove(t) {
    const { error } = await supabase.from('holidays').delete().eq('tanggal', t)
    if (error) return notify(error.message, 'error')
    load()
  }

  return (
    <div>
      <PanelHeader title="Hari Libur Ekstra" desc="Default libur hanya Minggu. Tambah libur khusus di sini." />
      <Toast {...(toast || {})} />

      <div className="card mb-4 space-y-3 p-4">
        <input type="date" className="input-field" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        <input className="input-field" placeholder="Keterangan (mis. Libur Nasional)" value={ket} onChange={(e) => setKet(e.target.value)} />
        <SaveButton loading={loading} onClick={add}>Tambah Libur</SaveButton>
      </div>

      <div className="card divide-y divide-border">
        <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-muted-foreground">
          <CalendarOff className="h-4 w-4" /> {rows.length} hari libur ekstra
        </div>
        {rows.map((r) => (
          <div key={r.tanggal} className="flex items-center justify-between px-4 py-2">
            <div>
              <p className="text-sm font-medium">{new Date(r.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              {r.keterangan && <p className="text-xs text-muted-foreground">{r.keterangan}</p>}
            </div>
            <button onClick={() => remove(r.tanggal)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
