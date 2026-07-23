'use client'

import { useRef, useState } from 'react'
import { uploadWithMeta } from '@/lib/upload'
import {
  Camera, ImageIcon, FileText, Link2, Loader2, X, CheckCircle2, UploadCloud,
} from 'lucide-react'

/*
  UploadField — form upload lanjutan 4 opsi, ramah seluler.
    a. Kamera Langsung  : <input accept="image/*" capture="environment">
    b. File Foto        : <input accept="image/*">      (galeri HP)
    c. Dokumen          : <input accept=".pdf,.doc,...>  (non-gambar)
    d. URL              : input teks tautan eksternal

  Logika:
    - Opsi file/kamera  → upload ke Supabase Storage, hasilkan public URL.
    - Opsi URL          → pakai teks tautan langsung (tanpa upload).

  Props:
    bucket     : nama bucket Storage tujuan (default 'tasks')
    folder     : subfolder di bucket (default 'upload')
    multiple   : true → bisa banyak lampiran (foto+url+dokumen sekaligus).
                 false (default) → satu lampiran (dipakai galeri).
    onUploaded : dipanggil tiap ada perubahan.
                 - multiple=false → onUploaded(meta | null)
                 - multiple=true  → onUploaded([meta, ...])
    accept     : batasi opsi ['camera','photo','doc','url'] (default semua)

  meta = { url, name, type, size, is_image, source }
*/
export function UploadField({
  bucket = 'tasks',
  folder = 'upload',
  multiple = false,
  onUploaded,
  accept = ['camera', 'photo', 'doc', 'url'],
}) {
  const cameraRef = useRef(null)
  const photoRef = useRef(null)
  const docRef = useRef(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([]) // daftar lampiran
  const [urlText, setUrlText] = useState('')
  const [showUrl, setShowUrl] = useState(false)

  // Simpan hasil & beri tahu parent (array kalau multiple, else 1 item / null).
  function commit(next) {
    setItems(next)
    onUploaded?.(multiple ? next : (next[next.length - 1] ?? null))
  }

  async function handleFile(file, source) {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      const meta = { ...(await uploadWithMeta(bucket, file, folder)), source }
      commit(multiple ? [...items, meta] : [meta])
    } catch (e) {
      setError(e.message || 'Gagal mengunggah.')
    } finally {
      setBusy(false)
      // reset input agar file yang sama bisa dipilih lagi
      if (cameraRef.current) cameraRef.current.value = ''
      if (photoRef.current) photoRef.current.value = ''
      if (docRef.current) docRef.current.value = ''
    }
  }

  function applyUrl() {
    const url = urlText.trim()
    setError('')
    if (!/^https?:\/\/.+/i.test(url)) {
      setError('Tautan harus diawali http:// atau https://')
      return
    }
    const meta = {
      url,
      name: url.split('/').pop() || url,
      type: '',
      size: 0,
      is_image: /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(url),
      source: 'url',
    }
    commit(multiple ? [...items, meta] : [meta])
    setUrlText('')
    setShowUrl(false)
  }

  function removeAt(idx) {
    commit(items.filter((_, i) => i !== idx))
  }

  const options = [
    accept.includes('camera') && {
      key: 'camera', label: 'Kamera', icon: Camera,
      onClick: () => cameraRef.current?.click(),
    },
    accept.includes('photo') && {
      key: 'photo', label: 'File Foto', icon: ImageIcon,
      onClick: () => photoRef.current?.click(),
    },
    accept.includes('doc') && {
      key: 'doc', label: 'Dokumen', icon: FileText,
      onClick: () => docRef.current?.click(),
    },
    accept.includes('url') && {
      key: 'url', label: 'URL', icon: Link2,
      onClick: () => setShowUrl((v) => !v),
    },
  ].filter(Boolean)

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="section-title mb-2">
        <UploadCloud className="h-4 w-4" /> Upload Lampiran
        {multiple && <span className="ml-1 font-normal normal-case text-muted-foreground">(bisa lebih dari satu)</span>}
      </p>

      {/* Hidden native inputs */}
      <input
        ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => handleFile(e.target.files?.[0], 'camera')}
      />
      <input
        ref={photoRef} type="file" accept="image/*" hidden
        onChange={(e) => handleFile(e.target.files?.[0], 'photo')}
      />
      <input
        ref={docRef} type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,application/pdf"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0], 'doc')}
      />

      {/* Grid 4 opsi — thumb friendly */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((o) => {
          const Icon = o.icon
          const active = o.key === 'url' && showUrl
          return (
            <button
              key={o.key}
              type="button"
              disabled={busy}
              onClick={o.onClick}
              className={
                'flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition active:scale-[0.97] disabled:opacity-50 ' +
                (active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted')
              }
            >
              <Icon className="h-5 w-5" />
              {o.label}
            </button>
          )
        })}
      </div>

      {/* Input URL manual */}
      {showUrl && (
        <div className="mt-3 flex gap-2">
          <input
            type="url" inputMode="url" className="input-field py-2 text-sm"
            placeholder="https://contoh.com/file.pdf"
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
          />
          <button type="button" className="btn-primary px-4" onClick={applyUrl}>
            Pakai
          </button>
        </div>
      )}

      {busy && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Mengunggah…
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Preview daftar lampiran */}
      {items.length > 0 && !busy && (
        <div className="mt-3 space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2">
              {it.is_image ? (
                <img
                  src={it.url} alt={it.name}
                  width={48} height={48} loading="lazy" decoding="async"
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-sm font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                  {it.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {it.source === 'url' ? 'Tautan eksternal' : humanSize(it.size)}
                </p>
              </div>
              <button
                type="button" onClick={() => removeAt(idx)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Hapus lampiran"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function humanSize(bytes) {
  if (!bytes) return ''
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
