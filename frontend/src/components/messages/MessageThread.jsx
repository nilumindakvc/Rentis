import { useEffect, useRef, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { useAuth } from '../../context/AuthContext'
import { conversationsApi } from '../../services/api'
import { notifyNotificationsChanged, onSocketEvent } from '../../services/ws'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorAlert from '../common/ErrorAlert'
import { avatarColors, initials } from '../../utils/avatar'

function dayLabel(iso) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a, b) => a.toDateString() === b.toDateString()
  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

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
  const otherId = user?.role === 'owner' ? conversation.customer_id : conversation.owner_id
  const [avatarStart, avatarEnd] = avatarColors(String(otherId ?? otherName))
  const avatarStyle = { background: `linear-gradient(135deg, ${avatarStart}, ${avatarEnd})` }

  return (
    <div className="d-flex flex-column chat-pane" style={{ height: '100%' }}>
      <div className="chat-header">
        <div className="conversation-avatar chat-header-avatar flex-shrink-0" style={avatarStyle}>
          {initials(otherName)}
        </div>
        <div className="text-truncate">
          <div className="fw-semibold text-truncate">{otherName}</div>
          <div className="small text-muted text-truncate">{conversation.property_title}</div>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto px-3 py-2 chat-scroll" style={{ minHeight: 0 }}>
        <ErrorAlert error={error} />
        {messages.map((m, idx) => {
          const mine = m.sender_id === user?.id
          const prev = messages[idx - 1]
          const showDateSeparator = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at)
          const isGroupStart = showDateSeparator || !prev || prev.sender_id !== m.sender_id

          return (
            <div key={m.id}>
              {showDateSeparator && (
                <div className="chat-day-separator">
                  <span>{dayLabel(m.created_at)}</span>
                </div>
              )}
              <div
                className={`d-flex align-items-end gap-2 ${mine ? 'justify-content-end' : 'justify-content-start'} ${isGroupStart ? 'mt-3' : 'mt-1'}`}
              >
                {!mine && (
                  <div className="chat-avatar flex-shrink-0" style={isGroupStart ? avatarStyle : undefined}>
                    {isGroupStart ? initials(otherName) : ''}
                  </div>
                )}
                <div className={`chat-bubble ${mine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}>
                  <div>{m.body}</div>
                  <div className="chat-bubble-time">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <Form onSubmit={handleSend} className="chat-composer">
        <Form.Control
          className="chat-composer-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
          autoComplete="off"
        />
        <button
          type="submit"
          className="chat-composer-send"
          disabled={sending || !draft.trim()}
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 12 20 4 13 20l-2-7-7-1Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </Form>
    </div>
  )
}
