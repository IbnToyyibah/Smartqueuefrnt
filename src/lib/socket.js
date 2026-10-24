import { io } from 'socket.io-client'

const RAW_SOCKET_URL = import.meta.env.VITE_SOCKET_URL
const RAW_API_URL = import.meta.env.VITE_API_URL
const API_ORIGIN = RAW_API_URL?.startsWith('http')
  ? new URL(RAW_API_URL).origin
  : 'https://smartqueuebck.onrender.com'
const DEFAULT_SOCKET_ORIGIN =
  import.meta.env.DEV && typeof window !== 'undefined' ? window.location.origin : API_ORIGIN
const configuredSocketUrl = RAW_SOCKET_URL && RAW_SOCKET_URL !== '/socket.io'
  ? new URL(RAW_SOCKET_URL, DEFAULT_SOCKET_ORIGIN)
  : new URL(DEFAULT_SOCKET_ORIGIN)
// A Socket.IO endpoint URL is a transport path, not a namespace.
const SOCKET_URL = configuredSocketUrl.origin
const SOCKET_PATH = configuredSocketUrl.pathname === '/'
  ? '/socket.io'
  : configuredSocketUrl.pathname

let socket = null

export const getSocket = () => socket

// Reuses the shared connection. A call without a token never downgrades an
// authenticated socket; only a new, different token forces a reconnect.
export const connectSocket = (token) => {
  if (socket) {
    const currentToken = socket.auth?.token || ''
    if (token && token !== currentToken) {
      socket.auth = { token }
      socket.disconnect().connect()
    } else if (!socket.connected) {
      socket.connect()
    }
    return socket
  }

  socket = io(SOCKET_URL, {
    path: SOCKET_PATH,
    auth: { token: token || '' },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
  })
  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })
  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

export const joinBranch = (branchId) => {
  socket?.emit('join:branch', { branchId })
}

export const leaveBranch = (branchId) => {
  socket?.emit('leave:branch', { branchId })
}

export const joinUserRoom = (userId) => {
  socket?.emit('join:user', { userId })
}
