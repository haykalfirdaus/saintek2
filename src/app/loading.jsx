import { HeaderSkeleton, CardListSkeleton, Skeleton } from '@/components/skeleton'

// Skeleton instan saat landing page memuat data. Lebar mengikuti shell baru
// (lebar penuh + offset rail di desktop) agar tidak ada lonjakan layout.
export default function Loading() {
  return (
    <div className="app-mesh pl-rail min-h-dvh">
      <HeaderSkeleton />
      <main className="app-container pb-nav space-y-6 py-5 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0">
        <div className="space-y-6 lg:col-span-8">
          <Skeleton className="h-16 w-full rounded-lg" />
          <CardListSkeleton count={2} />
          <CardListSkeleton count={1} />
        </div>
        <div className="space-y-6 lg:col-span-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </main>
    </div>
  )
}
