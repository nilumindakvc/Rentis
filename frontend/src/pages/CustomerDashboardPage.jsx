import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import EmptyState from '../components/common/EmptyState'
import PropertyGrid from '../components/property/PropertyGrid'
import { favoritesApi, bookingsApi } from '../services/api'

const STATUS_VARIANT = { pending: 'warning', accepted: 'success', rejected: 'secondary', cancelled: 'secondary' }

function FavoritesTab() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    favoritesApi.list().then(setFavorites).catch(setError).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />
  if (favorites.length === 0) {
    return <EmptyState title="No saved properties yet" message="Tap the star on any listing to save it here." />
  }
  return <PropertyGrid properties={favorites} />
}

function MyBookingsTab() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    bookingsApi.mine().then(setBookings).catch(setError).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCancel = async (id) => {
    const updated = await bookingsApi.cancel(id)
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)))
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />
  if (bookings.length === 0) {
    return <EmptyState title="No booking requests yet" message="Request dates on a short-term or medium-term listing to see it here." />
  }

  return (
    <div className="d-flex flex-column gap-3">
      {bookings.map((b) => (
        <Card key={b.id}>
          <Card.Body className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Link to={`/properties/${b.property_id}`} className="fw-semibold text-decoration-none">
                  {b.property_title}
                </Link>
                <Badge bg={STATUS_VARIANT[b.status]} className="text-capitalize">
                  {b.status}
                </Badge>
              </div>
              <p className="mb-1 small">
                {b.start_date} → {b.end_date}
              </p>
              {b.message && <p className="mb-1 text-muted small">{b.message}</p>}
            </div>
            {b.status === 'pending' && (
              <Button size="sm" variant="outline-danger" onClick={() => handleCancel(b.id)}>
                Cancel request
              </Button>
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  )
}

export default function CustomerDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'bookings' ? 'bookings' : 'favorites'

  return (
    <Container>
      <h1 className="h4 mb-4">My dashboard</h1>
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setSearchParams(key === 'bookings' ? { tab: 'bookings' } : {})}
        className="mb-3"
      >
        <Tab eventKey="favorites" title="Favorites">
          <FavoritesTab />
        </Tab>
        <Tab eventKey="bookings" title="My Bookings">
          <MyBookingsTab />
        </Tab>
      </Tabs>
    </Container>
  )
}
