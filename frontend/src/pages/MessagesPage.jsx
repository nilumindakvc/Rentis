import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import ConversationList from '../components/messages/ConversationList'
import MessageThread from '../components/messages/MessageThread'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import EmptyState from '../components/common/EmptyState'
import { conversationsApi } from '../services/api'
import { onSocketEvent } from '../services/ws'

const PANE_HEIGHT = 'calc(100vh - 180px)'

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
  if (error) return <Container><ErrorAlert error={error} /></Container>

  return (
    <Container>
      <h1 className="h4 mb-4">Messages</h1>
      <Card>
        <Row className="g-0">
          <Col
            md={4}
            className={`border-end ${activeId ? 'd-none d-md-block' : ''}`}
            style={{ height: PANE_HEIGHT, overflowY: 'auto' }}
          >
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={(convId) => navigate(`/messages/${convId}`)}
            />
          </Col>
          <Col md={8} className={activeId ? '' : 'd-none d-md-block'} style={{ height: PANE_HEIGHT }}>
            {active ? (
              <>
                <div className="d-md-none border-bottom">
                  <button
                    type="button"
                    className="btn btn-link btn-sm"
                    onClick={() => navigate('/messages')}
                  >
                    ← Back to conversations
                  </button>
                </div>
                <MessageThread conversation={active} onRead={handleRead} />
              </>
            ) : (
              <EmptyState title="Select a conversation" message="Pick a thread on the left to view it." />
            )}
          </Col>
        </Row>
      </Card>
    </Container>
  )
}
