import { BottomNav } from '@/components/bottom-nav'
import { KasClient } from './kas-client'
import { ThemeToggle } from '@/components/theme-toggle'
import { createPublicClient } from '@/lib/supabase/public'
import { getJakartaNow, toISODate } from '@/lib/utils'
import { Wallet } from 'lucide-react'

export const revalidate = 30

// Kamis TERAKHIR yang sudah lewat (>= start_date). null kalau kas belum mulai.
function currentBillingThursday(startISO) {
  const today = getJakartaNow().date
  today.setHours(0, 0, 0, 0)
  const start = new Date((startISO || toISODate(today)) + 'T00:00:00')
  // mundur dari hari ini ke Kamis terdekat
  const cur = new Date(today)
  while (cur.getDay() !== 4) cur.setDate(cur.getDate() - 1)
  if (cur < start) return null // belum ada Kamis tagihan sejak kas mulai
  return toISODate(cur)
}

export default async function KasPage() {
  const supabase = createPublicClient()
  const [{ data: arrears }, { data: payments }, { data: setting }] = await Promise.all([
    supabase.rpc('kas_arrears'),
    supabase.from('kas_payments').select('student_id, week_date, amount').eq('paid', true),
    supabase.from('kas_settings').select('start_date').eq('id', 1).maybeSingle(),
  ])

  const currentWeek = currentBillingThursday(setting?.start_date)

  // kelompokkan pembayaran per siswa (untuk detail "Selengkapnya" + cek minggu terkini)
  const byStudent = {}
  ;(payments ?? []).forEach((p) => {
    ;(byStudent[p.student_id] ||= []).push({ week_date: p.week_date, amount: p.amount })
  })
  Object.values(byStudent).forEach((arr) => arr.sort((a, b) => a.week_date.localeCompare(b.week_date)))

  return (
    <div className="pb-nav mx-auto min-h-dvh max-w-md">
      <header className="pt-safe sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-lg">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <Wallet className="h-5 w-5 text-primary" /> Kas Kelas
        </h1>
        <ThemeToggle />
      </header>

      <main className="px-4 py-5">
        <KasClient rows={arrears ?? []} payments={byStudent} currentWeek={currentWeek} />
      </main>

      <BottomNav />
    </div>
  )
}
