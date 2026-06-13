export function extractPhone(value) {
  const text = String(value || '')
  const match = text.match(/(?:\+?66|0)[0-9\s().-]{7,}/)
  return match ? match[0].replace(/[^\d+]/g, '') : ''
}

export function stripPhone(value) {
  return String(value || '')
    .replace(/(?:\+?66|0)[0-9\s().-]{7,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function phoneHref(value) {
  const phone = extractPhone(value)
  return phone ? `tel:${phone}` : ''
}
