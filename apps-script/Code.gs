const CONFIG = {
  VIEW_PASSCODE: 'peps-view-2026',
  EDIT_PASSCODE: 'peps-edit-2026',
  ADMIN_PASSCODE: 'peps-admin-2026',
  SPREADSHEET_ID: '1NMs4jUsSxplcRPp5PZksmovwwMRpKoNFTodjNR495Uo',
  STORYBOARD_ROOT_FOLDER_ID: '1Tv_9Xlrw0XlEhS2sB9DPz8R99LvvrWnY',
}

const SHEETS = {
  dashboard: 'Dashboard_สรุปงาน',
  timeline: 'Timeline_ถ่ายทำ_เดินทาง_ที่พัก',
  checklist: 'Checklist_ก่อนถ่าย',
  communities: 'ชุมชน_Master',
  references: 'Reference_แหล่งข้อมูล',
  lodging: 'ที่พัก_Master',
  maps: 'Map_Master',
}

const EDITOR_FIELDS = [
  'status',
  'checklistStatus',
  'shootingStatus',
  'contactName',
  'contactPhone',
  'note',
  'checkNotes',
  'storyboardLink',
]

function doOptions() {
  return json_({ ok: true })
}

function doGet(e) {
  const params = e.parameter || {}
  const action = params.action || 'ping'
  try {
    if (action === 'ping') return json_({ ok: true, app: 'Peps Isan Production Dashboard', now: new Date().toISOString() }, params.callback)
    if (action === 'getAppData') return json_(getAppData_(), params.callback)
    if (action === 'getStoryboardFolders') return json_({ ok: true, storyboardFolders: getStoryboardFolders_() }, params.callback)
    if (action === 'getStoryboardImages') return json_(getStoryboardImages_(params), params.callback)
    if (action === 'getStoryboardImage') return json_(getStoryboardImage_(params.fileId), params.callback)
    if (action === 'getSheetData') return json_({ ok: true, sheetName: params.sheetName, rows: getSheetRows_(params.sheetName) }, params.callback)
    return json_({ ok: false, error: 'Unknown GET action: ' + action }, params.callback)
  } catch (err) {
    return json_({ ok: false, error: err.message, stack: err.stack }, params.callback)
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.waitLock(30000)
  try {
    const body = parseBody_(e)
    const action = body.action
    const role = getRole_(body.passcode)
    if (role === 'none') return json_({ ok: false, error: 'Invalid passcode' })
    if (role === 'viewer') return json_({ ok: false, error: 'Viewer passcode is read-only' })

    if (action === 'updateCommunityField') return json_(updateOneField_(body, role, SHEETS.communities))
    if (action === 'updateChecklistStatus') return json_(updateOneField_({ ...body, fieldName: 'status', value: body.status || body.value }, role, SHEETS.checklist))
    if (action === 'updateShootingStatus') return json_(updateOneField_({ ...body, fieldName: 'shootingStatus', value: body.status || body.value }, role, SHEETS.communities))
    if (action === 'updateStoryboardLink') return json_(updateOneField_({ ...body, fieldName: 'storyboardLink' }, role, SHEETS.communities))
    if (action === 'updateContact') return json_(batchUpdateFields_({ ...body, sheetName: body.sheetName || SHEETS.communities, fields: { contactName: body.contactName, contactPhone: body.contactPhone } }, role))
    if (action === 'updateNote') return json_(updateOneField_({ ...body, fieldName: 'note' }, role, body.sheetName || SHEETS.communities))
    if (action === 'batchUpdateFields') return json_(batchUpdateFields_(body, role))

    return json_({ ok: false, error: 'Unknown POST action: ' + action })
  } catch (err) {
    return json_({ ok: false, error: err.message, stack: err.stack })
  } finally {
    lock.releaseLock()
  }
}

function getAppData_() {
  const communities = getCommunities_()
  const timeline = getTimeline_(communities)
  const checklist = getChecklist_(communities)
  const lodging = getLodging_()
  const maps = getMaps_()
  const references = sheetExists_(SHEETS.references) ? getSheetRows_(SHEETS.references) : []
  const storyboardFolders = getStoryboardFolders_(communities)
  const stats = {
    communities: communities.length,
    provinces: uniqueCount_(communities.map((item) => item.province)),
    storyboardFolders: storyboardFolders.length,
  }

  return {
    ok: true,
    communities,
    timeline,
    checklist,
    lodging,
    maps,
    references,
    storyboardFolders,
    stats,
    fetchedAt: new Date().toISOString(),
  }
}

function getCommunities_() {
  const rows = getSheetRows_(SHEETS.communities)
  return rows.map((row) => {
    const sequence = getAny_(row, ['ลำดับถ่ายใหม่', 'sequence', 'ลำดับ'])
    const province = getAny_(row, ['จังหวัด', 'province'])
    const community = getAny_(row, ['ชุมชน', 'community'])
    const mapsUrl = getAny_(row, ['Google Maps Search_url', 'mapsUrl', 'mapUrl'])
    const storyboardUrl = getAny_(row, ['Link Storyboard_url', 'storyboardLinkUrl'])
    const item = {
      id: buildCommunityId_(sequence, province, community),
      rowNumber: row._rowNumber,
      sequence,
      province,
      community,
      databaseName: getAny_(row, ['ชื่อฐานข้อมูล', 'databaseName']),
      district: getAny_(row, ['ตำบล/อำเภอ', 'district']),
      content: getAny_(row, ['CONTENT', 'content']),
      introduction: getAny_(row, ['INTRODUCTION', 'introduction']),
      products: getAny_(row, ['ผลิตภัณฑ์เด่น', 'products']),
      program: getAny_(row, ['โปรแกรม/จุดถ่าย', 'program']),
      keywords: getAny_(row, ['คำค้นหลัก', 'keywords']),
      backupKeywords: getAny_(row, ['คำค้นสำรอง/จุดท่องเที่ยวแผนสำรอง', 'backupKeywords']),
      mapsSearch: getAny_(row, ['Google Maps Search', 'mapsSearch']),
      mapsUrl,
      checkNotes: getAny_(row, ['ข้อควรเช็ค', 'checkNotes']),
      contactName: getAny_(row, ['ผู้ประสานงานในพื้นที่', 'contactName']),
      contactPhone: getAny_(row, ['เบอร์โทร', 'contactPhone', 'phone']),
      shootDate: normalizeDate_(getAny_(row, ['วันที่ไป', 'shootDate'])),
      startTime: getAny_(row, ['ช่วงเวลาเริ่มถ่าย', 'startTime']),
      endTime: getAny_(row, ['ช่วงเวลาถ่ายจบ', 'endTime']),
      lodging: getAny_(row, ['ที่พัก', 'lodging']),
      storyboardLink: storyboardUrl || getAny_(row, ['Link Storyboard', 'storyboardLink']),
      checklistStatus: getAny_(row, ['สถานะ Checklist', 'checklistStatus', 'status']) || 'ยังไม่ได้เช็ก',
      shootingStatus: getAny_(row, ['สถานะถ่ายทำ', 'shootingStatus']) || 'ยังไม่ได้เช็ก',
      note: getAny_(row, ['หมายเหตุ', 'note']),
    }
    item.storyboardStatus = item.storyboardLink ? 'partial' : 'missing'
    return item
  })
}

function getTimeline_(communities) {
  if (!sheetExists_(SHEETS.timeline)) return []
  return getSheetRows_(SHEETS.timeline).map((row, index) => {
    const morningTitle = getAny_(row, ['จุดถ่ายเช้า', 'คิวเช้า', 'morningTitle'])
    const afternoonTitle = getAny_(row, ['จุดถ่ายบ่าย/งานต่อ', 'คิวบ่าย', 'afternoonTitle'])
    return {
      id: getAny_(row, ['id', 'ID']) || 'timeline-' + (index + 1),
      rowNumber: row._rowNumber,
      batch: getAny_(row, ['ชุดงาน', 'batch']),
      date: normalizeDate_(getAny_(row, ['วันที่', 'date'])),
      day: getAny_(row, ['วัน', 'day']),
      status: getAny_(row, ['สถานะ', 'status']),
      morningTitle,
      morningTime: getAny_(row, ['เวลาเช้า', 'ช่วงเวลาเช้า', 'morningTime']),
      afternoonTitle,
      afternoonTime: getAny_(row, ['เวลาบ่าย/เดินทาง', 'เวลาบ่าย', 'afternoonTime']),
      routeAssessment: getAny_(row, ['ประเมินเส้นทาง', 'routeAssessment']),
      feasibility: getAny_(row, ['ความเป็นไปได้', 'feasibility']),
      lodging: getAny_(row, ['ที่พักคืนนี้', 'ที่พัก', 'lodging']),
      nextMorning: getAny_(row, ['คิวเช้าถัดไป', 'nextMorning']),
      notes: getAny_(row, ['หมายเหตุ', 'notes']),
      afterShootToLodgingQuery: getAny_(row, ['หลังถ่ายจบ→ที่พัก', 'หลังถ่ายจบไปที่พัก', 'afterShootToLodgingQuery']),
      lodgingToMorningQuery: getAny_(row, ['ที่พัก→จุดถ่ายเช้า', 'ที่พักไปจุดถ่ายเช้า', 'lodgingToMorningQuery']),
      mapQuery: getAny_(row, ['Google Maps', 'แผนที่', 'mapQuery']),
      communityIds: matchCommunityIdsFromText_(communities, morningTitle + ' ' + afternoonTitle),
    }
  })
}

function getChecklist_(communities) {
  if (!sheetExists_(SHEETS.checklist)) {
    return communities.map((community) => ({
      id: 'check-' + community.id,
      communityId: community.id,
      province: community.province,
      community: community.community,
      status: community.checklistStatus,
      note: community.checkNotes || community.note,
      contactName: community.contactName,
      contactPhone: community.contactPhone,
      extraCheck: community.checkNotes,
      shootingStatus: community.shootingStatus,
    }))
  }

  return getSheetRows_(SHEETS.checklist).map((row, index) => {
    const province = getAny_(row, ['จังหวัด', 'province'])
    const community = getAny_(row, ['ชุมชน', 'community'])
    const matched = communities.find((item) => normalize_(item.province) === normalize_(province) && normalize_(item.community) === normalize_(community))
    return {
      id: getAny_(row, ['id', 'ID']) || 'check-' + (index + 1),
      rowNumber: row._rowNumber,
      communityId: matched ? matched.id : buildCommunityId_(getAny_(row, ['ลำดับถ่ายใหม่', 'sequence']), province, community),
      province,
      community,
      status: getAny_(row, ['สถานะ', 'status', 'checklistStatus']) || 'ยังไม่ได้เช็ก',
      note: getAny_(row, ['หมายเหตุ', 'note']),
      contactName: getAny_(row, ['ผู้ประสานงาน', 'ผู้ประสานงานในพื้นที่', 'contactName']),
      contactPhone: getAny_(row, ['เบอร์โทร', 'contactPhone', 'phone']),
      extraCheck: getAny_(row, ['ข้อควรเช็คเพิ่มเติม', 'ข้อควรเช็ค', 'extraCheck']),
      shootingStatus: getAny_(row, ['สถานะถ่ายทำ', 'shootingStatus']) || 'ยังไม่ได้เช็ก',
    }
  })
}

function getLodging_() {
  if (!sheetExists_(SHEETS.lodging)) return []
  return getSheetRows_(SHEETS.lodging).map((row, index) => ({
    id: getAny_(row, ['id', 'ID']) || 'lodging-' + (index + 1),
    rowNumber: row._rowNumber,
    date: normalizeDate_(getAny_(row, ['วันที่ไป', 'วันที่', 'date'])),
    province: getAny_(row, ['จังหวัด', 'province']),
    community: getAny_(row, ['ชุมชน/จุดถ่ายหลัก', 'ชุมชน', 'community']),
    name: getAny_(row, ['ที่พักแนะนำ', 'ที่พัก', 'name']),
    type: getAny_(row, ['ประเภท', 'type']),
    rating: getAny_(row, ['คะแนน/รีวิว', 'rating']),
    address: getAny_(row, ['ที่อยู่/โซน', 'address']),
    phone: getAny_(row, ['โทร', 'เบอร์โทร', 'phone']),
    reason: getAny_(row, ['หมายเหตุการเลือก', 'reason']),
    backup: getAny_(row, ['ตัวเลือกสำรอง', 'backup']),
    nearMorning: getAny_(row, ['เช็กความใกล้กับคิวเช้า', 'nearMorning']),
    logic: getAny_(row, ['หมายเหตุ Logic', 'logic']),
    mapsQuery: getAny_(row, ['เปิดที่พัก', 'Google Maps', 'mapsQuery']),
    afterShootQuery: getAny_(row, ['หลังถ่ายจบ→ที่พัก', 'afterShootQuery']),
    toMorningQuery: getAny_(row, ['ที่พัก→จุดถ่ายเช้า', 'toMorningQuery']),
  }))
}

function getMaps_() {
  if (!sheetExists_(SHEETS.maps)) return []
  return getSheetRows_(SHEETS.maps).map((row, index) => ({
    id: getAny_(row, ['id', 'ID']) || 'map-' + (index + 1),
    rowNumber: row._rowNumber,
    type: getAny_(row, ['ประเภท', 'type']),
    title: getAny_(row, ['ชื่อแผนที่', 'title', 'name']),
    date: normalizeDate_(getAny_(row, ['วันที่', 'date'])),
    province: getAny_(row, ['จังหวัด', 'province']),
    community: getAny_(row, ['ชุมชน', 'community']),
    query: getAny_(row, ['คำค้น', 'query', 'Google Maps Search', 'Google Maps']),
    url: getAny_(row, ['url', 'URL', 'Google Maps_url', 'Google Maps Search_url']),
    description: getAny_(row, ['รายละเอียด', 'description', 'หมายเหตุ']),
  }))
}

function getStoryboardFolders_(communities) {
  communities = communities || getCommunities_()
  const root = DriveApp.getFolderById(CONFIG.STORYBOARD_ROOT_FOLDER_ID)
  const folders = root.getFolders()
  const result = []
  while (folders.hasNext()) {
    const folder = folders.next()
    const match = matchFolderToCommunity_(folder.getName(), communities)
    const imageCount = countImages_(folder)
    result.push({
      id: folder.getId(),
      name: folder.getName(),
      url: folder.getUrl(),
      imageCount,
      communityId: match ? match.id : '',
      matchedCommunityId: match ? match.id : '',
      status: imageCount >= 6 ? 'complete' : imageCount > 0 ? 'partial' : 'missing',
    })
  }
  return result.sort((a, b) => naturalCompare_(a.name, b.name))
}

function getStoryboardImages_(params) {
  const communities = getCommunities_()
  const community =
    communities.find((item) => item.id === params.communityId) ||
    communities.find((item) => String(item.sequence).padStart(2, '0') === String(params.sequence).padStart(2, '0')) ||
    communities.find((item) => normalize_(item.province) === normalize_(params.province) && normalize_(item.community).indexOf(normalize_(params.community)) !== -1)

  if (!community) {
    return { ok: false, status: 'missing', images: [], error: 'Community not found' }
  }

  const root = DriveApp.getFolderById(CONFIG.STORYBOARD_ROOT_FOLDER_ID)
  const folders = root.getFolders()
  let folder = null
  while (folders.hasNext()) {
    const candidate = folders.next()
    const matched = matchFolderToCommunity_(candidate.getName(), [community])
    if (matched) {
      folder = candidate
      break
    }
  }

  if (!folder) {
    return { ok: true, communityId: community.id, status: 'missing', folder: null, images: [] }
  }

  const files = folder.getFiles()
  const images = []
  const unsupported = []
  while (files.hasNext()) {
    const file = files.next()
    const mimeType = file.getMimeType()
    const item = {
      fileId: file.getId(),
      name: file.getName(),
      mimeType,
      order: extractOrder_(file.getName()),
      url: file.getUrl(),
    }
    if (isSupportedImage_(mimeType)) images.push(item)
    else unsupported.push(item)
  }

  images.sort((a, b) => naturalCompare_(a.name, b.name))
  const allFiles = images.concat(unsupported)
  return {
    ok: true,
    communityId: community.id,
    folder: { id: folder.getId(), name: folder.getName(), url: folder.getUrl() },
    status: images.length >= 6 ? 'complete' : images.length > 0 ? 'partial' : 'missing',
    images: allFiles,
    imageCount: images.length,
    unsupportedCount: unsupported.length,
  }
}

function getStoryboardImage_(fileId) {
  if (!fileId) throw new Error('Missing fileId')
  const cache = CacheService.getScriptCache()
  const cacheKey = 'storyboard-image-' + fileId
  const cached = cache.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const file = DriveApp.getFileById(fileId)
  const blob = file.getBlob()
  const mimeType = blob.getContentType()
  if (!isSupportedImage_(mimeType)) {
    return { ok: false, fileId, mimeType, error: 'Preview in web is not supported for this file type', url: file.getUrl() }
  }
  const dataUrl = 'data:' + mimeType + ';base64,' + Utilities.base64Encode(blob.getBytes())
  const payload = { ok: true, fileId, name: file.getName(), mimeType, dataUrl }
  const asText = JSON.stringify(payload)
  if (asText.length < 90000) cache.put(cacheKey, asText, 60 * 30)
  return payload
}

function updateOneField_(body, role, defaultSheetName) {
  const sheetName = body.sheetName || defaultSheetName
  const fieldName = body.fieldName
  if (!fieldName) throw new Error('Missing fieldName')
  if (role !== 'admin' && EDITOR_FIELDS.indexOf(fieldName) === -1) {
    throw new Error('This field requires admin passcode')
  }
  const value = body.value !== undefined ? body.value : body[fieldName]
  const row = findRowForUpdate_(sheetName, body.rowKey || body.communityId)
  const header = fieldHeader_(sheetName, fieldName)
  setCellByHeader_(row.sheet, row.rowNumber, header, value)
  writeAudit_(row.sheet, row.rowNumber, body.updatedBy, body.updatedAt)
  return { ok: true, action: body.action, sheetName, rowNumber: row.rowNumber, fieldName, value }
}

function batchUpdateFields_(body, role) {
  const sheetName = body.sheetName || SHEETS.communities
  const fields = body.fields || {}
  const row = findRowForUpdate_(sheetName, body.rowKey || body.communityId)
  Object.keys(fields).forEach((fieldName) => {
    if (fields[fieldName] === undefined) return
    if (role !== 'admin' && EDITOR_FIELDS.indexOf(fieldName) === -1) {
      throw new Error('Field requires admin passcode: ' + fieldName)
    }
    setCellByHeader_(row.sheet, row.rowNumber, fieldHeader_(sheetName, fieldName), fields[fieldName])
  })
  writeAudit_(row.sheet, row.rowNumber, body.updatedBy, body.updatedAt)
  return { ok: true, sheetName, rowNumber: row.rowNumber, fields: Object.keys(fields) }
}

function findRowForUpdate_(sheetName, rowKey) {
  if (!rowKey) throw new Error('Missing rowKey/communityId')
  const sheet = getSheet_(sheetName)
  const rows = getSheetRows_(sheetName)
  const match = rows.find((row) => {
    const sequence = getAny_(row, ['ลำดับถ่ายใหม่', 'sequence', 'ลำดับ'])
    const province = getAny_(row, ['จังหวัด', 'province'])
    const community = getAny_(row, ['ชุมชน', 'community'])
    const id = buildCommunityId_(sequence, province, community)
    return String(row._rowNumber) === String(rowKey) || row.id === rowKey || row.communityId === rowKey || id === rowKey
  })
  if (!match) throw new Error('Row not found for key: ' + rowKey)
  return { sheet, rowNumber: match._rowNumber }
}

function fieldHeader_(sheetName, fieldName) {
  const common = {
    status: 'สถานะ',
    checklistStatus: sheetName === SHEETS.checklist ? 'สถานะ' : 'สถานะ Checklist',
    shootingStatus: 'สถานะถ่ายทำ',
    contactName: sheetName === SHEETS.checklist ? 'ผู้ประสานงาน' : 'ผู้ประสานงานในพื้นที่',
    contactPhone: 'เบอร์โทร',
    note: 'หมายเหตุ',
    checkNotes: 'ข้อควรเช็ค',
    storyboardLink: 'Link Storyboard',
  }
  return common[fieldName] || fieldName
}

function setCellByHeader_(sheet, rowNumber, header, value) {
  const column = getOrCreateHeaderColumn_(sheet, header)
  sheet.getRange(rowNumber, column).setValue(value)
}

function writeAudit_(sheet, rowNumber, updatedBy, updatedAt) {
  if (updatedBy) setCellByHeader_(sheet, rowNumber, 'updatedBy', updatedBy)
  setCellByHeader_(sheet, rowNumber, 'updatedAt', updatedAt || new Date().toISOString())
}

function getOrCreateHeaderColumn_(sheet, header) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1)
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0]
  const index = headers.indexOf(header)
  if (index >= 0) return index + 1
  const next = lastColumn + 1
  sheet.getRange(1, next).setValue(header)
  return next
}

function getSheetRows_(sheetName) {
  const sheet = getSheet_(sheetName)
  const range = sheet.getDataRange()
  const values = range.getValues()
  const displayValues = range.getDisplayValues()
  const formulas = range.getFormulas()
  const richTexts = range.getRichTextValues()
  if (values.length < 2) return []
  const headers = displayValues[0].map((header, index) => header || 'Column_' + (index + 1))
  const rows = []
  for (let r = 1; r < values.length; r += 1) {
    if (displayValues[r].join('').trim() === '') continue
    const row = { _rowNumber: r + 1 }
    for (let c = 0; c < headers.length; c += 1) {
      const header = headers[c]
      const display = displayValues[r][c]
      row[header] = display !== '' ? display : values[r][c]
      const url = extractUrl_(formulas[r][c], richTexts[r][c])
      if (url) row[header + '_url'] = url
    }
    rows.push(row)
  }
  return rows
}

function extractUrl_(formula, richText) {
  if (formula) {
    const match = formula.match(/HYPERLINK\("([^"]+)"/i)
    if (match) return match[1]
  }
  try {
    const url = richText && richText.getLinkUrl()
    if (url) return url
  } catch (err) {
    return ''
  }
  return ''
}

function parseBody_(e) {
  const raw = e.postData && e.postData.contents ? e.postData.contents : '{}'
  try {
    return JSON.parse(raw)
  } catch (err) {
    return e.parameter || {}
  }
}

function getRole_(passcode) {
  if (passcode === CONFIG.ADMIN_PASSCODE) return 'admin'
  if (passcode === CONFIG.EDIT_PASSCODE) return 'editor'
  if (passcode === CONFIG.VIEW_PASSCODE) return 'viewer'
  return 'none'
}

function getSheet_(sheetName) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName)
  if (!sheet) throw new Error('Sheet not found: ' + sheetName)
  return sheet
}

function sheetExists_(sheetName) {
  return Boolean(SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName))
}

function getAny_(row, keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const value = row[keys[i]]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

function normalize_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\\/_|.(),\[\]{}'"“”‘’‐‑‒–—-]/g, '')
}

function buildCommunityId_(sequence, province, community) {
  const seq = String(sequence || '').padStart(2, '0')
  return [seq, normalize_(province), normalize_(community)].filter(Boolean).join('-')
}

function normalizeDate_(value) {
  if (!value) return ''
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  }
  const text = String(value)
  const date = new Date(text)
  if (!isNaN(date)) return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  return text
}

function matchCommunityIdsFromText_(communities, text) {
  const key = normalize_(text)
  return communities.filter((community) => key.indexOf(normalize_(community.community)) !== -1).map((community) => community.id)
}

function matchFolderToCommunity_(folderName, communities) {
  const name = String(folderName || '').trim()
  const normalized = normalize_(name)
  const sequenceMatch = name.match(/^(\d{1,2})/)
  if (sequenceMatch) {
    const seq = sequenceMatch[1].padStart(2, '0')
    const bySequence = communities.find((community) => String(community.sequence || '').padStart(2, '0') === seq)
    if (bySequence) return bySequence
  }
  return communities.find((community) => {
    const province = normalize_(community.province)
    const communityName = normalize_(community.community)
    return province && communityName && normalized.indexOf(province) !== -1 && (normalized.indexOf(communityName) !== -1 || communityName.indexOf(normalized) !== -1)
  })
}

function countImages_(folder) {
  const files = folder.getFiles()
  let count = 0
  while (files.hasNext()) {
    if (isSupportedImage_(files.next().getMimeType())) count += 1
  }
  return count
}

function isSupportedImage_(mimeType) {
  return ['image/jpeg', 'image/png', 'image/webp'].indexOf(mimeType) !== -1
}

function extractOrder_(name) {
  const match = String(name || '').match(/\d+/)
  return match ? Number(match[0]) : 999
}

function naturalCompare_(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'th', { numeric: true, sensitivity: 'base' })
}

function uniqueCount_(values) {
  const seen = {}
  values.forEach((value) => {
    if (value) seen[value] = true
  })
  return Object.keys(seen).length
}

function json_(payload, callback) {
  const text = JSON.stringify(payload)
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + text + ')').setMimeType(ContentService.MimeType.JAVASCRIPT)
  }
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON)
}
