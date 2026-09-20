import { useEffect, useRef, useState } from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { useAuth } from '../../context/AuthContext'
import { conversationsApi } from '../../services/api'
import { notifyNotificationsChanged, onSocketEvent } from '../../services/ws'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorAlert from '../common/ErrorAlert'

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

  return (
    <div className="d-flex flex-column" style={{ height: '100%' }}>
      <div className="px-3 py-2 border-bottom">
        <div className="fw-semibold">{user?.role === 'owner' ? conversation.customer_name : conversation.owner_name}</div>
        <div className="small text-muted">{conversation.property_title}</div>
      </div>

      <div className="flex-grow-1 overflow-auto px-3 py-2" style={{ minHeight: 0 }}>
        <ErrorAlert error={error} />
        {messages.map((m) => {
          const mine = m.sender_id === user?.id
          return (
            <div key={m.id} className={`d-flex mb-2 ${mine ? 'justify-content-end' : 'justify-content-start'}`}>
              <div className={`chat-bubble ${mine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}>
                <div>{m.body}</div>
                <div className="chat-bubble-time">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <Form onSubmit={handleSend} className="border-top p-2 d-flex gap-2">
        <Form.Control
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
          autoComplete="off"
        />
        <Button type="submit" variant="primary" disabled={sending || !draft.trim()}>
          Send
        </Button>
      </Form>
    </div>
  )
}
