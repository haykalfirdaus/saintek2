'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import { Wallet, X } from 'lucide-react'

/*
  Banner pengingat kas untuk SISWA yang sedang login & masih menunggak.
  - Cek user login → cari baris students (auth_user_id) → ambil tunggakan
    dari RPC kas_arrears. Kalau arrears > 0, tampilkan sapaan.
  - Tidak tampil untuk yg lunas / bukan siswa / belum login.
*/
export function KasReminder() {
  const [info, setInfo] = useState(null) // { nama, arrears }
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let alive = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: student } = await supabase
        .from('students')
        .select('id, nama, nickname')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      if (!student) return
      const { data: arrears } = await supabase.rpc('kas_arrears')
      const mine = (arrears ?? []).find((r) => r.student_id === student.id)
      if (alive && mine && mine.arrears > 0) {
        setInfo({ nama: student.nama, arrears: mine.arrears })
      }
    })()
    return () => { alive = false }
  }, [])

  if (!info || closed) return null

  return (
    <div className="mx-4 mt-4 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
        <Wallet className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Halo {info.nama}, waktunya bayar kas nih… 💰</p>
        <p className="mt-0.5">
          Kas kamu belum dibayar sebanyak{' '}
          <span className="font-bold">{formatRupiah(info.arrears)}</span>.
        </p>
      </div>
      <button
        onClick={() => setClosed(true)}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-amber-700/70 transition hover:bg-amber-500/20 dark:text-amber-300/70"
        aria-label="Tutup"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
