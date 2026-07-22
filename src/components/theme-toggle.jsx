'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle({ className = '' }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const current = mounted ? resolvedTheme : undefined

  return (
    <button
      type="button"
      aria-label="Ganti tema"
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
      className={`tap-target grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-foreground transition active:scale-95 hover:bg-muted ${className}`}
    >
      {current === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  )
}
