export function makeMapsUrl(queryOrUrl) {
  const value = String(queryOrUrl || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
}

export function makeDirectionsUrl(origin, destination) {
  if (!origin && !destination) return ''
  const params = new URLSearchParams()
  if (origin) params.set('origin', origin)
  if (destination) params.set('destination', destination)
  return `https://www.google.com/maps/dir/?api=1&${params.toString()}`
}

export function makeEmbedUrl(queryOrUrl, apiKey = '') {
  const value = String(queryOrUrl || '').trim()
  if (!value) return ''
  const query = /^https?:\/\//i.test(value) ? value : value
  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}`
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}
