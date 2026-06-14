export const EXPENSE_CHECK_ITEMS = [
  { key: 'expenseLocation', label: 'ค่าสถานที่' },
  { key: 'expenseInfluencer', label: 'ค่า Influencer' },
  { key: 'expenseContent1000', label: 'ค่า content 1000' },
]

const DONE_TEXT = 'สำเร็จ'

export function isExpenseDone(value) {
  const text = String(value ?? '').trim().toLowerCase()
  return ['true', 'yes', 'y', '1', 'done', 'paid', 'ok', 'checked', DONE_TEXT, 'จ่ายแล้ว', 'เรียบร้อย', 'พร้อม', '✓', '✔', '✅'].includes(text)
}

export function toExpenseSheetValue(value) {
  return value ? DONE_TEXT : ''
}

export function normalizeExpenseCustomItems(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        label: String(item?.label || item?.name || '').trim(),
        done: Boolean(item?.done),
      }))
      .filter((item) => item.label)
  }

  const text = String(value || '').trim()
  if (!text) return []

  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return normalizeExpenseCustomItems(parsed)
  } catch {
    // Plain text from Google Sheets is the normal path.
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const done = /^\[(x|✓|✔|done|สำเร็จ)\]/i.test(line) || /^✅/.test(line)
      const label = line
        .replace(/^\[(x| |✓|✔|done|สำเร็จ)\]\s*/i, '')
        .replace(/^✅\s*/, '')
        .replace(/^[-•]\s*/, '')
        .trim()
      return { label, done }
    })
    .filter((item) => item.label)
}

export function serializeExpenseCustomItems(items = []) {
  return normalizeExpenseCustomItems(items)
    .map((item) => `[${item.done ? 'x' : ' '}] ${item.label}`)
    .join('\n')
}

export function buildExpenseItems(record = {}) {
  const defaultItems = EXPENSE_CHECK_ITEMS.map((item) => ({
    ...item,
    done: isExpenseDone(record[item.key]),
    custom: false,
  }))
  const customItems = normalizeExpenseCustomItems(record.expenseCustomItems || record.expenseOther).map((item, index) => ({
    key: `expenseCustom-${index}`,
    label: item.label,
    done: item.done,
    custom: true,
  }))
  return [...defaultItems, ...customItems]
}

export function getExpenseProgress(items = []) {
  const total = items.filter((item) => item.label).length
  const done = items.filter((item) => item.label && item.done).length
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
  }
}
