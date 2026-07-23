'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'
import { PasswordInput } from '@/components/password-input'
import { LogIn, Loader2, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Pisahkan jalur: HANYA akun admin/pengurus (punya baris profiles) yang
    // boleh masuk lewat sini. Akun siswa/guru/wali ditolak & diarahkan ke /login.
    const { data: profile } = await supabase
      .from('profiles').select('id').eq('id', data.user.id).maybeSingle()
    if (!profile) {
      await supabase.auth.signOut()
      setError('Akun ini bukan akun admin. Silakan login di halaman siswa.')
      setLoading(false)
      return
    }
    router.replace('/admin')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">XI Saintek 2</p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="input-field" placeholder="admin@kelas.sch.id"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <PasswordInput
            required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          Masuk
        </button>
      </form>

      <a href="/" className="mt-4 text-center text-sm text-muted-foreground hover:text-foreground">
        ← Kembali ke halaman utama
      </a>
    </div>
  )
}
