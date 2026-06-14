function cleanStop(value) {
  return String(value || '')
    .replace(/^\d+\s*[.)-]?\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim())
}

function isGoogleMapsUrl(url) {
  return /(^|\.)google\.[^/]+$/i.test(url.hostname) && url.pathname.includes('/maps')
}

export function isUsableMapsUrl(value) {
  const text = String(value || '').trim()
  if (!isHttpUrl(text)) return false
  try {
    const url = new URL(text)
    if (!isGoogleMapsUrl(url)) return true
    const params = url.searchParams
    const hasDirIntent = url.pathname.includes('/dir') || text.includes('/maps/dir') || params.get('api') === '1'
    const hasOriginKey = params.has('origin') || params.has('saddr')
    const hasDestinationKey = params.has('destination') || params.has('daddr')
    const origin = params.get('origin') || params.get('saddr') || ''
    const destination = params.get('destination') || params.get('daddr') || ''
    const pathStops = parseRouteStopsFromUrl(text)

    if (hasDirIntent && (hasOriginKey || hasDestinationKey)) {
      return Boolean((origin && destination) || pathStops.length >= 2)
    }
    if (params.has('query') || params.has('q')) return Boolean(params.get('query') || params.get('q'))
    return pathStops.length >= 2 || url.pathname.includes('/place/') || url.pathname.includes('/search/')
  } catch {
    return false
  }
}

export function resolveMapTarget(url, query) {
  if (isUsableMapsUrl(url)) return String(url).trim()
  return String(query || url || '').trim()
}

function decodeMapSegment(value) {
  return cleanStop(decodeURIComponent(String(value || '').replace(/\+/g, ' ')))
}

function splitDaddr(value) {
  return String(value || '')
    .split(/\s+to:|to:/i)
    .map(cleanStop)
    .filter(Boolean)
}

function parseRouteStopsFromUrl(value) {
  try {
    const url = new URL(value)
    const params = url.searchParams
    const origin = params.get('origin') || params.get('saddr')
    const destination = params.get('destination') || params.get('daddr')
    const waypoints = (params.get('waypoints') || '')
      .split('|')
      .map(cleanStop)
      .filter(Boolean)

    if (origin && destination) {
      const destinationStops = params.get('daddr') ? splitDaddr(destination) : [destination]
      return [origin, ...waypoints, ...destinationStops].map(cleanStop).filter(Boolean)
    }

    const pathParts = url.pathname.split('/').filter(Boolean)
    const dirIndex = pathParts.findIndex((part) => part === 'dir')
    if (dirIndex >= 0) {
      return pathParts
        .slice(dirIndex + 1)
        .filter((part) => part && !part.startsWith('@') && !part.startsWith('data='))
        .map(decodeMapSegment)
        .filter(Boolean)
    }
  } catch {
    return []
  }
  return []
}

function parsePlaceQueryFromUrl(value) {
  try {
    const url = new URL(value)
    const query = url.searchParams.get('query') || url.searchParams.get('q')
    if (query) return cleanStop(query)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const placeIndex = pathParts.findIndex((part) => part === 'place')
    if (placeIndex >= 0 && pathParts[placeIndex + 1]) return decodeMapSegment(pathParts[placeIndex + 1])
  } catch {
    return ''
  }
  return ''
}

function previewStops(stops) {
  if (stops.length <= 3) return stops
  return [stops[0], stops[stops.length - 1]]
}

export function parseRouteStops(queryOrUrl) {
  const value = String(queryOrUrl || '').trim()
  if (!value) return []
  if (isHttpUrl(value)) return parseRouteStopsFromUrl(value)
  const delimiter = value.includes('|') ? /\s*\|\s*/ : value.includes('\u2192') ? /\s*\u2192\s*/ : /\s+\u0e44\u0e1b\s+/
  if (!delimiter.test(value)) return []
  return value.split(delimiter).map(cleanStop).filter(Boolean)
}

export function makeMapsUrl(queryOrUrl) {
  const value = String(queryOrUrl || '').trim()
  if (!value) return ''
  if (isHttpUrl(value)) return value
  const stops = parseRouteStops(value)
  if (stops.length >= 2) {
    const params = new URLSearchParams()
    params.set('api', '1')
    params.set('origin', stops[0])
    params.set('destination', stops[stops.length - 1])
    if (stops.length > 2) params.set('waypoints', stops.slice(1, -1).join('|'))
    return `https://www.google.com/maps/dir/?${params.toString()}`
  }
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
  const stops = previewStops(parseRouteStops(value))
  if (stops.length >= 2) {
    if (apiKey) {
      const params = new URLSearchParams({
        key: apiKey,
        origin: stops[0],
        destination: stops[stops.length - 1],
      })
      if (stops.length > 2) params.set('waypoints', stops.slice(1, -1).join('|'))
      return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`
    }
    const destination = stops.slice(1).map((stop, index) => `${index ? 'to:' : ''}${stop}`).join(' ')
    const params = new URLSearchParams({
      saddr: stops[0],
      daddr: destination,
      output: 'embed',
    })
    return `https://maps.google.com/maps?${params.toString()}`
  }
  const query = isHttpUrl(value) ? parsePlaceQueryFromUrl(value) || value : value
  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}`
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}
