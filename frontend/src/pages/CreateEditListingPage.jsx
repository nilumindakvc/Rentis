import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Spinner from 'react-bootstrap/Spinner'
import MapView from '../components/property/MapView'
import ErrorAlert from '../components/common/ErrorAlert'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { propertiesApi, taxonomyApi, uploadsApi } from '../services/api'

const CONDITIONS = ['new', 'good', 'renovated', 'needs_work']
const FURNISHINGS = ['furnished', 'semi_furnished', 'unfurnished']
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid']
const TRANSMISSIONS = ['manual', 'automatic']
const RENTAL_TERMS = [
  { value: 'long_term', label: 'Long-term (years)' },
  { value: 'medium_term', label: 'Medium-term (months)' },
  { value: 'short_term', label: 'Short-term (days)' },
]

const emptyForm = {
  primary_category_id: '',
  category_id: '',
  subtype_id: '',
  title: '',
  description: '',
  address_text: '',
  latitude: '',
  longitude: '',
  size_value: '',
  size_unit: 'sqft',
  layout_description: '',
  facilities: '',
  condition: 'good',
  furnishing: 'unfurnished',
  capacity: '',
  min_price: '',
  price_currency: 'LKR',
  security_deposit: '',
  rental_term: 'long_term',
  renewal_terms: '',
  availability_status: 'available',
  permitted_usage: '',
  restrictions: '',
  parking_access: '',
  status: 'published',
}

const emptyVehicle = {
  make: '', model: '', year: '', color: '',
  fuel_type: '', transmission: '',
  mileage_km: '', seats: '', engine_cc: '',
  has_ac: false, has_gps: false, driver_included: false,
}

const emptyGood = {
  brand: '', model_number: '',
  quantity_available: 1, returnable: true, condition_notes: '',
}

export default function CreateEditListingPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [primaryCategories, setPrimaryCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [vehicleDetails, setVehicleDetails] = useState(emptyVehicle)
  const [goodDetails, setGoodDetails] = useState(emptyGood)
  const [photos, setPhotos] = useState([{ url: '', uploading: false, error: null }])
  const [charges, setCharges] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    taxonomyApi.getPrimaryCategories()
      .then(setPrimaryCategories)
      .catch(() => setPrimaryCategories([]))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    propertiesApi
      .getById(id)
      .then((p) => {
        setForm({
          ...emptyForm,
          ...p,
          primary_category_id: p.primary_category_id ?? '',
          category_id: p.category_id ?? '',
          subtype_id: p.subtype_id ?? '',
          facilities: (p.facilities || []).join(', '),
        })
        if (p.vehicle_details) setVehicleDetails({ ...emptyVehicle, ...p.vehicle_details })
        if (p.good_details) setGoodDetails({ ...emptyGood, ...p.good_details })
        setPhotos(
          p.photos?.length
            ? p.photos.map((ph) => ({ url: ph.url, uploading: false, error: null }))
            : [{ url: '', uploading: false, error: null }]
        )
        setCharges(p.additional_charges || [])
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [id, isEdit])

  // Secondary categories for the selected primary
  const secondaryCategories = useMemo(() => {
    const primary = primaryCategories.find(
      (p) => String(p.id) === String(form.primary_category_id),
    )
    return primary?.secondary_categories || []
  }, [primaryCategories, form.primary_category_id])

  // Subtypes for the selected secondary category
  const subtypes = useMemo(() => {
    const cat = secondaryCategories.find((c) => String(c.id) === String(form.category_id))
    return cat?.subtypes || []
  }, [secondaryCategories, form.category_id])

  // Derived primary slug for conditional sections
  const primarySlug = useMemo(() => {
    const p = primaryCategories.find((p) => String(p.id) === String(form.primary_category_id))
    return p?.slug || ''
  }, [primaryCategories, form.primary_category_id])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setVd = (patch) => setVehicleDetails((v) => ({ ...v, ...patch }))
  const setGd = (patch) => setGoodDetails((g) => ({ ...g, ...patch }))

  const handlePrimaryChange = (e) => {
    set({ primary_category_id: e.target.value, category_id: '', subtype_id: '' })
  }

  const handleMapClick = (latlng) => {
    set({ latitude: latlng.lat.toFixed(6), longitude: latlng.lng.toFixed(6) })
  }

  const patchPhoto = (index, patch) =>
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  const addPhoto = () => setPhotos((prev) => [...prev, { url: '', uploading: false, error: null }])
  const removePhoto = (index) => setPhotos((prev) => prev.filter((_, i) => i !== index))

  const handlePhotoFile = async (index, file) => {
    if (!file) return
    patchPhoto(index, { uploading: true, error: null })
    try {
      const { url } = await uploadsApi.uploadImage(file)
      patchPhoto(index, { url, uploading: false, error: null })
    } catch {
      patchPhoto(index, { uploading: false, error: 'Upload failed — try again' })
    }
  }

  const updateCharge = (index, patch) =>
    setCharges((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  const addCharge = () => setCharges((prev) => [...prev, { label: '', amount: '' }])
  const removeCharge = (index) => setCharges((prev) => prev.filter((_, i) => i !== index))

  const hasPendingUploads = photos.some((p) => p.uploading)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (hasPendingUploads) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        primary_category_id: Number(form.primary_category_id),
        category_id: Number(form.category_id),
        subtype_id: Number(form.subtype_id),
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        size_value: form.size_value === '' ? null : Number(form.size_value),
        capacity: form.capacity === '' ? null : Number(form.capacity),
        min_price: Number(form.min_price),
        security_deposit: form.security_deposit === '' ? null : Number(form.security_deposit),
        facilities: form.facilities
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
        additional_charges: charges.filter((c) => c.label && c.amount !== ''),
        photos: photos
          .filter((p) => p.url)
          .map((p, sort_order) => ({ url: p.url, sort_order })),
        vehicle_details: primarySlug === 'vehicle'
          ? {
              ...vehicleDetails,
              year: vehicleDetails.year === '' ? null : Number(vehicleDetails.year),
              mileage_km: vehicleDetails.mileage_km === '' ? null : Number(vehicleDetails.mileage_km),
              seats: vehicleDetails.seats === '' ? null : Number(vehicleDetails.seats),
              engine_cc: vehicleDetails.engine_cc === '' ? null : Number(vehicleDetails.engine_cc),
              fuel_type: vehicleDetails.fuel_type || null,
              transmission: vehicleDetails.transmission || null,
            }
          : null,
        good_details: primarySlug === 'good'
          ? {
              ...goodDetails,
              quantity_available: Number(goodDetails.quantity_available) || 1,
            }
          : null,
      }
      if (isEdit) {
        await propertiesApi.update(id, payload)
        navigate(`/properties/${id}`)
      } else {
        const created = await propertiesApi.create(payload)
        navigate(`/properties/${created.id}`)
      }
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading listing…" />

  return (
    <Container style={{ maxWidth: 860 }}>
      <h1 className="h4 mb-4">{isEdit ? 'Edit listing' : 'New listing'}</h1>
      <ErrorAlert error={error} />
      <Form onSubmit={handleSubmit}>

        {/* ── Core details ───────────────────────────────────────────── */}
        <Card className="mb-3">
          <Card.Header className="fw-semibold">Listing details</Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={form.primary_category_id}
                  onChange={handlePrimaryChange}
                  required
                >
                  <option value="">Select type…</option>
                  {primaryCategories.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={form.category_id}
                  onChange={(e) => set({ category_id: e.target.value, subtype_id: '' })}
                  disabled={!form.primary_category_id}
                  required
                >
                  <option value="">Select category…</option>
                  {secondaryCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Sub-type</Form.Label>
                <Form.Select
                  value={form.subtype_id}
                  onChange={(e) => set({ subtype_id: e.target.value })}
                  disabled={!form.category_id}
                  required
                >
                  <option value="">Select sub-type…</option>
                  {subtypes.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={12}>
                <Form.Label>Title</Form.Label>
                <Form.Control
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="e.g. Bright 2-bedroom apartment in Colombo 5"
                  required
                />
              </Col>
              <Col md={12}>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </Col>
              <Col md={12}>
                <Form.Label>Address</Form.Label>
                <Form.Control
                  value={form.address_text}
                  onChange={(e) => set({ address_text: e.target.value })}
                  required
                />
              </Col>
              <Col md={12}>
                <Form.Label className="small text-muted">
                  Click the map to set the exact location
                </Form.Label>
                <MapView
                  height={280}
                  onMapClick={handleMapClick}
                  markers={
                    form.latitude && form.longitude
                      ? [{ id: 'new', lat: Number(form.latitude), lng: Number(form.longitude), title: form.title || 'Selected location' }]
                      : []
                  }
                />
                <div className="small text-muted mt-1">
                  {form.latitude && form.longitude
                    ? `Selected: ${form.latitude}, ${form.longitude}`
                    : 'No location selected yet'}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* ── Place-specific specs ────────────────────────────────────── */}
        {primarySlug === 'place' && (
          <Card className="mb-3">
            <Card.Header className="fw-semibold">Place details</Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label>Size</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.size_value}
                    onChange={(e) => set({ size_value: e.target.value })}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label>Unit</Form.Label>
                  <Form.Select value={form.size_unit} onChange={(e) => set({ size_unit: e.target.value })}>
                    <option value="sqft">sqft</option>
                    <option value="sqm">sqm</option>
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label>Layout</Form.Label>
                  <Form.Control
                    value={form.layout_description}
                    onChange={(e) => set({ layout_description: e.target.value })}
                    placeholder="e.g. Open plan, 2 rooms + reception"
                  />
                </Col>
                <Col md={12}>
                  <Form.Label>Facilities (comma separated)</Form.Label>
                  <Form.Control
                    value={form.facilities}
                    onChange={(e) => set({ facilities: e.target.value })}
                    placeholder="AC, Backup power, WiFi, Elevator"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Condition</Form.Label>
                  <Form.Select value={form.condition} onChange={(e) => set({ condition: e.target.value })}>
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label>Furnishing</Form.Label>
                  <Form.Select value={form.furnishing} onChange={(e) => set({ furnishing: e.target.value })}>
                    {FURNISHINGS.map((f) => (
                      <option key={f} value={f}>{f.replace('_', ' ')}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label>Capacity</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.capacity}
                    onChange={(e) => set({ capacity: e.target.value })}
                    placeholder="Seats / occupants / units"
                  />
                </Col>
                <Col md={12}>
                  <Form.Label>Parking / access</Form.Label>
                  <Form.Control
                    value={form.parking_access}
                    onChange={(e) => set({ parking_access: e.target.value })}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* ── Vehicle-specific specs ──────────────────────────────────── */}
        {primarySlug === 'vehicle' && (
          <Card className="mb-3">
            <Card.Header className="fw-semibold">Vehicle details</Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label>Make <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={vehicleDetails.make}
                    onChange={(e) => setVd({ make: e.target.value })}
                    placeholder="e.g. Toyota"
                    required
                  />
                </Col>
                <Col md={6}>
                  <Form.Label>Model <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={vehicleDetails.model}
                    onChange={(e) => setVd({ model: e.target.value })}
                    placeholder="e.g. Prius"
                    required
                  />
                </Col>
                <Col md={3}>
                  <Form.Label>Year</Form.Label>
                  <Form.Control
                    type="number"
                    value={vehicleDetails.year}
                    onChange={(e) => setVd({ year: e.target.value })}
                    placeholder="2020"
                  />
                </Col>
                <Col md={3}>
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    value={vehicleDetails.color}
                    onChange={(e) => setVd({ color: e.target.value })}
                    placeholder="Silver"
                  />
                </Col>
                <Col md={3}>
                  <Form.Label>Fuel type</Form.Label>
                  <Form.Select value={vehicleDetails.fuel_type} onChange={(e) => setVd({ fuel_type: e.target.value })}>
                    <option value="">Select…</option>
                    {FUEL_TYPES.map((f) => (
                      <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label>Transmission</Form.Label>
                  <Form.Select value={vehicleDetails.transmission} onChange={(e) => setVd({ transmission: e.target.value })}>
                    <option value="">Select…</option>
                    {TRANSMISSIONS.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label>Mileage (km)</Form.Label>
                  <Form.Control
                    type="number"
                    value={vehicleDetails.mileage_km}
                    onChange={(e) => setVd({ mileage_km: e.target.value })}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Seats</Form.Label>
                  <Form.Control
                    type="number"
                    value={vehicleDetails.seats}
                    onChange={(e) => setVd({ seats: e.target.value })}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Engine (cc)</Form.Label>
                  <Form.Control
                    type="number"
                    value={vehicleDetails.engine_cc}
                    onChange={(e) => setVd({ engine_cc: e.target.value })}
                  />
                </Col>
                <Col md={12} className="d-flex gap-4">
                  <Form.Check
                    type="checkbox"
                    label="Air conditioning"
                    checked={vehicleDetails.has_ac}
                    onChange={(e) => setVd({ has_ac: e.target.checked })}
                  />
                  <Form.Check
                    type="checkbox"
                    label="GPS"
                    checked={vehicleDetails.has_gps}
                    onChange={(e) => setVd({ has_gps: e.target.checked })}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Driver included"
                    checked={vehicleDetails.driver_included}
                    onChange={(e) => setVd({ driver_included: e.target.checked })}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* ── Good-specific specs ─────────────────────────────────────── */}
        {primarySlug === 'good' && (
          <Card className="mb-3">
            <Card.Header className="fw-semibold">Item details</Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label>Brand</Form.Label>
                  <Form.Control
                    value={goodDetails.brand}
                    onChange={(e) => setGd({ brand: e.target.value })}
                    placeholder="e.g. Sony"
                  />
                </Col>
                <Col md={6}>
                  <Form.Label>Model / Part number</Form.Label>
                  <Form.Control
                    value={goodDetails.model_number}
                    onChange={(e) => setGd({ model_number: e.target.value })}
                    placeholder="e.g. A7 III"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Quantity available</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    value={goodDetails.quantity_available}
                    onChange={(e) => setGd({ quantity_available: e.target.value })}
                  />
                </Col>
                <Col md={4} className="d-flex align-items-end pb-2">
                  <Form.Check
                    type="checkbox"
                    label="Returnable item"
                    checked={goodDetails.returnable}
                    onChange={(e) => setGd({ returnable: e.target.checked })}
                  />
                </Col>
                <Col md={12}>
                  <Form.Label>Condition notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={goodDetails.condition_notes}
                    onChange={(e) => setGd({ condition_notes: e.target.value })}
                    placeholder="Describe any wear, scratches or accessories included"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* ── Photos ─────────────────────────────────────────────────── */}
        <Card className="mb-3">
          <Card.Header className="fw-semibold">Photos</Card.Header>
          <Card.Body>
            {photos.map((photo, i) => (
              <div key={i} className="d-flex align-items-start gap-2 mb-3">
                {photo.url && (
                  <img
                    src={photo.url}
                    alt=""
                    style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 4 }}
                  />
                )}
                <div className="flex-grow-1">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    disabled={photo.uploading}
                    onChange={(e) => handlePhotoFile(i, e.target.files?.[0])}
                  />
                  {photo.uploading && (
                    <div className="small text-muted mt-1">
                      <Spinner animation="border" size="sm" className="me-1" />
                      Uploading…
                    </div>
                  )}
                  {photo.error && <div className="small text-danger mt-1">{photo.error}</div>}
                </div>
                <Button variant="outline-danger" size="sm" onClick={() => removePhoto(i)} disabled={photos.length === 1}>
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="outline-secondary" size="sm" onClick={addPhoto}>
              + Add another photo
            </Button>
          </Card.Body>
        </Card>

        {/* ── Rental terms ───────────────────────────────────────────── */}
        <Card className="mb-3">
          <Card.Header className="fw-semibold">Rental</Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>Minimum price</Form.Label>
                <Form.Control
                  type="number"
                  value={form.min_price}
                  onChange={(e) => set({ min_price: e.target.value })}
                  required
                />
              </Col>
              <Col md={2}>
                <Form.Label>Currency</Form.Label>
                <Form.Control value={form.price_currency} onChange={(e) => set({ price_currency: e.target.value })} />
              </Col>
              <Col md={3}>
                <Form.Label>Security deposit</Form.Label>
                <Form.Control
                  type="number"
                  value={form.security_deposit}
                  onChange={(e) => set({ security_deposit: e.target.value })}
                />
              </Col>
              <Col md={3}>
                <Form.Label>Rental duration</Form.Label>
                <Form.Select value={form.rental_term} onChange={(e) => set({ rental_term: e.target.value })}>
                  {RENTAL_TERMS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Renewal terms</Form.Label>
                <Form.Control
                  value={form.renewal_terms}
                  onChange={(e) => set({ renewal_terms: e.target.value })}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Availability</Form.Label>
                <Form.Select value={form.availability_status} onChange={(e) => set({ availability_status: e.target.value })}>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="under_maintenance">Under maintenance</option>
                </Form.Select>
              </Col>
              <Col md={12}>
                <Form.Label>Additional charges</Form.Label>
                {charges.map((c, i) => (
                  <div key={i} className="d-flex gap-2 mb-2">
                    <Form.Control
                      placeholder="Label, e.g. Cleaning fee"
                      value={c.label}
                      onChange={(e) => updateCharge(i, { label: e.target.value })}
                    />
                    <Form.Control
                      placeholder="Amount"
                      type="number"
                      value={c.amount}
                      onChange={(e) => updateCharge(i, { amount: e.target.value })}
                      style={{ maxWidth: 160 }}
                    />
                    <Button variant="outline-danger" size="sm" onClick={() => removeCharge(i)}>Remove</Button>
                  </div>
                ))}
                <Button variant="outline-secondary" size="sm" onClick={addCharge}>+ Add charge</Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* ── Rules ──────────────────────────────────────────────────── */}
        <Card className="mb-4">
          <Card.Header className="fw-semibold">Rules</Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Permitted usage</Form.Label>
                <Form.Control
                  as="textarea" rows={2}
                  value={form.permitted_usage}
                  onChange={(e) => set({ permitted_usage: e.target.value })}
                />
              </Col>
              <Col md={12}>
                <Form.Label>Restrictions</Form.Label>
                <Form.Control
                  as="textarea" rows={2}
                  value={form.restrictions}
                  onChange={(e) => set({ restrictions: e.target.value })}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex gap-2 mb-5">
          <Button type="submit" variant="primary" disabled={saving || hasPendingUploads}>
            {saving ? 'Saving…' : hasPendingUploads ? 'Waiting for uploads…' : isEdit ? 'Save changes' : 'Publish listing'}
          </Button>
        </div>
      </Form>
    </Container>
  )
}
