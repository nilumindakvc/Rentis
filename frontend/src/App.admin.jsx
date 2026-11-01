import { Routes, Route } from 'react-router-dom'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage'
import AdminArchivedPropertiesPage from './pages/admin/AdminArchivedPropertiesPage'
import AdminPropertyDetailPage from './pages/admin/AdminPropertyDetailPage'
import AdminManageAdminsPage from './pages/admin/AdminManageAdminsPage'
import AdminPartnersPage from './pages/admin/AdminPartnersPage'
import AdminPlansPage from './pages/admin/AdminPlansPage'
import AdminTaxonomyPage from './pages/admin/AdminTaxonomyPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route
        path="/"
        element={
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <AdminProtectedRoute>
            <AdminUsersPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/properties"
        element={
          <AdminProtectedRoute>
            <AdminPropertiesPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/properties/archived"
        element={
          <AdminProtectedRoute>
            <AdminArchivedPropertiesPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/properties/:id"
        element={
          <AdminProtectedRoute>
            <AdminPropertyDetailPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admins"
        element={
          <AdminProtectedRoute superOnly>
            <AdminManageAdminsPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/partners"
        element={
          <AdminProtectedRoute superOnly>
            <AdminPartnersPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <AdminProtectedRoute superOnly>
            <AdminPlansPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/taxonomy"
        element={
          <AdminProtectedRoute superOnly>
            <AdminTaxonomyPage />
          </AdminProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
