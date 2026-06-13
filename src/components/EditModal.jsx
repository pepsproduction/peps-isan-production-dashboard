import { useEffect, useState } from 'react'
import { Save, X } from 'lucide-react'
import { STATUS_OPTIONS } from '../config'

export default function EditModal({ open, title, record, onClose, onSave, saving = false }) {
  const [form, setForm] = useState({})

  useEffect(() => {
    if (record) {
      setForm({
        checklistStatus: record.checklistStatus || record.status || 'ยังไม่ได้เช็ก',
        shootingStatus: record.shootingStatus || 'ยังไม่ได้เช็ก',
        contactName: record.contactName || '',
        contactPhone: record.contactPhone || '',
        note: record.note || record.checkNotes || '',
        storyboardLink: record.storyboardLink || '',
      })
    }
  }, [record])

  if (!open) return null

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <form
        className="card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 sm:max-w-2xl sm:rounded-lg"
        onSubmit={(event) => {
          event.preventDefault()
          onSave(form)
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-peps">Edit</p>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button type="button" className="btn btn-ghost px-3" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">สถานะ Checklist</span>
            <select className="field" value={form.checklistStatus || ''} onChange={(event) => setValue('checklistStatus', event.target.value)}>
              {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">สถานะถ่ายทำ</span>
            <select className="field" value={form.shootingStatus || ''} onChange={(event) => setValue('shootingStatus', event.target.value)}>
              {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">ผู้ประสานงาน</span>
            <input className="field" value={form.contactName || ''} onChange={(event) => setValue('contactName', event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-zinc-400">เบอร์โทร</span>
            <input className="field" value={form.contactPhone || ''} onChange={(event) => setValue('contactPhone', event.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-zinc-400">Link Storyboard</span>
            <input className="field" value={form.storyboardLink || ''} onChange={(event) => setValue('storyboardLink', event.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm text-zinc-400">หมายเหตุ / ข้อควรเช็คเพิ่มเติม</span>
            <textarea className="field min-h-28 resize-y" value={form.note || ''} onChange={(event) => setValue('note', event.target.value)} />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} />
            บันทึก
          </button>
        </div>
      </form>
    </div>
  )
}
