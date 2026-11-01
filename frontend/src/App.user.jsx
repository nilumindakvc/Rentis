import { Routes, Route } from 'react-router-dom'
import NavBar from './components/layout/NavBar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/layout/ProtectedRoute'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import PricingPage from './pages/PricingPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'
import CustomerDashboardPage from './pages/CustomerDashboardPage'
import CreateEditListingPage from './pages/CreateEditListingPage'
import OwnerAvailabilityPage from './pages/OwnerAvailabilityPage'
import MessagesPage from './pages/MessagesPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <>
      <NavBar />
      <main className="pb-5" style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/pricing" element={<PricingPage />} />
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

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
