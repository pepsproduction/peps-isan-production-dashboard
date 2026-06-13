import { useMemo, useState } from 'react'
import FilterChips from '../components/FilterChips'
import LinkButton from '../components/LinkButton'
import MapPreview from '../components/MapPreview'
import { makeMapsUrl } from '../utils/maps'
import { MapPin } from 'lucide-react'

export default function Maps({ data, config }) {
  const maps = useMemo(() => data?.maps || [], [data])
  const [type, setType] = useState('')
  const types = useMemo(() => Array.from(new Set(maps.map((item) => item.type).filter(Boolean))).sort(), [maps])
  const filtered = maps.filter((item) => !type || item.type === type)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Maps</h1>
        <p className="muted">แผนที่รวมชุด รายวัน รายชุมชน และที่พัก พร้อมปุ่มเปิด Google Maps แยกแท็บ</p>
      </div>
      <section className="card p-4">
        <FilterChips options={types} value={type} onChange={setType} allLabel="ทุกประเภท" />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        {filtered.length ? (
          filtered.map((item) => (
            <div key={item.id} className="space-y-2">
              <MapPreview title={item.title} query={item.query} url={item.url} apiKey={config.mapsApiKey} />
              <LinkButton href={makeMapsUrl(item.url || item.query)} label="เปิดใน Google Maps" icon={MapPin} />
            </div>
          ))
        ) : (
          <div className="card p-8 text-center text-zinc-400 xl:col-span-2">ยังไม่มีข้อมูล Map_Master</div>
        )}
      </section>
    </div>
  )
}
