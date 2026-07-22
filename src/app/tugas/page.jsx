import { BottomNav } from '@/components/bottom-nav'
import { TaskCard } from '@/components/task-card'
import { UploadFotoButton } from '@/components/upload-foto-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@/lib/supabase/server'
import { ClipboardList } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TugasPage() {
  const supabase = await createClient()
  const { data: aktif } = await supabase
    .from('tasks').select('*').eq('is_active', true)
    .order('created_at', { ascending: false })
  const { data: riwayat } = await supabase
    .from('tasks').select('*').eq('is_active', false)
    .order('created_at', { ascending: false })

  return (
    <div className="pb-nav mx-auto min-h-dvh max-w-md">
      <header className="pt-safe sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-lg">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <ClipboardList className="h-5 w-5 text-primary" /> Tugas
        </h1>
        <ThemeToggle />
      </header>

      <main className="space-y-6 px-4 py-5">
        {/* Tombol upload foto publik di tab Tugas (izin kamera & galeri) */}
        <UploadFotoButton label="Upload Foto (Tugas/Galeri)" />

        <section>
          <p className="section-title">Aktif</p>
          {aktif?.length ? (
            <div className="space-y-3">{aktif.map((t) => <TaskCard key={t.id} task={t} />)}</div>
          ) : (
            <p className="card p-4 text-sm text-muted-foreground">Tidak ada tugas aktif.</p>
          )}
        </section>

        <section>
          <p className="section-title">Riwayat</p>
          {riwayat?.length ? (
            <div className="space-y-3 opacity-80">{riwayat.map((t) => <TaskCard key={t.id} task={t} />)}</div>
          ) : (
            <p className="card p-4 text-sm text-muted-foreground">Belum ada riwayat.</p>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
