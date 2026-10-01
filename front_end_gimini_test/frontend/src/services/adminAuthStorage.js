const ADMIN_KEY = 'rentis_admin'
const ACCESS_TOKEN_KEY = 'rentis_admin_access_token'
const REFRESH_TOKEN_KEY = 'rentis_admin_refresh_token'

export function getAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getAdminAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getAdminRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setAdminSession({ access_token, refresh_token, admin }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function clearAdminSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}

export const ADMIN_AUTH_EXPIRED_EVENT = 'rentis:admin-auth-expired'
