import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from './components/Layout'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Today from './pages/Today'
import Timeline from './pages/Timeline'
import Communities from './pages/Communities'
import Storyboards from './pages/Storyboards'
import Checklist from './pages/Checklist'
import Expenses from './pages/Expenses'
import Lodging from './pages/Lodging'
import Maps from './pages/Maps'
import Settings from './pages/Settings'
import { NAV_ITEMS, SHEETS } from './config'
import { fetchAppData, sendUpdate } from './api/googleSheetApi'
import { clearCache, loadCachedData, loadConfig, saveConfig } from './api/localCache'
import { loadPublicConfig, mergePublicConfig } from './api/publicConfig'
import { buildExpenseItems, getExpenseProgress } from './utils/expenses'
import { computeStats } from './utils/normalize'

function getInitialPage() {
  const page = window.location.hash.replace('#/', '') || 'dashboard'
  return NAV_ITEMS.some((item) => item.id === page) ? page : 'dashboard'
}

function itemMatchesUpdate(item, update) {
  const rowKey = update.rowKey ? String(update.rowKey) : ''
  const communityId = update.communityId ? String(update.communityId) : ''
  const candidates = [
    item.id,
    item.communityId,
    item.rowNumber,
    item._rowNumber,
    item.checklistId,
    item.checklistRowNumber,
  ].filter((value) => value !== undefined && value !== null).map(String)
  return Boolean((rowKey && candidates.includes(rowKey)) || (communityId && candidates.includes(communityId)))
}

function patchExpenseMeta(item) {
  const expenseItems = buildExpenseItems(item)
  return {
    ...item,
    expenseItems,
    expenseProgress: getExpenseProgress(expenseItems),
  }
}

function patchItem(item, fields, mirrorSchedule = false) {
  const next = {
    ...item,
    ...fields,
  }
  if (fields.checklistStatus !== undefined) next.status = fields.checklistStatus
  if (mirrorSchedule && fields.shootDate !== undefined) next.date = fields.shootDate
  return patchExpenseMeta(next)
}

function applyLocalUpdate(currentData, payload) {
  if (!currentData || !payload) return currentData
  const updates = Array.isArray(payload.updates) ? payload.updates : [payload]
  let communities = currentData.communities || []
  let checklist = currentData.checklist || []

  updates.forEach((update) => {
    const fields = update?.fields || {}
    if (!update || !Object.keys(fields).length) return
    const isChecklistUpdate = update.sheetName === SHEETS.checklist
    const isCommunityUpdate = update.sheetName === SHEETS.communities

    if (isChecklistUpdate || !isCommunityUpdate) {
      checklist = checklist.map((item) => (itemMatchesUpdate(item, update) ? patchItem(item, fields, true) : item))
    }

    if (isCommunityUpdate || !isChecklistUpdate) {
      communities = communities.map((item) => (itemMatchesUpdate(item, update) ? patchItem(item, fields, false) : item))
    }

    const sharedFields = {
      checklistStatus: fields.checklistStatus,
      shootingStatus: fields.shootingStatus,
      contactName: fields.contactName,
      contactPhone: fields.contactPhone,
      note: fields.note,
      shootDate: fields.shootDate,
      startTime: fields.startTime,
      endTime: fields.endTime,
      expenseLocation: fields.expenseLocation,
      expenseInfluencer: fields.expenseInfluencer,
      expenseContent1000: fields.expenseContent1000,
      expenseCustomItems: fields.expenseCustomItems,
    }
    Object.keys(sharedFields).forEach((key) => {
      if (sharedFields[key] === undefined) delete sharedFields[key]
    })
    if (Object.keys(sharedFields).length && update.communityId) {
      const mirrorUpdate = { ...update, rowKey: update.communityId }
      communities = communities.map((item) => (itemMatchesUpdate(item, mirrorUpdate) ? patchItem(item, sharedFields, false) : item))
      checklist = checklist.map((item) => (itemMatchesUpdate(item, mirrorUpdate) ? patchItem(item, sharedFields, true) : item))
    }
  })

  const nextData = {
    ...currentData,
    communities,
    checklist,
  }
  return {
    ...nextData,
    stats: computeStats(nextData),
  }
}

export default function App() {
  const [page, setPage] = useState(getInitialPage)
  const [config, setConfig] = useState(loadConfig)
  const [configReady, setConfigReady] = useState(false)
  const [data, setData] = useState(() => loadCachedData()?.data || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('loading')
  const [lastUpdated, setLastUpdated] = useState(loadCachedData()?.savedAt || '')
  const [toast, setToast] = useState(null)

  const notify = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type })
  }, [])

  useEffect(() => {
    let active = true
    loadPublicConfig().then((publicConfig) => {
      if (!active) return
      setConfig((currentConfig) => mergePublicConfig(currentConfig, publicConfig))
      setConfigReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  const refreshData = useCallback(
    async (options = {}) => {
      if (!configReady && !options.force) return
      const silent = Boolean(options.silent)
      if (!silent) {
        setLoading(true)
        setError('')
      }
      try {
        const result = await fetchAppData(config)
        setData(result.data)
        setMode(result.mode)
        setLastUpdated(new Date().toISOString())
        if (options.manual) notify(result.mode === 'demo' ? 'โหลด Demo Mode แล้ว' : 'ดึงข้อมูลล่าสุดแล้ว')
      } catch (err) {
        if (silent) {
          console.warn(err)
          return
        }
        const cached = loadCachedData()
        if (cached?.data) {
          setData(cached.data)
          setLastUpdated(cached.savedAt)
          setMode('cached')
          setError(`ดึงข้อมูลจริงไม่ได้ ใช้ cache ล่าสุดแทน: ${err.message}`)
        } else {
          const demoResult = await fetchAppData({ ...config, demoMode: true })
          setData(demoResult.data)
          setMode('demo')
          setError(`API ใช้งานไม่ได้ จึง fallback เป็น Demo Mode: ${err.message}`)
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [config, configReady, notify],
  )

  useEffect(() => {
    if (configReady) refreshData()
  }, [configReady, refreshData])

  useEffect(() => {
    if (!config.autoRefreshMinutes) return undefined
    const timer = window.setInterval(() => refreshData(), Number(config.autoRefreshMinutes) * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [config.autoRefreshMinutes, refreshData])

  useEffect(() => {
    const onHash = () => setPage(getInitialPage())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (nextPage) => {
    window.location.hash = `/${nextPage}`
    setPage(nextPage)
  }

  const updateConfig = (nextConfig) => {
    setConfig(nextConfig)
    saveConfig(nextConfig)
    notify('บันทึก Settings แล้ว')
  }

  const handleClearCache = () => {
    clearCache()
    notify('ล้าง cache แล้ว')
  }

  const copyText = useCallback(async (text) => {
    await navigator.clipboard.writeText(text)
    notify('คัดลอกข้อความแล้ว')
  }, [notify])

  const serviceConfig = useMemo(
    () => ({ ...config, demoMode: Boolean(config.demoMode) }),
    [config],
  )

  const updateRecord = useCallback(async (action, payload) => {
    const previousData = data
    setData((currentData) => applyLocalUpdate(currentData, payload))
    try {
      const result = await sendUpdate(serviceConfig, action, payload)
      notify(result.demo ? 'Demo Mode: จำลองการบันทึกแล้ว' : 'บันทึกกลับ Google Sheet แล้ว')
      refreshData({ force: true, silent: true }).catch((err) => console.warn(err))
      return result
    } catch (err) {
      setData(previousData)
      notify(`บันทึกไม่สำเร็จ: ${err.message}`, 'error')
      throw err
    }
  }, [data, serviceConfig, notify, refreshData])

  const pageProps = useMemo(
    () => ({
      data,
      config: serviceConfig,
      loading,
      error,
      mode,
      lastUpdated,
      refreshData,
      updateRecord,
      copyText,
      notify,
    }),
    [data, serviceConfig, loading, error, mode, lastUpdated, refreshData, updateRecord, copyText, notify],
  )

  const pages = {
    dashboard: <Dashboard {...pageProps} onNavigate={navigate} />,
    today: <Today {...pageProps} />,
    timeline: <Timeline {...pageProps} />,
    communities: <Communities {...pageProps} />,
    storyboards: <Storyboards {...pageProps} />,
    checklist: <Checklist {...pageProps} />,
    expenses: <Expenses {...pageProps} />,
    lodging: <Lodging {...pageProps} />,
    maps: <Maps {...pageProps} />,
    settings: (
      <Settings
        {...pageProps}
        config={config}
        onSave={updateConfig}
        onClearCache={handleClearCache}
        onRefresh={() => refreshData({ manual: true })}
      />
    ),
  }

  return (
    <>
      <Layout
        currentPage={page}
        onNavigate={navigate}
        mode={mode}
        lastUpdated={lastUpdated}
        onRefresh={() => refreshData({ manual: true })}
      >
        {pages[page] || pages.dashboard}
      </Layout>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  )
}
