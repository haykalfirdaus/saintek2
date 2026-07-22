import { HeaderSkeleton, Skeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <div className="pb-nav mx-auto min-h-dvh max-w-md">
      <HeaderSkeleton />
      <main className="space-y-4 px-4 py-5">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
        <div className="card divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
