'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { NAV, isActivePath } from '@/lib/nav'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'

/*
  Desktop-only vertical rail (hidden below lg, where BottomNav rules).
  Thin by default (84px), expands to 224px on hover to reveal labels.
  Active item glows; icons lift on hover. Fixed so page content never reflows.
*/
export function SideNav() {
  const pathname = usePathname()

  return (
    <aside
      aria-label="Navigasi samping"
      className="rail fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card/80 backdrop-blur-xl lg:flex"
    >
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-3 overflow-hidden px-[22px] py-5"
        aria-label="ClassHub, ke Beranda"
      >
        <span className="ch-float grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-elevated">
          <GraduationCap className="h-6 w-6" />
        </span>
        <span className="rail-label leading-none">
          <span className="block text-[15px] font-extrabold tracking-tight">ClassHub</span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            XI Saintek 2
          </span>
        </span>
      </Link>

      {/* Links */}
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 overflow-hidden rounded-xl py-2.5 pl-[13px] pr-3 transition',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-lg transition',
                  active
                    ? 'ch-glow bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                    : 'bg-muted text-current group-hover:scale-105'
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="rail-label text-sm font-semibold">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Theme switch */}
      <div className="flex items-center gap-3 overflow-hidden px-[26px] py-5">
        <ThemeToggle />
        <span className="rail-label text-xs font-medium text-muted-foreground">Ganti tema</span>
      </div>
    </aside>
  )
}
