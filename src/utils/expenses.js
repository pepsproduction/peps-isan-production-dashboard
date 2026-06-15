export const EXPENSE_CHECK_ITEMS = [
  { key: 'expenseLocation', label: 'ค่าสถานที่' },
  { key: 'expenseInfluencer', label: 'ค่า Influencer' },
  { key: 'expenseContent1000', label: 'ค่า content 1000' },
]

export const EXPENSE_SUMMARY_CATEGORIES = [
  ...EXPENSE_CHECK_ITEMS,
  { key: 'other', label: 'อื่นๆ' },
]

const PAID_TEXT = 'จ่ายแล้ว'
const UNPAID_TEXT = 'ยังไม่จ่าย'

function cleanAmount(value) {
  return String(value ?? '').replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function parseExpenseAmountRange(value) {
  const text = cleanAmount(value).replace(/,/g, '')
  if (!text) return { min: 0, max: 0, hasAmount: false }

  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|–|—|ถึง|to)\s*(\d+(?:\.\d+)?)/i)
  if (rangeMatch) {
    const first = Number(rangeMatch[1])
    const second = Number(rangeMatch[2])
    if (Number.isFinite(first) && Number.isFinite(second)) {
      return { min: Math.min(first, second), max: Math.max(first, second), hasAmount: true }
    }
  }

  const numberMatch = text.match(/\d+(?:\.\d+)?/)
  if (!numberMatch) return { min: 0, max: 0, hasAmount: false }
  const amount = Number(numberMatch[0])
  return Number.isFinite(amount)
    ? { min: amount, max: amount, hasAmount: true }
    : { min: 0, max: 0, hasAmount: false }
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
      category: item.key,
      custom: false,
    }))
    .filter((item) => item.enabled)
  const customItems = normalizeExpenseCustomItems(record.expenseCustomItems || record.expenseOther).map((item, index) => ({
    key: `expenseCustom-${index}`,
    label: item.label,
    enabled: true,
    amount: item.amount,
    paid: item.paid,
    category: 'other',
    custom: true,
  }))
  return [...defaultItems, ...customItems].map((item) => ({
    ...item,
    amountRange: parseExpenseAmountRange(item.amount),
  }))
}

export function getExpenseProgress(items = []) {
  const total = items.filter((item) => item.label).length
  const paid = items.filter((item) => item.label && item.paid).length
  const amountTotal = items.reduce((sum, item) => {
    const range = item.amountRange || parseExpenseAmountRange(item.amount)
    return range.hasAmount ? sum + range.max : sum
  }, 0)
  return {
    paid,
    total,
    amountTotal,
    percent: total ? Math.round((paid / total) * 100) : 0,
  }
}

function createSummary(label) {
  return {
    label,
    itemCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    minTotal: 0,
    maxTotal: 0,
    communities: [],
  }
}

export function summarizeExpenses(records = []) {
  const categoryMap = Object.fromEntries(
    EXPENSE_SUMMARY_CATEGORIES.map((category) => [category.key, createSummary(category.label)]),
  )
  const rows = records.map((record, index) => {
    const items = buildExpenseItems(record)
    items.forEach((item) => {
      const categoryKey = item.category || (item.custom ? 'other' : item.key)
      const summary = categoryMap[categoryKey] || categoryMap.other
      const range = item.amountRange || parseExpenseAmountRange(item.amount)
      summary.itemCount += 1
      summary.paidCount += item.paid ? 1 : 0
      summary.unpaidCount += item.paid ? 0 : 1
      summary.minTotal += range.hasAmount ? range.min : 0
      summary.maxTotal += range.hasAmount ? range.max : 0
      summary.communities.push({
        id: record.id || record.communityId || `${record.province}-${record.community}-${index}`,
        province: record.province,
        community: record.community,
        label: item.label,
        amount: item.amount,
        paid: item.paid,
      })
    })
    return {
      ...record,
      expenseItems: items,
      expenseIndex: index + 1,
    }
  })

  const categories = EXPENSE_SUMMARY_CATEGORIES.map((category) => ({
    key: category.key,
    ...categoryMap[category.key],
  }))
  const total = categories.reduce(
    (summary, category) => ({
      itemCount: summary.itemCount + category.itemCount,
      paidCount: summary.paidCount + category.paidCount,
      unpaidCount: summary.unpaidCount + category.unpaidCount,
      minTotal: summary.minTotal + category.minTotal,
      maxTotal: summary.maxTotal + category.maxTotal,
    }),
    { itemCount: 0, paidCount: 0, unpaidCount: 0, minTotal: 0, maxTotal: 0 },
  )

  return { rows, categories, total }
}

export function formatMoneyRange(min, max) {
  const formatter = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 })
  if (!min && !max) return '0'
  if (min === max) return formatter.format(max)
  return `${formatter.format(min)} - ${formatter.format(max)}`
}
