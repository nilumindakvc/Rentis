import { useEffect, useState } from 'react'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Modal from 'react-bootstrap/Modal'
import Badge from 'react-bootstrap/Badge'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import ConfirmModal from '../../components/common/ConfirmModal'
import { adminPlansApi } from '../../services/adminApi'

const emptyCreateForm = {
  code: '',
  name: '',
  description: '',
  max_active_listings: '',
  monthly_price_lkr: '',
  allows_booking: false,
  allows_connect: false,
  stripe_product_id: '',
  stripe_price_id: '',
  features: [],
  sort_order: 0,
}

function toPayload(form) {
  return {
    ...form,
    max_active_listings: form.max_active_listings === '' ? null : Number(form.max_active_listings),
    monthly_price_lkr: form.monthly_price_lkr === '' ? 0 : Number(form.monthly_price_lkr),
    sort_order: Number(form.sort_order) || 0,
    description: form.description || null,
    stripe_product_id: form.stripe_product_id || null,
    stripe_price_id: form.stripe_price_id || null,
    features: (form.features || [])
      .map((f) => ({ text: f.text.trim(), included: !!f.included }))
      .filter((f) => f.text),
  }
}

function FeaturesEditor({ features, setFeatures }) {
  const updateFeature = (idx, patch) => {
    setFeatures((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }
  const removeFeature = (idx) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx))
  }
  const addFeature = () => {
    setFeatures((prev) => [...prev, { text: '', included: true }])
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label className="small text-muted">Feature list (shown on the pricing page)</Form.Label>
      {features.length === 0 && (
        <p className="text-muted small mb-2">No features added yet.</p>
      )}
      {features.map((f, idx) => (
        <div key={idx} className="d-flex align-items-center gap-2 mb-2">
          <Form.Check
            type="checkbox"
            checked={f.included}
            onChange={(e) => updateFeature(idx, { included: e.target.checked })}
            title="Included in this plan"
          />
          <Form.Control
            value={f.text}
            onChange={(e) => updateFeature(idx, { text: e.target.value })}
            placeholder="e.g. Up to 10 active listings"
          />
          <Button variant="outline-danger" size="sm" onClick={() => removeFeature(idx)}>
            &times;
          </Button>
        </div>
      ))}
      <Button variant="outline-secondary" size="sm" onClick={addFeature}>
        + Add feature
      </Button>
    </Form.Group>
  )
}

function PlanFormFields({ form, setForm, showCode }) {
  return (
    <>
      {showCode && (
        <Form.Group className="mb-3" controlId="plan-code">
          <Form.Label className="small text-muted">
            Code <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.trim().toLowerCase() }))}
            placeholder="e.g. pro, business"
            required
          />
          <Form.Text className="text-muted">
            Lowercase, no spaces. Cannot be changed after creation.
          </Form.Text>
        </Form.Group>
      )}

      <Form.Group className="mb-3" controlId="plan-name">
        <Form.Label className="small text-muted">
          Name <span className="text-danger">*</span>
        </Form.Label>
        <Form.Control
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="plan-description">
        <Form.Label className="small text-muted">Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </Form.Group>

      <div className="d-flex gap-3 flex-wrap">
        <Form.Group className="mb-3" controlId="plan-max-listings" style={{ width: 180 }}>
          <Form.Label className="small text-muted">Max active listings</Form.Label>
          <Form.Control
            type="number"
            min="0"
            value={form.max_active_listings}
            onChange={(e) => setForm((f) => ({ ...f, max_active_listings: e.target.value }))}
            placeholder="blank = unlimited"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="plan-price" style={{ width: 180 }}>
          <Form.Label className="small text-muted">Monthly price (LKR)</Form.Label>
          <Form.Control
            type="number"
            min="0"
            step="0.01"
            value={form.monthly_price_lkr}
            onChange={(e) => setForm((f) => ({ ...f, monthly_price_lkr: e.target.value }))}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="plan-sort-order" style={{ width: 140 }}>
          <Form.Label className="small text-muted">Sort order</Form.Label>
          <Form.Control
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
          />
        </Form.Group>
      </div>

      <div className="d-flex gap-4 mb-3">
        <Form.Check
          type="checkbox"
          id="plan-allows-booking"
          label="Allows booking"
          checked={form.allows_booking}
          onChange={(e) => setForm((f) => ({ ...f, allows_booking: e.target.checked }))}
        />
        <Form.Check
          type="checkbox"
          id="plan-allows-connect"
          label="Allows Stripe Connect (payouts)"
          checked={form.allows_connect}
          onChange={(e) => setForm((f) => ({ ...f, allows_connect: e.target.checked }))}
        />
      </div>

      <Form.Group className="mb-3" controlId="plan-stripe-product">
        <Form.Label className="small text-muted">Stripe Product ID</Form.Label>
        <Form.Control
          value={form.stripe_product_id}
          onChange={(e) => setForm((f) => ({ ...f, stripe_product_id: e.target.value.trim() }))}
          placeholder="prod_..."
        />
        <Form.Text className="text-muted">
          Create the Product and Price in the Stripe dashboard first, then paste the IDs here.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3" controlId="plan-stripe-price">
        <Form.Label className="small text-muted">Stripe Price ID</Form.Label>
        <Form.Control
          value={form.stripe_price_id}
          onChange={(e) => setForm((f) => ({ ...f, stripe_price_id: e.target.value.trim() }))}
          placeholder="price_..."
        />
      </Form.Group>

      <FeaturesEditor
        features={form.features || []}
        setFeatures={(updater) =>
          setForm((f) => ({
            ...f,
            features: typeof updater === 'function' ? updater(f.features || []) : updater,
          }))
        }
      />
    </>
  )
}

function EditPlanModal({ plan, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: plan.name,
    description: plan.description || '',
    max_active_listings: plan.max_active_listings ?? '',
    monthly_price_lkr: plan.monthly_price_lkr,
    allows_booking: plan.allows_booking,
    allows_connect: plan.allows_connect,
    stripe_product_id: plan.stripe_product_id || '',
    stripe_price_id: plan.stripe_price_id || '',
    features: plan.features && plan.features.length ? plan.features : [],
    sort_order: plan.sort_order,
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const updated = await adminPlansApi.update(plan.id, toPayload(form))
      onSaved(updated)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show onHide={onClose} centered size="lg">
      <Form onSubmit={handleSave}>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            Edit plan — <code>{plan.code}</code>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorAlert error={error} />
          <PlanFormFields form={form} setForm={setForm} showCode={false} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="dark" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [form, setForm] = useState(emptyCreateForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const [editingPlan, setEditingPlan] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const load = () => {
    setLoading(true)
    adminPlansApi.list().then(setPlans).catch(setError).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const plan = await adminPlansApi.create(toPayload(form))
      setPlans((prev) => [...prev, plan].sort((a, b) => a.sort_order - b.sort_order))
      setForm(emptyCreateForm)
    } catch (err) {
      setCreateError(err)
    } finally {
      setCreating(false)
    }
  }

  const handleSaved = (updated) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)).sort((a, b) => a.sort_order - b.sort_order),
    )
    setEditingPlan(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await adminPlansApi.remove(deleteTarget.id)
      setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>

  return (
    <AdminLayout>
      <h1 className="h4 mb-4">Plans</h1>
      <p className="text-muted">
        Manage the subscription plans owners can choose from. Create the Product and Price for a
        plan in the Stripe dashboard first, then add it here with the matching IDs.
      </p>
      <ErrorAlert error={error} onClose={() => setError(null)} />
      <ErrorAlert error={deleteError} onClose={() => setDeleteError(null)} />

      <Table hover responsive className="bg-white align-middle">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Max listings</th>
            <th>Price (LKR)</th>
            <th>Capabilities</th>
            <th>Feature list</th>
            <th>Stripe product</th>
            <th>Stripe price</th>
            <th>Order</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.id}>
              <td><code>{p.code}</code></td>
              <td>{p.name}</td>
              <td>{p.max_active_listings ?? 'Unlimited'}</td>
              <td>{p.monthly_price_lkr ? Number(p.monthly_price_lkr).toLocaleString() : 'Free'}</td>
              <td>
                <div className="d-flex gap-1 flex-wrap">
                  {p.allows_booking && <Badge bg="info">Booking</Badge>}
                  {p.allows_connect && <Badge bg="success">Connect</Badge>}
                  {!p.allows_booking && !p.allows_connect && <span className="text-muted small">—</span>}
                </div>
              </td>
              <td
                className="small"
                title={(p.features || []).map((f) => `${f.included ? '✓' : '✗'} ${f.text}`).join('\n')}
              >
                {p.features && p.features.length ? (
                  <Badge bg="secondary">{p.features.length} feature{p.features.length === 1 ? '' : 's'}</Badge>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="small text-muted" style={{ maxWidth: 160, wordBreak: 'break-all' }}>
                {p.stripe_product_id || '—'}
              </td>
              <td className="small text-muted" style={{ maxWidth: 160, wordBreak: 'break-all' }}>
                {p.stripe_price_id || '—'}
              </td>
              <td>{p.sort_order}</td>
              <td>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-secondary" onClick={() => setEditingPlan(p)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={p.code === 'free'}
                    title={p.code === 'free' ? 'The Free plan cannot be deleted' : undefined}
                    onClick={() => setDeleteTarget(p)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Card className="mb-4">
        <Card.Header className="fw-semibold">Add plan</Card.Header>
        <Card.Body>
          <ErrorAlert error={createError} onClose={() => setCreateError(null)} />
          <Form onSubmit={handleCreate}>
            <PlanFormFields form={form} setForm={setForm} showCode />
            <Button type="submit" variant="dark" disabled={creating}>
              {creating ? 'Adding…' : 'Add plan'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete plan"
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      >
        Delete the <code>{deleteTarget?.code}</code> plan? This only works if no owners are
        currently subscribed to it — otherwise the deletion will be blocked.
      </ConfirmModal>
    </AdminLayout>
  )
}
