export function toDateInputValue(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function formatThaiDate(value) {
  if (!value) return 'ไม่ระบุวันที่'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

export function uniqueDates(items = []) {
  return Array.from(new Set(items.map((item) => toDateInputValue(item.date || item.shootDate)).filter(Boolean))).sort()
}
