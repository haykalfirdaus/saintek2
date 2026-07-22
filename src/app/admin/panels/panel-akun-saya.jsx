'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { Mail, KeyRound } from 'lucide-react'
import { useConfirm } from '@/components/confirm-dialog'

// Akun Saya: semua role bisa ganti email & password akun sendiri (tanpa verifikasi email).
export function PanelAkunSaya() {
  const supabase = createClient()
  const confirm = useConfirm()
  const [toast, setToast] = useState(null)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingPw, setLoadingPw] = useState(false)
  const [currentEmail, setCurrentEmail] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentEmail(data?.user?.email ?? ''))
  }, [])

  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  async function callApi(body) {
    const res = await fetch('/api/admin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_self', ...body }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Gagal')
    return json
  }

  async function changeEmail() {
    const next = email.trim()
    if (!next || !next.includes('@')) return notify('Email tidak valid', 'error')
    const ok = await confirm({
      title: 'Ganti Email?',
      message: `Ganti email login kamu menjadi ${next}? Gunakan email ini untuk login berikutnya.`,
      confirmText: 'Ya, Ganti',
    })
    if (!ok) return
    setLoadingEmail(true)
    try {
      await callApi({ email: next })
      setCurrentEmail(next); setEmail('')
      notify('Email diganti')
    } catch (e) { notify(e.message, 'error') } finally { setLoadingEmail(false) }
  }

  async function changePassword() {
    if (!pw || pw.length < 6) return notify('Password minimal 6 karakter', 'error')
    const ok = await confirm({
      title: 'Ganti Password?',
      message: 'Ganti password akun kamu? Password lama tidak bisa dikembalikan.',
      danger: true, confirmText: 'Ya, Ganti',
    })
    if (!ok) return
    setLoadingPw(true)
    try {
      await callApi({ password: pw })
      setPw('')
      notify('Password diganti')
    } catch (e) { notify(e.message, 'error') } finally { setLoadingPw(false) }
  }

  return (
    <div>
      <PanelHeader title="Akun Saya" desc="Ganti email & password akun kamu sendiri." />
      <Toast {...(toast || {})} />

      {/* Ganti email */}
      <div className="card mb-4 space-y-3 p-4">
        <p className="section-title"><Mail className="h-4 w-4" /> Ganti Email</p>
        <p className="text-xs text-muted-foreground">Email saat ini: <span className="font-medium text-foreground">{currentEmail || '—'}</span></p>
        <input className="input-field" type="email" placeholder="Email baru"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <SaveButton loading={loadingEmail} onClick={changeEmail}>Ganti Email</SaveButton>
      </div>

      {/* Ganti password */}
      <div className="card space-y-3 p-4">
        <p className="section-title"><KeyRound className="h-4 w-4" /> Ganti Password</p>
        <input className="input-field" type="text" placeholder="Password baru (min. 6 karakter)"
          value={pw} onChange={(e) => setPw(e.target.value)} />
        <SaveButton loading={loadingPw} onClick={changePassword}>Ganti Password</SaveButton>
      </div>
    </div>
  )
}
