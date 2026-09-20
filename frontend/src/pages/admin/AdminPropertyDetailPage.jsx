import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import AdminLayout from '../../components/admin/AdminLayout'
import PropertyDetailView from '../../components/property/PropertyDetailView'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import { adminPropertiesApi } from '../../services/adminApi'

export default function AdminPropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingStatus, setSavingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${property.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await adminPropertiesApi.remove(id)
      navigate('/admin/properties')
    } catch (err) {
      setError(err)
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
              <Button variant="outline-danger" className="w-100" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete listing'}
              </Button>
            </>
          }
        />
      )}
    </AdminLayout>
  )
}
