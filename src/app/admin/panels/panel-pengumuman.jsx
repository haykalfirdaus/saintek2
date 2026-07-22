'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadToBucket } from '@/lib/upload'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { Paperclip, Trash2 } from 'lucide-react'
import { useConfirm } from '@/components/confirm-dialog'

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

  async function load() {
    const { data } = await supabase.from('announcements').select('*').eq('kind', 'biasa')
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
      for (const f of files) media_urls.push(await uploadToBucket('announcements', f, 'pengumuman'))
      const { error } = await supabase.from('announcements').insert({
        kind: 'biasa',
        dari: form.dari.trim() || null,
        judul: form.judul.trim() || null,
        isi: form.isi.trim(),
        media_urls,
        active_from: form.active_from ? new Date(form.active_from).toISOString() : null,
        active_until: form.active_until ? new Date(form.active_until).toISOString() : null,
      })
      if (error) throw error
      setForm({ dari: '', judul: '', isi: '', active_from: '', active_until: '' })
      setFiles([]); if (fileRef.current) fileRef.current.value = ''
      notify('Pengumuman ditambahkan'); load()
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

        <SaveButton loading={loading} onClick={submit}>Terbitkan</SaveButton>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="card flex items-start justify-between gap-2 p-3">
            <div className="min-w-0">
              {r.judul && <p className="text-sm font-semibold">{r.judul}</p>}
              <p className="truncate text-sm text-muted-foreground">{r.isi}</p>
              {r.dari && <p className="text-xs text-muted-foreground">— {r.dari}</p>}
            </div>
            <button onClick={() => remove(r.id)} className="shrink-0 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
