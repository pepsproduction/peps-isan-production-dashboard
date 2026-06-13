import { demoData, getDemoStoryboardImages } from '../demoData'
import { normalizeAppData } from '../utils/normalize'
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

export async function fetchAppData(config) {
  if (config.demoMode || !config.apiUrl) {
    const normalized = normalizeAppData(demoData)
    saveCachedData(normalized)
    return { data: normalized, mode: 'demo' }
  }

  const data = await getJson(config.apiUrl, { action: 'getAppData' })
  const normalized = normalizeAppData(data)
  saveCachedData(normalized)
  return { data: normalized, mode: 'live' }
}

export async function fetchStoryboardImages(config, community) {
  if (config.demoMode || !config.apiUrl) {
    return getDemoStoryboardImages(community.id)
  }
  return getJson(config.apiUrl, {
    action: 'getStoryboardImages',
    communityId: community.id,
    sequence: community.sequence,
    province: community.province,
    community: community.community,
  })
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
