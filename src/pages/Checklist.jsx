import { useEffect, useMemo, useState } from 'react'
import EditModal from '../components/EditModal'
import SearchInput from '../components/SearchInput'
import StatusBadge from '../components/StatusBadge'
import FilterChips from '../components/FilterChips'
import LinkButton from '../components/LinkButton'
import ExpenseSummary from '../components/ExpenseSummary'
import { SHEETS } from '../config'
import { normalizeChecklistStatusValue, normalizeThai } from '../utils/normalize'
import { phoneHref } from '../utils/phone'
import { formatThaiDate, uniqueDates } from '../utils/date'
import { buildExpenseItems } from '../utils/expenses'
import { CalendarDays, Edit3, Phone } from 'lucide-react'

function buildWorkWeeks(dates = []) {
  const groups = []
  for (let index = 0; index < dates.length; index += 4) {
    const weekDates = dates.slice(index, index + 4)
    if (!weekDates.length) continue
    const start = formatThaiDate(weekDates[0]).replace(/^[^\s]+\s/, '')
    const end = formatThaiDate(weekDates[weekDates.length - 1]).replace(/^[^\s]+\s/, '')
    groups.push({
      id: `work-week-${groups.length + 1}`,
      label: `สัปดาห์งาน ${groups.length + 1}: ${start}${start === end ? '' : ` - ${end}`}`,
      dates: weekDates,
    })
  }
  return groups
}

function groupChecklistByDate(items = []) {
  const groups = new Map()
  items
    .slice()
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || Number(a.sequence || 999) - Number(b.sequence || 999))
    .forEach((item) => {
      const key = item.date || item.shootDate || 'no-date'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(item)
    })
  return Array.from(groups, ([date, rows]) => ({ date, rows }))
}

export default function Checklist({ data, updateRecord }) {
  const checklist = useMemo(() => data?.checklist || [], [data])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [viewMode, setViewMode] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedWeek, setSelectedWeek] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const statuses = useMemo(() => Array.from(new Set(checklist.map((item) => item.status).filter(Boolean))).sort(), [checklist])
  const dateOptions = useMemo(() => uniqueDates(checklist), [checklist])
  const workWeeks = useMemo(() => buildWorkWeeks(dateOptions), [dateOptions])

  useEffect(() => {
    if (dateOptions.length && !dateOptions.includes(selectedDate)) setSelectedDate(dateOptions[0])
    if (workWeeks.length && !workWeeks.some((week) => week.id === selectedWeek)) setSelectedWeek(workWeeks[0].id)
  }, [dateOptions, selectedDate, selectedWeek, workWeeks])

  const filtered = checklist.filter((item) => {
    const key = normalizeThai([item.province, item.community, item.content, item.introduction, item.note, item.extraCheck, item.contactName, item.expenseCustomItems].join(' '))
    const dateKey = item.date || item.shootDate || ''
    const activeWeek = workWeeks.find((week) => week.id === selectedWeek)
    const dateMatch =
      viewMode === 'all' ||
      (viewMode === 'day' && dateKey === selectedDate) ||
      (viewMode === 'week' && activeWeek?.dates.includes(dateKey))
    return (!search || key.includes(normalizeThai(search))) && (!status || item.status === status) && dateMatch
  })
  const grouped = useMemo(() => groupChecklistByDate(filtered), [filtered])

  const saveEdit = async (form) => {
    setSaving(true)
    try {
      const hasUnpaidExpense = buildExpenseItems(form).some((item) => !item.paid)
      const checklistStatus = !form.contactName && !form.contactPhone
        ? '🔴 ไม่มีข้อมูลติดต่อ'
        : hasUnpaidExpense
          ? '🟡 ต้องเช็กค่าใช้จ่าย'
          : normalizeChecklistStatusValue(form.checklistStatus).includes('ต้องเช็ก')
            ? '✅ พร้อม'
            : normalizeChecklistStatusValue(form.checklistStatus)
      const checklistFields = {
        checklistStatus,
        shootingStatus: form.shootingStatus,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        note: form.note,
        expenseLocation: form.expenseLocation,
        expenseInfluencer: form.expenseInfluencer,
        expenseContent1000: form.expenseContent1000,
        expenseCustomItems: form.expenseCustomItems,
      }
      await updateRecord('batchUpdateFields', {
        updates: [
          {
            sheetName: SHEETS.checklist,
            rowKey: editing.rowNumber || editing._rowNumber || editing.communityId || editing.id,
            communityId: editing.communityId,
            fields: checklistFields,
          },
          editing.communityId ? {
            sheetName: SHEETS.communities,
            rowKey: editing.communityId,
            communityId: editing.communityId,
            fields: {
              checklistStatus,
              shootingStatus: form.shootingStatus,
              contactName: form.contactName,
              contactPhone: form.contactPhone,
              note: form.note,
              shootDate: form.shootDate,
              startTime: form.startTime,
              endTime: form.endTime,
            },
          } : null,
        ].filter(Boolean),
      })
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Checklist ก่อนถ่าย</h1>
        <p className="muted">แก้สถานะ หมายเหตุ ผู้ประสานงาน เบอร์โทร ข้อควรเช็ค และสถานะถ่ายทำผ่านเว็บ</p>
      </div>
      <section className="card space-y-4 p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="ค้นหาชุมชน ผู้ประสานงาน หรือหมายเหตุ" />
        <FilterChips options={statuses} value={status} onChange={setStatus} allLabel="ทุกสถานะ" />
        <div className="grid gap-3 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ['all', 'ทั้งหมด'],
              ['day', 'รายวัน'],
              ['week', 'สัปดาห์งาน'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`chip shrink-0 ${viewMode === value ? 'border-peps bg-peps text-black' : 'bg-white/5'}`}
                onClick={() => setViewMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className={viewMode === 'day' ? 'block' : 'hidden md:block opacity-50'}>
              <span className="mb-2 block text-xs text-zinc-500">เลือกวันที่ถ่าย</span>
              <select className="field" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} disabled={viewMode !== 'day'}>
                {dateOptions.map((date) => (
                  <option key={date} value={date}>{formatThaiDate(date)}</option>
                ))}
              </select>
            </label>
            <label className={viewMode === 'week' ? 'block' : 'hidden md:block opacity-50'}>
              <span className="mb-2 block text-xs text-zinc-500">เลือกสัปดาห์งาน 4 วันถ่าย</span>
              <select className="field" value={selectedWeek} onChange={(event) => setSelectedWeek(event.target.value)} disabled={viewMode !== 'week'}>
                {workWeeks.map((week) => (
                  <option key={week.id} value={week.id}>{week.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <p className="text-sm text-zinc-400">แสดง {filtered.length}/{checklist.length} รายการ โดยยึดวันที่ถ่ายจากชุมชน_Master ใน Google Sheet</p>
      </section>
      <section className="space-y-5">
        {grouped.length ? grouped.map((group) => (
          <div key={group.date} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="section-title flex items-center gap-2">
                <CalendarDays size={18} className="text-peps" />
                {group.date === 'no-date' ? 'ยังไม่ระบุวันที่ถ่าย' : formatThaiDate(group.date)}
              </h2>
              <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-300">{group.rows.length} รายการ</span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {group.rows.map((item) => {
                const tel = phoneHref(item.contactPhone)
                const time = [item.startTime, item.endTime].filter(Boolean).join('-')
                return (
                  <article key={item.id || item.communityId} className="card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 text-sm font-bold text-peps">ลำดับ {item.sequence || '-'}</p>
                        <h2 className="text-lg font-bold text-white">{item.province} - {item.community}</h2>
                        <p className="muted">{item.contactName || 'ยังไม่มีผู้ประสานงาน'} {item.contactPhone || ''}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={item.status} />
                        <StatusBadge status={item.shootingStatus} />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div><p className="text-zinc-500">วันที่ถ่าย</p><p className="text-zinc-100">{item.date ? formatThaiDate(item.date) : '-'}</p></div>
                      <div><p className="text-zinc-500">เวลา</p><p className="text-zinc-100">{time || '-'}</p></div>
                      <div><p className="text-zinc-500">CONTENT</p><p className="text-zinc-100">{item.content || '-'}</p></div>
                      <div><p className="text-zinc-500">INTRODUCTION</p><p className="text-zinc-100">{item.introduction || '-'}</p></div>
                      <div><p className="text-zinc-500">ที่พัก</p><p className="text-zinc-100">{item.lodging || '-'}</p></div>
                      <div><p className="text-zinc-500">หมายเหตุ</p><p className="text-zinc-100">{item.note || '-'}</p></div>
                      <div className="sm:col-span-2"><p className="text-zinc-500">ข้อควรเช็คเพิ่มเติม</p><p className="text-zinc-100">{item.extraCheck || '-'}</p></div>
                      <ExpenseSummary record={item} />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <LinkButton label="แก้ไข" icon={Edit3} onClick={() => setEditing(item)} />
                      {tel ? <LinkButton href={tel} label="โทร" icon={Phone} /> : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )) : (
          <div className="card p-8 text-center text-zinc-400">ไม่พบ checklist ในช่วงที่เลือก</div>
        )}
      </section>
      <EditModal
        open={Boolean(editing)}
        title={editing ? `${editing.province} - ${editing.community}` : ''}
        record={editing}
        onClose={() => setEditing(null)}
        onSave={saveEdit}
        saving={saving}
      />
    </div>
  )
}
