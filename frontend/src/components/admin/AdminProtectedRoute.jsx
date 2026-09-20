import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminProtectedRoute({ superOnly, children }) {
  const { admin, ready } = useAdminAuth()

  if (!ready) return null
  if (!admin) return <Navigate to="/admin/login" replace />
  if (superOnly && admin.role !== 'super_admin') return <Navigate to="/admin" replace />

  return children
}
