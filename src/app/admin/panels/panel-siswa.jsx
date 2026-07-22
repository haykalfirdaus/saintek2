'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { Trash2, Plus, Users, ClipboardPaste, Eye, EyeOff, Pencil, Check, X } from 'lucide-react'

// Manajemen Data Siswa: bulk paste (Excel) + manual add/edit/hapus.
// No absen otomatis urut alfabet nama (via RPC renumber_students_alpha).
export function PanelSiswa() {
  const supabase = createClient()
  const [students, setStudents] = useState([])
  const [bulk, setBulk] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const [showList, setShowList] = useState(false)   // list disembunyikan default (lebih aman)
  const [editMode, setEditMode] = useState(false)   // tombol hapus/edit hanya muncul saat mode edit
  const [confirmId, setConfirmId] = useState(null)   // id siswa yg menunggu konfirmasi hapus

  async function load() {
    const { data } = await supabase.from('students').select('*').order('no_absen')
    setStudents(data ?? [])
  }
  useEffect(() => { load() }, [])

  function notify(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  // Susun ulang no_absen mengikuti urutan alfabet nama.
  async function renumber() {
    const { error } = await supabase.rpc('renumber_students_alpha')
    if (error) notify(error.message, 'error')
  }

  async function saveBulk() {
    const names = bulk.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!names.length) return
    setLoading(true)
    const { data, error } = await supabase.rpc('bulk_insert_students', { names })
    if (!error) await renumber()
    setLoading(false)
    if (error) return notify(error.message, 'error')
    setBulk('')
    notify(`${data} siswa ditambahkan`)
    load()
  }

  async function addOne() {
    if (!newName.trim()) return
    // no_absen sementara di ujung; renumber akan menatanya sesuai alfabet.
    const nextNo = (students.at(-1)?.no_absen ?? 0) + 1
    const { error } = await supabase.from('students').insert({ nama: newName.trim(), no_absen: nextNo })
    if (error) return notify(error.message, 'error')
    await renumber()
    setNewName('')
    load()
  }

  async function rename(id, nama) {
    if (!nama) return
    const { error } = await supabase.from('students').update({ nama }).eq('id', id)
    if (error) return notify(error.message, 'error')
    await renumber()
    load()
  }

  async function remove(id) {
    const { error } = await supabase.from('students').delete().eq('id', id)
    setConfirmId(null)
    if (error) return notify(error.message, 'error')
    await renumber()
    notify('Siswa dihapus')
    load()
  }

  return (
    <div>
      <PanelHeader title="Data Siswa" desc="Bulk paste dari Excel atau input manual. No absen otomatis urut alfabet." />
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

      {/* Kontrol list */}
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Users className="h-4 w-4" /> {students.length} siswa
        </span>
        <div className="flex gap-2">
          <button className="btn-ghost h-10 px-3 text-sm" onClick={() => setShowList((v) => !v)}>
            {showList ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showList ? 'Sembunyikan' : 'Lihat List'}
          </button>
          {showList && (
            <button
              className={'h-10 rounded-lg border px-3 text-sm font-medium transition ' +
                (editMode ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}
              onClick={() => { setEditMode((v) => !v); setConfirmId(null) }}
            >
              <span className="flex items-center gap-1">
                <Pencil className="h-4 w-4" /> {editMode ? 'Selesai' : 'Edit'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* List (disembunyikan sampai ditekan "Lihat List") */}
      {showList && (
        <div className="card divide-y divide-border">
          {students.map((s) => (
            <div key={s.id} className="flex items-center gap-2 px-4 py-2">
              <span className="w-8 shrink-0 text-sm text-muted-foreground">{s.no_absen}</span>

              {editMode ? (
                <input
                  defaultValue={s.nama}
                  className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v && v !== s.nama) rename(s.id, v)
                  }}
                />
              ) : (
                <span className="flex-1 text-sm">{s.nama}</span>
              )}

              {/* Tombol hapus HANYA muncul saat mode edit, dan butuh konfirmasi */}
              {editMode && (
                confirmId === s.id ? (
                  <span className="flex shrink-0 items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">Yakin?</span>
                    <button onClick={() => remove(s.id)} className="grid h-8 w-8 place-items-center rounded bg-destructive/10 text-destructive" aria-label="Konfirmasi hapus">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirmId(null)} className="grid h-8 w-8 place-items-center rounded bg-muted text-muted-foreground" aria-label="Batal">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmId(s.id)} className="shrink-0 text-destructive" aria-label="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )
              )}
            </div>
          ))}
          {!students.length && (
            <p className="px-4 py-3 text-sm text-muted-foreground">Belum ada siswa.</p>
          )}
        </div>
      )}
    </div>
  )
}
