import { BottomNav } from '@/components/bottom-nav'
import { KasClient } from './kas-client'
import { ThemeToggle } from '@/components/theme-toggle'
import { createPublicClient } from '@/lib/supabase/public'
import { Wallet } from 'lucide-react'

export const revalidate = 30

export default async function KasPage() {
  const supabase = createPublicClient()
  const { data: arrears } = await supabase.rpc('kas_arrears')

  return (
    <div className="pb-nav mx-auto min-h-dvh max-w-md">
      <header className="pt-safe sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-lg">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <Wallet className="h-5 w-5 text-primary" /> Kas Kelas
        </h1>
        <ThemeToggle />
      </header>

      <main className="px-4 py-5">
        <KasClient rows={arrears ?? []} />
      </main>

      <BottomNav />
    </div>
  )
}
