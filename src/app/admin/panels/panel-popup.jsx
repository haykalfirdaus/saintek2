'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadToBucket } from '@/lib/upload'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { Trash2, Image as ImageIcon } from 'lucide-react'

// Popup Besar (hanya developer). Muncul di tengah layar landing.
export function PanelPopup() {
  const supabase = createClient()
  const fileRef = useRef(null)
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ judul: '', dari: '', isi: '', active_until: '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  async function load() {
    const { data } = await supabase.from('announcements').select('*').eq('kind', 'popup')
      .order('created_at', { ascending: false })
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])
  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 2500) }

  async function submit() {
    if (!form.isi.trim()) return notify('Isi wajib diisi', 'error')
    setLoading(true)
    try {
      const media_urls = []
      if (file) media_urls.push(await uploadToBucket('announcements', file, 'popup'))
      const { error } = await supabase.from('announcements').insert({
        kind: 'popup',
        judul: form.judul.trim() || 'Pengumuman',
        dari: form.dari.trim() || null,
        isi: form.isi.trim(),
        media_urls,
        active_until: form.active_until ? new Date(form.active_until).toISOString() : null,
      })
      if (error) throw error
      setForm({ judul: '', dari: '', isi: '', active_until: '' })
      setFile(null); if (fileRef.current) fileRef.current.value = ''
      notify('Popup dibuat'); load()
    } catch (e) { notify(e.message, 'error') } finally { setLoading(false) }
  }

  async function remove(id) { await supabase.from('announcements').delete().eq('id', id); load() }

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
          <ImageIcon className="h-4 w-4" /> {file ? file.name : 'Gambar (opsional)'}
        </button>
        <div>
          <label className="text-xs text-muted-foreground">Tampil sampai (opsional)</label>
          <input type="datetime-local" className="input-field" value={form.active_until}
            onChange={(e) => setForm((f) => ({ ...f, active_until: e.target.value }))} />
        </div>
        <SaveButton loading={loading} onClick={submit}>Buat Popup</SaveButton>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="card flex items-start justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{r.judul}</p>
              <p className="truncate text-sm text-muted-foreground">{r.isi}</p>
            </div>
            <button onClick={() => remove(r.id)} className="shrink-0 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
