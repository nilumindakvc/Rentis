import ListGroup from 'react-bootstrap/ListGroup'
import Badge from 'react-bootstrap/Badge'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../common/EmptyState'

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
    <ListGroup variant="flush">
      {conversations.map((c) => {
        const otherName = user?.role === 'owner' ? c.customer_name : c.owner_name
        return (
          <ListGroup.Item
            key={c.id}
            action
            active={c.id === activeId}
            onClick={() => onSelect(c.id)}
            className="py-3"
          >
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div className="text-truncate">
                <div className="fw-semibold text-truncate">{otherName}</div>
                <div className="small text-truncate" style={{ opacity: 0.8 }}>
                  {c.property_title}
                </div>
                {c.last_message && (
                  <div className="small text-truncate" style={{ opacity: 0.65, maxWidth: 220 }}>
                    {c.last_message}
                  </div>
                )}
              </div>
              <div className="text-end flex-shrink-0">
                <div className="small" style={{ opacity: 0.6 }}>
                  {relativeTime(c.last_message_at || c.updated_at)}
                </div>
                {c.unread_count > 0 && (
                  <Badge bg="danger" pill className="mt-1">
                    {c.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </ListGroup.Item>
        )
      })}
    </ListGroup>
  )
}
