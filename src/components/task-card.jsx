import { Clock, CalendarRange, FileText, Download } from 'lucide-react'
import { ZoomableImage } from '@/components/zoomable-image'

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
        <ZoomableImage
          src={task.photo_url}
          alt={`Lampiran tugas ${task.mapel}`}
          className="mt-3 max-h-72 w-full rounded-lg border border-border object-cover"
        />
      )}

      {/* Lampiran dokumen / URL non-gambar */}
      {task.attachment_url && (
        <a
          href={task.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm transition hover:bg-muted"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 truncate">{task.attachment_name || 'Lampiran'}</span>
          <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      )}
    </article>
  )
}
