'use client'

import { Loader2, UserCircle2 } from 'lucide-react'
import { ROLE_LABEL } from '@/lib/roles'

// Tiny shared bits reused across admin panels.

// Badge kecil menampilkan role pembuat (tugas/pengumuman).
export function RoleBadge({ role, className = '' }) {
  if (!role) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ${className}`}>
      <UserCircle2 className="h-3 w-3" />
      {ROLE_LABEL[role] || role}
    </span>
  )
}

export function PanelHeader({ title, desc }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
    </div>
  )
}

export function Toast({ msg, type = 'success' }) {
  if (!msg) return null
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={
        'mb-3 rounded-lg px-3 py-2 text-sm ' +
        (type === 'error'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-success/10 text-success')
      }
    >
      {msg}
    </div>
  )
}

export function SaveButton({ loading, children = 'Simpan', ...props }) {
  return (
    <button className="btn-primary" disabled={loading} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
