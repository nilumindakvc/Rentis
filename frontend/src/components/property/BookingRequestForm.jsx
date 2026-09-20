import { useState } from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import AvailabilityCalendar from './AvailabilityCalendar'
import ErrorAlert from '../common/ErrorAlert'
import { bookingsApi } from '../../services/api'

function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function BookingRequestForm({ propertyId, blocks }) {
  const [range, setRange] = useState()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!range?.from || !range?.to) return
    setSubmitting(true)
    setError(null)
    try {
      const booking = await bookingsApi.create({
        property_id: propertyId,
        start_date: toDateString(range.from),
        end_date: toDateString(range.to),
        message: message || undefined,
      })
      setSent(booking)
      setRange(undefined)
      setMessage('')
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <Alert variant="success">
        Booking request sent for {sent.start_date} → {sent.end_date}. You'll be notified once the owner responds.
      </Alert>
    )
  }

  return (
    <Form onSubmit={handleSubmit}>
      <ErrorAlert error={error} />
      <Form.Label className="small text-muted mb-1">Pick your dates</Form.Label>
      <AvailabilityCalendar blocks={blocks} mode="range" selected={range} onSelect={setRange} />
      <Form.Group className="mt-2 mb-3">
        <Form.Label className="small text-muted">Message (optional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Anything the owner should know?"
        />
      </Form.Group>
      <Button type="submit" variant="primary" disabled={submitting || !range?.from || !range?.to}>
        {submitting ? 'Requesting…' : 'Request to book'}
      </Button>
    </Form>
  )
}
