'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast, SaveButton, RoleBadge } from '@/components/ui-bits'
import { UploadField } from '@/components/upload-field'
import { canUpload } from '@/lib/roles'
import { Trash2, Power } from 'lucide-react'
import { useConfirm } from '@/components/confirm-dialog'

// Input Tugas (UI Simpel): Mapel, Isi (teks/lampiran), Deadline (range / jam pasti).
export function PanelTugas({ role }) {
  const supabase = createClient()
  const confirm = useConfirm()
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState({
    mapel: '', isi: '', deadline_type: 'exact',
    deadline_start: '', deadline_end: '',
  })
  const [attachments, setAttachments] = useState([]) // daftar lampiran dari UploadField
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const allowUpload = canUpload(role)

  async function load() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data ?? [])
  }
  useEffect(() => { load() }, [])
  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 2500) }

  async function submit() {
    if (!form.mapel.trim()) return notify('Mapel wajib diisi', 'error')
    setLoading(true)
    try {
      // Simpan SEMUA lampiran di kolom jsonb `attachments`.
      // Untuk kompatibilitas dgn tampilan lama: foto pertama → photo_url,
      // dokumen/URL pertama → attachment_*.
      const firstImage = attachments.find((a) => a.is_image)
      const firstDoc = attachments.find((a) => !a.is_image)
      const payload = {
        mapel: form.mapel.trim(),
        isi: form.isi.trim() || null,
        attachments,
        photo_url: firstImage?.url ?? null,
        attachment_url: firstDoc?.url ?? null,
        attachment_name: firstDoc?.name ?? null,
        attachment_type: firstDoc?.type ?? null,
        deadline_type: form.deadline_type,
        // Simpan sebagai tanggal (jam 12 siang WIB) agar tidak bergeser zona waktu.
        deadline_start: form.deadline_type === 'range' && form.deadline_start ? new Date(form.deadline_start + 'T12:00:00').toISOString() : null,
        deadline_end: form.deadline_end ? new Date(form.deadline_end + 'T12:00:00').toISOString() : null,
        is_active: true,
      }
      const { error } = await supabase.from('tasks').insert(payload)
      if (error) throw error
      setForm({ mapel: '', isi: '', deadline_type: 'exact', deadline_start: '', deadline_end: '' })
      setAttachments([])
      notify('Tugas ditambahkan')
      load()
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(t) {
    await supabase.from('tasks').update({ is_active: !t.is_active }).eq('id', t.id)
    load()
  }
  async function remove(id, mapel) {
    const ok = await confirm({
      title: 'Hapus Tugas?',
      message: `Hapus tugas "${mapel}"? Tidak bisa dikembalikan.`,
      danger: true, confirmText: 'Ya, Hapus',
    })
    if (!ok) return
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <PanelHeader title="Input Tugas" desc="Mapel, isi (teks/foto), dan deadline." />
      <Toast {...(toast || {})} />

      <div className="card mb-5 space-y-3 p-4">
        <input className="input-field" placeholder="Mapel" value={form.mapel}
          onChange={(e) => setForm((f) => ({ ...f, mapel: e.target.value }))} />
        <textarea className="input-field" rows={3} placeholder="Isi tugas (opsional)" value={form.isi}
          onChange={(e) => setForm((f) => ({ ...f, isi: e.target.value }))} />

        {/* Upload lanjutan (kamera / foto / dokumen / URL) — hanya role tertentu */}
        {allowUpload && (
          <UploadField
            bucket="tasks"
            folder="tugas"
            multiple
            onUploaded={setAttachments}
          />
        )}

        {/* Deadline radio — tanggal saja, tanpa jam */}
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-medium">Deadline</p>
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input type="radio" name="dl" checked={form.deadline_type === 'exact'}
              onChange={() => setForm((f) => ({ ...f, deadline_type: 'exact' }))} />
            Tanggal Pasti
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="dl" checked={form.deadline_type === 'range'}
              onChange={() => setForm((f) => ({ ...f, deadline_type: 'range' }))} />
            Rentang Tanggal
          </label>

          <div className="mt-3 space-y-2">
            {form.deadline_type === 'range' && (
              <div>
                <label className="text-xs text-muted-foreground">Mulai</label>
                <input type="date" className="input-field" value={form.deadline_start}
                  onChange={(e) => setForm((f) => ({ ...f, deadline_start: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground">{form.deadline_type === 'range' ? 'Selesai' : 'Deadline'}</label>
              <input type="date" className="input-field" value={form.deadline_end}
                onChange={(e) => setForm((f) => ({ ...f, deadline_end: e.target.value }))} />
            </div>
          </div>
        </div>

        <SaveButton loading={loading} onClick={submit}>Tambah Tugas</SaveButton>
      </div>

      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="card flex items-center justify-between p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{t.mapel} {!t.is_active && <span className="text-xs text-muted-foreground">(arsip)</span>}</p>
              {t.isi && <p className="truncate text-xs text-muted-foreground">{t.isi}</p>}
              {t.created_by_role && <div className="mt-1"><RoleBadge role={t.created_by_role} /></div>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => toggleActive(t)} className="text-muted-foreground" title="Aktif/Arsip"><Power className="h-4 w-4" /></button>
              <button onClick={() => remove(t.id, t.mapel)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
