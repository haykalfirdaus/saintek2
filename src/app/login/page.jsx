'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogIn, Loader2, GraduationCap } from 'lucide-react'

// Login khusus SISWA / Guru Mapel / Wali Kelas. Admin/pengurus lewat /admin.
export default function StudentLoginPage() {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Login Akun</h1>
        <p className="text-sm text-muted-foreground">XI Saintek 2 — Siswa &amp; Guru</p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email" required autoComplete="email" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="input-field" placeholder="nama.1@kelas.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="input-field" placeholder="••••••••"
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

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Kredensial default dibagikan oleh pengurus kelas.
      </p>
      <a href="/" className="mt-2 text-center text-sm text-muted-foreground hover:text-foreground">
        ← Kembali ke halaman utama
      </a>
    </div>
  )
}
