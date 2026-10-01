export default function PropertySection({ title, rows }) {
  const visible = rows.filter(([, value]) => value !== undefined && value !== null && value !== '')
  if (visible.length === 0) return null

  return (
    <div className="mb-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 overflow-hidden shadow-lg shadow-black/30">
      <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800/80 font-bold text-sm text-pink-400 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        {title}
      </div>
      <div className="p-5">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map(([label, value]) => (
            <div key={label} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50">
              <dt className="text-xs text-slate-400 font-medium mb-1">{label}</dt>
              <dd className="text-sm font-semibold text-slate-100">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
