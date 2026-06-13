import { buildStoryboardIndex, storyboardStatusFromCount } from './storyboard'

export function compactText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[\\/_|]+/g, ' ')
    .trim()
}

export function normalizeThai(value) {
  return compactText(value)
    .toLowerCase()
    .replace(/[‐‑‒–—-]/g, ' ')
    .replace(/[.(),[\]{}'"“”‘’]/g, '')
    .replace(/\s+/g, '')
}

export function getAny(row, keys, fallback = '') {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== '') {
      return row[key]
    }
  }
  return fallback
}

export function toCommunityId(sequence, province, community) {
  const seq = String(sequence || '').padStart(2, '0')
  return [seq, normalizeThai(province), normalizeThai(community)].filter(Boolean).join('-')
}

export function normalizeCommunity(row = {}) {
  const sequence = getAny(row, ['sequence', 'ลำดับถ่ายใหม่', 'ลำดับ', 'A'])
  const province = getAny(row, ['province', 'จังหวัด', 'B'])
  const community = getAny(row, ['community', 'ชุมชน', 'C'])
  const id = getAny(row, ['id', 'communityId'], toCommunityId(sequence, province, community))

  return {
    id,
    rowNumber: getAny(row, ['rowNumber', '_rowNumber']),
    sequence,
    province,
    community,
    databaseName: getAny(row, ['databaseName', 'ชื่อฐานข้อมูล', 'D']),
    district: getAny(row, ['district', 'ตำบล/อำเภอ', 'E']),
    content: getAny(row, ['content', 'CONTENT', 'F']),
    introduction: getAny(row, ['introduction', 'INTRODUCTION', 'G']),
    products: getAny(row, ['products', 'ผลิตภัณฑ์เด่น', 'H']),
    program: getAny(row, ['program', 'โปรแกรม/จุดถ่าย', 'I']),
    keywords: getAny(row, ['keywords', 'คำค้นหลัก', 'J']),
    backupKeywords: getAny(row, ['backupKeywords', 'คำค้นสำรอง/จุดท่องเที่ยวแผนสำรอง', 'K']),
    mapsSearch: getAny(row, ['mapsSearch', 'Google Maps Search', 'L']),
    mapsUrl: getAny(row, ['mapsUrl', 'Google Maps URL', 'mapUrl', 'url']),
    checkNotes: getAny(row, ['checkNotes', 'ข้อควรเช็ค', 'M']),
    contactName: getAny(row, ['contactName', 'ผู้ประสานงานในพื้นที่', 'N']),
    contactPhone: getAny(row, ['contactPhone', 'เบอร์โทร', 'phone']),
    shootDate: getAny(row, ['shootDate', 'วันที่ไป', 'O']),
    startTime: getAny(row, ['startTime', 'ช่วงเวลาเริ่มถ่าย', 'P']),
    endTime: getAny(row, ['endTime', 'ช่วงเวลาถ่ายจบ', 'Q']),
    lodging: getAny(row, ['lodging', 'ที่พัก', 'R']),
    storyboardLink: getAny(row, ['storyboardLink', 'Link Storyboard', 'S']),
    storyboardStatus: getAny(row, ['storyboardStatus'], ''),
    checklistStatus: getAny(row, ['checklistStatus', 'status'], 'ยังไม่ได้เช็ก'),
    shootingStatus: getAny(row, ['shootingStatus'], 'ยังไม่ได้เช็ก'),
    note: getAny(row, ['note', 'หมายเหตุ']),
  }
}

export function normalizeAppData(raw = {}) {
  const communities = (raw.communities || []).map(normalizeCommunity)
  const storyboardIndex = buildStoryboardIndex(raw.storyboardFolders || [], communities)
  const communitiesWithStoryboard = communities.map((community) => {
    const folder = storyboardIndex.byCommunityId.get(community.id)
    const imageCount = Number(folder?.imageCount || folder?.images?.length || 0)
    return {
      ...community,
      storyboardFolder: folder || null,
      storyboardStatus:
        community.storyboardStatus || storyboardStatusFromCount(imageCount || (community.storyboardLink ? 1 : 0)),
    }
  })

  return {
    ...raw,
    communities: communitiesWithStoryboard,
    timeline: raw.timeline || [],
    checklist: raw.checklist || [],
    lodging: raw.lodging || [],
    maps: raw.maps || [],
    references: raw.references || [],
    storyboardFolders: raw.storyboardFolders || [],
    unmatchedStoryboardFolders: storyboardIndex.unmatched,
    stats: computeStats({ ...raw, communities: communitiesWithStoryboard }),
  }
}

export function computeStats(data) {
  const communities = data.communities || []
  const timeline = data.timeline || []
  const lodging = data.lodging || []
  const provinces = new Set(communities.map((item) => item.province).filter(Boolean))
  const shootDays = new Set(communities.map((item) => item.shootDate).filter(Boolean))
  const storyboardDone = communities.filter((item) => item.storyboardStatus === 'complete').length
  const storyboardAny = communities.filter((item) => ['complete', 'partial'].includes(item.storyboardStatus)).length
  const missingContacts = communities.filter((item) => !item.contactName && !item.contactPhone).length
  const filmingDone = communities.filter((item) => item.shootingStatus === 'ถ่ายเสร็จแล้ว').length
  const needsCheck = communities.filter((item) => compactText(item.checkNotes)).length
  const risks = [
    ...communities
      .filter((item) => ['เสี่ยง', 'ต้องเช็ก', 'รอยืนยัน'].includes(item.checklistStatus) || item.checkNotes)
      .map((item) => ({
        id: `community-${item.id}`,
        level: item.checklistStatus === 'เสี่ยง' ? 'danger' : 'warning',
        title: `${item.province} - ${item.community}`,
        detail: item.checkNotes || item.checklistStatus,
      })),
    ...timeline
      .filter((item) => String(item.status || item.feasibility || '').includes('เสี่ยง'))
      .map((item) => ({
        id: `timeline-${item.id}`,
        level: 'danger',
        title: `${item.date} ${item.batch || ''}`,
        detail: item.notes || item.feasibility || item.status,
      })),
  ].slice(0, 12)

  return {
    provinces: provinces.size,
    communities: communities.length,
    shootDays: shootDays.size || timeline.length,
    lodging: new Set(lodging.map((item) => item.name || item.lodgingName).filter(Boolean)).size || lodging.length,
    storyboardDone,
    storyboardAny,
    storyboardMissing: Math.max(communities.length - storyboardAny, 0),
    missingContacts,
    needsCheck,
    filmingDone,
    alerts: risks,
  }
}

export function groupCount(items, key) {
  const groups = new Map()
  items.forEach((item) => {
    const value = typeof key === 'function' ? key(item) : item[key]
    const label = compactText(value) || 'ไม่ระบุ'
    groups.set(label, (groups.get(label) || 0) + 1)
  })
  return Array.from(groups, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}
