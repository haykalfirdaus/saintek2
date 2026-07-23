'use client'

import { useState } from 'react'
import { signOut } from './actions'
import { ROLE_LABEL, PREVIEW_ROLES, can, isReadOnly } from '@/lib/roles'
import { ThemeToggle } from '@/components/theme-toggle'
import { ConfirmProvider } from '@/components/confirm-dialog'
import {
  Users, Brush, BookOpen, CalendarOff, ClipboardList, Wallet,
  Megaphone, MonitorSmartphone, KeyRound, LogOut, ShieldCheck, Images,
  AlertTriangle, UserCog, CalendarCheck, IdCard, Eye, Lock,
} from 'lucide-react'

import { PanelSiswa } from './panels/panel-siswa'
import { PanelPiket } from './panels/panel-piket'
import { PanelMapel } from './panels/panel-mapel'
import { PanelLibur } from './panels/panel-libur'
import { PanelTugas } from './panels/panel-tugas'
import { PanelKas } from './panels/panel-kas'
import { PanelPengumuman } from './panels/panel-pengumuman'
import { PanelPopup } from './panels/panel-popup'
import { PanelAkun } from './panels/panel-akun'
import { PanelAkunSaya } from './panels/panel-akun-saya'
import { PanelGaleri } from './panels/panel-galeri'
import { PanelAbsensi } from './panels/panel-absensi'
import { PanelProvisioning } from './panels/panel-provisioning'

const TABS = [
  { key: 'siswa', label: 'Siswa', icon: Users, cap: 'siswa', C: PanelSiswa },
  { key: 'absensi', label: 'Absensi', icon: CalendarCheck, cap: 'absensi', C: PanelAbsensi },
  { key: 'provisioning', label: 'Akun Siswa', icon: IdCard, cap: 'provisioning', C: PanelProvisioning },
  { key: 'piket', label: 'Piket', icon: Brush, cap: 'piket', C: PanelPiket },
  { key: 'mapel', label: 'Mapel', icon: BookOpen, cap: 'mapel', C: PanelMapel },
  { key: 'libur', label: 'Libur', icon: CalendarOff, cap: 'libur', C: PanelLibur },
  { key: 'tugas', label: 'Tugas', icon: ClipboardList, cap: 'tugas', C: PanelTugas },
  { key: 'kas', label: 'Kas', icon: Wallet, cap: 'kas', C: PanelKas },
  { key: 'pengumuman', label: 'Pengumuman', icon: Megaphone, cap: 'pengumuman', C: PanelPengumuman },
  { key: 'popup', label: 'Popup Besar', icon: MonitorSmartphone, cap: 'popup', C: PanelPopup },
  { key: 'galeri', label: 'Kelola Galeri', icon: Images, cap: 'galeri', C: PanelGaleri },
  { key: 'akun', label: 'Akun Admin', icon: KeyRound, cap: 'akun', C: PanelAkun },
  { key: 'akun_saya', label: 'Akun Saya', icon: UserCog, cap: 'akun_saya', C: PanelAkunSaya },
]

export function AdminDashboard({ role, name }) {
  const isDev = role === 'developer'
  // "Lihat sebagai" — developer bisa pratinjau panel milik role lain.
  const [viewAs, setViewAs] = useState('') // '' = diri sendiri (developer)
  const effectiveRole = isDev && viewAs ? viewAs : role
  const preview = isDev && !!viewAs
  const readOnly = isReadOnly(effectiveRole)

  const allowed = TABS.filter((t) => can(effectiveRole, t.cap))
  const [active, setActive] = useState(allowed[0]?.key)
  // Saat ganti "lihat sebagai", pastikan tab aktif tetap valid.
  const activeTab = allowed.find((t) => t.key === active) || allowed[0]
  const ActivePanel = activeTab?.C

  function changeViewAs(v) {
    setViewAs(v)
    const next = TABS.filter((t) => can(v || role, t.cap))
    setActive(next[0]?.key)
  }

  return (
    <ConfirmProvider>
    <div className="mx-auto min-h-dvh w-full max-w-2xl pb-10">
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">{name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={signOut}>
              <button className="btn-ghost h-10 px-3 text-sm" type="submit">
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </form>
          </div>
        </div>

        {/* Developer: Lihat sebagai role lain (pratinjau fitur) */}
        {isDev && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
            <label className="text-sm font-medium text-muted-foreground">Lihat sebagai</label>
            <select
              value={viewAs}
              onChange={(e) => changeViewAs(e.target.value)}
              className="ml-auto rounded-md border border-border bg-background px-2 py-1 text-sm"
            >
              <option value="">Developer (saya)</option>
              {PREVIEW_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
        )}

        {/* Banner mode pratinjau */}
        {preview && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
            <Eye className="h-4 w-4 shrink-0" />
            Mode pratinjau: {ROLE_LABEL[effectiveRole]}
            {readOnly && ' (read-only)'}
          </div>
        )}

        {/* Banner read-only (mis. wali kelas) */}
        {readOnly && !preview && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" /> Akses hanya-baca — tombol aksi disembunyikan.
          </div>
        )}

        {/* Bendahara wajib banner */}
        {effectiveRole === 'bendahara' && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" /> PERINGATAN: Harus tetap catat manual di buku untuk keamanan data!
          </div>
        )}

        {/* Tab scroller */}
        <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {allowed.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={
                  'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ' +
                  (activeTab?.key === t.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted')
                }
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="px-4 py-5">
        {ActivePanel ? (
          <ActivePanel role={effectiveRole} readOnly={readOnly} />
        ) : (
          <p className="card p-4 text-sm text-muted-foreground">Tidak ada panel yang tersedia untuk role ini.</p>
        )}
      </main>
    </div>
    </ConfirmProvider>
  )
}
