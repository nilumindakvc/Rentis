import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConversationList from '../components/messages/ConversationList'
import MessageThread from '../components/messages/MessageThread'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import EmptyState from '../components/common/EmptyState'
import { conversationsApi } from '../services/api'
import { onSocketEvent } from '../services/ws'
import { ArrowLeft, MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const activeId = id ? Number(id) : null
  const active = conversations.find((c) => c.id === activeId) || null

  const load = useCallback(() => {
    conversationsApi.list().then(setConversations).catch(setError).finally(() => setLoading(false))
  }, [])

  const handleRead = useCallback((conversationId) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
    )
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    const unsubscribe = onSocketEvent((event) => {
      if (event.type === 'new_message') load()
    })
    return unsubscribe
  }, [load])

  if (loading) return <LoadingSpinner label="Loading messages…" />
  if (error) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><ErrorAlert error={error} /></div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-emerald-400" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Messages</h1>
      </div>

      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden h-[calc(100vh-220px)] min-h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
          {/* Conversation list column */}
          <div
            className={`md:col-span-4 border-r border-slate-800 overflow-y-auto h-full ${
              activeId ? 'hidden md:block' : 'block'
            }`}
          >
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={(convId) => navigate(`/messages/${convId}`)}
            />
          </div>

          {/* Active thread column */}
          <div
            className={`md:col-span-8 h-full flex flex-col ${
              activeId ? 'block' : 'hidden md:flex'
            }`}
          >
            {active ? (
              <div className="h-full flex flex-col">
                <div className="md:hidden p-3 bg-slate-950 border-b border-slate-800">
                  <button
                    type="button"
                    onClick={() => navigate('/messages')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to conversations</span>
                  </button>
                </div>
                <MessageThread conversation={active} onRead={handleRead} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState title="Select a conversation" message="Pick a thread on the left to view messages." />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
