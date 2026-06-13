const statusStyles = {
  'ถ่ายทำ': 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  'พัก': 'border-sky-400/40 bg-sky-400/15 text-sky-100',
  'สำรอง': 'border-orange-400/40 bg-orange-400/15 text-orange-100',
  'เสี่ยงสูง': 'border-red-400/50 bg-red-500/20 text-red-100',
  'ตึงแต่ทำได้': 'border-amber-400/50 bg-amber-400/20 text-amber-100',
  'ทำได้': 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  'พร้อม': 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  'ต้องเช็ก': 'border-yellow-400/50 bg-yellow-400/20 text-yellow-100',
  'รอยืนยัน': 'border-orange-400/50 bg-orange-400/20 text-orange-100',
  'เสี่ยง': 'border-red-400/50 bg-red-500/20 text-red-100',
  'ยังไม่ได้เช็ก': 'border-zinc-400/30 bg-zinc-500/15 text-zinc-100',
  'กำลังถ่าย': 'border-peps/60 bg-peps/20 text-orange-100',
  'ถ่ายเสร็จแล้ว': 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  'ต้องถ่ายซ่อม': 'border-orange-400/50 bg-orange-400/20 text-orange-100',
  complete: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  partial: 'border-amber-400/50 bg-amber-400/20 text-amber-100',
  missing: 'border-red-400/50 bg-red-500/20 text-red-100',
  danger: 'border-red-400/50 bg-red-500/20 text-red-100',
  warning: 'border-amber-400/50 bg-amber-400/20 text-amber-100',
}

const statusLabels = {
  complete: 'Storyboard ครบ',
  partial: 'Storyboard ยังไม่ครบ',
  missing: 'ไม่มี Storyboard',
}

export default function StatusBadge({ status, children, className = '' }) {
  const label = children || statusLabels[status] || status || 'ไม่ระบุ'
  const styles = statusStyles[status] || 'border-white/10 bg-white/10 text-zinc-100'
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles} ${className}`}>
      {label}
    </span>
  )
}
