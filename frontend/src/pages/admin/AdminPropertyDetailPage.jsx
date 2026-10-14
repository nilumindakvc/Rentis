import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import AdminLayout from '../../components/admin/AdminLayout'
import PropertyDetailView from '../../components/property/PropertyDetailView'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import ConfirmModal from '../../components/common/ConfirmModal'
import { adminPropertiesApi } from '../../services/adminApi'

export default function AdminPropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingStatus, setSavingStatus] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [archivedNotice, setArchivedNotice] = useState(null)

  useEffect(() => {
    setLoading(true)
    adminPropertiesApi.get(id).then(setProperty).catch(setError).finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value
    setSavingStatus(true)
    try {
      const updated = await adminPropertiesApi.setStatus(id, nextStatus)
      setProperty((prev) => ({ ...prev, status: updated.status }))
    } catch (err) {
      setError(err)
    } finally {
      setSavingStatus(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    setDeleteError(null)
    setArchivedNotice(null)
    try {
      const result = await adminPropertiesApi.remove(id)
      setShowDeleteModal(false)
      if (result?.action === 'archived') {
        setProperty((prev) => ({ ...prev, status: 'archived' }))
        setArchivedNotice(result.message)
      } else {
        navigate('/admin/properties')
      }
    } catch (err) {
      setShowDeleteModal(false)
      setDeleteError(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout>
      <Button variant="link" className="ps-0 mb-3" onClick={() => navigate('/admin/properties')}>
        ← Back to listings
      </Button>

      {loading && <LoadingSpinner label="Loading listing…" />}
      <ErrorAlert error={error} />

      {!loading && property && (
        <>
          <PropertyDetailView
            property={property}
            showFavorite={false}
            actions={
              <>
                <Form.Group className="mb-3" controlId="admin-property-status">
                  <Form.Label className="small text-muted">Status</Form.Label>
                  <Form.Select value={property.status} onChange={handleStatusChange} disabled={savingStatus}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </Form.Select>
                </Form.Group>

                {archivedNotice && (
                  <Alert variant="warning" className="mb-3">
                    {archivedNotice}{' '}
                    <Link to="/admin/properties/archived">View Archived Listings →</Link>
                  </Alert>
                )}

                <ErrorAlert error={deleteError} />

                <Button
                  variant="outline-danger"
                  className="w-100"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={property.status === 'archived'}
                >
                  Delete listing
                </Button>

                {property.status === 'archived' && (
                  <div className="text-muted small mt-2 text-center">
                    This listing is archived.{' '}
                    <Link to="/admin/properties/archived">Manage in Archived Listings</Link>
                  </div>
                )}
              </>
            }
          />

          <ConfirmModal
            show={showDeleteModal}
            title="Delete listing"
            confirmLabel="Delete"
            loading={deleting}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDeleteModal(false)}
          >
            <p className="mb-1">
              Are you sure you want to delete <strong>{property.title}</strong>?
            </p>
            <p className="text-muted small mb-0">
              If this listing has existing bookings or messages it will be <strong>archived</strong> instead.
              You can permanently delete it from the Archived Listings page.
            </p>
          </ConfirmModal>
        </>
      )}
    </AdminLayout>
  )
}
