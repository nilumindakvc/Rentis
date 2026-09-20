import { useEffect, useState } from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import { adminStatsApi } from '../../services/adminApi'

function StatTile({ label, value }) {
  return (
    <Card className="text-center h-100">
      <Card.Body>
        <div className="fs-3 fw-bold">{value ?? '—'}</div>
        <div className="text-muted small">{label}</div>
      </Card.Body>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    adminStatsApi.summary().then(setStats).catch(setError).finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <h1 className="h4 mb-4">Platform overview</h1>
      {loading && <LoadingSpinner />}
      {error && <ErrorAlert error={error} />}
      {stats && (
        <Row className="g-3">
          <Col xs={6} md={3}>
            <StatTile label="Owners" value={stats.total_owners} />
          </Col>
          <Col xs={6} md={3}>
            <StatTile label="Customers" value={stats.total_customers} />
          </Col>
          <Col xs={6} md={3}>
            <StatTile label="Conversations" value={stats.total_conversations} />
          </Col>
          <Col xs={6} md={3}>
            <StatTile label="Messages" value={stats.total_messages} />
          </Col>
          {Object.entries(stats.listings_by_status).map(([status, count]) => (
            <Col xs={6} md={3} key={status}>
              <StatTile label={`Listings — ${status}`} value={count} />
            </Col>
          ))}
        </Row>
      )}
    </AdminLayout>
  )
}
