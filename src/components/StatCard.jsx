export default function StatCard({ label, value, hint, icon: Icon, tone = 'orange' }) {
  const tones = {
    orange: 'from-peps/30 to-peps/5 text-peps',
    gold: 'from-gold/30 to-gold/5 text-gold',
    green: 'from-emerald-400/30 to-emerald-400/5 text-emerald-300',
    red: 'from-red-400/30 to-red-400/5 text-red-300',
    blue: 'from-sky-400/30 to-sky-400/5 text-sky-300',
  }
  return (
    <div className="card p-4">
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
    </div>
  )
}
