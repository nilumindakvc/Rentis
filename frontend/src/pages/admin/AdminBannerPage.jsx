import { useEffect, useState } from 'react'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Alert from 'react-bootstrap/Alert'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import { adminSettingsApi } from '../../services/adminApi'

export default function AdminBannerPage() {
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    adminSettingsApi
      .getBanner()
      .then((banner) => {
        setEnabled(banner.enabled)
        setMessage(banner.message)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const banner = await adminSettingsApi.updateBanner({ enabled, message })
      setEnabled(banner.enabled)
      setMessage(banner.message)
      setSaved(true)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>

  return (
    <AdminLayout>
      <h1 className="h4 mb-4">Site banner</h1>
      <p className="text-muted">
        When enabled, this message is shown at the top of every page on the public site.
      </p>

      <Card>
        <Card.Body>
          <ErrorAlert error={error} onClose={() => setError(null)} />
          {saved && (
            <Alert variant="success" dismissible onClose={() => setSaved(false)}>
              Banner settings saved.
            </Alert>
          )}
          <Form onSubmit={handleSave}>
            <Form.Check
              type="switch"
              id="banner-enabled"
              label="Show banner on the public site"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mb-3"
            />
            <Form.Group className="mb-3" controlId="banner-message">
              <Form.Label className="small text-muted">Banner message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Scheduled maintenance on Sunday, 2am–4am."
              />
            </Form.Group>
            <Button type="submit" variant="dark" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </AdminLayout>
  )
}
