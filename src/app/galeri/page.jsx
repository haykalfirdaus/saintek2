import { AppShell } from '@/components/app-shell'
import { GallerySlider } from '@/components/gallery-slider'
import { ZoomableImage } from '@/components/zoomable-image'
import { PageHeader } from '@/components/page-header'
import { createPublicClient } from '@/lib/supabase/public'
import { Images } from 'lucide-react'

export const revalidate = 30

export default async function GaleriPage() {
  const supabase = createPublicClient()
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
    <AppShell>
      <PageHeader icon={Images} title="Galeri Foto" />

      <main className="app-container pb-nav space-y-6 py-5">
        <section className="ch-rise mx-auto max-w-3xl">
          <p className="section-title">Slideshow Otomatis</p>
          <GallerySlider photos={slider} />
        </section>

        <section className="ch-rise" style={{ animationDelay: '80ms' }}>
          <p className="section-title">Frame Statis</p>
          {statis.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {statis.map((p) => (
                <div key={p.id} className="card glass-lift overflow-hidden">
                  <ZoomableImage src={p.url} alt={p.caption || ''} className="aspect-square w-full object-cover" />
                  {p.caption && <p className="px-2 py-1 text-xs text-muted-foreground">{p.caption}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="card p-4 text-sm text-muted-foreground">Belum ada foto frame statis.</p>
          )}
        </section>
      </main>
    </AppShell>
  )
}
