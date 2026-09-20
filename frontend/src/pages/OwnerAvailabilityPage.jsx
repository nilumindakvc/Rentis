import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import AvailabilityCalendar from '../components/property/AvailabilityCalendar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import EmptyState from '../components/common/EmptyState'
import { propertiesApi, availabilityApi } from '../services/api'

function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function OwnerAvailabilityPage() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [range, setRange] = useState()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const load = () => {
    Promise.all([propertiesApi.getById(id), availabilityApi.list(id)])
      .then(([p, b]) => {
        setProperty(p)
        setBlocks(b)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleBlock = async () => {
    if (!range?.from || !range?.to) return
    setSaving(true)
    setError(null)
    try {
      await availabilityApi.create(id, {
        start_date: toDateString(range.from),
        end_date: toDateString(range.to),
        reason: reason || undefined,
      })
      setRange(undefined)
      setReason('')
      load()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (blockId) => {
    await availabilityApi.remove(id, blockId)
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
  }

  if (loading) return <LoadingSpinner label="Loading availability…" />

  return (
    <Container style={{ maxWidth: 900 }}>
      <Link to="/owner/dashboard" className="small d-inline-block mb-3">
        ← Back to dashboard
      </Link>
      <h1 className="h4 mb-1">Availability</h1>
      {property && <p className="text-muted mb-4">{property.title}</p>}
      <ErrorAlert error={error} />

      <Row className="g-4">
        <Col md={7}>
          <Card className="mb-3">
            <Card.Body>
              <h2 className="h6 mb-3">Block new dates</h2>
              <AvailabilityCalendar blocks={blocks} mode="range" selected={range} onSelect={setRange} />
              <Form.Group className="mt-3 mb-3">
                <Form.Label className="small text-muted">Reason (optional)</Form.Label>
                <Form.Control
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Under maintenance"
                />
              </Form.Group>
              <Button variant="primary" onClick={handleBlock} disabled={saving || !range?.from || !range?.to}>
                {saving ? 'Blocking…' : 'Block these dates'}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          <Card>
            <Card.Header className="fw-semibold">Blocked periods</Card.Header>
            {blocks.length === 0 ? (
              <Card.Body>
                <EmptyState title="No blocked dates" message="This listing is open on every date." />
              </Card.Body>
            ) : (
              <ListGroup variant="flush">
                {blocks.map((b) => (
                  <ListGroup.Item key={b.id} className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="fw-semibold small">
                        {b.start_date} → {b.end_date}
                      </div>
                      {b.reason && <div className="text-muted small">{b.reason}</div>}
                    </div>
                    <Button size="sm" variant="outline-danger" onClick={() => handleRemove(b.id)}>
                      Remove
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
