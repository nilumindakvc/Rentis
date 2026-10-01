import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsApi } from '../../services/api'
import { NOTIFICATIONS_CHANGED_EVENT, onSocketEvent } from '../../services/ws'
import { useAuth } from '../../context/AuthContext'
import { Bell, Check, Loader2 } from 'lucide-react'

const POLL_INTERVAL_MS = 30000

export default function NotificationBell() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOpen = async () => {
    const nextState = !open
    setOpen(nextState)
    if (nextState) {
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
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative p-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-pink-500/30 hover:bg-slate-800 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-[10px] font-bold text-white shadow-md shadow-pink-500/40 ring-2 ring-slate-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Notifications</span>
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {loading && (
              <div className="flex items-center justify-center py-8 text-pink-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-8">No notifications yet</div>
            )}

            {!loading &&
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 hover:bg-slate-800/60 ${
                    n.is_read ? 'bg-slate-900/40 opacity-75' : 'bg-slate-900 border-l-2 border-pink-500'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-slate-700' : 'bg-emerald-400 glow-green'}`} />
                  <div>
                    <div className="text-xs font-bold text-slate-100">{n.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.body}</div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
