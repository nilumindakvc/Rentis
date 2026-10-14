import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from 'react-bootstrap/Badge'
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { adminPropertiesApi } from '../../services/adminApi'

function ArchivedByBadge({ role, name }) {
  if (!role) return <span className="text-muted small">—</span>
  const bg = role === 'owner' ? 'secondary' : 'dark'
  const label = role === 'owner' ? 'Owner' : 'Admin'
  return (
    <span className="d-flex flex-column gap-1">
      <Badge bg={bg}>{label}</Badge>
      <span className="small text-muted">{name}</span>
    </span>
  )
}

export default function AdminArchivedPropertiesPage() {
  const { admin } = useAdminAuth()
  const isSuperAdmin = admin?.role === 'super_admin'

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    adminPropertiesApi
      .listArchived()
      .then(setProperties)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleRestore = async (p) => {
    setProcessing(p.id)
    setActionError(null)
    try {
      await adminPropertiesApi.restore(p.id)
      setProperties((prev) => prev.filter((x) => x.id !== p.id))
    } catch (err) {
      setActionError(err)
    } finally {
      setProcessing(null)
    }
  }

  const handlePermanentDeleteConfirm = async () => {
    if (!deleteTarget) return
    setProcessing(deleteTarget.id)
    setActionError(null)
    try {
      await adminPropertiesApi.permanentDelete(deleteTarget.id)
      setProperties((prev) => prev.filter((x) => x.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setActionError(err)
      setDeleteTarget(null)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h4 mb-0">Archived Listings</h1>
        <Link to="/admin/properties" className="btn btn-outline-secondary btn-sm">
          ← All Listings
        </Link>
      </div>

      <ErrorAlert error={actionError} />

      {loading && <LoadingSpinner />}
      {error && <ErrorAlert error={error} />}

      {!loading && !error && properties.length === 0 && (
        <EmptyState
          title="No archived listings"
          message="Listings archived by owners or admin appear here."
        />
      )}

      {!loading && !error && properties.length > 0 && (
        <Table hover responsive className="bg-white">
          <thead>
            <tr>
              <th>Title</th>
              <th>Owner</th>
              <th>Category</th>
              <th>Price</th>
              <th>Archived by</th>
              <th>Archived on</th>
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
                <td>
                  <ArchivedByBadge role={p.archived_by_role} name={p.archived_by_name} />
                </td>
                <td className="small text-muted">
                  {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-success"
                      disabled={processing === p.id}
                      onClick={() => handleRestore(p)}
                    >
                      Restore
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={processing === p.id}
                        onClick={() => setDeleteTarget(p)}
                      >
                        Delete permanently
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Permanently delete listing"
        confirmLabel="Delete permanently"
        loading={processing === deleteTarget?.id}
        onConfirm={handlePermanentDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      >
        <p className="mb-1">
          Are you sure you want to permanently delete <strong>{deleteTarget?.title}</strong>?
        </p>
        <p className="text-muted small mb-0">
          This will remove all bookings, messages, and photos associated with this listing.
          This action cannot be undone.
        </p>
      </ConfirmModal>
    </AdminLayout>
  )
}
