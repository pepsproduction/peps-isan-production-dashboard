import { useMemo, useState } from 'react'
import EditModal from '../components/EditModal'
import SearchInput from '../components/SearchInput'
import StatusBadge from '../components/StatusBadge'
import FilterChips from '../components/FilterChips'
import LinkButton from '../components/LinkButton'
import { SHEETS } from '../config'
import { normalizeThai } from '../utils/normalize'
import { phoneHref } from '../utils/phone'
import { Edit3, Phone } from 'lucide-react'

export default function Checklist({ data, updateRecord }) {
  const checklist = useMemo(() => data?.checklist || [], [data])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const statuses = useMemo(() => Array.from(new Set(checklist.map((item) => item.status).filter(Boolean))).sort(), [checklist])
  const filtered = checklist.filter((item) => {
    const key = normalizeThai([item.province, item.community, item.note, item.extraCheck, item.contactName].join(' '))
    return (!search || key.includes(normalizeThai(search))) && (!status || item.status === status)
  })

  const saveEdit = async (form) => {
    setSaving(true)
    try {
      await updateRecord('batchUpdateFields', {
        sheetName: SHEETS.checklist,
        rowKey: editing.rowNumber || editing._rowNumber || editing.communityId || editing.id,
        communityId: editing.communityId,
        fields: {
          status: form.checklistStatus,
          shootingStatus: form.shootingStatus,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          note: form.note,
        },
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
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        {filtered.map((item) => {
          const tel = phoneHref(item.contactPhone)
          return (
            <article key={item.id || item.communityId} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{item.province} - {item.community}</h2>
                  <p className="muted">{item.contactName || 'ยังไม่มีผู้ประสานงาน'} {item.contactPhone || ''}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={item.status} />
                  <StatusBadge status={item.shootingStatus} />
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <div><p className="text-zinc-500">หมายเหตุ</p><p className="text-zinc-100">{item.note || '-'}</p></div>
                <div><p className="text-zinc-500">ข้อควรเช็คเพิ่มเติม</p><p className="text-zinc-100">{item.extraCheck || '-'}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <LinkButton label="แก้ไข" icon={Edit3} onClick={() => setEditing(item)} />
                {tel ? <LinkButton href={tel} label="โทร" icon={Phone} /> : null}
              </div>
            </article>
          )
        })}
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
