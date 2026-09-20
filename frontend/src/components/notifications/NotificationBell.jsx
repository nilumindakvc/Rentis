import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Dropdown from 'react-bootstrap/Dropdown'
import Badge from 'react-bootstrap/Badge'
import Spinner from 'react-bootstrap/Spinner'
import { notificationsApi } from '../../services/api'
import { NOTIFICATIONS_CHANGED_EVENT, onSocketEvent } from '../../services/ws'
import { useAuth } from '../../context/AuthContext'

const POLL_INTERVAL_MS = 30000

export default function NotificationBell() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const intervalRef = useRef(null)

  const refreshCount = async () => {
    try {
      const data = await notificationsApi.unreadCount()
      setUnreadCount(data.unread_count ?? 0)
    } catch {
      // silently ignore polling errors
    }
  }

  useEffect(() => {
    refreshCount()
    intervalRef.current = setInterval(refreshCount, POLL_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    const unsubscribe = onSocketEvent(() => refreshCount())
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshCount)
    return () => {
      unsubscribe()
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshCount)
    }
  }, [])

  const handleOpen = async (isOpen) => {
    setOpen(isOpen)
    if (isOpen) {
      setLoading(true)
      try {
        const data = await notificationsApi.list({ limit: 10 })
        setNotifications(data)
      } catch {
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
  }

  const handleMarkAll = async (e) => {
    e.stopPropagation()
    await notificationsApi.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const handleItemClick = async (n) => {
    if (!n.is_read) {
      await notificationsApi.markRead(n.id)
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    if (n.related_conversation_id) {
      setOpen(false)
      navigate(`/messages/${n.related_conversation_id}`)
    } else if (n.related_booking_id) {
      setOpen(false)
      navigate(user?.role === 'owner' ? '/owner/dashboard?tab=bookings' : '/customer/dashboard?tab=bookings')
    }
  }

  return (
    <Dropdown align="end" show={open} onToggle={handleOpen}>
      <Dropdown.Toggle
        variant="outline-secondary"
        id="notification-bell"
        className="position-relative border-0"
      >
        {'\u{1F514}'}
        {unreadCount > 0 && (
          <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ minWidth: 320 }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-1">
          <strong className="small">Notifications</strong>
          <button type="button" className="btn btn-link btn-sm p-0" onClick={handleMarkAll}>
            Mark all read
          </button>
        </div>
        <Dropdown.Divider />
        {loading && (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
          </div>
        )}
        {!loading && notifications.length === 0 && (
          <div className="text-muted small text-center py-3">No notifications yet</div>
        )}
        {!loading &&
          notifications.map((n) => (
            <Dropdown.Item
              key={n.id}
              onClick={() => handleItemClick(n)}
              className={n.is_read ? '' : 'bg-light'}
            >
              <div className="fw-semibold small">{n.title}</div>
              <div className="text-muted small">{n.body}</div>
            </Dropdown.Item>
          ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
