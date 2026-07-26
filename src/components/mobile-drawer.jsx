'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCap, Menu, X } from 'lucide-react'
import { NAV, isActivePath } from '@/lib/nav'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'

/*
  Mobile-only hamburger + slide-in navigation drawer.
  Hidden on desktop (lg+) where the SideNav rail rules. Mirrors the same NAV
  as SideNav/BottomNav, plus the ClassHub brand + theme switch.

  A11y: modal dialog, Escape closes, body scroll-locked while open, focus moves
  into the panel on open and returns to the trigger on close, route change
  auto-closes. Slide animation is disabled under prefers-reduced-motion (CSS).
*/
export function MobileDrawer() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  // Close on route change so the drawer never lingers after navigating.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Scroll-lock + Escape + focus handling while open.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)

    // Move focus into the panel (first focusable = close button).
    const t = setTimeout(() => {
      panelRef.current?.querySelector('button, a')?.focus()
    }, 0)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
      // Return focus to the trigger for keyboard users.
      triggerRef.current?.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Buka menu navigasi"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="tap-target grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-foreground transition active:scale-95 hover:bg-muted lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Tutup menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm animate-fade-in"
          />

          {/* Panel */}
          <aside
            ref={panelRef}
            className="ch-drawer-panel pt-safe pb-safe absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col border-r border-border bg-card shadow-elevated"
          >
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-elevated">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <div className="leading-none">
                  <p className="text-[15px] font-extrabold tracking-tight">ClassHub</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    XI Saintek 2
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setOpen(false)}
                className="tap-target grid h-10 w-10 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = isActivePath(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-lg transition',
                        active
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center justify-between border-t border-border px-5 py-4">
              <span className="text-xs font-medium text-muted-foreground">Ganti tema</span>
              <ThemeToggle />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
