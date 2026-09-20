import { useEffect, useState } from 'react'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import { adminUsersApi } from '../../services/adminApi'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = (params) => {
    setLoading(true)
    adminUsersApi
      .list(params)
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleSearch = (e) => {
    e.preventDefault()
    load({ q: q || undefined })
  }

  const toggleActive = async (u) => {
    const updated = await adminUsersApi.setStatus(u.id, !u.is_active)
    setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)))
  }

  return (
    <AdminLayout>
      <h1 className="h4 mb-4">Users</h1>
      <Form className="d-flex gap-2 mb-3" onSubmit={handleSearch}>
        <Form.Control
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Button type="submit" variant="outline-dark">
          Search
        </Button>
      </Form>

      {loading && <LoadingSpinner />}
      {error && <ErrorAlert error={error} />}
      {!loading && !error && users.length === 0 && <EmptyState title="No users found" />}
      {!loading && !error && users.length > 0 && (
        <Table hover responsive className="bg-white">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td className="text-capitalize">{u.role}</td>
                <td>{u.phone || '—'}</td>
                <td>
                  <Badge bg={u.is_active ? 'success' : 'secondary'}>
                    {u.is_active ? 'Active' : 'Suspended'}
                  </Badge>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <Button
                    size="sm"
                    variant={u.is_active ? 'outline-danger' : 'outline-success'}
                    onClick={() => toggleActive(u)}
                  >
                    {u.is_active ? 'Suspend' : 'Reactivate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </AdminLayout>
  )
}
