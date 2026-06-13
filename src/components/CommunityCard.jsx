import { Copy, Edit3, Images, MapPin, Phone } from 'lucide-react'
import { makeMapsUrl } from '../utils/maps'
import { extractPhone, phoneHref } from '../utils/phone'
import { buildCommunityCopy } from '../utils/copy'
import LinkButton from './LinkButton'
import StatusBadge from './StatusBadge'

function info(label, value) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-100">{value}</p>
    </div>
  )
}

export default function CommunityCard({ community, onCopy, onEdit, onStoryboard }) {
  const mapsUrl = makeMapsUrl(community.mapsUrl || community.mapsSearch || `${community.community} ${community.province}`)
  const tel = phoneHref(community.contactPhone)
  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-peps px-2.5 py-1 text-sm font-bold text-black">{community.sequence || '-'}</span>
            <StatusBadge status={community.storyboardStatus} />
            <StatusBadge status={community.checklistStatus} />
            <StatusBadge status={community.shootingStatus} />
          </div>
          <h3 className="mt-3 text-xl font-bold text-white">{community.province} - {community.community}</h3>
          <p className="mt-1 text-sm text-zinc-400">{community.district}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {info('CONTENT', community.content)}
        {info('INTRODUCTION', community.introduction)}
        {info('ผลิตภัณฑ์เด่น', community.products)}
        {info('โปรแกรม/จุดถ่าย', community.program)}
        {info('ข้อควรเช็ค', community.checkNotes)}
        {info('ผู้ประสานงาน', [community.contactName, extractPhone(community.contactPhone)].filter(Boolean).join(' / ') || 'ยังไม่มีข้อมูลติดต่อ')}
        {info('วันที่ / เวลา', `${community.shootDate || '-'} ${community.startTime || ''}-${community.endTime || ''}`)}
        {info('ที่พัก', community.lodging)}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <LinkButton href={mapsUrl} label="เปิด Maps" icon={MapPin} />
        <LinkButton label="ดู Storyboard" icon={Images} onClick={() => onStoryboard(community)} />
        <LinkButton label="แก้ไขสถานะ" icon={Edit3} onClick={() => onEdit(community)} />
        <LinkButton label="คัดลอก" icon={Copy} onClick={() => onCopy(buildCommunityCopy(community))} />
        {tel ? <LinkButton href={tel} label="โทร" icon={Phone} /> : null}
      </div>
    </article>
  )
}
