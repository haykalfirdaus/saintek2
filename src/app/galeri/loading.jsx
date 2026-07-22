import { HeaderSkeleton, Skeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <div className="pb-nav mx-auto min-h-dvh max-w-md">
      <HeaderSkeleton />
      <main className="space-y-6 px-4 py-5">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  )
}
