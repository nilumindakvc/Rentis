import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import ToggleButton from 'react-bootstrap/ToggleButton'
import { useAuth } from '../context/AuthContext'
import ErrorAlert from '../components/common/ErrorAlert'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const user = await signup(form)
      navigate(user.role === 'owner' ? '/owner/dashboard' : '/', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container style={{ maxWidth: 460 }}>
      <Card className="p-4 shadow-sm">
        <h1 className="h4 mb-3">Create your Rentis account</h1>
        <ErrorAlert error={error} />
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="signup-role">
            <Form.Label className="d-block">I am a…</Form.Label>
            <ButtonGroup>
              <ToggleButton
                id="role-customer"
                type="radio"
                variant="outline-primary"
                name="role"
                value="customer"
                checked={form.role === 'customer'}
                onChange={() => set({ role: 'customer' })}
              >
                Customer — I'm looking to rent
              </ToggleButton>
              <ToggleButton
                id="role-owner"
                type="radio"
                variant="outline-primary"
                name="role"
                value="owner"
                checked={form.role === 'owner'}
                onChange={() => set({ role: 'owner' })}
              >
                Owner — I'm listing a property
              </ToggleButton>
            </ButtonGroup>
          </Form.Group>
          <Form.Group className="mb-3" controlId="signup-name">
            <Form.Label>Full name</Form.Label>
            <Form.Control value={form.name} onChange={(e) => set({ name: e.target.value })} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="signup-email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="signup-phone">
            <Form.Label>Phone (optional)</Form.Label>
            <Form.Control value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="signup-password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </Button>
        </Form>
        <p className="text-center small text-muted mt-3 mb-0">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Card>
    </Container>
  )
}
