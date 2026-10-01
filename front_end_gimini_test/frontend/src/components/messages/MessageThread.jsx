import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { conversationsApi } from '../../services/api'
import { notifyNotificationsChanged, onSocketEvent } from '../../services/ws'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorAlert from '../common/ErrorAlert'
import { Send, User } from 'lucide-react'

export default function MessageThread({ conversation, onRead }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const markThreadRead = (conversationId) => {
    conversationsApi
      .markRead(conversationId)
      .then(() => {
        onRead?.(conversationId)
        notifyNotificationsChanged()
      })
      .catch(() => {})
  }

  useEffect(() => {
    setLoading(true)
    setMessages([])
    conversationsApi
      .messages(conversation.id)
      .then(setMessages)
      .catch(setError)
      .finally(() => setLoading(false))
    markThreadRead(conversation.id)
  }, [conversation.id])

  useEffect(() => {
    const unsubscribe = onSocketEvent((event) => {
      if (event.type !== 'new_message' || event.conversation_id !== conversation.id) return
      conversationsApi.messages(conversation.id).then(setMessages).catch(() => {})
      markThreadRead(conversation.id)
    })
    return unsubscribe
  }, [conversation.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setError(null)
    try {
      const message = await conversationsApi.send(conversation.id, body)
      setMessages((prev) => [...prev, message])
      setDraft('')
    } catch (err) {
      setError(err)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading messages…" />

  const otherName = user?.role === 'owner' ? conversation.customer_name : conversation.owner_name

  return (
    <div className="flex flex-col h-full bg-slate-950/60 rounded-2xl overflow-hidden border border-slate-800">
      {/* Thread Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
          <User className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-100">{otherName}</div>
          <div className="text-xs text-pink-400 font-medium">{conversation.property_title}</div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
        <ErrorAlert error={error} />
        {messages.map((m) => {
          const mine = m.sender_id === user?.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-sm ${
                  mine
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-xs shadow-pink-500/20'
                    : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-xs'
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</div>
                <div
                  className={`text-[10px] mt-1 text-right font-mono ${
                    mine ? 'text-pink-200 opacity-90' : 'text-slate-400'
                  }`}
                >
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
          autoComplete="off"
          className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="inline-flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-md shadow-pink-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
