import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(onClose, 3200)
    return () => window.clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null
  const Icon = toast.type === 'error' ? XCircle : toast.type === 'warning' ? AlertTriangle : CheckCircle2
  const color =
    toast.type === 'error'
      ? 'border-red-400/40 bg-red-500/20 text-red-100'
      : toast.type === 'warning'
        ? 'border-amber-400/40 bg-amber-500/20 text-amber-100'
        : 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'

  return (
    <div className="fixed right-4 top-20 z-[60] max-w-sm">
      <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-2xl backdrop-blur-xl ${color}`}>
        <Icon size={19} />
        <p className="text-sm font-semibold">{toast.message}</p>
      </div>
    </div>
  )
}
