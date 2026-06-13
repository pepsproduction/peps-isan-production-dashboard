import { DEFAULT_CONFIG } from '../config'

const CONFIG_KEY = 'peps-isan-production-dashboard:config'
const DATA_KEY = 'peps-isan-production-dashboard:last-data'
const DATA_TIME_KEY = 'peps-isan-production-dashboard:last-data-time'

export function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}')
    return { ...DEFAULT_CONFIG, ...saved }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function loadCachedData() {
  try {
    const data = JSON.parse(localStorage.getItem(DATA_KEY) || 'null')
    const savedAt = localStorage.getItem(DATA_TIME_KEY)
    return data ? { data, savedAt } : null
  } catch {
    return null
  }
}

export function saveCachedData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
  localStorage.setItem(DATA_TIME_KEY, new Date().toISOString())
}

export function clearCache() {
  localStorage.removeItem(DATA_KEY)
  localStorage.removeItem(DATA_TIME_KEY)
}
