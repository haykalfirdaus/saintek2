'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

/*
  Foto yang bisa ditekan → buka fullscreen lightbox dengan zoom.
  - Desktop: scroll wheel zoom, drag geser.
  - HP: pinch (2 jari) zoom, double-tap zoom, 1 jari geser saat ter-zoom.
  Zoom ini KHUSUS fotonya, tidak mempengaruhi zoom halaman web.
*/
export function ZoomableImage({ src, alt = '', className = '', imgClassName = '' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-zoom-in ${className}`}
        loading="lazy"
        draggable={false}
        onClick={() => setOpen(true)}
      />
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  )
}

function Lightbox({ src, alt, onClose }) {
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const gesture = useRef({ mode: null, startDist: 0, startScale: 1, lastX: 0, lastY: 0, lastTap: 0 })

  // Kunci scroll body selama lightbox terbuka.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function clampScale(s) { return Math.min(5, Math.max(1, s)) }

  function reset() { setScale(1); setTx(0); setTy(0) }

  function onWheel(e) {
    e.preventDefault()
    setScale((s) => {
      const ns = clampScale(s - e.deltaY * 0.002)
      if (ns === 1) { setTx(0); setTy(0) }
      return ns
    })
  }

  function dist(t) {
    const dx = t[0].clientX - t[1].clientX
    const dy = t[0].clientY - t[1].clientY
    return Math.hypot(dx, dy)
  }

  function onTouchStart(e) {
    const g = gesture.current
    if (e.touches.length === 2) {
      g.mode = 'pinch'
      g.startDist = dist(e.touches)
      g.startScale = scale
    } else if (e.touches.length === 1) {
      // double-tap → toggle zoom
      const now = Date.now()
      if (now - g.lastTap < 280) {
        if (scale > 1) reset()
        else setScale(2.5)
        g.lastTap = 0
      } else {
        g.lastTap = now
      }
      g.mode = 'pan'
      g.lastX = e.touches[0].clientX
      g.lastY = e.touches[0].clientY
    }
  }

  function onTouchMove(e) {
    const g = gesture.current
    if (g.mode === 'pinch' && e.touches.length === 2) {
      e.preventDefault()
      const ns = clampScale(g.startScale * (dist(e.touches) / g.startDist))
      setScale(ns)
      if (ns === 1) { setTx(0); setTy(0) }
    } else if (g.mode === 'pan' && e.touches.length === 1 && scale > 1) {
      e.preventDefault()
      const t = e.touches[0]
      setTx((x) => x + (t.clientX - g.lastX))
      setTy((y) => y + (t.clientY - g.lastY))
      g.lastX = t.clientX
      g.lastY = t.clientY
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 animate-fade-in"
      role="dialog" aria-modal="true"
      onClick={onClose}
    >
      <button
        className="tap-target absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur active:scale-90"
        onClick={onClose} aria-label="Tutup"
      >
        <X className="h-6 w-6" />
      </button>

      <div
        className="h-full w-full touch-none overflow-hidden"
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => (scale > 1 ? reset() : setScale(2.5))}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="mx-auto h-full w-full select-none object-contain"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: gesture.current.mode ? 'none' : 'transform 0.15s ease-out',
            cursor: scale > 1 ? 'grab' : 'zoom-in',
          }}
        />
      </div>

      {scale > 1 && (
        <button
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-4 py-2 text-sm text-white backdrop-blur"
          onClick={(e) => { e.stopPropagation(); reset() }}
        >
          Reset zoom
        </button>
      )}
    </div>
  )
}
