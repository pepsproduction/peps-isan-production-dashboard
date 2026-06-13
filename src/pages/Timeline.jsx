import { useMemo, useState } from 'react'
import FilterChips from '../components/FilterChips'
import TimelineCard from '../components/TimelineCard'
import StoryboardViewer from '../components/StoryboardViewer'
import { fetchStoryboardImages } from '../api/googleSheetApi'
import { uniqueDates } from '../utils/date'

export default function Timeline({ data, config, copyText, notify }) {
  const timeline = useMemo(() => data?.timeline || [], [data])
  const communities = useMemo(() => data?.communities || [], [data])
  const dates = useMemo(() => uniqueDates(timeline), [timeline])
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('')
  const [viewer, setViewer] = useState({ open: false, community: null, images: [], driveUrl: '' })
  const statuses = useMemo(() => Array.from(new Set(timeline.map((item) => item.status).filter(Boolean))), [timeline])
  const items = timeline.filter((item) => (!date || item.date === date) && (!status || item.status === status))

  const openStoryboard = async (community) => {
    try {
      const result = await fetchStoryboardImages(config, community)
      setViewer({ open: true, community, images: result.images || [], driveUrl: result.folder?.url || community.storyboardLink })
    } catch (err) {
      notify(`โหลด Storyboard ไม่สำเร็จ: ${err.message}`, 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Timeline ถ่ายทำ / เดินทาง / ที่พัก</h1>
        <p className="muted">แสดงเป็น card รายวัน พร้อมปุ่มแผนที่และ Storyboard ของชุมชนที่เกี่ยวข้อง</p>
      </div>

      <section className="card space-y-4 p-4">
        <div>
          <p className="mb-2 text-sm text-zinc-400">Filter วันที่</p>
          <FilterChips options={dates} value={date} onChange={setDate} allLabel="ทุกวัน" />
        </div>
        <div>
          <p className="mb-2 text-sm text-zinc-400">Filter สถานะ</p>
          <FilterChips options={statuses} value={status} onChange={setStatus} allLabel="ทุกสถานะ" />
        </div>
      </section>

      <section className="space-y-4">
        {items.length ? (
          items.map((item) => (
            <TimelineCard
              key={item.id}
              item={item}
              communities={communities}
              onCopy={copyText}
              onStoryboard={openStoryboard}
            />
          ))
        ) : (
          <div className="card p-8 text-center text-zinc-400">ไม่พบ Timeline ตามเงื่อนไข</div>
        )}
      </section>

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
