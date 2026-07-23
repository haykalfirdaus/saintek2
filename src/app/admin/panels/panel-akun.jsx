'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { ROLE_LABEL } from '@/lib/roles'
import { UserPlus, KeyRound, Trash2, Mail } from 'lucide-react'
import { useConfirm } from '@/components/confirm-dialog'

// Manajemen Akun (developer): buat admin, ganti email & password tanpa verifikasi email.
export function PanelAkun() {
  const supabase = createClient()
  const confirm = useConfirm()
  const [admins, setAdmins] = useState([])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  const [create, setCreate] = useState({ email: '', password: '', full_name: '', role: 'sekretaris' })
  const [pw, setPw] = useState({}) // userId -> new password
  const [emailEdit, setEmailEdit] = useState({}) // userId -> new email
  const [currentId, setCurrentId] = useState(null)
  const [filterRole, setFilterRole] = useState('') // '' = belum pilih → list disembunyikan

  async function load() {
    // Ambil daftar admin + email via API (email tersimpan di auth.users).
    try {
      const { admins } = await callApi('list', {})
      setAdmins(admins ?? [])
    } catch {
      const { data } = await supabase.from('profiles').select('*').order('created_at')
      setAdmins(data ?? [])
    }
  }
  useEffect(() => {
    load()
    supabase.auth.getUser().then(({ data }) => setCurrentId(data?.user?.id ?? null))
  }, [])
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
    const ok = await confirm({
      title: 'Buat Akun Admin?',
      message: `Buat akun ${ROLE_LABEL[create.role]} untuk ${create.email}?`,
    })
    if (!ok) return
    setLoading(true)
    try {
      await callApi('create', create)
      setCreate({ email: '', password: '', full_name: '', role: 'sekretaris' })
      notify('Akun admin dibuat'); load()
    } catch (e) { notify(e.message, 'error') } finally { setLoading(false) }
  }

  async function changePassword(userId, nama) {
    const password = pw[userId]
    if (!password || password.length < 6) return notify('Password minimal 6 karakter', 'error')
    const ok = await confirm({
      title: 'Ganti Password?',
      message: `Ganti password untuk ${nama}? Password lama tidak bisa dikembalikan.`,
      danger: true,
      confirmText: 'Ya, Ganti',
    })
    if (!ok) return
    setLoading(true)
    try {
      await callApi('set_password', { userId, password })
      setPw((p) => ({ ...p, [userId]: '' }))
      notify('Password diganti')
    } catch (e) { notify(e.message, 'error') } finally { setLoading(false) }
  }

  async function changeEmail(userId, nama) {
    const email = (emailEdit[userId] || '').trim()
    if (!email || !email.includes('@')) return notify('Email tidak valid', 'error')
    const ok = await confirm({
      title: 'Ganti Email?',
      message: `Ganti email untuk ${nama} menjadi ${email}?`,
      confirmText: 'Ya, Ganti',
    })
    if (!ok) return
    setLoading(true)
    try {
      await callApi('set_email', { userId, email })
      setEmailEdit((p) => ({ ...p, [userId]: '' }))
      notify('Email diganti'); load()
    } catch (e) { notify(e.message, 'error') } finally { setLoading(false) }
  }

  async function changeRole(userId, role, nama) {
    const ok = await confirm({
      title: 'Ubah Role?',
      message: `Ubah role ${nama} menjadi ${ROLE_LABEL[role]}?`,
    })
    if (!ok) { load(); return } // reset select ke nilai semula
    try { await callApi('set_role', { userId, role }); load() }
    catch (e) { notify(e.message, 'error') }
  }

  async function deleteAccount(userId, nama) {
    const ok = await confirm({
      title: 'Hapus Akun?',
      message: `Hapus akun "${nama}" permanen? Akun tidak bisa login lagi & tidak bisa dikembalikan.`,
      danger: true, confirmText: 'Ya, Hapus',
    })
    if (!ok) return
    try { await callApi('delete', { userId }); notify('Akun dihapus'); load() }
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

      {/* Cari berdasarkan role dulu, baru tampilkan list */}
      <div className="card mb-3 p-3">
        <label className="mb-1 block text-sm font-medium">Cari akun berdasarkan role</label>
        <select
          className="input-field"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">— Pilih role dulu —</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {!filterRole ? (
        <p className="card p-4 text-sm text-muted-foreground">
          Pilih role di atas untuk menampilkan daftar akun.
        </p>
      ) : (
      /* Daftar akun sesuai role terpilih + ganti password */
      <div className="space-y-2">
        {admins.filter((a) => a.role === filterRole).length === 0 && (
          <p className="card p-4 text-sm text-muted-foreground">
            Tidak ada akun dengan role {ROLE_LABEL[filterRole]}.
          </p>
        )}
        {admins.filter((a) => a.role === filterRole).map((a) => (
          <div key={a.id} className="card space-y-2 p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{a.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{a.email || '—'}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABEL[a.role]}</p>
              </div>
              <select className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                value={a.role} onChange={(e) => changeRole(a.id, e.target.value, a.full_name)}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input className="input-field py-2 text-sm" type="email" placeholder="Email baru"
                value={emailEdit[a.id] || ''} onChange={(e) => setEmailEdit((p) => ({ ...p, [a.id]: e.target.value }))} />
              <button className="btn-primary px-3" onClick={() => changeEmail(a.id, a.full_name)} title="Ganti email">
                <Mail className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input className="input-field py-2 text-sm" placeholder="Password baru"
                value={pw[a.id] || ''} onChange={(e) => setPw((p) => ({ ...p, [a.id]: e.target.value }))} />
              <button className="btn-primary px-3" onClick={() => changePassword(a.id, a.full_name)} title="Ganti password">
                <KeyRound className="h-4 w-4" />
              </button>
              {a.id !== currentId && (
                <button
                  className="grid min-h-[44px] w-11 place-items-center rounded-lg border border-destructive/40 text-destructive transition active:scale-95 hover:bg-destructive/10"
                  onClick={() => deleteAccount(a.id, a.full_name)} title="Hapus akun"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
