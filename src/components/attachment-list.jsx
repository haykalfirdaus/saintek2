import { FileText, Download } from 'lucide-react'
import { ZoomableImage } from '@/components/zoomable-image'

/*
  Renderer lampiran bersama — gaya kartu Tugas developer/sekretaris.
  Dipakai TaskCard, pengumuman landing, & popup agar tampilannya seragam.
    - Foto     → ZoomableImage (bisa di-zoom fullscreen).
    - Non-foto → baris unduh (ikon dokumen + nama + ikon download).

  Props:
    attachments  : array { url, name, type, size, is_image }
    className    : kelas untuk wrapper (default 'mt-3 space-y-3')
    imgClassName : kelas untuk <img> foto (override tata letak per lokasi)
    label        : alt fallback untuk foto
*/
export function AttachmentList({
  attachments,
  className = 'mt-3 space-y-3',
  imgClassName = 'max-h-72 w-full rounded-lg border border-border object-cover',
  label = 'Lampiran',
}) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null

  return (
    <div className={className}>
      {attachments.map((a, i) =>
        a.is_image ? (
          <ZoomableImage
            key={i}
            src={a.url}
            alt={a.name || label}
            className={imgClassName}
          />
        ) : (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm transition hover:bg-muted"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">{a.name || label}</span>
            <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        )
      )}
    </div>
  )
}
