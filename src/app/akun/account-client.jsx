'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Toast } from '@/components/ui-bits'
import { UploadField } from '@/components/upload-field'
import { PasswordInput } from '@/components/password-input'
import { ROLE_LABEL } from '@/lib/roles'
import {
  CircleUser, LogOut, MapPin, Loader2, CheckCircle2, ShieldCheck,
  UserCog, Mail, KeyRound, IdCard, FileText, HeartPulse, CalendarClock,
} from 'lucide-react'

const STATUS_LABEL = {
  hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', dispen: 'Dispensasi', alpha: 'Alpha',
}

// Halaman Akun: absen (hadir/izin/sakit/dispen) + profil, dengan bottom nav.
export function AccountClient({ email, student, isAdmin, adminRole, initialAttendance }) {
  const supabase = createClient()
  const router = useRouter()
  const [toast, setToast] = useState(null)
  const [attendance, setAttendance] = useState(initialAttendance)

  const [nickname, setNickname] = useState(student?.nickname || student?.nama || '')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [locating, setLocating] = useState(false)

  // Form izin/sakit/dispen
  const [reportType, setReportType] = useState(null) // 'izin'|'sakit'|'dispen'|null
  const [desc, setDesc] = useState('')
  const [foto, setFoto] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' })
  const sudahAbsen = attendance?.tanggal === todayISO

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login'); router.refresh()
  }

  async function refreshToday() {
    if (!student) return
    const { data } = await supabase
      .from('attendance').select('*')
      .eq('student_id', student.id).eq('tanggal', todayISO).maybeSingle()
    setAttendance(data)
  }

  // ---- Absen HADIR via Geolocation ----
  function absenHadir() {
    if (!student) return notify('Akun tidak terhubung ke data siswa.', 'error')
    if (!('geolocation' in navigator)) return notify('Perangkat tidak mendukung lokasi.', 'error')
    if (!window.confirm('Absen HADIR sekarang?\n\nSetelah absen tercatat, kamu TIDAK bisa mengubahnya sendiri (terkunci). Hanya developer yang bisa mengubah.')) return
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
        refreshToday()
      },
      (err) => {
        setLocating(false)
        notify(err.code === err.PERMISSION_DENIED
          ? 'Izin lokasi ditolak. Aktifkan GPS & izinkan lokasi.'
          : 'Gagal mendapatkan lokasi.', 'error')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // ---- Absen IZIN / SAKIT / DISPEN (self report) ----
  async function submitReport() {
    if (!reportType) return
    if (!desc.trim()) return notify('Isi deskripsi dulu.', 'error')
    if (!window.confirm(`Ajukan ${STATUS_LABEL[reportType]} sekarang?\n\nSetelah dikirim, absen TIDAK bisa kamu ubah lagi (terkunci). Hanya developer yang bisa mengubah.`)) return
    setSubmitting(true)
    const { data, error } = await supabase.rpc('self_report', {
      p_status: reportType,
      p_deskripsi: desc.trim(),
      p_foto_url: foto?.url ?? null,
    })
    setSubmitting(false)
    if (error) return notify(error.message, 'error')
    const res = Array.isArray(data) ? data[0] : data
    if (!res?.ok) return notify(res?.message || 'Gagal.', 'error')
    notify('Absen berhasil dicatat.')
    setReportType(null); setDesc(''); setFoto(null)
    refreshToday()
  }

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
    if (newPass !== confirmPass) return notify('Konfirmasi password tidak cocok.', 'error')
    setSavingProfile(true)
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_self', password: newPass }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal')
      setNewPass(''); setConfirmPass(''); notify('Password diperbarui')
    } catch (e) { notify(e.message, 'error') } finally { setSavingProfile(false) }
  }

  const descLabel = {
    izin: 'Alasan izin', sakit: 'Sakit apa?', dispen: 'Alasan dispensasi',
  }
  const fotoLabel = {
    izin: 'Foto surat izin (opsional)',
    sakit: 'Foto surat dokter (opsional)',
    dispen: 'Foto surat dispensasi (opsional)',
  }

  return (
    <div className="pb-nav mx-auto min-h-dvh w-full max-w-md">
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <CircleUser className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none">
                {student?.nickname || student?.nama || (isAdmin ? ROLE_LABEL[adminRole] : 'Akun')}
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

        {/* Admin shortcut */}
        {isAdmin && (
          <Link href="/admin" className="card flex items-center gap-3 p-4 transition hover:bg-muted">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Buka Panel Admin</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABEL[adminRole]}</p>
            </div>
          </Link>
        )}

        {!student && !isAdmin && (
          <p className="card p-4 text-sm text-destructive">
            Akun ini belum tertaut ke data siswa. Hubungi pengurus kelas.
          </p>
        )}

        {/* ---- ABSENSI ---- */}
        {student && (
          <section className="card p-5">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-7 w-7" />
            </div>
            <h2 className="text-center text-lg font-bold">Absensi Hari Ini</h2>

            {sudahAbsen ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 rounded-lg bg-success/10 px-3 py-3 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  Sudah absen: {STATUS_LABEL[attendance.status] || attendance.status}
                  {attendance.distance_m != null ? ` · ${attendance.distance_m} m` : ''}
                </div>
                {attendance.deskripsi && (
                  <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    Keterangan: {attendance.deskripsi}
                  </p>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  Absen terkunci. Hanya developer yang bisa mengubah.
                </p>
              </div>
            ) : reportType ? (
              /* Form izin/sakit/dispen */
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold">Ajukan {STATUS_LABEL[reportType]}</p>
                <textarea
                  className="input-field text-sm" rows={3}
                  placeholder={descLabel[reportType]}
                  value={desc} onChange={(e) => setDesc(e.target.value)}
                />
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">{fotoLabel[reportType]}</p>
                  <UploadField
                    bucket="attendance" folder="surat"
                    accept={['camera', 'photo']}
                    onUploaded={setFoto}
                  />
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost flex-1" onClick={() => { setReportType(null); setDesc(''); setFoto(null) }}>
                    Batal
                  </button>
                  <button className="btn-primary flex-1" onClick={submitReport} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Kirim
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <button className="btn-primary w-full" onClick={absenHadir} disabled={locating}>
                  {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                  {locating ? 'Mengambil lokasi…' : 'Absen Hadir (Lokasi)'}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button className="btn-ghost flex-col gap-1 py-3 text-xs" onClick={() => setReportType('izin')}>
                    <FileText className="h-4 w-4" /> Izin
                  </button>
                  <button className="btn-ghost flex-col gap-1 py-3 text-xs" onClick={() => setReportType('sakit')}>
                    <HeartPulse className="h-4 w-4" /> Sakit
                  </button>
                  <button className="btn-ghost flex-col gap-1 py-3 text-xs" onClick={() => setReportType('dispen')}>
                    <CalendarClock className="h-4 w-4" /> Dispen
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ---- NAMA PANGGILAN ---- */}
        {student && (
          <section className="card space-y-3 p-4">
            <p className="section-title"><IdCard className="h-4 w-4" /> Nama Panggilan</p>
            <p className="text-xs text-muted-foreground">
              Nama lengkap: <span className="font-medium text-foreground">{student.nama}</span> (tidak bisa diubah)
            </p>
            <div className="flex gap-2">
              <input className="input-field py-2 text-sm" placeholder="Nama panggilan"
                value={nickname} onChange={(e) => setNickname(e.target.value)} />
              <button className="btn-primary px-4" onClick={saveNickname} disabled={savingProfile}>
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
              </button>
            </div>
          </section>
        )}

        {/* ---- GANTI PASSWORD ---- */}
        <section className="card space-y-3 p-4">
          <p className="section-title"><KeyRound className="h-4 w-4" /> Ganti Password</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> {email} (hanya pengurus yang bisa mengubah email)
          </p>
          <PasswordInput className="py-2 text-sm" placeholder="Password baru (min. 6 karakter)"
            value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <PasswordInput className="py-2 text-sm" placeholder="Ulangi password baru"
            value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
          <button className="btn-primary w-full" onClick={savePassword} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Simpan Password
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
