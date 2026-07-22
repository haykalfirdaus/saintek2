'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { ZoomableImage } from '@/components/zoomable-image'

/*
  Auto-playing, swipeable slideshow. Manual swipe/drag & arrow buttons pause
  auto-play briefly. Works with touch (mobile) and mouse.
*/
export function GallerySlider({ photos = [], autoPlayMs = 3500, className = '' }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef(null)
  const startX = useRef(null)

  const count = photos.length

  useEffect(() => {
    if (count <= 1 || paused) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, autoPlayMs)
    return () => clearInterval(id)
  }, [count, paused, autoPlayMs])

  if (count === 0) {
    return (
      <div className={`card grid h-56 place-items-center text-muted-foreground ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="h-8 w-8" />
          <span className="text-sm">Belum ada foto</span>
        </div>
      </div>
    )
  }

  const go = (dir) => {
    setPaused(true)
    setIndex((i) => (i + dir + count) % count)
    setTimeout(() => setPaused(false), 6000)
  }

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    setPaused(true)
  }
  const onTouchEnd = (e) => {
    if (startX.current == null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (Math.abs(dx) > 40) setIndex((i) => (i + (dx < 0 ? 1 : -1) + count) % count)
    startX.current = null
    setTimeout(() => setPaused(false), 6000)
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-border bg-card shadow-card ${className}`}>
      <div
        ref={trackRef}
        className="flex h-56 transition-transform duration-500 ease-out sm:h-64"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {photos.map((p, i) => (
          <div key={p.id ?? i} className="relative h-full w-full shrink-0">
            <ZoomableImage
              src={p.url}
              alt={p.caption || `Foto ${i + 1}`}
              className="h-full w-full object-cover"
            />
            {p.caption && (
              <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                {p.caption}
              </span>
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            aria-label="Sebelumnya"
            onClick={() => go(-1)}
            className="tap-target absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur active:scale-90"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Berikutnya"
            onClick={() => go(1)}
            className="tap-target absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur active:scale-90"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
