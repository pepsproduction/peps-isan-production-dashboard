export default function StatCard({ label, value, hint, icon: Icon, tone = 'orange', details = [] }) {
  const tones = {
    orange: 'from-peps/30 to-peps/5 text-peps',
    gold: 'from-gold/30 to-gold/5 text-gold',
    green: 'from-emerald-400/30 to-emerald-400/5 text-emerald-300',
    red: 'from-red-400/30 to-red-400/5 text-red-300',
    blue: 'from-sky-400/30 to-sky-400/5 text-sky-300',
  }
  const preview = details.slice(0, 14)
  const hiddenCount = Math.max(details.length - preview.length, 0)
  return (
    <div className="card group relative p-4" tabIndex={details.length ? 0 : undefined} title={details.length ? details.join('\n') : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="muted">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        {Icon ? (
          <div className={`rounded-lg bg-gradient-to-br p-3 ${tones[tone] || tones.orange}`}>
            <Icon size={22} />
          </div>
        ) : null}
      </div>
      {hint ? <p className="mt-3 text-xs text-zinc-500">{hint}</p> : null}
      {details.length ? (
        <div className="pointer-events-none absolute left-3 right-3 top-[calc(100%-0.25rem)] z-30 rounded-lg border border-white/10 bg-zinc-950/95 p-3 text-sm text-zinc-100 opacity-0 shadow-2xl shadow-black/40 backdrop-blur transition group-hover:opacity-100 group-focus:opacity-100">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-peps">{label}</p>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {preview.map((item) => (
              <p key={item} className="leading-snug">{item}</p>
            ))}
            {hiddenCount ? <p className="text-zinc-500">และอีก {hiddenCount} รายการ</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
