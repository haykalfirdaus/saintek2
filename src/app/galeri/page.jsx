import { BottomNav } from '@/components/bottom-nav'
import { GallerySlider } from '@/components/gallery-slider'
import { UploadFotoButton } from '@/components/upload-foto-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@/lib/supabase/server'
import { Images } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function GaleriPage() {
  const supabase = await createClient()
  const { data: photos } = await supabase
    .from('gallery')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const all = photos ?? []
  // 10 foto slideshow + 4 foto frame statis (total 14). Prioritaskan flag in_slider.
  const slider = all.filter((p) => p.in_slider).slice(0, 10)
  const sliderIds = new Set(slider.map((p) => p.id))
  const statis = all.filter((p) => !sliderIds.has(p.id)).slice(0, 4)

  return (
    <div className="pb-nav mx-auto min-h-dvh max-w-md">
      <header className="pt-safe sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-lg">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <Images className="h-5 w-5 text-primary" /> Galeri Foto
        </h1>
        <ThemeToggle />
      </header>

      <main className="space-y-6 px-4 py-5">
        {/* Tombol upload foto publik (izin kamera & galeri) di tab Galeri */}
        <UploadFotoButton label="Upload Foto ke Galeri" inSlider />

        <section>
          <p className="section-title">Slideshow Otomatis</p>
          <GallerySlider photos={slider} />
        </section>

        <section>
          <p className="section-title">Frame Statis</p>
          {statis.length ? (
            <div className="grid grid-cols-2 gap-3">
              {statis.map((p) => (
                <div key={p.id} className="card overflow-hidden">
                  <img src={p.url} alt={p.caption || ''} className="aspect-square w-full object-cover" loading="lazy" />
                  {p.caption && <p className="px-2 py-1 text-xs text-muted-foreground">{p.caption}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="card p-4 text-sm text-muted-foreground">Belum ada foto frame statis.</p>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
