'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'
import { Toast } from '@/components/ui-bits'
import {
  GraduationCap, LogOut, MapPin, Loader2, CheckCircle2, XCircle,
  UserCog, Mail, KeyRound, IdCard,
} from 'lucide-react'

// Dashboard akun siswa: profil (email/password/nickname) + absen geolocation.
export function StudentDashboard({ email, student, initialAttendance }) {
  const supabase = createClient()
  const router = useRouter()
  const [toast, setToast] = useState(null)
  const [attendance, setAttendance] = useState(initialAttendance)

  // Profil — siswa hanya boleh ganti password & nama panggilan (email dikunci).
  const [nickname, setNickname] = useState(student?.nickname || student?.nama || '')
  const [newPass, setNewPass] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Absen
  const [locating, setLocating] = useState(false)

  function notify(msg, type = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })
  const sudahAbsenHariIni = attendance?.tanggal === todayISO

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  // ---- Absen via Geolocation ----
  function absen() {
    if (!student) return notify('Akun tidak terhubung ke data siswa.', 'error')
    if (!('geolocation' in navigator)) return notify('Perangkat tidak mendukung lokasi.', 'error')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const { data, error } = await supabase.rpc('check_in', { p_lat: latitude, p_lng: longitude })
        setLocating(false)
        if (error) return notify(error.message, 'error')
        const res = Array.isArray(data) ? data[0] : data
        if (!res?.ok) return notify(res?.message || 'Absen ditolak.', 'error')
        notify(`${res.message} (${res.distance_m} m dari sekolah)`)
        // Refresh status absen hari ini.
        const { data: att } = await supabase
          .from('attendance').select('*')
          .eq('student_id', student.id).eq('tanggal', todayISO).maybeSingle()
        setAttendance(att)
      },
      (err) => {
        setLocating(false)
        notify(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan GPS & izinkan lokasi.'
            : 'Gagal mendapatkan lokasi.',
          'error'
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // ---- Simpan profil ----
  async function saveNickname() {
    setSavingProfile(true)
    const { error } = await supabase.rpc('set_my_nickname', { new_nick: nickname })
    setSavingProfile(false)
    if (error) return notify(error.message, 'error')
    notify('Nama panggilan disimpan')
  }

  async function savePassword() {
    if (!newPass) return notify('Isi password baru.', 'error')
    if (newPass.length < 6) return notify('Password minimal 6 karakter.', 'error')
    setSavingProfile(true)
    try {
      // Siswa hanya boleh ganti PASSWORD (bukan email).
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_self', password: newPass }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal')
      setNewPass('')
      notify('Password diperbarui')
      router.refresh()
    } catch (e) {
      notify(e.message, 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md pb-12">
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none">
                {student?.nickname || student?.nama || 'Akun'}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="btn-ghost h-10 px-3 text-sm" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-5 px-4 py-5">
        <Toast {...(toast || {})} />

        {!student && (
          <p className="card p-4 text-sm text-destructive">
            Akun ini belum tertaut ke data siswa. Hubungi pengurus kelas.
          </p>
        )}

        {/* ---- ABSENSI ---- */}
        <section className="card p-5 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold">Absensi Hari Ini</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Absen hanya berhasil dalam radius 100 m dari sekolah.
          </p>

          {sudahAbsenHariIni ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-success/10 px-3 py-3 text-sm font-semibold text-success">
              <CheckCircle2 className="h-5 w-5" />
              Sudah absen ({attendance.status}
              {attendance.distance_m != null ? ` · ${attendance.distance_m} m` : ''})
            </div>
          ) : (
            <button className="btn-primary w-full" onClick={absen} disabled={locating || !student}>
              {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
              {locating ? 'Mengambil lokasi…' : 'Absen Sekarang'}
            </button>
          )}
        </section>

        {/* ---- PROFIL: NAMA PANGGILAN ---- */}
        <section className="card space-y-3 p-4">
          <p className="section-title"><IdCard className="h-4 w-4" /> Nama Panggilan</p>
          <p className="text-xs text-muted-foreground">
            Nama lengkap: <span className="font-medium text-foreground">{student?.nama || '—'}</span> (tidak bisa diubah)
          </p>
          <div className="flex gap-2">
            <input
              className="input-field py-2 text-sm" placeholder="Nama panggilan"
              value={nickname} onChange={(e) => setNickname(e.target.value)}
              disabled={!student}
            />
            <button className="btn-primary px-4" onClick={saveNickname} disabled={savingProfile || !student}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
            </button>
          </div>
        </section>

        {/* ---- PROFIL: PASSWORD (email dikunci — hanya pengurus yang bisa ubah) ---- */}
        <section className="card space-y-3 p-4">
          <p className="section-title"><KeyRound className="h-4 w-4" /> Ganti Password</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> Email: <span className="font-medium text-foreground">{email}</span> (hanya pengurus yang bisa mengubah)
          </p>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" /> Password baru (min. 6 karakter)
            </label>
            <input
              type="password" className="input-field py-2 text-sm" placeholder="••••••••"
              value={newPass} onChange={(e) => setNewPass(e.target.value)}
            />
          </div>
          <button className="btn-primary w-full" onClick={savePassword} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Simpan Password
          </button>
        </section>
      </main>
    </div>
  )
}
