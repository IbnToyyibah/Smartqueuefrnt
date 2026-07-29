import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { notifApi } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)
let toastId = 0

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [toasts, setToasts] = useState([])
  const [inbox, setInbox] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const timers = useRef({})

  /* ── Load inbox from API on login ── */
  useEffect(() => {
    if (!user) { setInbox([]); setUnreadCount(0); return }
    notifApi.list()
      .then(({ notifications, unread }) => {
        setInbox(notifications)
        setUnreadCount(unread)
      })
      .catch(console.error)
  }, [user])

  /* ── Socket: real-time push notifications ── */
  useEffect(() => {
    const sock = getSocket()
    if (!sock || !user) return

    const handler = (notification) => {
      setInbox((prev) => [notification, ...prev])
      setUnreadCount((n) => n + 1)
      // Also show as toast
      addToast({
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
      })
    }

    sock.on('notification:new', handler)
    return () => sock.off('notification:new', handler)
  }, [user])

  /* ── Add toast (local only — no API) ── */
  const addToast = useCallback((toast) => {
    const id = `t${++toastId}`
    const entry = { id, ...toast, time: new Date().toISOString() }
    setToasts((prev) => [entry, ...prev].slice(0, 5))

    const duration = toast.duration ?? 4000
    timers.current[id] = setTimeout(() => dismissToast(id), duration)
    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  /* ── Mark single read ── */
  const markRead = useCallback(async (id) => {
    setInbox((prev) => prev.map((n) => n._id === id || n.id === id ? { ...n, read: true } : n))
    setUnreadCount((n) => Math.max(0, n - 1))
    await notifApi.read(id).catch(console.error)
  }, [])

  /* ── Mark all read ── */
  const markAllRead = useCallback(async () => {
    setInbox((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    await notifApi.readAll().catch(console.error)
  }, [])

  /* ── Convenience: show toast + optionally persist ── */
  const notify = useCallback((type, title, message, opts = {}) => {
    return addToast({ type, title, message, ...opts })
  }, [addToast])

  return (
    <NotificationContext.Provider value={{
      toasts, inbox, unreadCount,
      notify, addToast, dismissToast,
      markRead, markAllRead,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
