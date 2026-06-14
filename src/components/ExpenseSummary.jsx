import { CheckCircle2, Circle } from 'lucide-react'
import { buildExpenseItems, getExpenseProgress } from '../utils/expenses'

export default function ExpenseSummary({ record }) {
  const items = buildExpenseItems(record)
  const { done, total, percent } = getExpenseProgress(items)
  if (!total) return null

  return (
    <div className="border-t border-white/10 pt-3 sm:col-span-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-peps">ค่าใช้จ่ายระหว่างชุมชน</p>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">{done}/{total} สำเร็จ · {percent}%</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = item.done ? CheckCircle2 : Circle
          return (
            <span
              key={item.key}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                item.done
                  ? 'border-emerald-400/40 bg-emerald-500/12 text-emerald-100'
                  : 'border-white/10 bg-white/5 text-zinc-300'
              }`}
            >
              <Icon size={14} />
              {item.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
