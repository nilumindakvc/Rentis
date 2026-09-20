import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import { useAuth } from '../../context/AuthContext'
import { conversationsApi } from '../../services/api'
import ErrorAlert from '../common/ErrorAlert'

export default function ContactOwnerForm({ propertyId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!user) {
    return (
      <Alert variant="light" className="border">
        <a href="/login">Log in</a> as a customer to message the owner.
      </Alert>
    )
  }

  if (user.role !== 'customer') {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const conversation = await conversationsApi.start({ property_id: propertyId, message })
      navigate(`/messages/${conversation.id}`)
    } catch (err) {
      setError(err)
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <ErrorAlert error={error} />
      <Form.Group className="mb-2">
        <Form.Label className="small text-muted">Message to owner</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I'm interested in this property — is it still available?"
          required
        />
      </Form.Group>
      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? 'Sending…' : 'Message owner'}
      </Button>
    </Form>
  )
}
