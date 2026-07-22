import { Clock, CalendarRange } from 'lucide-react'

function fmt(dt) {
  if (!dt) return null
  // Tanggal saja, tanpa jam.
  return new Date(dt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Renders a task per the input format: teks / foto / keduanya + deadline.
export function TaskCard({ task }) {
  return (
    <article className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
          {task.mapel}
        </span>
        {task.deadline_type === 'range' ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" />
            {fmt(task.deadline_start)} – {fmt(task.deadline_end)}
          </span>
        ) : (
          task.deadline_end && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {fmt(task.deadline_end)}
            </span>
          )
        )}
      </div>

      {task.isi && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-card-foreground">
          {task.isi}
        </p>
      )}

      {task.photo_url && (
        <img
          src={task.photo_url}
          alt={`Lampiran tugas ${task.mapel}`}
          className="mt-3 max-h-72 w-full rounded-lg border border-border object-cover"
          loading="lazy"
        />
      )}
    </article>
  )
}
