import { Home, ClipboardList, Wallet, Images, CircleUser } from 'lucide-react'

// Single source of truth for primary navigation — shared by the mobile
// BottomNav and the desktop SideNav rail so they never drift apart.
export const NAV = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/tugas', label: 'Tugas', icon: ClipboardList },
  { href: '/kas', label: 'Kas', icon: Wallet },
  { href: '/galeri', label: 'Galeri', icon: Images },
  { href: '/akun', label: 'Akun', icon: CircleUser },
]

// Active-route test shared by both navs (exact match for home, prefix else).
export function isActivePath(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
