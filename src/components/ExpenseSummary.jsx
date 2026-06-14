import { CheckCircle2, Circle } from 'lucide-react'
import { buildExpenseItems, getExpenseProgress } from '../utils/expenses'

export default function ExpenseSummary({ record }) {
  const items = buildExpenseItems(record)
  const { paid, total, amountTotal, percent } = getExpenseProgress(items)
  if (!total) return null

  return (
    <div className="border-t border-white/10 pt-3 sm:col-span-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-peps">ค่าใช้จ่ายระหว่างชุมชน</p>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">
          จ่ายแล้ว {paid}/{total} · {percent}%{amountTotal ? ` · รวม ${amountTotal.toLocaleString('th-TH')} บาท` : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = item.paid ? CheckCircle2 : Circle
          return (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                item.paid
                  ? 'border-emerald-400/40 bg-emerald-500/12 text-emerald-100'
                  : 'border-amber-400/40 bg-amber-500/12 text-amber-100'
              }`}
            >
              <Icon size={14} />
              <span>{item.label}{item.amount ? ` ${item.amount}` : ''}</span>
              <span className="text-white/60">{item.paid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
