import { useCallback, useEffect, useMemo, useState } from 'react'
import Layout from './components/Layout'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Today from './pages/Today'
import Timeline from './pages/Timeline'
import Communities from './pages/Communities'
import Storyboards from './pages/Storyboards'
import Checklist from './pages/Checklist'
import Lodging from './pages/Lodging'
import Maps from './pages/Maps'
import Settings from './pages/Settings'
import { NAV_ITEMS } from './config'
import { fetchAppData, sendUpdate } from './api/googleSheetApi'
import { clearCache, loadCachedData, loadConfig, saveConfig } from './api/localCache'

function getInitialPage() {
  const page = window.location.hash.replace('#/', '') || 'dashboard'
  return NAV_ITEMS.some((item) => item.id === page) ? page : 'dashboard'
}

export default function App() {
  const [page, setPage] = useState(getInitialPage)
  const [config, setConfig] = useState(loadConfig)
  const [data, setData] = useState(() => loadCachedData()?.data || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState(config.demoMode || !config.apiUrl ? 'demo' : 'live')
  const [lastUpdated, setLastUpdated] = useState(loadCachedData()?.savedAt || '')
  const [toast, setToast] = useState(null)

  const notify = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type })
  }, [])

  const refreshData = useCallback(
    async (options = {}) => {
      setLoading(true)
      setError('')
      try {
        const result = await fetchAppData(config)
        setData(result.data)
        setMode(result.mode)
        setLastUpdated(new Date().toISOString())
        if (options.manual) notify(result.mode === 'demo' ? 'โหลด Demo Mode แล้ว' : 'ดึงข้อมูลล่าสุดแล้ว')
      } catch (err) {
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
        setLoading(false)
      }
    },
    [config, notify],
  )

  useEffect(() => {
    refreshData()
  }, [refreshData])

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

  const updateRecord = useCallback(async (action, payload) => {
    const result = await sendUpdate(config, action, payload)
    notify(result.demo ? 'Demo Mode: จำลองการบันทึกแล้ว' : 'บันทึกกลับ Google Sheet แล้ว')
    await refreshData()
    return result
  }, [config, notify, refreshData])

  const pageProps = useMemo(
    () => ({
      data,
      config,
      loading,
      error,
      mode,
      lastUpdated,
      refreshData,
      updateRecord,
      copyText,
      notify,
    }),
    [data, config, loading, error, mode, lastUpdated, refreshData, updateRecord, copyText, notify],
  )

  const pages = {
    dashboard: <Dashboard {...pageProps} onNavigate={navigate} />,
    today: <Today {...pageProps} />,
    timeline: <Timeline {...pageProps} />,
    communities: <Communities {...pageProps} />,
    storyboards: <Storyboards {...pageProps} />,
    checklist: <Checklist {...pageProps} />,
    lodging: <Lodging {...pageProps} />,
    maps: <Maps {...pageProps} />,
    settings: (
      <Settings
        {...pageProps}
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
