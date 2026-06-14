import { useEffect, useState } from 'react'
import { Plus, Save, Trash2, X } from 'lucide-react'
import { STATUS_OPTIONS } from '../config'
import { EXPENSE_CHECK_ITEMS, isExpenseDone, normalizeExpenseCustomItems, serializeExpenseCustomItems, toExpenseSheetValue } from '../utils/expenses'

export default function EditModal({ open, title, record, onClose, onSave, saving = false }) {
  const [form, setForm] = useState({})
  const [newExpenseItem, setNewExpenseItem] = useState('')

  useEffect(() => {
    if (record) {
      setForm({
        checklistStatus: record.checklistStatus || record.status || 'ยังไม่ได้เช็ก',
        shootingStatus: record.shootingStatus || 'ยังไม่ได้เช็ก',
        contactName: record.contactName || '',
        contactPhone: record.contactPhone || '',
        note: record.note || record.checkNotes || '',
        storyboardLink: record.storyboardLink || '',
        expenseLocation: isExpenseDone(record.expenseLocation),
        expenseInfluencer: isExpenseDone(record.expenseInfluencer),
        expenseContent1000: isExpenseDone(record.expenseContent1000),
        expenseCustomItems: normalizeExpenseCustomItems(record.expenseCustomItems || record.expenseOther),
      })
      setNewExpenseItem('')
    }
  }, [record])

  if (!open) return null

  const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const setCustomExpense = (index, patch) => {
    setValue('expenseCustomItems', (form.expenseCustomItems || []).map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }
  const addCustomExpense = () => {
    const label = newExpenseItem.trim()
    if (!label) return
    setValue('expenseCustomItems', [...(form.expenseCustomItems || []), { label, done: false }])
    setNewExpenseItem('')
  }
  const removeCustomExpense = (index) => {
    setValue('expenseCustomItems', (form.expenseCustomItems || []).filter((_, itemIndex) => itemIndex !== index))
  }
  const submitForm = () => {
    onSave({
      ...form,
      ...Object.fromEntries(EXPENSE_CHECK_ITEMS.map((item) => [item.key, toExpenseSheetValue(form[item.key])])),
      expenseCustomItems: serializeExpenseCustomItems(form.expenseCustomItems),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <form
        className="card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 sm:max-w-2xl sm:rounded-lg"
        onSubmit={(event) => {
          event.preventDefault()
          submitForm()
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
          <div className="space-y-3 md:col-span-2">
            <div>
              <p className="text-sm font-semibold text-white">ค่าใช้จ่ายระหว่างชุมชน</p>
              <p className="text-xs text-zinc-500">ติ๊กเมื่อรายการนั้นเคลียร์สำเร็จ ข้อมูลจะบันทึกลง Checklist_ก่อนถ่าย</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {EXPENSE_CHECK_ITEMS.map((item) => (
                <label key={item.key} className="flex min-h-12 items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-peps"
                    checked={Boolean(form[item.key])}
                    onChange={(event) => setValue(item.key, event.target.checked)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div className="space-y-2">
              {(form.expenseCustomItems || []).map((item, index) => (
                <div key={`${item.label}-${index}`} className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-peps"
                      checked={Boolean(item.done)}
                      onChange={(event) => setCustomExpense(index, { done: event.target.checked })}
                    />
                    สำเร็จ
                  </label>
                  <input className="field" value={item.label} onChange={(event) => setCustomExpense(index, { label: event.target.value })} />
                  <button type="button" className="btn btn-ghost px-3" onClick={() => removeCustomExpense(index)} aria-label="ลบรายการค่าใช้จ่าย">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className="field"
                value={newExpenseItem}
                onChange={(event) => setNewExpenseItem(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addCustomExpense()
                  }
                }}
                placeholder="เพิ่มรายการเอง เช่น ค่าเรือ ค่าอาหารทีม ค่าเดินทาง"
              />
              <button type="button" className="btn btn-ghost" onClick={addCustomExpense}>
                <Plus size={16} />
                เพิ่มรายการ
              </button>
            </div>
          </div>
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
