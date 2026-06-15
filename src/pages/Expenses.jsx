import { useMemo, useState } from 'react'
import { ExternalLink, Phone, ReceiptText, Search } from 'lucide-react'
import FilterChips from '../components/FilterChips'
import LinkButton from '../components/LinkButton'
import SearchInput from '../components/SearchInput'
import StatusBadge from '../components/StatusBadge'
import { EXPENSE_SHEET_URL } from '../config'
import { formatThaiDate } from '../utils/date'
import { EXPENSE_SUMMARY_CATEGORIES, formatMoneyRange, summarizeExpenses } from '../utils/expenses'
import { normalizeThai } from '../utils/normalize'
import { phoneHref } from '../utils/phone'

function SummaryCard({ title, summary }) {
  return (
    <article className="card p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-peps">{title}</p>
      <p className="mt-3 text-2xl font-black text-white">{formatMoneyRange(summary.minTotal, summary.maxTotal)} ฿</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400">
        <div>
          <p className="text-zinc-500">รายการ</p>
          <p className="text-base font-bold text-white">{summary.itemCount}</p>
        </div>
        <div>
          <p className="text-zinc-500">จ่ายแล้ว</p>
          <p className="text-base font-bold text-emerald-300">{summary.paidCount}</p>
        </div>
        <div>
          <p className="text-zinc-500">ค้างจ่าย</p>
          <p className="text-base font-bold text-amber-300">{summary.unpaidCount}</p>
        </div>
      </div>
    </article>
  )
}

function ExpenseLine({ item }) {
  const range = item.amountRange || { min: 0, max: 0 }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <div>
        <p className="font-semibold text-zinc-100">{item.label}</p>
        <p className="text-xs text-zinc-500">{item.amount || 'ยังไม่ระบุจำนวนเงิน'}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-white">
          {formatMoneyRange(range.min, range.max)} ฿
        </span>
        <StatusBadge status={item.paid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'} />
      </div>
    </div>
  )
}

export default function Expenses({ data }) {
  const communities = useMemo(
    () => (data?.communities || [])
      .slice()
      .sort((a, b) => Number(a.sequence || 999) - Number(b.sequence || 999)),
    [data],
  )
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const expenseData = useMemo(() => summarizeExpenses(communities), [communities])
  const categoryOptions = useMemo(() => EXPENSE_SUMMARY_CATEGORIES.map((item) => item.key), [])
  const categoryLabels = useMemo(
    () => Object.fromEntries(EXPENSE_SUMMARY_CATEGORIES.map((item) => [item.key, item.label])),
    [],
  )

  const filteredRows = expenseData.rows.filter((row) => {
    const key = normalizeThai([
      row.sequence,
      row.province,
      row.community,
      row.contactName,
      row.contactPhone,
      row.content,
      row.introduction,
      row.expenseItems.map((item) => `${item.label} ${item.amount}`).join(' '),
    ].join(' '))
    return !search || key.includes(normalizeThai(search))
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Expenses รายจ่าย</h1>
          <p className="muted">สรุปค่าใช้จ่ายรายชุมชนจาก Checklist_ก่อนถ่าย พร้อมยอดต่ำสุด/สูงสุดสำหรับราคาที่เป็นช่วง</p>
        </div>
        <LinkButton href={EXPENSE_SHEET_URL} label="เปิดชีทรายจ่าย" icon={ExternalLink} />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {expenseData.categories.map((item) => (
          <SummaryCard key={item.key} title={item.label} summary={item} />
        ))}
        <SummaryCard title="รวมทั้งหมด" summary={expenseData.total} />
      </section>

      <section className="card space-y-4 p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="ค้นหาจังหวัด ชุมชน ผู้ประสานงาน หรือรายการค่าใช้จ่าย" />
        <FilterChips
          options={categoryOptions}
          value={category}
          onChange={setCategory}
          allLabel="ค่าใช้จ่ายทั้งหมด"
          labelMap={categoryLabels}
        />
        <p className="text-sm text-zinc-400">
          แสดง {filteredRows.length}/{communities.length} ชุมชน ค่าใช้จ่ายที่ไม่มีจำนวนเงินจะนับเป็นรายการ แต่ไม่รวมยอดเงิน
        </p>
      </section>

      <section className="space-y-4">
        {filteredRows.map((community, index) => {
          const items = category
            ? community.expenseItems.filter((item) => item.category === category)
            : community.expenseItems
          const tel = phoneHref(community.contactPhone)
          return (
            <article key={community.id || `${community.province}-${community.community}-${index}`} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-peps">ข้อ {community.sequence || community.expenseIndex || index + 1}</p>
                  <h2 className="text-lg font-bold text-white">{community.province} - {community.community}</h2>
                  <p className="muted">
                    {community.contactName || 'ยังไม่มีผู้ประสานงาน'} {community.contactPhone ? `• ${community.contactPhone}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={community.checklistStatus} />
                  <StatusBadge status={community.shootingStatus} />
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-zinc-500">วันที่ / เวลา</p>
                  <p className="text-zinc-100">
                    {community.shootDate ? formatThaiDate(community.shootDate) : '-'} {[community.startTime, community.endTime].filter(Boolean).join('-')}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">CONTENT</p>
                  <p className="text-zinc-100">{community.content || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-zinc-500">INTRODUCTION</p>
                  <p className="text-zinc-100">{community.introduction || '-'}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {items.length ? items.map((item) => (
                  <ExpenseLine key={`${community.id}-${item.key}-${item.label}`} item={item} />
                )) : (
                  <div className="rounded-md border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500">
                    {category ? `ยังไม่มีรายการ ${categoryLabels[category]}` : 'ยังไม่มีรายการค่าใช้จ่าย'}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <LinkButton href={EXPENSE_SHEET_URL} label="ดูในชีท" icon={ReceiptText} />
                {tel ? <LinkButton href={tel} label="โทร" icon={Phone} /> : null}
                <LinkButton label="เปิดชุมชน" icon={Search} onClick={() => { window.location.hash = '/communities' }} />
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
