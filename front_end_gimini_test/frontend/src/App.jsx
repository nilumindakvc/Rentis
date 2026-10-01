import { Routes, Route, useLocation } from 'react-router-dom'
import NavBar from './components/layout/NavBar'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'
import CustomerDashboardPage from './pages/CustomerDashboardPage'
import CreateEditListingPage from './pages/CreateEditListingPage'
import OwnerAvailabilityPage from './pages/OwnerAvailabilityPage'
import MessagesPage from './pages/MessagesPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage'
import AdminPropertyDetailPage from './pages/admin/AdminPropertyDetailPage'
import AdminManageAdminsPage from './pages/admin/AdminManageAdminsPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <>
      {!isAdminRoute && <NavBar />}
      <main className={isAdminRoute ? '' : 'pb-5'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute role="owner">
                <OwnerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/listings/new"
            element={
              <ProtectedRoute role="owner">
                <CreateEditListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/listings/:id/edit"
            element={
              <ProtectedRoute role="owner">
                <CreateEditListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/listings/:id/availability"
            element={
              <ProtectedRoute role="owner">
                <OwnerAvailabilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:id?"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

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

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  )
}
