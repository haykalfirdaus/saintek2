'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Wallet, Images, CircleUser } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/tugas', label: 'Tugas', icon: ClipboardList },
  { href: '/kas', label: 'Kas', icon: Wallet },
  { href: '/galeri', label: 'Galeri', icon: Images },
  { href: '/akun', label: 'Akun', icon: CircleUser },
]

// Fixed bottom navigation — thumb-zone reachable, respects safe-area inset.
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigasi utama"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-lg"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'tap-target flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-6 w-6 transition', active && 'scale-110')} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
