import { AppShell } from '@/components/app-shell'
import { TaskCard } from '@/components/task-card'
import { PageHeader } from '@/components/page-header'
import { createPublicClient } from '@/lib/supabase/public'
import { ClipboardList } from 'lucide-react'

export const revalidate = 30

export default async function TugasPage() {
  const supabase = createPublicClient()
  const { data: aktif } = await supabase
    .from('tasks').select('*').eq('is_active', true)
    .order('created_at', { ascending: false })
  const { data: riwayat } = await supabase
    .from('tasks').select('*').eq('is_active', false)
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <PageHeader icon={ClipboardList} title="Tugas" />

      <main className="app-container pb-nav space-y-6 py-5">
        <section className="ch-rise">
          <p className="section-title">Aktif</p>
          {aktif?.length ? (
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{aktif.map((t) => <TaskCard key={t.id} task={t} />)}</div>
          ) : (
            <p className="card p-4 text-sm text-muted-foreground">Tidak ada tugas aktif.</p>
          )}
        </section>

        <section className="ch-rise" style={{ animationDelay: '80ms' }}>
          <p className="section-title">Riwayat</p>
          {riwayat?.length ? (
            <div className="grid gap-3 opacity-80 lg:grid-cols-2 xl:grid-cols-3">{riwayat.map((t) => <TaskCard key={t.id} task={t} />)}</div>
          ) : (
            <p className="card p-4 text-sm text-muted-foreground">Belum ada riwayat.</p>
          )}
        </section>
      </main>
    </AppShell>
  )
}
