'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV, isActivePath } from '@/lib/nav'
import { cn } from '@/lib/utils'

// Fixed bottom navigation — thumb-zone reachable, respects safe-area inset.
// Hidden on desktop (lg+) where the SideNav rail takes over.
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigasi utama"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-lg lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'tap-target relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {active && (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />
                )}
                <Icon className={cn('h-6 w-6 transition-transform duration-300', active && '-translate-y-0.5 scale-110')} />
                {label === 'Beranda' ? 'Home' : label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
