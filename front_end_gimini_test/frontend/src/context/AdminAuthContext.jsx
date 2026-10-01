import { createContext, useContext, useEffect, useState } from 'react'
import { adminAuthApi } from '../services/adminApi'
import {
  ADMIN_AUTH_EXPIRED_EVENT,
  clearAdminSession,
  getAdmin,
  getAdminRefreshToken,
  setAdminSession,
} from '../services/adminAuthStorage'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setAdmin(getAdmin())
    setReady(true)

    const onExpired = () => setAdmin(null)
    window.addEventListener(ADMIN_AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(ADMIN_AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const login = async (email, password) => {
    const result = await adminAuthApi.login({ email, password })
    setAdminSession(result)
    setAdmin(result.admin)
    return result.admin
  }

  const logout = () => {
    const refreshToken = getAdminRefreshToken()
    clearAdminSession()
    setAdmin(null)
    if (refreshToken) {
      adminAuthApi.logout(refreshToken).catch(() => {
        // best-effort server-side revocation — local session is already cleared
      })
    }
  }

  return (
    <AdminAuthContext.Provider value={{ admin, ready, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
