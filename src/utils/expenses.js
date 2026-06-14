export const EXPENSE_CHECK_ITEMS = [
  { key: 'expenseLocation', label: 'ค่าสถานที่' },
  { key: 'expenseInfluencer', label: 'ค่า Influencer' },
  { key: 'expenseContent1000', label: 'ค่า content 1000' },
]

const PAID_TEXT = 'จ่ายแล้ว'
const UNPAID_TEXT = 'ยังไม่จ่าย'

function cleanAmount(value) {
  return String(value ?? '').replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function isExpensePaid(value) {
  const text = String(value ?? '').trim().toLowerCase()
  return ['true', 'yes', 'y', '1', 'done', 'paid', 'ok', 'checked', PAID_TEXT, 'สำเร็จ', 'เรียบร้อย', 'พร้อม', '✓', '✔', '✅'].includes(text) || text.includes(PAID_TEXT)
}

export function parseExpenseValue(value) {
  const text = String(value || '').trim()
  if (!text) return { enabled: false, amount: '', paid: false }
  const paid = isExpensePaid(text)
  const amount = cleanAmount(
    text
      .replace(PAID_TEXT, '')
      .replace(UNPAID_TEXT, '')
      .replace(/^\[(x| |✓|✔|paid|done|จ่ายแล้ว|สำเร็จ)\]\s*/i, '')
      .replace(/^✅\s*/, ''),
  )
  return {
    enabled: true,
    amount: amount && !['สำเร็จ', 'done', 'paid', 'ok', 'checked'].includes(amount.toLowerCase()) ? amount : '',
    paid,
  }
}

export function toExpenseSheetValue(expense) {
  if (!expense?.enabled) return ''
  const amount = cleanAmount(expense.amount)
  return [amount, expense.paid ? PAID_TEXT : UNPAID_TEXT].filter(Boolean).join(' | ')
}

export function normalizeExpenseCustomItems(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        label: String(item?.label || item?.name || '').trim(),
        amount: cleanAmount(item?.amount),
        paid: Boolean(item?.paid ?? item?.done),
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
      const paid = /^\[(x|✓|✔|paid|done|จ่ายแล้ว|สำเร็จ)\]/i.test(line) || /^✅/.test(line) || line.includes(PAID_TEXT)
      const cleaned = line
        .replace(/^\[(x| |✓|✔|paid|done|จ่ายแล้ว|สำเร็จ)\]\s*/i, '')
        .replace(/^✅\s*/, '')
        .replace(/^[-•]\s*/, '')
        .trim()
      const [labelPart, ...amountParts] = cleaned.split(':')
      return {
        label: labelPart.trim(),
        amount: cleanAmount(amountParts.join(':').replace(PAID_TEXT, '').replace(UNPAID_TEXT, '')),
        paid,
      }
    })
    .filter((item) => item.label)
}

export function serializeExpenseCustomItems(items = []) {
  return normalizeExpenseCustomItems(items)
    .map((item) => `[${item.paid ? 'x' : ' '}] ${item.label}${item.amount ? `: ${item.amount}` : ''}`)
    .join('\n')
}

export function buildExpenseItems(record = {}) {
  const defaultItems = EXPENSE_CHECK_ITEMS
    .map((item) => ({
      ...item,
      ...parseExpenseValue(record[item.key]),
      custom: false,
    }))
    .filter((item) => item.enabled)
  const customItems = normalizeExpenseCustomItems(record.expenseCustomItems || record.expenseOther).map((item, index) => ({
    key: `expenseCustom-${index}`,
    label: item.label,
    enabled: true,
    amount: item.amount,
    paid: item.paid,
    custom: true,
  }))
  return [...defaultItems, ...customItems]
}

export function getExpenseProgress(items = []) {
  const total = items.filter((item) => item.label).length
  const paid = items.filter((item) => item.label && item.paid).length
  const amountTotal = items.reduce((sum, item) => {
    const amount = String(item.amount || '').replace(/,/g, '').trim()
    if (!/^\d+(?:\.\d+)?$/.test(amount)) return sum
    const numeric = Number(amount)
    return Number.isFinite(numeric) ? sum + numeric : sum
  }, 0)
  return {
    paid,
    total,
    amountTotal,
    percent: total ? Math.round((paid / total) * 100) : 0,
  }
}
