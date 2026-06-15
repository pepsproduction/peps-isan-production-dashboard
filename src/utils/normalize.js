import { buildStoryboardIndex, storyboardStatusFromCount } from './storyboard'
import { toDateInputValue } from './date'
import { extractPhone, stripPhone } from './phone'
import { buildExpenseItems, getExpenseProgress } from './expenses'

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

export function normalizeChecklistStatusValue(value) {
  const text = compactText(value)
  if (!text) return 'ยังไม่ได้เช็ก'
  if (text.includes('ไม่มีข้อมูลติดต่อ')) return '🔴 ไม่มีข้อมูลติดต่อ'
  if (text.includes('รอยืนยัน')) return '🟠 รอยืนยัน'
  if (text.includes('ต้องเช็ก')) return '🟡 ต้องเช็กค่าใช้จ่าย'
  if (text.includes('พร้อม')) return '✅ พร้อม'
  return text
}

export function isChecklistNeedsExpense(status) {
  return normalizeChecklistStatusValue(status).includes('ต้องเช็ก')
}

function rowKeys(row) {
  return Object.keys(row || {})
}

function fuzzyKey(row, key) {
  const target = normalizeThai(key)
  if (!target) return ''
  return rowKeys(row).find((candidate) => {
    const normalized = normalizeThai(candidate)
    return normalized === target || normalized.endsWith(target) || normalized.includes(target)
  })
}

function isUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim())
}

function isActionLabel(value) {
  const text = compactText(value)
  return (
    !isUrl(text) &&
    (['เปิด', 'ดู', 'คลิก'].some((prefix) => text.startsWith(prefix)) ||
      /^open\b/i.test(text) ||
      text.includes('→') ||
      text === 'ไม่มีคิวก่อนหน้า')
  )
}

function usableText(value, fallback = '') {
  const text = compactText(value)
  return text && !isActionLabel(text) ? value : fallback
}

function usableUrl(value) {
  const text = String(value || '').trim()
  return isUrl(text) ? text : ''
}

export function getAny(row, keys, fallback = '') {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== '') {
      return row[key]
    }
  }
  for (const key of keys) {
    const matchedKey = fuzzyKey(row, key)
    const value = matchedKey ? row[matchedKey] : ''
    if (value !== undefined && value !== null && value !== '') return value
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
  const contactRaw = getAny(row, ['contactName', 'ผู้ประสานงานในพื้นที่', 'ผู้ประสานงาน', 'N'])
  const extractedPhone = extractPhone(contactRaw)
  const contactPhone = getAny(row, ['contactPhone', 'เบอร์โทร', 'โทร', 'phone'], extractedPhone)
  const contactName = stripPhone(contactRaw)

  const communityRecord = {
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
    mapsSearch: usableText(getAny(row, ['mapsSearch', 'Google Maps Search', 'L']), `${community} ${province}`),
    mapsUrl: usableUrl(getAny(row, ['mapsUrl', 'Google Maps URL', 'Google Maps Search_url', 'mapUrl', 'url'])),
    checkNotes: getAny(row, ['checkNotes', 'ข้อควรเช็ค', 'M']),
    contactName: contactName || contactRaw,
    contactPhone,
    shootDate:
      toDateInputValue(getAny(row, ['shootDate', 'วันที่ไป', 'O'])) ||
      getAny(row, ['shootDate', 'วันที่ไป', 'O']),
    startTime: getAny(row, ['startTime', 'ช่วงเวลาเริ่มถ่าย', 'P']),
    endTime: getAny(row, ['endTime', 'ช่วงเวลาถ่ายจบ', 'Q']),
    lodging: getAny(row, ['lodging', 'ที่พัก', 'R']),
    storyboardLink: usableUrl(getAny(row, ['storyboardLink', 'Link Storyboard_url', 'Link Storyboard', 'S'])),
    storyboardStatus: getAny(row, ['storyboardStatus'], ''),
    checklistStatus: normalizeChecklistStatusValue(getAny(row, ['checklistStatus', 'สถานะ Checklist'], 'ยังไม่ได้เช็ก')),
    shootingStatus: getAny(row, ['shootingStatus'], 'ยังไม่ได้เช็ก'),
    note: getAny(row, ['note', 'หมายเหตุ']),
    expenseLocation: getAny(row, ['expenseLocation', 'ค่าสถานที่']),
    expenseInfluencer: getAny(row, ['expenseInfluencer', 'ค่า Influencer']),
    expenseContent1000: getAny(row, ['expenseContent1000', 'ค่า content 1000']),
    expenseCustomItems: getAny(row, ['expenseCustomItems', 'ค่าใช้จ่ายเพิ่มเติม', 'ค่าใช้จ่ายอื่นๆ']),
  }
  const expenseItems = buildExpenseItems(communityRecord)
  return {
    ...communityRecord,
    expenseItems,
    expenseProgress: getExpenseProgress(expenseItems),
  }
}

export function normalizeTimelineItem(row = {}, index = 0) {
  const dateRaw = getAny(row, ['date', 'วันที่'])
  const morningTitle = getAny(row, ['morningTitle', 'จุดถ่ายเช้า', 'คิวเช้า'])
  const afternoonTitle = getAny(row, ['afternoonTitle', 'จุดถ่ายบ่าย/งานต่อ', 'คิวบ่าย'])
  return {
    ...row,
    id: getAny(row, ['id', 'ID'], `timeline-${index + 1}`),
    rowNumber: getAny(row, ['rowNumber', '_rowNumber']),
    batch: getAny(row, ['batch', 'ชุดงาน', 'ชุด/วัน']),
    date: toDateInputValue(dateRaw) || dateRaw,
    day: getAny(row, ['day', 'วัน']),
    status: getAny(row, ['status', 'สถานะ']),
    morningTitle,
    morningTime: getAny(row, ['morningTime', 'เวลาเช้า', 'ช่วงเวลาเช้า']),
    afternoonTitle,
    afternoonTime: getAny(row, ['afternoonTime', 'เวลาบ่าย/เดินทาง', 'เวลาบ่าย']),
    routeAssessment: getAny(row, ['routeAssessment', 'ประเมินเส้นทาง']),
    feasibility: getAny(row, ['feasibility', 'ความเป็นไปได้']),
    lodging: getAny(row, ['lodging', 'ที่พักตาม Master', 'ที่พักคืนนี้']),
    nextMorning: getAny(row, ['nextMorning', 'คิวเช้าที่พักรองรับ', 'คิวเช้าถัดไป']),
    notes: getAny(row, ['notes', 'หมายเหตุ']),
    afterShootToLodgingQuery: usableText(getAny(row, [
      'afterShootToLodgingQuery',
      'หลังถ่ายจบ→ที่พัก จาก Master_url',
      'หลังถ่ายจบ→ที่พัก จาก Master',
      'หลังถ่ายจบ→ที่พัก',
    ]), [afternoonTitle, getAny(row, ['lodging', 'ที่พักตาม Master', 'ที่พักคืนนี้'])].filter(Boolean).join(' ไป ')),
    lodgingToMorningQuery: usableText(getAny(row, [
      'lodgingToMorningQuery',
      'ที่พัก→จุดถ่ายเช้า จาก Master_url',
      'ที่พัก→จุดถ่ายเช้า จาก Master',
      'ที่พัก→จุดถ่ายเช้า',
    ]), [getAny(row, ['lodging', 'ที่พักตาม Master', 'ที่พักคืนนี้']), getAny(row, ['nextMorning', 'คิวเช้าที่พักรองรับ', 'คิวเช้าถัดไป'])].filter(Boolean).join(' ไป ')),
    mapQuery: usableText(getAny(row, ['mapQuery', 'Google Maps_url', 'Google Maps', 'แผนที่']), [morningTitle, afternoonTitle].filter(Boolean).join(' ')),
  }
}

export function normalizeChecklistItem(row = {}, index = 0, communities = []) {
  const province = getAny(row, ['province', 'จังหวัด'])
  const community = getAny(row, ['community', 'ชุมชน'])
  const matched = communities.find(
    (item) => normalizeThai(item.province) === normalizeThai(province) && normalizeThai(item.community) === normalizeThai(community),
  )
  const contactRaw = getAny(row, ['contactName', 'ผู้ประสานงาน', 'ผู้ประสานงานในพื้นที่'])
  const extractedPhone = extractPhone(contactRaw)
  const dateRaw = getAny(row, ['date', 'วันที่'], matched?.shootDate || '')
  const checklistStatus = normalizeChecklistStatusValue(getAny(row, ['checklistStatus', 'สถานะ Checklist', 'status'], 'ยังไม่ได้เช็ก'))
  const item = {
    ...row,
    id: getAny(row, ['id', 'ID'], `check-${index + 1}`),
    rowNumber: getAny(row, ['rowNumber', '_rowNumber']),
    communityId: matched?.id || getAny(row, ['communityId'], ''),
    sequence: matched?.sequence || getAny(row, ['sequence', 'ลำดับ']),
    date: toDateInputValue(dateRaw) || dateRaw,
    shootDate: toDateInputValue(matched?.shootDate || dateRaw) || matched?.shootDate || dateRaw,
    startTime: matched?.startTime || getAny(row, ['startTime', 'เวลาเริ่ม']),
    endTime: matched?.endTime || getAny(row, ['endTime', 'เวลาจบ']),
    lodging: matched?.lodging || getAny(row, ['lodging', 'ที่พัก']),
    content: matched?.content || getAny(row, ['content', 'CONTENT']),
    introduction: matched?.introduction || getAny(row, ['introduction', 'INTRODUCTION']),
    province,
    community,
    time: getAny(row, ['time', 'เวลา']),
    item: getAny(row, ['item', 'สิ่งที่ต้องเช็ก']),
    contactName: stripPhone(contactRaw) || contactRaw,
    contactPhone: getAny(row, ['contactPhone', 'เบอร์โทร', 'โทร', 'phone'], extractedPhone),
    status: checklistStatus,
    checklistStatus,
    note: getAny(row, ['note', 'หมายเหตุ']),
    extraCheck: getAny(row, ['extraCheck', 'สิ่งที่ต้องเช็ก', 'ข้อควรเช็คเพิ่มเติม', 'ข้อควรเช็ค']),
    shootingStatus: getAny(row, ['shootingStatus', 'สถานะถ่ายทำ'], 'ยังไม่ได้เช็ก'),
    expenseLocation: getAny(row, ['expenseLocation', 'ค่าสถานที่']),
    expenseInfluencer: getAny(row, ['expenseInfluencer', 'ค่า Influencer']),
    expenseContent1000: getAny(row, ['expenseContent1000', 'ค่า content 1000']),
    expenseCustomItems: getAny(row, ['expenseCustomItems', 'ค่าใช้จ่ายเพิ่มเติม', 'ค่าใช้จ่ายอื่นๆ']),
  }
  const expenseItems = buildExpenseItems(item)
  return {
    ...item,
    expenseItems,
    expenseProgress: getExpenseProgress(expenseItems),
  }
}

export function normalizeLodgingItem(row = {}, index = 0) {
  const dateRaw = getAny(row, ['date', 'วันที่ไป', 'วันที่'])
  const name = getAny(row, ['name', 'lodgingName', 'ที่พักแนะนำ', 'ที่พัก'])
  const community = getAny(row, ['community', 'ชุมชน/จุดถ่ายหลัก', 'ชุมชน'])
  const shootQuery = usableText(getAny(row, ['shootQuery', 'คำค้นจุดถ่าย']), community)
  const beforeLodgingShoot = usableText(getAny(row, ['beforeLodgingShoot', 'จุดถ่ายก่อนเข้าที่พัก']), community)
  const mapsQuery = usableText(getAny(row, [
    'mapsQuery',
    'ลิงก์ที่พัก Google Maps_url',
    'ลิงก์ที่พัก Google Maps',
    'Google Maps',
  ]), name)
  return {
    ...row,
    id: getAny(row, ['id', 'ID'], `lodging-${index + 1}`),
    rowNumber: getAny(row, ['rowNumber', '_rowNumber']),
    sequence: getAny(row, ['sequence', 'วันถ่ายลำดับ', 'ลำดับ']),
    date: toDateInputValue(dateRaw) || dateRaw,
    province: getAny(row, ['province', 'จังหวัด']),
    community,
    shootQuery,
    name,
    type: getAny(row, ['type', 'ประเภท']),
    rating: getAny(row, ['rating', 'คะแนน/รีวิว']),
    address: getAny(row, ['address', 'ที่อยู่/โซน']),
    phone: getAny(row, ['phone', 'โทร', 'เบอร์โทร']),
    mapsQuery,
    routeQuery: usableText(getAny(row, ['routeQuery', 'ลิงก์เส้นทาง Google Maps_url', 'ลิงก์เส้นทาง Google Maps']), [community, name].filter(Boolean).join(' ไป ')),
    travelTime: getAny(row, ['travelTime', 'ระยะทาง/เวลาเดินทาง']),
    reason: getAny(row, ['reason', 'หมายเหตุการเลือก']),
    backup: getAny(row, ['backup', 'ตัวเลือกสำรอง/ต้องเช็ค', 'ตัวเลือกสำรอง']),
    placeId: getAny(row, ['placeId', 'Google Maps Place ID']),
    beforeLodgingShoot,
    beforeLodgingTime: getAny(row, ['beforeLodgingTime', 'เวลาถ่ายจบก่อนเข้าที่พัก']),
    afterShootQuery: usableText(getAny(row, ['afterShootQuery', 'ลิงก์หลังถ่ายจบ→ที่พัก_url', 'ลิงก์หลังถ่ายจบ→ที่พัก']), [beforeLodgingShoot, name].filter(Boolean).join(' ไป ')),
    toMorningQuery: usableText(getAny(row, ['toMorningQuery', 'ลิงก์ที่พัก→จุดถ่ายเช้า_url', 'ลิงก์ที่พัก→จุดถ่ายเช้า']), [name, shootQuery].filter(Boolean).join(' ไป ')),
    nearMorning: getAny(row, ['nearMorning', 'เช็กความใกล้กับคิวเช้า']),
    logic: getAny(row, ['logic', 'หมายเหตุ Logic']),
  }
}

export function normalizeMapItem(row = {}, index = 0) {
  const title = getAny(row, ['title', 'ชื่อแผนที่', 'จุดหมาย', 'name'])
  const query = usableText(getAny(row, ['query', 'คำค้นที่ใช้', 'คำค้น', 'Google Maps Search', 'Google Maps']), title)
  return {
    ...row,
    id: getAny(row, ['id', 'ID'], `map-${index + 1}`),
    rowNumber: getAny(row, ['rowNumber', '_rowNumber']),
    type: getAny(row, ['type', 'ประเภท'], 'แผนที่'),
    batch: getAny(row, ['batch', 'ชุด/วัน', 'ชุดงาน']),
    order: getAny(row, ['order', 'ลำดับจุด']),
    title,
    date: toDateInputValue(getAny(row, ['date', 'วันที่'])) || getAny(row, ['date', 'วันที่']),
    province: getAny(row, ['province', 'จังหวัด']),
    community: getAny(row, ['community', 'ชุมชน']),
    query,
    url: usableUrl(getAny(row, ['url', 'URL', 'Google Maps Link_url', 'Google Maps Link', 'Google Maps_url'])),
    description: getAny(row, ['description', 'หมายเหตุ', 'รายละเอียด']),
  }
}

function inferTimelineCommunityIds(item, communities) {
  if (Array.isArray(item.communityIds) && item.communityIds.length) return item.communityIds
  const key = normalizeThai([item.morningTitle, item.afternoonTitle, item.nextMorning].filter(Boolean).join(' '))
  return communities
    .filter((community) => {
      const communityKey = normalizeThai(community.community)
      return communityKey && key.includes(communityKey)
    })
    .map((community) => community.id)
}

function checklistMatchesCommunity(checklistItem, community) {
  if (!checklistItem || !community) return false
  if (checklistItem.communityId && checklistItem.communityId === community.id) return true
  return normalizeThai(checklistItem.province) === normalizeThai(community.province) && normalizeThai(checklistItem.community) === normalizeThai(community.community)
}

function mergeChecklistIntoCommunity(community, checklist = []) {
  const checklistItem = checklist.find((item) => checklistMatchesCommunity(item, community))
  if (!checklistItem) return community
  const merged = {
    ...community,
    checklistId: checklistItem.id,
    checklistRowNumber: checklistItem.rowNumber,
    checklistStatus: checklistItem.checklistStatus || checklistItem.status || community.checklistStatus,
    shootingStatus: checklistItem.shootingStatus || community.shootingStatus,
    contactName: checklistItem.contactName || community.contactName,
    contactPhone: checklistItem.contactPhone || community.contactPhone,
    note: checklistItem.note || community.note,
    checkNotes: checklistItem.extraCheck || community.checkNotes,
    expenseLocation: checklistItem.expenseLocation,
    expenseInfluencer: checklistItem.expenseInfluencer,
    expenseContent1000: checklistItem.expenseContent1000,
    expenseCustomItems: checklistItem.expenseCustomItems,
    expenseItems: checklistItem.expenseItems,
    expenseProgress: checklistItem.expenseProgress,
  }
  return merged
}

export function normalizeAppData(raw = {}) {
  const communities = (raw.communities || []).map(normalizeCommunity)
  const timeline = (raw.timeline || [])
    .map((item, index) => normalizeTimelineItem(item, index))
    .map((item) => ({ ...item, communityIds: inferTimelineCommunityIds(item, communities) }))
  const checklist = (raw.checklist || []).map((item, index) => normalizeChecklistItem(item, index, communities))
  const lodging = (raw.lodging || []).map((item, index) => normalizeLodgingItem(item, index))
  const maps = (raw.maps || []).map((item, index) => normalizeMapItem(item, index))
  const storyboardIndex = buildStoryboardIndex(raw.storyboardFolders || [], communities)
  const communitiesWithChecklist = communities.map((community) => mergeChecklistIntoCommunity(community, checklist))
  const communitiesWithStoryboard = communitiesWithChecklist.map((community) => {
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
    timeline,
    checklist,
    lodging,
    maps,
    references: raw.references || [],
    expenses: raw.expenses || [],
    storyboardFolders: raw.storyboardFolders || [],
    unmatchedStoryboardFolders: storyboardIndex.unmatched,
    stats: computeStats({ ...raw, communities: communitiesWithStoryboard, timeline, lodging, maps }),
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
  const needsCheckItems = communities.filter((item) => isChecklistNeedsExpense(item.checklistStatus))
  const needsCheck = needsCheckItems.length
  const risks = [
    ...communities
      .filter((item) => isChecklistNeedsExpense(item.checklistStatus) || normalizeChecklistStatusValue(item.checklistStatus).includes('รอยืนยัน') || normalizeChecklistStatusValue(item.checklistStatus).includes('ไม่มีข้อมูลติดต่อ'))
      .map((item) => ({
        id: `community-${item.id}`,
        level: normalizeChecklistStatusValue(item.checklistStatus).includes('ไม่มีข้อมูลติดต่อ') ? 'danger' : 'warning',
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
