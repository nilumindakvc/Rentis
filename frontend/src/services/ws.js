import { getAccessToken } from './authStorage'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const RECONNECT_DELAY_MS = 3000

let socket = null
let reconnectTimer = null
const listeners = new Set()

function getWebSocketBase() {
  if (API_BASE.startsWith('/')) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}${API_BASE.replace(/\/+$/, '')}`
  }
  return API_BASE.replace(/^http/, 'ws').replace(/\/+$/, '')
}

function notify(event) {
  listeners.forEach((cb) => cb(event))
}

export function connectSocket() {
  const token = getAccessToken()
  if (!token) return
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return

  socket = new WebSocket(`${getWebSocketBase()}/ws/messages?token=${encodeURIComponent(token)}`)

  socket.onmessage = (event) => {
    try {
      notify(JSON.parse(event.data))
    } catch {
      // ignore malformed frame
    }
  }

  socket.onclose = () => {
    socket = null
    clearTimeout(reconnectTimer)
    if (getAccessToken()) {
      reconnectTimer = setTimeout(connectSocket, RECONNECT_DELAY_MS)
    }
  }
}

export function disconnectSocket() {
  clearTimeout(reconnectTimer)
  if (socket) {
    socket.onclose = null
    socket.close()
  }
  socket = null
}

export function onSocketEvent(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

// Dispatched locally (not a server push) whenever this tab marks something as
// read, so other components sharing no direct state (e.g. the notification
// bell) know to refresh without waiting for the next poll.
export const NOTIFICATIONS_CHANGED_EVENT = 'rentis:notifications-changed'

export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
}
