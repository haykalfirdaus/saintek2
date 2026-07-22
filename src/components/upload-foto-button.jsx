'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/*
  Public photo upload (no login). Uploads straight to Supabase Storage
  bucket "gallery" and inserts a public gallery row.
  On mobile, the file input with capture triggers camera / gallery access.
*/
export function UploadFotoButton({
  label = 'Upload Foto',
  bucket = 'gallery',
  inSlider = false,
  className = '',
  onUploaded,
}) {
  const inputRef = useRef(null)
  const [state, setState] = useState('idle') // idle | uploading | done | error
  const [msg, setMsg] = useState('')

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const supabase = createClient()
    setState('uploading')
    setMsg('')
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        // Build a clean key from the MIME type — never trust file.name (camera
        // uploads on mobile can have empty/odd names → "Invalid path" errors).
        const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
        const rand = Math.random().toString(36).slice(2)
        const path = `public/${rand}.${ext}`

        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          })
        if (upErr) throw upErr

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)

        const { error: insErr } = await supabase.from('gallery').insert({
          url: pub.publicUrl,
          in_slider: inSlider,
          uploaded_by_public: true,
        })
        if (insErr) throw insErr
      }
      setState('done')
      setMsg('Foto terkirim, terima kasih!')
      onUploaded?.()
      setTimeout(() => setState('idle'), 2500)
    } catch (err) {
      setState('error')
      setMsg(err.message || 'Gagal upload')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={handleFiles}
      />
      <button
        type="button"
        className="btn-primary w-full"
        disabled={state === 'uploading'}
        onClick={() => inputRef.current?.click()}
      >
        {state === 'uploading' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : state === 'done' ? (
          <Check className="h-5 w-5" />
        ) : (
          <Camera className="h-5 w-5" />
        )}
        {state === 'uploading' ? 'Mengupload…' : label}
      </button>
      {msg && (
        <p
          className={cnMsg(state)}
          role={state === 'error' ? 'alert' : 'status'}
        >
          {msg}
        </p>
      )}
    </div>
  )
}

function cnMsg(state) {
  return (
    'mt-2 text-center text-sm ' +
    (state === 'error' ? 'text-destructive' : 'text-success')
  )
}
