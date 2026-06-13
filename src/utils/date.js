const THAI_TIME_ZONE = 'Asia/Bangkok'
const THAI_MONTHS = new Map([
  ['ม.ค.', 1],
  ['มกราคม', 1],
  ['ก.พ.', 2],
  ['กุมภาพันธ์', 2],
  ['มี.ค.', 3],
  ['มีนาคม', 3],
  ['เม.ย.', 4],
  ['เมษายน', 4],
  ['พ.ค.', 5],
  ['พฤษภาคม', 5],
  ['มิ.ย.', 6],
  ['มิถุนายน', 6],
  ['ก.ค.', 7],
  ['กรกฎาคม', 7],
  ['ส.ค.', 8],
  ['สิงหาคม', 8],
  ['ก.ย.', 9],
  ['กันยายน', 9],
  ['ต.ค.', 10],
  ['ตุลาคม', 10],
  ['พ.ย.', 11],
  ['พฤศจิกายน', 11],
  ['ธ.ค.', 12],
  ['ธันวาคม', 12],
])

function pad(value) {
  return String(value).padStart(2, '0')
}

function normalizeYear(year) {
  const numericYear = Number(year)
  if (!Number.isFinite(numericYear)) return null
  return numericYear > 2400 ? numericYear - 543 : numericYear
}

export function parseDateParts(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    }
  }

  const text = String(value).trim()
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) }
  }

  const thaiText = text.replace(/วัน(?:จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์)/g, '').trim()
  const thaiMonth = Array.from(THAI_MONTHS.entries()).find(([name]) => thaiText.includes(name))
  if (thaiMonth) {
    const numbers = thaiText.match(/\d+/g) || []
    if (numbers.length >= 2) {
      const year = normalizeYear(numbers[numbers.length - 1])
      const day = Number(numbers[0])
      return year ? { year, month: thaiMonth[1], day } : null
    }
  }

  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (slash) {
    const year = normalizeYear(slash[3].length === 2 ? `20${slash[3]}` : slash[3])
    return year ? { year, month: Number(slash[2]), day: Number(slash[1]) } : null
  }

  const fallback = new Date(text)
  if (!Number.isNaN(fallback.getTime())) {
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth() + 1,
      day: fallback.getDate(),
    }
  }
  return null
}

export function toDateInputValue(value) {
  const parts = parseDateParts(value)
  if (!parts) return ''
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

export function formatThaiDate(value, sheetDay = '') {
  if (!value) return 'ไม่ระบุวันที่'
  const parts = parseDateParts(value)
  if (!parts) return String(value)
  const date = new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0)
  const dayLabel =
    sheetDay ||
    new Intl.DateTimeFormat('th-TH', {
      weekday: 'short',
      timeZone: THAI_TIME_ZONE,
    }).format(date)
  const dateLabel = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: THAI_TIME_ZONE,
  }).format(date)
  return `${dayLabel} ${dateLabel}`
}

export function todayInput() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: THAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${byType.year}-${byType.month}-${byType.day}`
}

export function uniqueDates(items = []) {
  return Array.from(new Set(items.map((item) => toDateInputValue(item.date || item.shootDate)).filter(Boolean))).sort()
}
