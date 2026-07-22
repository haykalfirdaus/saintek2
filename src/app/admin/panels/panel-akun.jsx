'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { ROLE_LABEL } from '@/lib/roles'
import { UserPlus, KeyRound } from 'lucide-react'

// Manajemen Akun (developer): buat admin & ganti password tanpa verifikasi email.
export function PanelAkun() {
  const supabase = createClient()
  const [admins, setAdmins] = useState([])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  const [create, setCreate] = useState({ email: '', password: '', full_name: '', role: 'sekretaris' })
  const [pw, setPw] = useState({}) // userId -> new password

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setAdmins(data ?? [])
  }
  useEffect(() => { load() }, [])
  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  async function callApi(action, body) {
    const res = await fetch('/api/admin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Gagal')
    return json
  }

  async function createAdmin() {
    if (!create.email || !create.password) return notify('Email & password wajib', 'error')
    setLoading(true)
    try {
      await callApi('create', create)
      setCreate({ email: '', password: '', full_name: '', role: 'sekretaris' })
      notify('Akun admin dibuat'); load()
    } catch (e) { notify(e.message, 'error') } finally { setLoading(false) }
  }

  async function changePassword(userId) {
    const password = pw[userId]
    if (!password || password.length < 6) return notify('Password minimal 6 karakter', 'error')
    setLoading(true)
    try {
      await callApi('set_password', { userId, password })
      setPw((p) => ({ ...p, [userId]: '' }))
      notify('Password diganti')
    } catch (e) { notify(e.message, 'error') } finally { setLoading(false) }
  }

  async function changeRole(userId, role) {
    try { await callApi('set_role', { userId, role }); load() }
    catch (e) { notify(e.message, 'error') }
  }

  return (
    <div>
      <PanelHeader title="Manajemen Akun" desc="Buat admin & ganti password langsung (tanpa verifikasi email)." />
      <Toast {...(toast || {})} />

      {/* Buat akun */}
      <div className="card mb-5 space-y-3 p-4">
        <p className="section-title"><UserPlus className="h-4 w-4" /> Buat Akun Admin</p>
        <input className="input-field" placeholder="Email" value={create.email}
          onChange={(e) => setCreate((c) => ({ ...c, email: e.target.value }))} />
        <input className="input-field" placeholder="Nama lengkap" value={create.full_name}
          onChange={(e) => setCreate((c) => ({ ...c, full_name: e.target.value }))} />
        <input className="input-field" type="text" placeholder="Password" value={create.password}
          onChange={(e) => setCreate((c) => ({ ...c, password: e.target.value }))} />
        <select className="input-field" value={create.role}
          onChange={(e) => setCreate((c) => ({ ...c, role: e.target.value }))}>
          {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <SaveButton loading={loading} onClick={createAdmin}>Buat Akun</SaveButton>
      </div>

      {/* Daftar admin + ganti password */}
      <div className="space-y-2">
        {admins.map((a) => (
          <div key={a.id} className="card space-y-2 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{a.full_name}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABEL[a.role]}</p>
              </div>
              <select className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                defaultValue={a.role} onChange={(e) => changeRole(a.id, e.target.value)}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input className="input-field py-2 text-sm" placeholder="Password baru"
                value={pw[a.id] || ''} onChange={(e) => setPw((p) => ({ ...p, [a.id]: e.target.value }))} />
              <button className="btn-primary px-3" onClick={() => changePassword(a.id)}>
                <KeyRound className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
