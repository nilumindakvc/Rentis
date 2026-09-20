import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import { useAuth } from '../context/AuthContext'
import ErrorAlert from '../components/common/ErrorAlert'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const user = await login(email, password)
      const redirectTo = location.state?.from || (user.role === 'owner' ? '/owner/dashboard' : '/')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container style={{ maxWidth: 420 }}>
      <Card className="p-4 shadow-sm">
        <h1 className="h4 mb-3">Log in to Rentis</h1>
        <ErrorAlert error={error} />
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="login-email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="login-password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </Form>
        <p className="text-center small text-muted mt-3 mb-0">
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </Card>
    </Container>
  )
}
