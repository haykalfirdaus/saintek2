import { HeaderSkeleton, CardListSkeleton, Skeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <div className="app-mesh pl-rail min-h-dvh">
      <HeaderSkeleton />
      <main className="app-container pb-nav space-y-6 py-5">
        <Skeleton className="h-12 w-full rounded-lg lg:w-40" />
        <CardListSkeleton count={3} />
      </main>
    </div>
  )
}
