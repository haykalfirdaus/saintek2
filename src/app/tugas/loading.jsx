import { HeaderSkeleton, CardListSkeleton, Skeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <div className="pb-nav mx-auto min-h-dvh max-w-md">
      <HeaderSkeleton />
      <main className="space-y-6 px-4 py-5">
        <Skeleton className="h-12 w-full rounded-lg" />
        <CardListSkeleton count={3} />
      </main>
    </div>
  )
}
