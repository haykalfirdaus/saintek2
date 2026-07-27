'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { UploadField } from '@/components/upload-field'
import { canUpload } from '@/lib/roles'
import { collectAttachments } from '@/lib/attachments'
import { Trash2, Pencil, X, Paperclip } from 'lucide-react'
import { useConfirm } from '@/components/confirm-dialog'

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const EMPTY_FORM = { judul: '', dari: '', isi: '', active_until: '' }

// Popup Besar (hanya developer). Muncul di tengah layar landing.
export function PanelPopup({ role }) {
  const supabase = createClient()
  const confirm = useConfirm()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [attachments, setAttachments] = useState([]) // lampiran dari UploadField
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [editId, setEditId] = useState(null)
  const allowUpload = canUpload(role)

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
    setAttachments(collectAttachments(r))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setAttachments([])
  }

  async function submit() {
    if (!form.isi.trim()) return notify('Isi wajib diisi', 'error')
    setLoading(true)
    try {
      // attachments = sumber kebenaran. media_urls = mirror foto (kompat lama).
      const media_urls = attachments.filter((a) => a.is_image).map((a) => a.url)
      const base = {
        judul: form.judul.trim() || 'Pengumuman',
        dari: form.dari.trim() || null,
        isi: form.isi.trim(),
        attachments,
        media_urls,
        active_until: form.active_until ? new Date(form.active_until).toISOString() : null,
      }
      if (editId) {
        const { error } = await supabase.from('announcements').update(base).eq('id', editId)
        if (error) throw error
        notify('Popup diperbarui')
      } else {
        const { error } = await supabase.from('announcements').insert({ kind: 'popup', ...base })
        if (error) throw error
        notify('Popup dibuat')
      }
      cancelEdit(); load()
    } catch (e) { notify(e.message, 'error') } finally { setLoading(false) }
  }

  async function remove(id) {
    const ok = await confirm({ title: 'Hapus Popup?', message: 'Popup akan dihapus permanen.', danger: true, confirmText: 'Ya, Hapus' })
    if (!ok) return
    if (editId === id) cancelEdit()
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

        {/* Lampiran (kamera / foto / dokumen / URL) — key=editId utk seed saat edit */}
        {allowUpload && (
          <UploadField
            key={editId ?? 'new'}
            bucket="announcements"
            folder="popup"
            multiple
            initialItems={attachments}
            onUploaded={setAttachments}
          />
        )}

        <div>
          <label className="text-xs text-muted-foreground">Tampil sampai (opsional)</label>
          <input type="datetime-local" className="input-field" value={form.active_until}
            onChange={(e) => setForm((f) => ({ ...f, active_until: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <SaveButton loading={loading} onClick={submit}>{editId ? 'Simpan Perubahan' : 'Buat Popup'}</SaveButton>
          {editId && <button className="btn-ghost" onClick={cancelEdit}><X className="h-4 w-4" /> Batal</button>}
        </div>
        {editId && <p className="text-xs text-muted-foreground">Mode edit — lampiran bisa ditambah atau dihapus.</p>}
      </div>

      <div className="space-y-2">
        {rows.map((r) => {
          const n = collectAttachments(r).length
          return (
            <div key={r.id} className={'card flex items-start justify-between gap-2 p-3 ' + (editId === r.id ? 'ring-2 ring-primary' : '')}>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{r.judul}</p>
                <p className="truncate text-sm text-muted-foreground">{r.isi}</p>
                {n > 0 && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Paperclip className="h-3 w-3" /> {n} lampiran
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => startEdit(r)} className="text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(r.id)} className="text-destructive" title="Hapus"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
