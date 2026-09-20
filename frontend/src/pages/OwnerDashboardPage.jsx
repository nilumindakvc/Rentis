import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Table from 'react-bootstrap/Table'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import EmptyState from '../components/common/EmptyState'
import { propertiesApi, ownerStatsApi, bookingsApi } from '../services/api'

const STATUS_VARIANT = { pending: 'warning', accepted: 'success', rejected: 'secondary', cancelled: 'secondary' }

function StatTile({ label, value }) {
  return (
    <Card className="text-center h-100">
      <Card.Body>
        <div className="fs-3 fw-bold" style={{ color: 'var(--rentis-accent)' }}>
          {value ?? '—'}
        </div>
        <div className="text-muted small">{label}</div>
      </Card.Body>
    </Card>
  )
}

function ListingsTab() {
  const [listings, setListings] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([propertiesApi.getMine(), ownerStatsApi.summary()])
      .then(([l, s]) => {
        setListings(l)
        setStats(s)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />

  return (
    <>
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <StatTile label="Listings" value={stats?.total_listings} />
        </Col>
        <Col xs={6} md={3}>
          <StatTile label="Total views" value={stats?.total_views} />
        </Col>
        <Col xs={6} md={3}>
          <StatTile label="Conversations" value={stats?.total_conversations} />
        </Col>
        <Col xs={6} md={3}>
          <StatTile label="Unread messages" value={stats?.unread_messages} />
        </Col>
      </Row>

      {listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          message="Publish your first property to start receiving messages."
          action={
            <Button as={Link} to="/owner/listings/new" variant="primary">
              Add listing
            </Button>
          }
        />
      ) : (
        <Table hover responsive className="bg-white">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Views</th>
              <th>Conversations</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {listings.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/properties/${p.id}`}>{p.title}</Link>
                </td>
                <td>
                  {p.category_name} · {p.subtype_name}
                </td>
                <td>
                  {p.price_currency} {Number(p.min_price).toLocaleString()}
                </td>
                <td className="text-capitalize">{p.status}</td>
                <td>{p.view_count}</td>
                <td>{p.conversation_count}</td>
                <td className="d-flex gap-2">
                  <Link to={`/owner/listings/${p.id}/edit`} className="small">
                    Edit
                  </Link>
                  {(p.rental_term === 'medium_term' || p.rental_term === 'short_term') && (
                    <Link to={`/owner/listings/${p.id}/availability`} className="small">
                      Availability
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}

function BookingRequestsTab() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    bookingsApi.forOwner().then(setBookings).catch(setError).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleAccept = async (id) => {
    await bookingsApi.accept(id)
    load()
  }

  const handleReject = async (id) => {
    const updated = await bookingsApi.reject(id)
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)))
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />
  if (bookings.length === 0) {
    return <EmptyState title="No booking requests yet" message="Requests for your short-term/medium-term listings will show up here." />
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
                {b.start_date} → {b.end_date} · from {b.customer_name}
              </p>
              {b.message && <p className="mb-1 text-muted small">{b.message}</p>}
            </div>
            {b.status === 'pending' && (
              <div className="d-flex gap-2">
                <Button size="sm" variant="success" onClick={() => handleAccept(b.id)}>
                  Accept
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => handleReject(b.id)}>
                  Reject
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  )
}

export default function OwnerDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'bookings' ? 'bookings' : 'listings'

  return (
    <Container>
      <h1 className="h4 mb-4">Owner dashboard</h1>
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setSearchParams(key === 'bookings' ? { tab: 'bookings' } : {})}
        className="mb-3"
      >
        <Tab eventKey="listings" title="My Listings">
          <ListingsTab />
        </Tab>
        <Tab eventKey="bookings" title="Booking Requests">
          <BookingRequestsTab />
        </Tab>
      </Tabs>
    </Container>
  )
}
