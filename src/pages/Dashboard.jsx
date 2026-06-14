import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Film, Hotel, Images, MapPinned, Users } from 'lucide-react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import LinkButton from '../components/LinkButton'
import { groupCount, isChecklistNeedsExpense, normalizeChecklistStatusValue } from '../utils/normalize'
import { formatThaiDate, todayInput, uniqueDates } from '../utils/date'
import { makeMapsUrl } from '../utils/maps'
import { buildTimelineCopy } from '../utils/copy'

function communityLabel(community) {
  return `${community.province || '-'} - ${community.community || '-'}`
}

function uniqueList(items) {
  return Array.from(new Set(items.filter(Boolean)))
}

function dashboardStatDetails({ communities, timeline, lodging }) {
  const byDate = new Map()
  communities.forEach((community) => {
    if (!community.shootDate) return
    if (!byDate.has(community.shootDate)) byDate.set(community.shootDate, [])
    byDate.get(community.shootDate).push(communityLabel(community))
  })
  return {
    provinces: groupCount(communities, 'province').map((item) => `${item.name} (${item.value} ชุมชน)`),
    communities: communities.map(communityLabel),
    shootDays: Array.from(byDate, ([date, rows]) => `${formatThaiDate(date)}: ${rows.join(', ')}`),
    lodging: uniqueList([
      ...lodging.map((item) => item.name || item.lodgingName),
      ...communities.map((item) => item.lodging),
    ]),
    storyboardAny: communities.filter((item) => ['complete', 'partial'].includes(item.storyboardStatus)).map(communityLabel),
    storyboardMissing: communities.filter((item) => !['complete', 'partial'].includes(item.storyboardStatus)).map(communityLabel),
    missingContacts: communities.filter((item) => !item.contactName && !item.contactPhone).map(communityLabel),
    needsCheck: communities
      .filter((item) => isChecklistNeedsExpense(item.checklistStatus))
      .map((item) => `${communityLabel(item)} (${normalizeChecklistStatusValue(item.checklistStatus)})`),
    timeline: timeline.map((item) => `${formatThaiDate(item.date, item.day)}: ${item.morningTitle || '-'} / ${item.afternoonTitle || '-'}`),
  }
}

function Progress({ label, value, total, color = 'bg-peps' }) {
  const percent = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-white">{label}</p>
        <p className="text-sm text-zinc-400">{value}/{total}</p>
      </div>
      <div className="mt-3 h-3 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-sm text-zinc-400">{percent}% completed</p>
    </div>
  )
}

function ChartCard({ title, children, height = 256 }) {
  return (
    <div className="card p-4">
      <h3 className="section-title">{title}</h3>
      <div className="mt-4" style={{ height }}>{children}</div>
    </div>
  )
}

function DashboardCommunityBrief({ community }) {
  const fields = [
    ['CONTENT', community.content],
    ['INTRODUCTION', community.introduction],
    ['ผลิตภัณฑ์เด่น', community.products],
    ['โปรแกรม/จุดถ่าย', community.program],
  ]
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="font-semibold text-white">{community.sequence || '-'} {community.province} - {community.community}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-sm text-zinc-100">{value || '-'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardToday({ timeline, communities, copyText, onNavigate }) {
  const dates = useMemo(() => uniqueDates(timeline), [timeline])
  const [selectedDate, setSelectedDate] = useState(dates.includes(todayInput()) ? todayInput() : dates[0] || todayInput())
  const item = timeline.find((entry) => entry.date === selectedDate)
  const relatedCommunities = useMemo(
    () => (item?.communityIds || [])
      .map((id) => communities.find((community) => community.id === id))
      .filter(Boolean),
    [communities, item],
  )

  useEffect(() => {
    if (dates.length && !dates.includes(selectedDate)) {
      setSelectedDate(dates.includes(todayInput()) ? todayInput() : dates[0])
    }
  }, [dates, selectedDate])

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-peps">Today View</p>
          <h2 className="section-title">{formatThaiDate(selectedDate, item?.day)}</h2>
        </div>
        <div className="flex gap-2">
          <select className="field min-w-44" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
            {dates.map((date) => {
              const row = timeline.find((entry) => entry.date === date)
              return <option key={date} value={date}>{formatThaiDate(date, row?.day)}</option>
            })}
          </select>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('today')}>เปิด Today</button>
        </div>
      </div>
      {item ? (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="soft-card p-4 md:col-span-2">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={item.status} />
              <StatusBadge status={item.feasibility} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><p className="text-zinc-500">คิวเช้า</p><p className="font-semibold text-white">{item.morningTitle}</p><p className="text-sm text-zinc-400">{item.morningTime}</p></div>
              <div><p className="text-zinc-500">คิวบ่าย</p><p className="font-semibold text-white">{item.afternoonTitle}</p><p className="text-sm text-zinc-400">{item.afternoonTime}</p></div>
              <div><p className="text-zinc-500">ที่พักคืนนี้</p><p className="text-white">{item.lodging || '-'}</p></div>
              <div><p className="text-zinc-500">คิวเช้าถัดไป</p><p className="text-white">{item.nextMorning || '-'}</p></div>
            </div>
            {relatedCommunities.length ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-peps">รายละเอียดชุมชนในคิววันนี้</p>
                <div className="grid gap-3">
                  {relatedCommunities.map((community) => (
                    <DashboardCommunityBrief key={community.id} community={community} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <LinkButton href={makeMapsUrl(item.mapQuery || item.morningTitle)} label="เปิด Maps" icon={MapPinned} />
            <LinkButton label="คัดลอกสรุป" icon={Film} onClick={() => copyText(buildTimelineCopy(item))} />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-zinc-400">ไม่มีคิวในวันที่เลือก</p>
      )}
    </section>
  )
}

export default function Dashboard({ data, loading, error, copyText, onNavigate }) {
  const stats = data?.stats || {}
  const communities = useMemo(() => data?.communities || [], [data])
  const timeline = useMemo(() => data?.timeline || [], [data])
  const lodging = useMemo(() => data?.lodging || [], [data])
  const statDetails = useMemo(() => dashboardStatDetails({ communities, timeline, lodging }), [communities, timeline, lodging])
  const provinceData = useMemo(() => groupCount(communities, 'province').slice(0, 8), [communities])
  const contentData = useMemo(() => groupCount(communities, 'content'), [communities])
  const contentChartHeight = Math.max(320, contentData.length * 42)
  const dateData = useMemo(() => groupCount(timeline, 'date'), [timeline])
  const storyboardData = useMemo(
    () => groupCount(communities, (item) => item.storyboardStatus === 'complete' ? 'ครบ 6 รูป' : item.storyboardStatus === 'partial' ? 'ยังไม่ครบ' : 'ยังไม่มี'),
    [communities],
  )
  const pieColors = ['#18a058', '#f5b642', '#ef4444', '#ff7a00']

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-32" />
        <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-32" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Dashboard ภาพรวม</h1>
          <p className="muted">แผนถ่ายทำชุมชนภาคอีสาน พร้อม Storyboard, Maps, Checklist และที่พัก</p>
        </div>
        {error ? <StatusBadge status="warning">{error}</StatusBadge> : null}
      </div>

      <DashboardToday timeline={timeline} communities={communities} copyText={copyText} onNavigate={onNavigate} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="จำนวนจังหวัดทั้งหมด" value={stats.provinces || 0} icon={MapPinned} tone="orange" details={statDetails.provinces} />
        <StatCard label="จำนวนชุมชนทั้งหมด" value={stats.communities || 0} icon={Users} tone="gold" details={statDetails.communities} />
        <StatCard label="จำนวนวันถ่ายทั้งหมด" value={stats.shootDays || 0} icon={Film} tone="blue" details={statDetails.shootDays.length ? statDetails.shootDays : statDetails.timeline} />
        <StatCard label="จำนวนที่พัก" value={stats.lodging || 0} icon={Hotel} tone="green" details={statDetails.lodging} />
        <StatCard label="Storyboard ที่มีแล้ว" value={stats.storyboardAny || 0} icon={Images} tone="green" details={statDetails.storyboardAny} />
        <StatCard label="Storyboard ที่ยังไม่มี" value={stats.storyboardMissing || 0} icon={Images} tone="red" details={statDetails.storyboardMissing} />
        <StatCard label="ไม่มีข้อมูลติดต่อ" value={stats.missingContacts || 0} icon={AlertTriangle} tone="red" details={statDetails.missingContacts} />
        <StatCard label="ต้องเช็กค่าใช้จ่าย" value={stats.needsCheck || 0} icon={CheckCircle2} tone="gold" details={statDetails.needsCheck} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Progress label="Storyboard completed" value={stats.storyboardDone || 0} total={stats.communities || 0} color="bg-peps" />
        <Progress label="งานถ่ายทำ completed" value={stats.filmingDone || 0} total={stats.communities || 0} color="bg-emerald-400" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="จำนวนชุมชนต่อจังหวัด">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={provinceData}>
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#15151d', border: '1px solid rgba(255,255,255,.12)' }} />
              <Bar dataKey="value" fill="#ff7a00" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="จำนวน Content แต่ละประเภท" height={contentChartHeight}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={contentData} layout="vertical" margin={{ left: 24 }}>
              <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} width={120} />
              <Tooltip contentStyle={{ background: '#15151d', border: '1px solid rgba(255,255,255,.12)' }} />
              <Bar dataKey="value" fill="#f5b642" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="จำนวนคิวถ่ายต่อวัน">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={dateData}>
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#15151d', border: '1px solid rgba(255,255,255,.12)' }} />
              <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="สถานะ Storyboard">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie data={storyboardData} dataKey="value" nameKey="name" outerRadius={88} label>
                {storyboardData.map((entry, index) => <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#15151d', border: '1px solid rgba(255,255,255,.12)' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="card p-4">
        <h2 className="section-title">รายการแจ้งเตือน</h2>
        <div className="mt-4 space-y-3">
          {(stats.alerts || []).length ? (
            stats.alerts.map((alert) => (
              <div key={alert.id} className="soft-card flex items-start justify-between gap-3 p-3">
                <div>
                  <p className="font-semibold text-white">{alert.title}</p>
                  <p className="text-sm text-zinc-400">{alert.detail}</p>
                </div>
                <StatusBadge status={alert.level}>{alert.level === 'danger' ? 'เสี่ยงสูง' : 'ต้องเช็ก'}</StatusBadge>
              </div>
            ))
          ) : (
            <p className="text-zinc-400">ไม่มีรายการแจ้งเตือนในตอนนี้</p>
          )}
        </div>
      </section>
    </div>
  )
}
