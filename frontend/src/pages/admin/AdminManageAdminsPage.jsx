import { useEffect, useState } from 'react'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import { adminAdminsApi } from '../../services/adminApi'

const emptyForm = { name: '', email: '', password: '' }

export default function AdminManageAdminsPage() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const load = () => {
    setLoading(true)
    adminAdminsApi.list().then(setAdmins).catch(setError).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const admin = await adminAdminsApi.create(form)
      setAdmins((prev) => [...prev, admin])
      setForm(emptyForm)
    } catch (err) {
      setCreateError(err)
    } finally {
      setCreating(false)
    }
  }

  const handleRemove = async (admin) => {
    await adminAdminsApi.remove(admin.id)
    setAdmins((prev) => prev.filter((a) => a.id !== admin.id))
  }

  if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>

  return (
    <AdminLayout>
      <h1 className="h4 mb-4">Admins</h1>
      <ErrorAlert error={error} />

      <Card className="mb-4">
        <Card.Header className="fw-semibold">Add admin</Card.Header>
        <Card.Body>
          <ErrorAlert error={createError} />
          <Form onSubmit={handleCreate} className="d-flex flex-wrap gap-2 align-items-end">
            <Form.Group controlId="admin-name">
              <Form.Label className="small text-muted">Name</Form.Label>
              <Form.Control
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group controlId="admin-email">
              <Form.Label className="small text-muted">Email</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group controlId="admin-password">
              <Form.Label className="small text-muted">Password</Form.Label>
              <Form.Control
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </Form.Group>
            <Button type="submit" variant="dark" disabled={creating}>
              {creating ? 'Adding…' : 'Add admin'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Table hover responsive className="bg-white">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Added</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.email}</td>
              <td>
                <Badge bg={a.role === 'super_admin' ? 'dark' : 'secondary'} className="text-capitalize">
                  {a.role.replace('_', ' ')}
                </Badge>
              </td>
              <td>{new Date(a.created_at).toLocaleDateString()}</td>
              <td>
                {a.role !== 'super_admin' && (
                  <Button size="sm" variant="outline-danger" onClick={() => handleRemove(a)}>
                    Remove
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminLayout>
  )
}
