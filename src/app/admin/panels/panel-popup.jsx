'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadToBucket } from '@/lib/upload'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { Trash2, Image as ImageIcon, Pencil, X } from 'lucide-react'
import { useConfirm } from '@/components/confirm-dialog'

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Popup Besar (hanya developer). Muncul di tengah layar landing.
export function PanelPopup() {
  const supabase = createClient()
  const confirm = useConfirm()
  const fileRef = useRef(null)
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ judul: '', dari: '', isi: '', active_until: '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [editId, setEditId] = useState(null)

  async function load() {
    const { data } = await supabase.from('announcements').select('*').eq('kind', 'popup')
      .order('created_at', { ascending: false })
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])
  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 2500) }

  function startEdit(r) {
    setEditId(r.id)
    setForm({ judul: r.judul || '', dari: r.dari || '', isi: r.isi || '', active_until: toLocalInput(r.active_until) })
    setFile(null); if (fileRef.current) fileRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function cancelEdit() {
    setEditId(null)
    setForm({ judul: '', dari: '', isi: '', active_until: '' })
    setFile(null); if (fileRef.current) fileRef.current.value = ''
  }

  async function submit() {
    if (!form.isi.trim()) return notify('Isi wajib diisi', 'error')
    setLoading(true)
    try {
      const base = {
        judul: form.judul.trim() || 'Pengumuman',
        dari: form.dari.trim() || null,
        isi: form.isi.trim(),
        active_until: form.active_until ? new Date(form.active_until).toISOString() : null,
      }
      if (editId) {
        const existing = rows.find((r) => r.id === editId)
        let media_urls = existing?.media_urls || []
        if (file) media_urls = [await uploadToBucket('announcements', file, 'popup')] // ganti gambar
        const { error } = await supabase.from('announcements').update({ ...base, media_urls }).eq('id', editId)
        if (error) throw error
        notify('Popup diperbarui')
      } else {
        const media_urls = []
        if (file) media_urls.push(await uploadToBucket('announcements', file, 'popup'))
        const { error } = await supabase.from('announcements').insert({ kind: 'popup', ...base, media_urls })
        if (error) throw error
        notify('Popup dibuat')
      }
      cancelEdit(); load()
    } catch (e) { notify(e.message, 'error') } finally { setLoading(false) }
  }

  async function remove(id) {
    const ok = await confirm({ title: 'Hapus Popup?', message: 'Popup akan dihapus permanen.', danger: true, confirmText: 'Ya, Hapus' })
    if (!ok) return
    await supabase.from('announcements').delete().eq('id', id); load()
  }

  return (
    <div>
      <PanelHeader title="Popup Besar" desc="Muncul di tengah layar saat web dibuka." />
      <Toast {...(toast || {})} />

      <div className="card mb-5 space-y-3 p-4">
        <input className="input-field" placeholder="Judul" value={form.judul}
          onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))} />
        <input className="input-field" placeholder="Dari (opsional)" value={form.dari}
          onChange={(e) => setForm((f) => ({ ...f, dari: e.target.value }))} />
        <textarea className="input-field" rows={3} placeholder="Isi popup" value={form.isi}
          onChange={(e) => setForm((f) => ({ ...f, isi: e.target.value }))} />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button type="button" className="btn-ghost w-full" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="h-4 w-4" /> {file ? file.name : (editId ? 'Ganti Gambar (opsional)' : 'Gambar (opsional)')}
        </button>
        <div>
          <label className="text-xs text-muted-foreground">Tampil sampai (opsional)</label>
          <input type="datetime-local" className="input-field" value={form.active_until}
            onChange={(e) => setForm((f) => ({ ...f, active_until: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <SaveButton loading={loading} onClick={submit}>{editId ? 'Simpan Perubahan' : 'Buat Popup'}</SaveButton>
          {editId && <button className="btn-ghost" onClick={cancelEdit}><X className="h-4 w-4" /> Batal</button>}
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className={'card flex items-start justify-between gap-2 p-3 ' + (editId === r.id ? 'ring-2 ring-primary' : '')}>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{r.judul}</p>
              <p className="truncate text-sm text-muted-foreground">{r.isi}</p>
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
