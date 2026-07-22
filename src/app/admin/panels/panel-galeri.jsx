'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast } from '@/components/ui-bits'
import { Trash2, Loader2, ImageOff } from 'lucide-react'
import { useConfirm } from '@/components/confirm-dialog'
import { ZoomableImage } from '@/components/zoomable-image'

// Kelola Galeri (khusus developer): hapus foto dari DB + file di Storage.
export function PanelGaleri() {
  const supabase = createClient()
  const confirm = useConfirm()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [toast, setToast] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function notify(msg, type = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2500)
  }

  // Ambil path object di dalam bucket dari public URL.
  function pathFromUrl(url) {
    const marker = '/storage/v1/object/public/gallery/'
    const i = url.indexOf(marker)
    return i === -1 ? null : url.slice(i + marker.length)
  }

  async function remove(photo) {
    const ok = await confirm({ title: 'Hapus Foto?', message: 'Foto akan dihapus permanen dari galeri & storage.', danger: true, confirmText: 'Ya, Hapus' })
    if (!ok) return
    setDeleting(photo.id)
    try {
      // 1) hapus file fisik di Storage (kalau path terbaca)
      const path = pathFromUrl(photo.url)
      if (path) await supabase.storage.from('gallery').remove([path])
      // 2) hapus baris metadata
      const { error } = await supabase.from('gallery').delete().eq('id', photo.id)
      if (error) throw error
      setPhotos((ps) => ps.filter((p) => p.id !== photo.id))
      notify('Foto dihapus')
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  async function toggleSlider(photo) {
    const { error } = await supabase
      .from('gallery')
      .update({ in_slider: !photo.in_slider })
      .eq('id', photo.id)
    if (error) return notify(error.message, 'error')
    setPhotos((ps) => ps.map((p) => p.id === photo.id ? { ...p, in_slider: !p.in_slider } : p))
  }

  return (
    <div>
      <PanelHeader title="Kelola Galeri" desc="Hapus foto & atur foto slideshow. Khusus developer." />
      <Toast {...(toast || {})} />

      {loading ? (
        <div className="grid place-items-center py-10 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : photos.length ? (
        <>
          <p className="mb-3 text-sm text-muted-foreground">{photos.length} foto</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <div key={p.id} className="card overflow-hidden">
                <ZoomableImage src={p.url} alt={p.caption || ''} className="aspect-square w-full object-cover" />
                <div className="flex items-center justify-between gap-1 p-2">
                  <button
                    onClick={() => toggleSlider(p)}
                    className={
                      'rounded px-2 py-1 text-[11px] font-medium ' +
                      (p.in_slider ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')
                    }
                    title="Tampilkan di slideshow?"
                  >
                    {p.in_slider ? 'Slideshow' : 'Statis'}
                  </button>
                  <button
                    onClick={() => remove(p)}
                    disabled={deleting === p.id}
                    className="grid h-8 w-8 place-items-center rounded text-destructive hover:bg-destructive/10"
                    aria-label="Hapus foto"
                  >
                    {deleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card grid place-items-center gap-2 py-10 text-muted-foreground">
          <ImageOff className="h-7 w-7" />
          <span className="text-sm">Belum ada foto.</span>
        </div>
      )}
    </div>
  )
}
