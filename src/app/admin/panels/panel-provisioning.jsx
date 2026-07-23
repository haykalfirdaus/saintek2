'use client'

import { useEffect, useState } from 'react'
import { PanelHeader, Toast, SaveButton } from '@/components/ui-bits'
import { exportToExcel } from '@/lib/export-excel'
import { useConfirm } from '@/components/confirm-dialog'
import { IdCard, Download, Copy, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react'

/*
  Akun Login Siswa (developer/sekretaris):
    - Buat akun Auth otomatis utk siswa yang belum punya (email nama@kelas.com).
    - Lihat & export kredensial default utk dibagikan ke siswa.
    - Reset password 1 siswa.
*/
export function PanelProvisioning() {
  const confirm = useConfirm()
  const [creds, setCreds] = useState([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState(null)
  const [show, setShow] = useState(false)
  const [domain, setDomain] = useState('kelas.com')
  const [password, setPassword] = useState('saintek2')

  function notify(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  async function callApi(action, body = {}) {
    const res = await fetch('/api/admin/students', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Gagal')
    return json
  }

  async function load() {
    setLoading(true)
    try { const { creds } = await callApi('list_creds'); setCreds(creds ?? []) }
    catch (e) { notify(e.message, 'error') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function provision() {
    const ok = await confirm({
      title: 'Buat Akun Login Siswa?',
      message: `Sistem akan membuat akun untuk semua siswa yang belum punya akun. Email: <slug-nama>.<no>@${domain}, password default: "${password}".`,
      confirmText: 'Ya, Buat',
    })
    if (!ok) return
    setWorking(true)
    try {
      const r = await callApi('provision', { domain, password })
      if (r.message) {
        notify(r.message, r.created ? 'success' : 'error')
      } else {
        notify(`${r.created} akun dibuat, ${r.skipped} sudah ada${r.errors?.length ? `, ${r.errors.length} gagal` : ''}`,
          r.created ? 'success' : 'error')
      }
      load()
    } catch (e) { notify(e.message, 'error') } finally { setWorking(false) }
  }

  async function resetOne(studentId, nama) {
    const ok = await confirm({
      title: 'Reset Password?',
      message: `Reset password ${nama} ke "${password}"?`,
      danger: true, confirmText: 'Ya, Reset',
    })
    if (!ok) return
    try { await callApi('reset_password', { studentId, password }); notify('Password direset'); load() }
    catch (e) { notify(e.message, 'error') }
  }

  function exportCreds() {
    if (!creds.length) return notify('Belum ada kredensial.', 'error')
    exportToExcel({
      filename: 'kredensial-siswa',
      sheetName: 'Kredensial',
      title: 'Kredensial Login Siswa — XI Saintek 2',
      columns: [
        { key: 'no_absen', label: 'No' },
        { key: 'nama', label: 'Nama' },
        { key: 'email', label: 'Email' },
        { key: 'password', label: 'Password' },
      ],
      rows: creds,
    })
  }

  function copyAll() {
    const text = creds.map((c) => `${c.no_absen}\t${c.nama}\t${c.email}\t${c.password}`).join('\n')
    navigator.clipboard?.writeText(text).then(() => notify('Disalin ke clipboard'), () => notify('Gagal menyalin', 'error'))
  }

  return (
    <div>
      <PanelHeader title="Akun Login Siswa" desc="Buat akun massal & bagikan kredensial default." />
      <Toast {...(toast || {})} />

      {/* Konfigurasi + provision */}
      <div className="card mb-4 space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Domain email</label>
            <input className="input-field py-2 text-sm" value={domain} onChange={(e) => setDomain(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Password default</label>
            <input className="input-field py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <SaveButton loading={working} onClick={provision}>
          <IdCard className="h-4 w-4" /> Buat Akun Siswa yang Belum Punya
        </SaveButton>
      </div>

      {/* Kredensial */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">{creds.length} kredensial</span>
        <div className="flex gap-2">
          <button className="btn-ghost h-9 px-3 text-sm" onClick={() => setShow((v) => !v)}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {show ? 'Sembunyikan' : 'Lihat'}
          </button>
          <button className="btn-ghost h-9 px-3 text-sm" onClick={copyAll}><Copy className="h-4 w-4" /> Salin</button>
          <button className="btn-ghost h-9 px-3 text-sm" onClick={exportCreds}><Download className="h-4 w-4" /> Export</button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : creds.length ? (
        <div className="card divide-y divide-border">
          {creds.map((c) => (
            <div key={c.email} className="flex items-center gap-2 px-3 py-2">
              <span className="w-7 shrink-0 text-xs text-muted-foreground">{c.no_absen}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.nama}</p>
                <p className="truncate text-xs text-muted-foreground">{c.email}</p>
              </div>
              <span className="shrink-0 rounded bg-muted px-2 py-1 font-mono text-xs">
                {show ? c.password : '••••••'}
              </span>
              <button onClick={() => resetOne(c.student_id ?? undefined, c.nama)} className="shrink-0 text-muted-foreground hover:text-foreground" title="Reset password">
                <KeyRound className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="card p-4 text-sm text-muted-foreground">Belum ada akun siswa. Klik tombol di atas untuk membuat.</p>
      )}
    </div>
  )
}
