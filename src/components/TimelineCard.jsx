import { Building2, Copy, Images, MapPin, Navigation } from 'lucide-react'
import { makeMapsUrl } from '../utils/maps'
import { buildTimelineCopy } from '../utils/copy'
import { formatThaiDate } from '../utils/date'
import LinkButton from './LinkButton'
import StatusBadge from './StatusBadge'

export default function TimelineCard({ item, communities = [], onCopy, onStoryboard }) {
  const related = communities.filter((community) => item.communityIds?.includes(community.id))
  const storyboardTarget = related.find((community) => community.storyboardStatus !== 'missing') || related[0]
  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-peps">{item.batch || 'ชุดงาน'}</p>
          <h3 className="mt-1 text-xl font-bold text-white">{formatThaiDate(item.date, item.day)}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={item.status} />
          <StatusBadge status={item.feasibility} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="soft-card p-4">
          <p className="text-xs text-zinc-500">จุดถ่ายเช้า</p>
          <p className="mt-1 font-semibold text-white">{item.morningTitle || '-'}</p>
          <p className="mt-1 text-sm text-zinc-400">{item.morningTime || '-'}</p>
        </div>
        <div className="soft-card p-4">
          <p className="text-xs text-zinc-500">จุดถ่ายบ่าย/งานต่อ</p>
          <p className="mt-1 font-semibold text-white">{item.afternoonTitle || '-'}</p>
          <p className="mt-1 text-sm text-zinc-400">{item.afternoonTime || '-'}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div><dt className="text-zinc-500">ประเมินเส้นทาง</dt><dd className="text-zinc-100">{item.routeAssessment || '-'}</dd></div>
        <div><dt className="text-zinc-500">ที่พักคืนนี้</dt><dd className="text-zinc-100">{item.lodging || '-'}</dd></div>
        <div><dt className="text-zinc-500">คิวเช้าถัดไป</dt><dd className="text-zinc-100">{item.nextMorning || '-'}</dd></div>
        <div><dt className="text-zinc-500">หมายเหตุ</dt><dd className="text-zinc-100">{item.notes || '-'}</dd></div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <LinkButton href={makeMapsUrl(item.afterShootToLodgingQuery)} label="หลังถ่ายจบ→ที่พัก" icon={Building2} />
        <LinkButton href={makeMapsUrl(item.lodgingToMorningQuery)} label="ที่พัก→จุดถ่ายเช้า" icon={Navigation} />
        <LinkButton href={makeMapsUrl(item.mapQuery || item.morningTitle)} label="เปิดใน Google Maps" icon={MapPin} />
        {storyboardTarget ? <LinkButton label="ดู Storyboard" icon={Images} onClick={() => onStoryboard(storyboardTarget)} /> : null}
        <LinkButton label="คัดลอก" icon={Copy} onClick={() => onCopy(buildTimelineCopy(item))} />
      </div>
    </article>
  )
}
