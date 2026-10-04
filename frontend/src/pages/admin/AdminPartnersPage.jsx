import { useEffect, useRef, useState } from 'react'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import { adminPartnersApi } from '../../services/adminApi'

const emptyForm = { name: '', website_url: '', sort_order: 0, logo_url: '' }

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const fileInputRef = useRef(null)

  const load = () => {
    setLoading(true)
    adminPartnersApi.list().then(setPartners).catch(setError).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setCreateError(null)
    try {
      const { url } = await adminPartnersApi.uploadLogo(file)
      setForm((f) => ({ ...f, logo_url: url }))
    } catch (err) {
      setCreateError(err)
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.logo_url) {
      setCreateError({ message: 'Upload a logo image first.' })
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const partner = await adminPartnersApi.create({
        ...form,
        sort_order: Number(form.sort_order) || 0,
        website_url: form.website_url || null,
      })
      setPartners((prev) => [...prev, partner].sort((a, b) => a.sort_order - b.sort_order))
      setForm(emptyForm)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setCreateError(err)
    } finally {
      setCreating(false)
    }
  }

  const handleRemove = async (partner) => {
    await adminPartnersApi.remove(partner.id)
    setPartners((prev) => prev.filter((p) => p.id !== partner.id))
  }

  if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>

  return (
    <AdminLayout>
      <h1 className="h4 mb-4">Partners</h1>
      <p className="text-muted">
        Logos shown in the "Our global customers" section on the homepage.
      </p>
      <ErrorAlert error={error} />

      <Card className="mb-4">
        <Card.Header className="fw-semibold">Add partner</Card.Header>
        <Card.Body>
          <ErrorAlert error={createError} />
          <Form onSubmit={handleCreate} className="d-flex flex-wrap gap-2 align-items-end">
            <Form.Group controlId="partner-name">
              <Form.Label className="small text-muted">Name</Form.Label>
              <Form.Control
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group controlId="partner-website">
              <Form.Label className="small text-muted">
                Website <span className="text-muted">optional</span>
              </Form.Label>
              <Form.Control
                type="url"
                value={form.website_url}
                onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                placeholder="https://"
              />
            </Form.Group>
            <Form.Group controlId="partner-sort-order">
              <Form.Label className="small text-muted">Order</Form.Label>
              <Form.Control
                type="number"
                style={{ width: 90 }}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
            </Form.Group>
            <Form.Group controlId="partner-logo">
              <Form.Label className="small text-muted">Logo</Form.Label>
              <Form.Control
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </Form.Group>
            {form.logo_url && (
              <img
                src={form.logo_url}
                alt="Logo preview"
                style={{ height: 36, objectFit: 'contain' }}
              />
            )}
            <Button type="submit" variant="dark" disabled={creating || uploading}>
              {creating ? 'Adding…' : uploading ? 'Uploading…' : 'Add partner'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {partners.length === 0 ? (
        <EmptyState title="No partners yet" message="Add a partner above to show their logo on the homepage." />
      ) : (
        <Table hover responsive className="bg-white align-middle">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Name</th>
              <th>Website</th>
              <th>Order</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id}>
                <td>
                  <img src={p.logo_url} alt={p.name} style={{ height: 32, objectFit: 'contain' }} />
                </td>
                <td>{p.name}</td>
                <td>
                  {p.website_url ? (
                    <a href={p.website_url} target="_blank" rel="noopener noreferrer">
                      {p.website_url}
                    </a>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>{p.sort_order}</td>
                <td>
                  <Button size="sm" variant="outline-danger" onClick={() => handleRemove(p)}>
                    Remove
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
