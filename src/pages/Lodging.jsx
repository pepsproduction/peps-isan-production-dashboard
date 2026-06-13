import { useMemo, useState } from 'react'
import LodgingCard from '../components/LodgingCard'
import FilterChips from '../components/FilterChips'
import SearchInput from '../components/SearchInput'
import { normalizeThai } from '../utils/normalize'

export default function Lodging({ data, copyText }) {
  const lodging = useMemo(() => data?.lodging || [], [data])
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const dates = useMemo(() => Array.from(new Set(lodging.map((item) => item.date).filter(Boolean))).sort(), [lodging])
  const filtered = lodging.filter((item) => {
    const key = normalizeThai([item.date, item.province, item.community, item.name, item.address, item.reason].join(' '))
    return (!search || key.includes(normalizeThai(search))) && (!date || item.date === date)
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Lodging ที่พัก</h1>
        <p className="muted">ข้อมูลที่พัก แผนเส้นทางหลังถ่ายจบ และเส้นทางจากที่พักไปจุดถ่ายเช้า</p>
      </div>
      <section className="card space-y-4 p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="ค้นหาที่พัก จังหวัด ชุมชน หรือเหตุผลการเลือก" />
        <FilterChips options={dates} value={date} onChange={setDate} allLabel="ทุกวัน" />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        {filtered.length ? filtered.map((item) => <LodgingCard key={item.id} item={item} onCopy={copyText} />) : <div className="card p-8 text-center text-zinc-400 xl:col-span-2">ไม่พบที่พักตามเงื่อนไข</div>}
      </section>
    </div>
  )
}
