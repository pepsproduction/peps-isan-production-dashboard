function normalizeKey(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[\\/_|]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[‐‑‒–—-]/g, ' ')
    .replace(/[.(),[\]{}'"“”‘’]/g, '')
    .replace(/\s+/g, '')
}

export function storyboardStatusFromCount(count) {
  if (count >= 6) return 'complete'
  if (count > 0) return 'partial'
  return 'missing'
}

export function storyboardStatusLabel(status, count = 0) {
  if (status === 'complete') return `ครบ 6 รูป`
  if (status === 'partial') return `มีแล้ว ${count || 1}/6`
  return 'ยังไม่มี'
}

export function buildStoryboardIndex(folders = [], communities = []) {
  const byCommunityId = new Map()
  const unmatched = []

  folders.forEach((folder) => {
    const matched =
      communities.find((community) => {
        const sequence = String(community.sequence || '').padStart(2, '0')
        return sequence && String(folder.name || '').trim().startsWith(sequence)
      }) ||
      communities.find((community) => {
        const folderKey = normalizeKey(folder.name)
        return (
          folderKey.includes(normalizeKey(community.province)) &&
          (folderKey.includes(normalizeKey(community.community)) ||
            normalizeKey(community.community).includes(folderKey))
        )
      })

    if (matched) {
      byCommunityId.set(matched.id, {
        ...folder,
        matchedCommunityId: matched.id,
        status: storyboardStatusFromCount(Number(folder.imageCount || folder.images?.length || 0)),
      })
    } else {
      unmatched.push(folder)
    }
  })

  return { byCommunityId, unmatched }
}

export function sortStoryboardFiles(files = []) {
  return [...files].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'th', {
      numeric: true,
      sensitivity: 'base',
    }),
  )
}

export function makeDemoStoryboardDataUrl(title, index, total) {
  const colors = ['#ff7a00', '#f5b642', '#18a058', '#38bdf8', '#f97316', '#ef4444']
  const accent = colors[(index - 1) % colors.length]
  const safeTitle = String(title || '').replace(/[<>&]/g, '')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b0b0f"/>
          <stop offset="1" stop-color="#24212a"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <rect x="52" y="48" width="1176" height="624" rx="24" fill="#15151d" stroke="${accent}" stroke-width="8"/>
      <rect x="92" y="92" width="500" height="44" rx="22" fill="${accent}"/>
      <text x="112" y="123" fill="#0b0b0f" font-size="24" font-family="Arial, sans-serif" font-weight="700">Storyboard Panel ${index}/${total}</text>
      <text x="96" y="230" fill="#ffffff" font-size="58" font-family="Arial, sans-serif" font-weight="700">${safeTitle}</text>
      <text x="100" y="310" fill="#f5b642" font-size="34" font-family="Arial, sans-serif">PEPS ISAN COMMUNITY SHOOT</text>
      <circle cx="1060" cy="485" r="92" fill="${accent}" opacity="0.88"/>
      <rect x="730" y="420" width="250" height="130" rx="18" fill="#ffffff" opacity="0.92"/>
      <rect x="760" y="452" width="190" height="18" rx="9" fill="#0b0b0f" opacity="0.7"/>
      <rect x="760" y="488" width="142" height="18" rx="9" fill="#0b0b0f" opacity="0.42"/>
      <text x="96" y="610" fill="#d7d7df" font-size="28" font-family="Arial, sans-serif">Demo image loaded inside the web viewer</text>
    </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
