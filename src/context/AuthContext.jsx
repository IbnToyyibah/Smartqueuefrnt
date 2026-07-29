import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authApi } from '../lib/api'
import { connectSocket, disconnectSocket, joinUserRoom } from '../lib/socket'

const AuthContext = createContext(null)

const TOKEN_KEY = 'sq_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)   // true while restoring session
  const [error, setError] = useState(null)

  /* ── Restore session on mount ── */
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setLoading(false); return }

    let alive = true
    authApi.me()
      .then(({ user: u }) => {
        if (!alive) return
        setUser(u)
        connectSocket(token)
        joinUserRoom(u._id)
      })
      .catch(() => {
        if (!alive) return
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true); setError(null)
    try {
      const { token, user: u } = await authApi.login({ email, password })
      localStorage.setItem(TOKEN_KEY, token)
      setUser(u)
      connectSocket(token)
      joinUserRoom(u._id)
      return { success: true, user: u }
    } catch (err) {
      const msg = err.status === 503
        ? 'SmartQueue is temporarily unavailable. Please try again shortly.'
        : (err.message || 'Login failed.')
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data) => {
    setLoading(true); setError(null)
    try {
      const { token, user: u } = await authApi.register(data)
      localStorage.setItem(TOKEN_KEY, token)
      setUser(u)
      connectSocket(token)
      joinUserRoom(u._id)
      return { success: true, user: u }
    } catch (err) {
      const msg = err.status === 503
        ? 'SmartQueue is temporarily unavailable. Please try again shortly.'
        : (err.message || 'Registration failed.')
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    disconnectSocket()
    setUser(null)
    setError(null)
  }, [])

  const updateProfile = useCallback(async (data) => {
    const { user: u } = await authApi.updateMe(data)
    setUser(u)
    return u
  }, [])

  const isRole = useCallback(
    (...roles) => user && roles.includes(user.role),
    [user]
  )

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, updateProfile, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
