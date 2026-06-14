import { MapPin } from 'lucide-react'
import { makeEmbedUrl, makeMapsUrl, resolveMapTarget } from '../utils/maps'
import LinkButton from './LinkButton'

export default function MapPreview({ title, query, url, apiKey, className = '' }) {
  const mapsTarget = resolveMapTarget(url, query)
  const previewTarget = query || mapsTarget
  const embedUrl = makeEmbedUrl(previewTarget, apiKey)
  const mapsUrl = makeMapsUrl(mapsTarget)

  if (!previewTarget && !mapsTarget) {
    return (
      <div className={`soft-card flex min-h-56 items-center justify-center p-6 text-center text-zinc-400 ${className}`}>
        ยังไม่มีข้อมูลแผนที่
      </div>
    )
  }

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{title || 'Map Preview'}</p>
          <p className="muted">แสดงตัวอย่างในเว็บ และเปิด Google Maps ได้เสมอ</p>
        </div>
        <LinkButton href={mapsUrl} label="เปิด Maps" icon={MapPin} className="shrink-0" />
      </div>
      <iframe
        title={title || 'Map Preview'}
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-72 w-full border-0 bg-black md:h-96"
      />
    </div>
  )
}
