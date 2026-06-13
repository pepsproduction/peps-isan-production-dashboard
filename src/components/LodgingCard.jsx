import { Building2, Copy, MapPin, Navigation, Phone } from 'lucide-react'
import { makeMapsUrl } from '../utils/maps'
import { phoneHref } from '../utils/phone'
import { buildLodgingCopy } from '../utils/copy'
import LinkButton from './LinkButton'

export default function LodgingCard({ item, onCopy }) {
  const tel = phoneHref(item.phone)
  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-peps">{item.date || 'ไม่ระบุวันที่'}</p>
          <h3 className="mt-1 text-xl font-bold text-white">{item.name || 'ที่พัก'}</h3>
          <p className="mt-1 text-sm text-zinc-400">{item.province} · {item.community}</p>
        </div>
        <span className="rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-sm font-semibold text-gold">
          {item.type || 'ที่พัก'} {item.rating ? `· ${item.rating}` : ''}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div><p className="text-zinc-500">ที่อยู่/โซน</p><p className="text-zinc-100">{item.address || '-'}</p></div>
        <div><p className="text-zinc-500">โทร</p><p className="text-zinc-100">{item.phone || '-'}</p></div>
        <div><p className="text-zinc-500">หมายเหตุการเลือก</p><p className="text-zinc-100">{item.reason || '-'}</p></div>
        <div><p className="text-zinc-500">ตัวเลือกสำรอง</p><p className="text-zinc-100">{item.backup || '-'}</p></div>
        <div><p className="text-zinc-500">เช็กความใกล้กับคิวเช้า</p><p className="text-zinc-100">{item.nearMorning || '-'}</p></div>
        <div><p className="text-zinc-500">หมายเหตุ Logic</p><p className="text-zinc-100">{item.logic || '-'}</p></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <LinkButton href={makeMapsUrl(item.mapsQuery || item.name)} label="เปิดที่พัก" icon={MapPin} />
        <LinkButton href={makeMapsUrl(item.afterShootQuery)} label="หลังถ่ายจบ→ที่พัก" icon={Building2} />
        <LinkButton href={makeMapsUrl(item.toMorningQuery)} label="ที่พัก→จุดถ่ายเช้า" icon={Navigation} />
        {tel ? <LinkButton href={tel} label="โทรที่พัก" icon={Phone} /> : null}
        <LinkButton label="คัดลอกข้อมูลที่พัก" icon={Copy} onClick={() => onCopy(buildLodgingCopy(item))} />
      </div>
    </article>
  )
}
