'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadToBucket } from '@/lib/upload'
import { PanelHeader, Toast, SaveButton, RoleBadge } from '@/components/ui-bits'
import { Paperclip, Trash2, Pencil, X } from 'lucide-react'
import { useConfirm } from '@/components/confirm-dialog'

// datetime-local butuh format 'YYYY-MM-DDTHH:mm' waktu lokal.
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Pengumuman biasa: Dari (opsional), Isi (teks/multi-foto/file), Masa berlaku.
export function PanelPengumuman() {
  const supabase = createClient()
  const confirm = useConfirm()
  const fileRef = useRef(null)
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ dari: '', judul: '', isi: '', active_from: '', active_until: '' })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [editId, setEditId] = useState(null) // null = mode tambah

  async function load() {
    const { data } = await supabase.from('announcements').select('*').eq('kind', 'biasa')
      .order('created_at', { ascending: false })
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])
  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 2500) }

  function startEdit(r) {
    setEditId(r.id)
    setForm({
      dari: r.dari || '', judul: r.judul || '', isi: r.isi || '',
      active_from: toLocalInput(r.active_from), active_until: toLocalInput(r.active_until),
    })
    setFiles([]); if (fileRef.current) fileRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm({ dari: '', judul: '', isi: '', active_from: '', active_until: '' })
    setFiles([]); if (fileRef.current) fileRef.current.value = ''
  }

  async function submit() {
    if (!form.isi.trim()) return notify('Isi wajib diisi', 'error')
    setLoading(true)
    try {
      // upload file baru (kalau ada); saat edit, file baru menambah media lama.
      const newMedia = []
      for (const f of files) newMedia.push(await uploadToBucket('announcements', f, 'pengumuman'))

      const base = {
        dari: form.dari.trim() || null,
        judul: form.judul.trim() || null,
        isi: form.isi.trim(),
        active_from: form.active_from ? new Date(form.active_from).toISOString() : null,
        active_until: form.active_until ? new Date(form.active_until).toISOString() : null,
      }

      if (editId) {
        const existing = rows.find((r) => r.id === editId)
        const media_urls = [...(existing?.media_urls || []), ...newMedia]
        const { error } = await supabase.from('announcements').update({ ...base, media_urls }).eq('id', editId)
        if (error) throw error
        notify('Pengumuman diperbarui')
      } else {
        const { error } = await supabase.from('announcements').insert({ kind: 'biasa', ...base, media_urls: newMedia })
        if (error) throw error
        notify('Pengumuman ditambahkan')
      }
      cancelEdit(); load()
    } catch (e) { notify(e.message, 'error') } finally { setLoading(false) }
  }

  async function remove(id) {
    const ok = await confirm({ title: 'Hapus Pengumuman?', message: 'Pengumuman akan dihapus permanen.', danger: true, confirmText: 'Ya, Hapus' })
    if (!ok) return
    await supabase.from('announcements').delete().eq('id', id); load()
  }

  return (
    <div>
      <PanelHeader title="Pengumuman Biasa" desc="Dari (opsional), isi, media, & masa berlaku." />
      <Toast {...(toast || {})} />

      <div className="card mb-5 space-y-3 p-4">
        <input className="input-field" placeholder="Dari siapa (opsional)" value={form.dari}
          onChange={(e) => setForm((f) => ({ ...f, dari: e.target.value }))} />
        <input className="input-field" placeholder="Judul (opsional)" value={form.judul}
          onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))} />
        <textarea className="input-field" rows={3} placeholder="Isi pengumuman" value={form.isi}
          onChange={(e) => setForm((f) => ({ ...f, isi: e.target.value }))} />

        <input ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        <button type="button" className="btn-ghost w-full" onClick={() => fileRef.current?.click()}>
          <Paperclip className="h-4 w-4" /> {files.length ? `${files.length} file dipilih` : 'Lampirkan Foto/File (multi)'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Berlaku dari</label>
            <input type="datetime-local" className="input-field" value={form.active_from}
              onChange={(e) => setForm((f) => ({ ...f, active_from: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Sampai</label>
            <input type="datetime-local" className="input-field" value={form.active_until}
              onChange={(e) => setForm((f) => ({ ...f, active_until: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-2">
          <SaveButton loading={loading} onClick={submit}>{editId ? 'Simpan Perubahan' : 'Terbitkan'}</SaveButton>
          {editId && (
            <button className="btn-ghost" onClick={cancelEdit}><X className="h-4 w-4" /> Batal</button>
          )}
        </div>
        {editId && <p className="text-xs text-muted-foreground">Mode edit — foto baru akan ditambahkan ke media lama.</p>}
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className={'card flex items-start justify-between gap-2 p-3 ' + (editId === r.id ? 'ring-2 ring-primary' : '')}>
            <div className="min-w-0">
              {r.judul && <p className="text-sm font-semibold">{r.judul}</p>}
              <p className="truncate text-sm text-muted-foreground">{r.isi}</p>
              {r.dari && <p className="text-xs text-muted-foreground">— {r.dari}</p>}
              {r.created_by_role && <div className="mt-1"><RoleBadge role={r.created_by_role} /></div>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => startEdit(r)} className="text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(r.id)} className="text-destructive" title="Hapus"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
