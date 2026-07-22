import { HeaderSkeleton, CardListSkeleton, Skeleton } from '@/components/skeleton'

// Skeleton instan saat landing page memuat data.
export default function Loading() {
  return (
    <div className="pb-nav mx-auto min-h-dvh max-w-md">
      <HeaderSkeleton />
      <main className="space-y-6 px-4 py-5">
        <Skeleton className="h-16 w-full rounded-lg" />
        <CardListSkeleton count={2} />
        <CardListSkeleton count={1} />
        <Skeleton className="h-40 w-full rounded-lg" />
      </main>
    </div>
  )
}
