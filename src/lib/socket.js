import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin

let socket = null

export const getSocket = () => socket

export const connectSocket = (token) => {
  if (socket) {
    socket.auth = { token: token || '' }
    if (!socket.connected) socket.connect()
    return socket
  }

  socket = io(SOCKET_URL, {
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

export const joinQueue = (queueId) => {
  socket?.emit('join_queue', queueId)
}

export const leaveQueue = (queueId) => {
  socket?.emit('leave_queue', queueId)
}

export const joinUserRoom = (userId) => {
  socket?.emit('join:user', { userId })
}
