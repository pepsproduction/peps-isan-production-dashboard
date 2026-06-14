function nonEmptyConfig(value = {}) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null && entryValue !== ''),
  )
}

export async function loadPublicConfig() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}app-config.json`, { cache: 'no-store' })
    if (!response.ok) return {}
    return nonEmptyConfig(await response.json())
  } catch {
    return {}
  }
}

export function mergePublicConfig(currentConfig, publicConfig) {
  return {
    ...currentConfig,
    apiUrl: currentConfig.apiUrl || publicConfig.apiUrl || '',
    mapsApiKey: currentConfig.mapsApiKey || publicConfig.mapsApiKey || '',
    demoMode: Boolean(currentConfig.demoMode || publicConfig.demoMode),
    autoRefreshMinutes: currentConfig.autoRefreshMinutes || publicConfig.autoRefreshMinutes || 0,
  }
}
