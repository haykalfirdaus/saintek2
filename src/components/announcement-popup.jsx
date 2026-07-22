'use client'

import { useEffect, useState } from 'react'
import { Megaphone, X } from 'lucide-react'

/*
  Big centered popup shown on first open. The "Okeii Noted" button closes it.
  Uses sessionStorage so it appears once per browser session per popup id.
*/
export function AnnouncementPopup({ popup }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!popup) return
    const key = `popup-seen-${popup.id}`
    if (!sessionStorage.getItem(key)) setOpen(true)
  }, [popup])

  if (!popup || !open) return null

  function close() {
    sessionStorage.setItem(`popup-seen-${popup.id}`, '1')
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div className="card w-full max-w-sm p-6 shadow-elevated animate-pop-in">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
          <Megaphone className="h-7 w-7" />
        </div>
        <h2 id="popup-title" className="text-center text-xl font-bold">
          {popup.judul || 'Pengumuman'}
        </h2>
        {popup.dari && (
          <p className="mt-1 text-center text-sm text-muted-foreground">
            dari {popup.dari}
          </p>
        )}
        <p className="mt-3 whitespace-pre-wrap text-center text-card-foreground">
          {popup.isi}
        </p>

        {Array.isArray(popup.media_urls) && popup.media_urls.length > 0 && (
          <img
            src={popup.media_urls[0]}
            alt=""
            className="mt-4 max-h-56 w-full rounded-lg object-cover"
          />
        )}

        <button className="btn-primary mt-6 w-full" onClick={close}>
          <X className="h-5 w-5" />
          Okeii Noted
        </button>
      </div>
    </div>
  )
}
