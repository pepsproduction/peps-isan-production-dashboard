import { useMemo, useState } from 'react'
import { Copy, Images, MapPin } from 'lucide-react'
import LinkButton from '../components/LinkButton'
import StatusBadge from '../components/StatusBadge'
import StoryboardViewer from '../components/StoryboardViewer'
import { fetchStoryboardImages } from '../api/googleSheetApi'
import { buildTimelineCopy } from '../utils/copy'
import { formatThaiDate, todayInput, uniqueDates } from '../utils/date'
import { makeMapsUrl } from '../utils/maps'

export default function Today({ data, config, copyText, notify }) {
  const timeline = useMemo(() => data?.timeline || [], [data])
  const communities = useMemo(() => data?.communities || [], [data])
  const dates = useMemo(() => uniqueDates(timeline), [timeline])
  const [selectedDate, setSelectedDate] = useState(dates.includes(todayInput()) ? todayInput() : dates[0] || todayInput())
  const [viewer, setViewer] = useState({ open: false, community: null, images: [], driveUrl: '' })
  const item = timeline.find((entry) => entry.date === selectedDate)
  const related = item ? communities.filter((community) => item.communityIds?.includes(community.id)) : []
  const storyboardTarget = related.find((community) => community.storyboardStatus !== 'missing') || related[0]

  const openStoryboard = async () => {
    if (!storyboardTarget) return
    try {
      const result = await fetchStoryboardImages(config, storyboardTarget)
      setViewer({ open: true, community: storyboardTarget, images: result.images || [], driveUrl: result.folder?.url || storyboardTarget.storyboardLink })
    } catch (err) {
      notify(`โหลด Storyboard ไม่สำเร็จ: ${err.message}`, 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Today View</h1>
          <p className="muted">เลือกวันที่เพื่อดูคิวถ่าย เดินทาง ที่พัก และข้อความสรุปสำหรับส่งทีมงาน</p>
        </div>
        <select className="field min-w-56" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
          {dates.map((date) => <option key={date} value={date}>{formatThaiDate(date)}</option>)}
        </select>
      </div>

      {item ? (
        <section className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-peps">{item.batch}</p>
              <h2 className="mt-1 text-2xl font-bold text-white">{formatThaiDate(item.date)}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={item.status} />
              <StatusBadge status={item.feasibility} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="soft-card p-4">
              <p className="text-zinc-500">คิวเช้า</p>
              <p className="mt-1 text-xl font-semibold text-white">{item.morningTitle || '-'}</p>
              <p className="mt-1 text-zinc-400">{item.morningTime || '-'}</p>
            </div>
            <div className="soft-card p-4">
              <p className="text-zinc-500">คิวบ่าย</p>
              <p className="mt-1 text-xl font-semibold text-white">{item.afternoonTitle || '-'}</p>
              <p className="mt-1 text-zinc-400">{item.afternoonTime || '-'}</p>
            </div>
            <div className="soft-card p-4">
              <p className="text-zinc-500">ที่พักคืนนี้</p>
              <p className="mt-1 text-lg font-semibold text-white">{item.lodging || '-'}</p>
            </div>
            <div className="soft-card p-4">
              <p className="text-zinc-500">คิวเช้าถัดไป</p>
              <p className="mt-1 text-lg font-semibold text-white">{item.nextMorning || '-'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <LinkButton href={makeMapsUrl(item.mapQuery || item.morningTitle)} label="เปิด Maps" icon={MapPin} />
            <LinkButton label="เปิด Storyboard" icon={Images} onClick={openStoryboard} disabled={!storyboardTarget} />
            <LinkButton label="คัดลอกสรุปส่งทีมงาน" icon={Copy} onClick={() => copyText(buildTimelineCopy(item))} />
          </div>
        </section>
      ) : (
        <section className="card p-6 text-center text-zinc-400">ไม่มีข้อมูลในวันที่เลือก</section>
      )}

      <StoryboardViewer
        open={viewer.open}
        community={viewer.community}
        images={viewer.images}
        driveUrl={viewer.driveUrl}
        onClose={() => setViewer({ open: false, community: null, images: [], driveUrl: '' })}
        config={config}
      />
    </div>
  )
}
