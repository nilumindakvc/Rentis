import { useAuth } from '../../context/AuthContext'
import EmptyState from '../common/EmptyState'
import { User } from 'lucide-react'

function relativeTime(iso) {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export default function ConversationList({ conversations, activeId, onSelect }) {
  const { user } = useAuth()

  if (conversations.length === 0) {
    return <EmptyState title="No conversations yet" message="Messages with owners or customers will show up here." />
  }

  return (
    <div className="divide-y divide-slate-800/80">
      {conversations.map((c) => {
        const otherName = user?.role === 'owner' ? c.customer_name : c.owner_name
        const isActive = c.id === activeId

        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left p-4 transition-all flex items-start gap-3 ${
              isActive
                ? 'bg-slate-800/90 border-l-4 border-pink-500 shadow-md'
                : 'hover:bg-slate-900/60 bg-slate-950/40'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <User className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                  {otherName}
                </div>
                <div className="text-[11px] text-slate-400 shrink-0">
                  {relativeTime(c.last_message_at || c.updated_at)}
                </div>
              </div>

              <div className="text-xs text-pink-400 font-medium truncate mt-0.5">
                {c.property_title}
              </div>

              {c.last_message && (
                <div className="text-xs text-slate-400 truncate mt-1">
                  {c.last_message}
                </div>
              )}
            </div>

            {c.unread_count > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-[10px] font-bold text-white shadow-sm shadow-pink-500/30">
                {c.unread_count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
