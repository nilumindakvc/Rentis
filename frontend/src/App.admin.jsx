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
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminProtectedRoute>
            <AdminUsersPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/properties"
        element={
          <AdminProtectedRoute>
            <AdminPropertiesPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/properties/archived"
        element={
          <AdminProtectedRoute>
            <AdminArchivedPropertiesPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/properties/:id"
        element={
          <AdminProtectedRoute>
            <AdminPropertyDetailPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/admins"
        element={
          <AdminProtectedRoute superOnly>
            <AdminManageAdminsPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/partners"
        element={
          <AdminProtectedRoute superOnly>
            <AdminPartnersPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/plans"
        element={
          <AdminProtectedRoute superOnly>
            <AdminPlansPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/taxonomy"
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
