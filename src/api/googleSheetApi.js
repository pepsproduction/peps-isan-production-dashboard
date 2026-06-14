import { demoData, getDemoStoryboardImages } from '../demoData'
import { STORYBOARD_ROOT_FOLDER_URL } from '../config'
import { isUsableMapsUrl } from '../utils/maps'
import { normalizeAppData, normalizeThai } from '../utils/normalize'
import { fetchPublicSheetData } from './googleSheetCsv'
import { saveCachedData } from './localCache'

function buildUrl(apiUrl, params = {}) {
  const url = new URL(apiUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  })
  return url.toString()
}

async function getJson(apiUrl, params) {
  const response = await fetch(buildUrl(apiUrl, params), { method: 'GET' })
  if (!response.ok) throw new Error(`API error ${response.status}`)
  const data = await response.json()
  if (data.ok === false) throw new Error(data.error || 'API returned an error')
  return data
}

async function postJson(apiUrl, payload) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`API error ${response.status}`)
  const data = await response.json()
  if (data.ok === false) throw new Error(data.error || 'API returned an error')
  return data
}

function communityKey(item = {}) {
  return [item.sequence, item.province, item.community].map(normalizeThai).join('|')
}

function communityNameKey(item = {}) {
  return [item.province, item.community].map(normalizeThai).join('|')
}

function timelineKey(item = {}) {
  return [item.batch, item.morningTitle, item.afternoonTitle].map(normalizeThai).join('|')
}

function lodgingKey(item = {}) {
  return [item.date, item.name, item.community].map(normalizeThai).join('|')
}

function mapKey(item = {}) {
  return [item.type, item.batch, item.title, item.query].map(normalizeThai).join('|')
}

function isUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim())
}

function preferUsableUrl(primary, fallback) {
  if (isUrl(primary) && (!String(primary).includes('google.') || isUsableMapsUrl(primary))) return primary
  if (isUrl(fallback) && (!String(fallback).includes('google.') || isUsableMapsUrl(fallback))) return fallback
  return primary || fallback || ''
}

function storyboardStatusFromCount(count = 0) {
  if (count >= 6) return 'complete'
  if (count > 0) return 'partial'
  return 'missing'
}

function matchStoryboardFolder(folders = [], community = {}) {
  const sequence = String(community.sequence || '').padStart(2, '0')
  const province = normalizeThai(community.province)
  const communityName = normalizeThai(community.community)
  return (
    folders.find((folder) => sequence && String(folder.name || '').trim().startsWith(sequence)) ||
    folders.find((folder) => folder.matchedCommunityId === community.id || folder.communityId === community.id) ||
    folders.find((folder) => {
      const name = normalizeThai(folder.name)
      return province && communityName && name.includes(province) && (name.includes(communityName) || communityName.includes(name))
    })
  )
}

function enrichSheetDataWithApi(sheetData, apiData) {
  if (!apiData) return sheetData
  const apiCommunities = normalizeAppData({ communities: apiData.communities || [] }).communities
  const byCommunity = new Map(apiCommunities.map((item) => [communityKey(item), item]))
  const byCommunityName = new Map(apiCommunities.map((item) => [communityNameKey(item), item]))
  const communities = (sheetData.communities || []).map((item) => {
    const normalized = normalizeAppData({ communities: [item] }).communities[0]
    const match = byCommunity.get(communityKey(normalized)) || byCommunityName.get(communityNameKey(normalized))
    return {
      ...item,
      mapsUrl: preferUsableUrl(item.mapsUrl, match?.mapsUrl),
      storyboardLink: preferUsableUrl(item.storyboardLink, match?.storyboardLink),
      storyboardStatus: match?.storyboardStatus || item.storyboardStatus || '',
    }
  })

  const apiTimeline = normalizeAppData({ timeline: apiData.timeline || [] }).timeline
  const byTimeline = new Map(apiTimeline.map((item) => [timelineKey(item), item]))
  const timeline = (sheetData.timeline || []).map((item) => {
    const normalized = normalizeAppData({ timeline: [item] }).timeline[0]
    const match = byTimeline.get(timelineKey(normalized))
    return {
      ...item,
      afterShootToLodgingQuery: preferUsableUrl(item.afterShootToLodgingQuery, match?.afterShootToLodgingQuery),
      lodgingToMorningQuery: preferUsableUrl(item.lodgingToMorningQuery, match?.lodgingToMorningQuery),
      mapQuery: preferUsableUrl(item.mapQuery, match?.mapQuery),
    }
  })

  const apiLodging = normalizeAppData({ lodging: apiData.lodging || [] }).lodging
  const byLodging = new Map(apiLodging.map((item) => [lodgingKey(item), item]))
  const lodging = (sheetData.lodging || []).map((item) => {
    const normalized = normalizeAppData({ lodging: [item] }).lodging[0]
    const match = byLodging.get(lodgingKey(normalized))
    return {
      ...item,
      mapsQuery: preferUsableUrl(item.mapsQuery, match?.mapsQuery),
      routeQuery: preferUsableUrl(item.routeQuery, match?.routeQuery),
      afterShootQuery: preferUsableUrl(item.afterShootQuery, match?.afterShootQuery),
      toMorningQuery: preferUsableUrl(item.toMorningQuery, match?.toMorningQuery),
    }
  })

  const apiMaps = normalizeAppData({ maps: apiData.maps || [] }).maps
  const byMap = new Map(apiMaps.map((item) => [mapKey(item), item]))
  const maps = (sheetData.maps || []).map((item) => {
    const normalized = normalizeAppData({ maps: [item] }).maps[0]
    const match = byMap.get(mapKey(normalized))
    return {
      ...item,
      url: preferUsableUrl(item.url, match?.url),
    }
  })

  return {
    ...apiData,
    ...sheetData,
    communities,
    timeline,
    lodging,
    maps,
    storyboardFolders: apiData.storyboardFolders || sheetData.storyboardFolders || [],
  }
}

export async function fetchAppData(config) {
  if (config.demoMode) {
    const normalized = normalizeAppData(demoData)
    saveCachedData(normalized)
    return { data: normalized, mode: 'demo' }
  }

  if (!config.apiUrl) {
    const sheetData = await fetchPublicSheetData().catch(() => null)
    const normalized = normalizeAppData(sheetData || demoData)
    saveCachedData(normalized)
    return { data: normalized, mode: sheetData ? 'sheet' : 'demo' }
  }

  const [apiResult, sheetResult] = await Promise.allSettled([
    getJson(config.apiUrl, { action: 'getAppData' }),
    fetchPublicSheetData(),
  ])
  const data = apiResult.status === 'fulfilled' ? apiResult.value : null
  const sheetData = sheetResult.status === 'fulfilled' ? sheetResult.value : null

  if (!data && !sheetData) {
    throw apiResult.reason || sheetResult.reason || new Error('โหลดข้อมูลไม่สำเร็จ')
  }

  const sourceData = sheetData ? enrichSheetDataWithApi(sheetData, data) : data
  const normalized = normalizeAppData(sourceData)
  saveCachedData(normalized)
  return { data: normalized, mode: data ? 'live' : 'sheet' }
}

export async function fetchStoryboardImages(config, community) {
  if (config.demoMode) {
    return getDemoStoryboardImages(community.id)
  }
  if (!config.apiUrl) {
    const folder = community.storyboardFolder || (community.storyboardLink ? { url: community.storyboardLink } : {
      name: 'Storyboard Root Folder',
      url: STORYBOARD_ROOT_FOLDER_URL,
      rootFallback: true,
    })
    return {
      ok: true,
      communityId: community.id,
      folder,
      images: community.storyboardFolder?.images || [],
      imageCount: community.storyboardFolder?.imageCount || 0,
      status: community.storyboardStatus || storyboardStatusFromCount(community.storyboardFolder?.imageCount || 0),
      fallback: 'drive-folder',
      warning: 'ต้องตั้งค่า Apps Script API URL เพื่อโหลดรูป Storyboard แบบ proxy รายชุมชน',
    }
  }
  const params = {
    action: 'getStoryboardImages',
    communityId: community.id,
    rowNumber: community.rowNumber,
    sequence: community.sequence,
    province: community.province,
    community: community.community,
    communityName: community.community,
    folderId: community.storyboardFolder?.id || community.storyboardFolder?.folderId,
    storyboardLink: community.storyboardLink,
  }
  try {
    return await getJson(config.apiUrl, params)
  } catch (err) {
    if (!String(err.message || '').includes('Community not found')) throw err
    const foldersResult = await getJson(config.apiUrl, { action: 'getStoryboardFolders' }).catch(() => null)
    const folders = foldersResult?.storyboardFolders || foldersResult?.folders || []
    const folder = matchStoryboardFolder(folders, community)
    if (!folder?.id) {
      return { ok: true, status: 'missing', images: [], folder: null, imageCount: 0, warning: err.message }
    }
    return getJson(config.apiUrl, {
      ...params,
      communityId: '',
      folderId: folder.id,
      storyboardLink: folder.url,
    }).catch(() => ({
      ok: true,
      status: storyboardStatusFromCount(Number(folder.imageCount || 0)),
      images: [],
      folder,
      imageCount: Number(folder.imageCount || 0),
      warning: err.message,
    }))
  }
}

export async function fetchStoryboardImage(config, fileId) {
  if (config.demoMode || !config.apiUrl || String(fileId).startsWith('demo-')) {
    return null
  }
  return getJson(config.apiUrl, { action: 'getStoryboardImage', fileId })
}

export async function pingApi(config) {
  if (!config.apiUrl) return { ok: false, error: 'ยังไม่ได้ใส่ Apps Script API URL' }
  return getJson(config.apiUrl, { action: 'ping' })
}

export async function sendUpdate(config, action, payload) {
  if (!config.apiUrl || config.demoMode) {
    return { ok: true, demo: true, message: 'Demo Mode: จำลองการบันทึกเรียบร้อย' }
  }
  return postJson(config.apiUrl, {
    action,
    passcode: config.passcode,
    updatedBy: config.updatedBy || 'Production Dashboard',
    updatedAt: new Date().toISOString(),
    ...payload,
  })
}
