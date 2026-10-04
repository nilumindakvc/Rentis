import ListGroup from 'react-bootstrap/ListGroup'
import Badge from 'react-bootstrap/Badge'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../common/EmptyState'
import { avatarColors, initials } from '../../utils/avatar'

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
    <ListGroup variant="flush" className="conversation-list">
      {conversations.map((c) => {
        const otherName = user?.role === 'owner' ? c.customer_name : c.owner_name
        const otherId = user?.role === 'owner' ? c.customer_id : c.owner_id
        const [avatarStart, avatarEnd] = avatarColors(String(otherId ?? otherName))
        const isActive = c.id === activeId
        return (
          <ListGroup.Item
            key={c.id}
            action
            active={isActive}
            onClick={() => onSelect(c.id)}
            className={`conversation-item${c.unread_count > 0 ? ' is-unread' : ''}`}
          >
            <div className="d-flex align-items-start gap-2">
              <div
                className="conversation-avatar flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${avatarStart}, ${avatarEnd})` }}
              >
                {initials(otherName)}
              </div>
              <div className="flex-grow-1 text-truncate">
                <div className="d-flex justify-content-between align-items-baseline gap-2">
                  <span className="conversation-name text-truncate">{otherName}</span>
                  <span className="conversation-time flex-shrink-0">
                    {relativeTime(c.last_message_at || c.updated_at)}
                  </span>
                </div>
                <div className="conversation-property text-truncate">{c.property_title}</div>
                {c.last_message && (
                  <div className="conversation-preview text-truncate">{c.last_message}</div>
                )}
              </div>
              {c.unread_count > 0 && (
                <Badge bg="danger" pill className="conversation-unread-badge flex-shrink-0">
                  {c.unread_count}
                </Badge>
              )}
            </div>
          </ListGroup.Item>
        )
      })}
    </ListGroup>
  )
}
