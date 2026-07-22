'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { Trash2, Plus, Users, ClipboardPaste } from 'lucide-react'

// Manajemen Data Siswa: bulk paste (Excel) + manual add/edit/hapus.
export function PanelSiswa() {
  const supabase = createClient()
  const [students, setStudents] = useState([])
  const [bulk, setBulk] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  async function load() {
    const { data } = await supabase.from('students').select('*').order('no_absen')
    setStudents(data ?? [])
  }
  useEffect(() => { load() }, [])

  function notify(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  async function saveBulk() {
    const names = bulk.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!names.length) return
    setLoading(true)
    const { data, error } = await supabase.rpc('bulk_insert_students', { names })
    setLoading(false)
    if (error) return notify(error.message, 'error')
    setBulk('')
    notify(`${data} siswa ditambahkan`)
    load()
  }

  async function addOne() {
    if (!newName.trim()) return
    const nextNo = (students.at(-1)?.no_absen ?? 0) + 1
    const { error } = await supabase.from('students').insert({ nama: newName.trim(), no_absen: nextNo })
    if (error) return notify(error.message, 'error')
    setNewName('')
    load()
  }

  async function rename(id, nama) {
    const { error } = await supabase.from('students').update({ nama }).eq('id', id)
    if (error) notify(error.message, 'error')
  }

  async function remove(id) {
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) return notify(error.message, 'error')
    load()
  }

  return (
    <div>
      <PanelHeader title="Data Siswa" desc="Bulk paste dari Excel atau input manual." />
      <Toast {...(toast || {})} />

      {/* Bulk paste */}
      <div className="card mb-4 p-4">
        <p className="section-title"><ClipboardPaste className="h-4 w-4" /> Bulk Paste (1 nama per baris)</p>
        <textarea
          value={bulk} onChange={(e) => setBulk(e.target.value)}
          rows={5} className="input-field font-mono text-sm"
          placeholder={"Ahmad\nBudi\nCitra\n..."}
        />
        <div className="mt-3"><SaveButton loading={loading} onClick={saveBulk}>Parse & Simpan</SaveButton></div>
      </div>

      {/* Manual add */}
      <div className="card mb-4 flex gap-2 p-4">
        <input
          value={newName} onChange={(e) => setNewName(e.target.value)}
          className="input-field" placeholder="Tambah 1 siswa…"
          onKeyDown={(e) => e.key === 'Enter' && addOne()}
        />
        <button className="btn-primary px-4" onClick={addOne}><Plus className="h-5 w-5" /></button>
      </div>

      {/* List */}
      <div className="card divide-y divide-border">
        <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-muted-foreground">
          <Users className="h-4 w-4" /> {students.length} siswa
        </div>
        {students.map((s) => (
          <div key={s.id} className="flex items-center gap-2 px-4 py-2">
            <span className="w-8 text-sm text-muted-foreground">{s.no_absen}</span>
            <input
              defaultValue={s.nama}
              className="flex-1 bg-transparent text-sm outline-none focus:underline"
              onBlur={(e) => rename(s.id, e.target.value.trim())}
            />
            <button onClick={() => remove(s.id)} className="text-destructive" aria-label="Hapus">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
