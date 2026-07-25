import { HeaderSkeleton, Skeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <div className="app-mesh pl-rail min-h-dvh">
      <HeaderSkeleton />
      <main className="app-container pb-nav space-y-6 py-5">
        <div className="mx-auto max-w-3xl space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  )
}
