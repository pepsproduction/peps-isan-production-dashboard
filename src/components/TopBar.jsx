import { RefreshCw } from 'lucide-react'
import { APP_NAME } from '../config'

export default function TopBar({ mode, lastUpdated, onRefresh }) {
  const modeLabel = mode === 'live' ? 'Live Sheet' : mode === 'cached' ? 'Cache' : 'Demo Mode'
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/86 backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-peps">Pepsproduction</p>
          <h1 className="truncate text-base font-bold text-white md:text-xl">{APP_NAME}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 sm:inline-flex">
            {modeLabel}
          </span>
          <span className="hidden text-xs text-zinc-500 md:inline">
            {lastUpdated ? `อัปเดต ${new Date(lastUpdated).toLocaleString('th-TH')}` : 'ยังไม่โหลดข้อมูล'}
          </span>
          <button type="button" className="btn btn-primary px-3" onClick={onRefresh} title="Refresh data">
            <RefreshCw size={18} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  )
}
