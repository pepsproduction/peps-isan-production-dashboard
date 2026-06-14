import { useMemo, useState } from 'react'
import CommunityCard from '../components/CommunityCard'
import EditModal from '../components/EditModal'
import FilterChips from '../components/FilterChips'
import SearchInput from '../components/SearchInput'
import StoryboardViewer from '../components/StoryboardViewer'
import { fetchStoryboardImages } from '../api/googleSheetApi'
import { SHEETS } from '../config'
import { normalizeThai } from '../utils/normalize'

export default function Communities({ data, config, copyText, updateRecord, notify }) {
  const communities = useMemo(() => data?.communities || [], [data])
  const [search, setSearch] = useState('')
  const [province, setProvince] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState('')
  const [storyboard, setStoryboard] = useState('')
  const [missingContact, setMissingContact] = useState(false)
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [viewer, setViewer] = useState({ open: false, community: null, images: [], driveUrl: '' })

  const provinces = useMemo(() => Array.from(new Set(communities.map((item) => item.province).filter(Boolean))).sort(), [communities])
  const contents = useMemo(() => Array.from(new Set(communities.map((item) => item.content).filter(Boolean))).sort(), [communities])
  const dates = useMemo(() => Array.from(new Set(communities.map((item) => item.shootDate).filter(Boolean))).sort(), [communities])
  const statuses = useMemo(() => Array.from(new Set(communities.flatMap((item) => [item.checklistStatus, item.shootingStatus]).filter(Boolean))).sort(), [communities])

  const filtered = communities.filter((community) => {
    const searchKey = normalizeThai([community.community, community.province, community.district, community.content, community.program].join(' '))
    return (
      (!search || searchKey.includes(normalizeThai(search))) &&
      (!province || community.province === province) &&
      (!content || community.content === content) &&
      (!date || community.shootDate === date) &&
      (!storyboard || community.storyboardStatus === storyboard) &&
      (!missingContact || (!community.contactName && !community.contactPhone)) &&
      (!status || community.checklistStatus === status || community.shootingStatus === status)
    )
  })

  const openStoryboard = async (community) => {
    try {
      const result = await fetchStoryboardImages(config, community)
      setViewer({ open: true, community, images: result.images || [], driveUrl: result.folder?.url || community.storyboardLink })
    } catch (err) {
      notify(`โหลด Storyboard ไม่สำเร็จ: ${err.message}`, 'error')
    }
  }

  const saveEdit = async (form) => {
    setSaving(true)
    try {
      const checklistFields = {
        checklistStatus: form.checklistStatus,
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
            rowKey: editing.checklistRowNumber || editing.checklistId || editing.id,
            communityId: editing.id,
            fields: checklistFields,
          },
          {
            sheetName: SHEETS.communities,
            rowKey: editing.id,
            communityId: editing.id,
            fields: {
              checklistStatus: form.checklistStatus,
              shootingStatus: form.shootingStatus,
              contactName: form.contactName,
              contactPhone: form.contactPhone,
              note: form.note,
              storyboardLink: form.storyboardLink,
            },
          },
        ],
      })
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Communities</h1>
        <p className="muted">รวมชุมชนทั้งหมด พร้อม search, filter, maps, storyboard, contact และสถานะงาน</p>
      </div>

      <section className="card space-y-4 p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="ค้นหาชุมชน จังหวัด โปรแกรม หรือ content" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div><p className="mb-2 text-sm text-zinc-400">จังหวัด</p><FilterChips options={provinces} value={province} onChange={setProvince} /></div>
          <div><p className="mb-2 text-sm text-zinc-400">CONTENT</p><FilterChips options={contents} value={content} onChange={setContent} /></div>
          <div><p className="mb-2 text-sm text-zinc-400">วันที่ถ่าย</p><FilterChips options={dates} value={date} onChange={setDate} /></div>
          <div><p className="mb-2 text-sm text-zinc-400">สถานะงาน</p><FilterChips options={statuses} value={status} onChange={setStatus} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChips options={['complete', 'partial', 'missing']} value={storyboard} onChange={setStoryboard} allLabel="Storyboard ทั้งหมด" />
          <button type="button" className={`chip ${missingContact ? 'border-peps bg-peps text-black' : 'bg-white/5'}`} onClick={() => setMissingContact((value) => !value)}>
            ไม่มีข้อมูลติดต่อ
          </button>
        </div>
      </section>

      <p className="text-sm text-zinc-400">พบ {filtered.length}/{communities.length} ชุมชน</p>

      <section className="grid gap-4 xl:grid-cols-2">
        {filtered.length ? (
          filtered.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              onCopy={copyText}
              onEdit={setEditing}
              onStoryboard={openStoryboard}
            />
          ))
        ) : (
          <div className="card p-8 text-center text-zinc-400 xl:col-span-2">ไม่พบชุมชนตามเงื่อนไข</div>
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
