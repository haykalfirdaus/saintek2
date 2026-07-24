'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Leaf, Moon } from 'lucide-react'

/*
  Cycles through the three ClassHub themes: Biru -> Hijau -> Gelap -> Biru.
  Same small footprint as before, so every existing placement keeps working.
*/
const ORDER = ['biru', 'hijau', 'dark']
const META = {
  biru: { icon: Sun, label: 'Tema Biru', next: 'Hijau' },
  hijau: { icon: Leaf, label: 'Tema Hijau', next: 'Gelap' },
  dark: { icon: Moon, label: 'Tema Gelap', next: 'Biru' },
}

export function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const current = mounted && ORDER.includes(theme) ? theme : 'biru'
  const { icon: Icon, next } = META[current]

  return (
    <button
      type="button"
      aria-label={`Ganti tema (berikutnya: ${next})`}
      title={`Ganti ke ${next}`}
      onClick={() => {
        const i = ORDER.indexOf(current)
        setTheme(ORDER[(i + 1) % ORDER.length])
      }}
      className={`tap-target grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-foreground transition active:scale-95 hover:bg-muted ${className}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
