// Skeleton primitives — dark/light aware via --muted token. Server-safe (no 'use client').

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

// Skeleton untuk header halaman (judul + toggle).
export function HeaderSkeleton() {
  return (
    <div className="pt-safe sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-lg">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-10 rounded-lg" />
    </div>
  )
}

// Beberapa kartu placeholder.
export function CardListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-2 p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}
