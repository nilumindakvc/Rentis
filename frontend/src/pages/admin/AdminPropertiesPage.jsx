import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import Badge from 'react-bootstrap/Badge'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import { adminPropertiesApi } from '../../services/adminApi'

const STATUS_VARIANT = { published: 'success', draft: 'secondary', archived: 'dark' }

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = (params) => {
    setLoading(true)
    adminPropertiesApi
      .list(params)
      .then(setProperties)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleFilterChange = (value) => {
    setStatusFilter(value)
    load({ status_filter: value || undefined })
  }

  const handleStatusChange = async (p, status) => {
    const updated = await adminPropertiesApi.setStatus(p.id, status)
    setProperties((prev) => prev.map((x) => (x.id === p.id ? updated : x)))
  }

  return (
    <AdminLayout>
      <h1 className="h4 mb-4">Listings</h1>
      <Form.Select
        style={{ maxWidth: 220 }}
        className="mb-3"
        value={statusFilter}
        onChange={(e) => handleFilterChange(e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </Form.Select>

      {loading && <LoadingSpinner />}
      {error && <ErrorAlert error={error} />}
      {!loading && !error && properties.length === 0 && <EmptyState title="No listings found" />}
      {!loading && !error && properties.length > 0 && (
        <Table hover responsive className="bg-white">
          <thead>
            <tr>
              <th>Title</th>
              <th>Owner</th>
              <th>Category</th>
              <th>Price</th>
              <th>Views</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/admin/properties/${p.id}`}>{p.title}</Link>
                </td>
                <td>{p.owner_name}</td>
                <td>
                  {p.category_name} · {p.subtype_name}
                </td>
                <td>
                  {p.price_currency} {Number(p.min_price).toLocaleString()}
                </td>
                <td>{p.view_count}</td>
                <td>
                  <Badge bg={STATUS_VARIANT[p.status] || 'secondary'} className="text-capitalize">
                    {p.status}
                  </Badge>
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    style={{ maxWidth: 150 }}
                    value={p.status}
                    onChange={(e) => handleStatusChange(p, e.target.value)}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </Form.Select>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </AdminLayout>
  )
}
