'use client'

import { useEffect, useRef, useState } from 'react'

/*
  Lottie micro-interaction with a graceful, accessible fallback.

  - SSR / first paint: renders the provided Lucide `fallback` icon so there is
    never a blank box and no hydration mismatch.
  - prefers-reduced-motion: stays on the static fallback, never loads Lottie.
  - Otherwise: lazy-loads lottie-web (light SVG player) + the JSON, plays only
    while the element is on screen (IntersectionObserver), pauses off-screen.
  - Recolors every stroke/fill to the element's computed `color`, so the art
    matches the icon chip across all three themes, and reloads on theme switch.

  Props:
    src       path under /public (e.g. "/lottie/bell.json")
    fallback  a Lucide icon component (shown before/without animation)
    loop      loop the animation (default true)
    className sizing/color classes on the wrapper (its color drives the art)
*/
export function LottieIcon({ src, fallback: Fallback, loop = true, className = '' }) {
  const hostRef = useRef(null)
  const animRef = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return // keep the static fallback

    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let io = null
    let themeObserver = null
    let sourceData = null
    let lottie = null
    let lastColor = ''

    function build() {
      if (cancelled || !hostRef.current || !sourceData || !lottie) return
      const color = readColor(hostRef.current)
      lastColor = color.key
      const data = recolor(sourceData, color.rgb)

      if (animRef.current) {
        animRef.current.destroy()
        animRef.current = null
      }
      animRef.current = lottie.loadAnimation({
        container: hostRef.current,
        renderer: 'svg',
        loop,
        autoplay: true,
        animationData: data,
        rendererSettings: { progressiveLoad: false },
      })
      setActive(true)
    }

    async function start() {
      lottie = (await import('lottie-web/build/player/lottie_light')).default
      if (cancelled) return
      const res = await fetch(src)
      sourceData = await res.json()
      if (cancelled) return

      build()

      // Play only while visible.
      io = new IntersectionObserver(
        (entries) => {
          if (!animRef.current) return
          if (entries[0].isIntersecting) animRef.current.play()
          else animRef.current.pause()
        },
        { threshold: 0.2 }
      )
      io.observe(host)

      // Reload with fresh color when the theme class changes.
      themeObserver = new MutationObserver(() => {
        if (readColor(hostRef.current).key !== lastColor) build()
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }

    start()

    return () => {
      cancelled = true
      if (io) io.disconnect()
      if (themeObserver) themeObserver.disconnect()
      if (animRef.current) {
        animRef.current.destroy()
        animRef.current = null
      }
    }
  }, [src, loop])

  return (
    <span className={`relative grid place-items-center ${className}`}>
      {Fallback && !active && <Fallback className="h-full w-full" />}
      <span ref={hostRef} aria-hidden="true" className={active ? 'h-full w-full' : 'sr-only'} />
    </span>
  )
}

// Resolve the element's computed text color to a normalized [r,g,b] triplet.
function readColor(el) {
  const cs = getComputedStyle(el).color || 'rgb(0,0,0)'
  const m = cs.match(/\d+(\.\d+)?/g) || [0, 0, 0]
  const rgb = [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255]
  return { rgb, key: cs }
}

// Deep-clone the Bodymovin doc and set every static fill/stroke color to `rgb`,
// preserving each shape's fill-vs-stroke role (we only change the color value).
function recolor(data, rgb) {
  const clone = JSON.parse(JSON.stringify(data))
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk)
    if (!node || typeof node !== 'object') return
    if ((node.ty === 'fl' || node.ty === 'st') && node.c && node.c.a === 0) {
      const a = Array.isArray(node.c.k) ? node.c.k[3] : 1
      node.c.k = [rgb[0], rgb[1], rgb[2], a == null ? 1 : a]
    }
    if (node.it) walk(node.it)
    if (node.shapes) walk(node.shapes)
    if (node.layers) walk(node.layers)
  }
  walk(clone.layers)
  return clone
}
