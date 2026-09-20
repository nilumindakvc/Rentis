import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import { useAdminAuth } from '../../context/AdminAuthContext'
import ErrorAlert from '../../components/common/ErrorAlert'

export default function AdminLoginPage() {
  const { login } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container style={{ maxWidth: 420 }} className="mt-5">
      <Card className="p-4 shadow-sm border-dark">
        <h1 className="h4 mb-1">Rentis Admin</h1>
        <p className="text-muted small mb-3">Authorized personnel only.</p>
        <ErrorAlert error={error} />
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="admin-login-email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="admin-login-password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" variant="dark" className="w-100" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </Form>
      </Card>
    </Container>
  )
}
