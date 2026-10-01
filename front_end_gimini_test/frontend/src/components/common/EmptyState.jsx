import { Inbox } from 'lucide-react'

export default function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 my-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 text-pink-400">
        <Inbox className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-200 mb-1">{title}</h3>
      {message && <p className="text-sm text-slate-400 max-w-sm mb-4">{message}</p>}
      {action}
    </div>
  )
}
