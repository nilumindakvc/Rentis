import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api'
import { AUTH_EXPIRED_EVENT, clearSession, getRefreshToken, getUser, setSession } from '../services/authStorage'
import { connectSocket, disconnectSocket } from '../services/ws'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const restored = getUser()
    setUser(restored)
    setReady(true)
    if (restored) connectSocket()

    const onExpired = () => {
      setUser(null)
      disconnectSocket()
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const login = async (email, password) => {
    const result = await authApi.login({ email, password })
    setSession(result)
    setUser(result.user)
    connectSocket()
    return result.user
  }

  const signup = async (payload) => {
    const result = await authApi.signup(payload)
    setSession(result)
    setUser(result.user)
    connectSocket()
    return result.user
  }

  const logout = () => {
    const refreshToken = getRefreshToken()
    clearSession()
    setUser(null)
    disconnectSocket()
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {
        // best-effort server-side revocation — local session is already cleared
      })
    }
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
