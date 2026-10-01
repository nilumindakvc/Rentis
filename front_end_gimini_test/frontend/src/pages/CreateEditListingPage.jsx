import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MapView from '../components/property/MapView'
import ErrorAlert from '../components/common/ErrorAlert'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { propertiesApi, taxonomyApi, uploadsApi } from '../services/api'
import { Plus, Trash2, Loader2, Sparkles, MapPin, Upload, DollarSign, ShieldAlert } from 'lucide-react'

const CONDITIONS = ['new', 'good', 'renovated', 'needs_work']
const FURNISHINGS = ['furnished', 'semi_furnished', 'unfurnished']
const RENTAL_TERMS = [
  { value: 'long_term', label: 'Long-term (years)' },
  { value: 'medium_term', label: 'Medium-term (months)' },
  { value: 'short_term', label: 'Short-term (days)' },
]

const emptyForm = {
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

export default function CreateEditListingPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [photos, setPhotos] = useState([{ url: '', uploading: false, error: null }])
  const [charges, setCharges] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    taxonomyApi.getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    propertiesApi
      .getById(id)
      .then((p) => {
        setForm({
          ...emptyForm,
          ...p,
          category_id: p.category_id ?? '',
          subtype_id: p.subtype_id ?? '',
          facilities: (p.facilities || []).join(', '),
        })
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

  const subtypes = useMemo(() => {
    const cat = categories.find((c) => String(c.id) === String(form.category_id))
    return cat?.subtypes || []
  }, [categories, form.category_id])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleMapClick = (latlng) => {
    set({ latitude: latlng.lat.toFixed(6), longitude: latlng.lng.toFixed(6) })
  }

  const patchPhoto = (index, patch) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }
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

  const updateCharge = (index, patch) => {
    setCharges((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
      <div>
        <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest block mb-1">
          PROPERTY MANAGER
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {isEdit ? 'Edit listing' : 'Create new listing'}
        </h1>
      </div>

      <ErrorAlert error={error} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Info */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-pink-400" />
            Basic Property Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category *</label>
              <select
                value={form.category_id}
                onChange={(e) => set({ category_id: e.target.value, subtype_id: '' })}
                required
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              >
                <option value="" className="bg-slate-900 text-white">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Property Type *</label>
              <select
                value={form.subtype_id}
                onChange={(e) => set({ subtype_id: e.target.value })}
                disabled={!form.category_id}
                required
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500 disabled:opacity-40"
              >
                <option value="" className="bg-slate-900 text-white">Select type…</option>
                {subtypes.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Bright 2-chair dental clinic space in Colombo 5"
              required
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Describe your space..."
              className="w-full p-3 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Address *</label>
            <input
              type="text"
              value={form.address_text}
              onChange={(e) => set({ address_text: e.target.value })}
              required
              placeholder="Street name, city, district"
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span>Location Map (Click to select pin)</span>
            </label>
            <div className="rounded-xl overflow-hidden border border-slate-800">
              <MapView
                height={260}
                onMapClick={handleMapClick}
                markers={
                  form.latitude && form.longitude
                    ? [{ id: 'new', lat: Number(form.latitude), lng: Number(form.longitude), title: form.title || 'Selected location' }]
                    : []
                }
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 font-mono">
              {form.latitude && form.longitude
                ? `Selected Coordinates: ${form.latitude}, ${form.longitude}`
                : 'No map pin placed yet.'}
            </div>
          </div>

          {/* Grid of specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Size</label>
              <input
                type="number"
                value={form.size_value}
                onChange={(e) => set({ size_value: e.target.value })}
                placeholder="1200"
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Unit</label>
              <select
                value={form.size_unit}
                onChange={(e) => set({ size_unit: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              >
                <option value="sqft" className="bg-slate-900 text-white">sqft</option>
                <option value="sqm" className="bg-slate-900 text-white">sqm</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => set({ condition: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Furnishing</label>
              <select
                value={form.furnishing}
                onChange={(e) => set({ furnishing: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              >
                {FURNISHINGS.map((f) => (
                  <option key={f} value={f} className="bg-slate-900 text-white">
                    {f.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Facilities (comma separated)</label>
            <input
              type="text"
              value={form.facilities}
              onChange={(e) => set({ facilities: e.target.value })}
              placeholder="AC, Backup power, WiFi, Elevator"
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Section 2: Photos */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-pink-400 uppercase tracking-wider">
            <Upload className="w-4 h-4 text-emerald-400" />
            Photos & Media
          </div>

          <div className="space-y-3">
            {photos.map((photo, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                {photo.url && (
                  <img
                    src={photo.url}
                    alt=""
                    className="w-16 h-12 object-cover rounded-lg shrink-0 border border-slate-700"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={photo.uploading}
                    onChange={(e) => handlePhotoFile(i, e.target.files?.[0])}
                    className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-pink-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                  {photo.uploading && (
                    <div className="flex items-center gap-1.5 text-xs text-pink-400 mt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading photo…</span>
                    </div>
                  )}
                  {photo.error && <div className="text-xs text-rose-400 mt-1">{photo.error}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  disabled={photos.length === 1}
                  className="p-2 text-slate-400 hover:text-rose-400 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPhoto}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add another photo</span>
            </button>
          </div>
        </div>

        {/* Section 3: Pricing & Rental Terms */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-emerald-400 uppercase tracking-wider">
            <DollarSign className="w-4 h-4 text-pink-400" />
            Rental & Pricing Terms
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Minimum Price *</label>
              <input
                type="number"
                value={form.min_price}
                onChange={(e) => set({ min_price: e.target.value })}
                required
                placeholder="50000"
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Currency</label>
              <input
                type="text"
                value={form.price_currency}
                onChange={(e) => set({ price_currency: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration Term</label>
              <select
                value={form.rental_term}
                onChange={(e) => set({ rental_term: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              >
                {RENTAL_TERMS.map((t) => (
                  <option key={t.value} value={t.value} className="bg-slate-900 text-white">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Security Deposit</label>
              <input
                type="number"
                value={form.security_deposit}
                onChange={(e) => set({ security_deposit: e.target.value })}
                placeholder="100000"
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Availability Status</label>
              <select
                value={form.availability_status}
                onChange={(e) => set({ availability_status: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              >
                <option value="available" className="bg-slate-900 text-white">Available</option>
                <option value="unavailable" className="bg-slate-900 text-white">Unavailable</option>
                <option value="under_maintenance" className="bg-slate-900 text-white">Under maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Additional Charges</label>
            <div className="space-y-2">
              {charges.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Cleaning fee"
                    value={c.label}
                    onChange={(e) => updateCharge(i, { label: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={c.amount}
                    onChange={(e) => updateCharge(i, { amount: e.target.value })}
                    className="w-32 px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeCharge(i)}
                    className="p-2 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCharge}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-slate-950 border border-slate-800"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add charge</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Rules */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-pink-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Rules & Permissions
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Permitted Usage</label>
            <textarea
              rows={2}
              value={form.permitted_usage}
              onChange={(e) => set({ permitted_usage: e.target.value })}
              placeholder="e.g. Commercial office or medical clinic only"
              className="w-full p-3 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Restrictions</label>
            <textarea
              rows={2}
              value={form.restrictions}
              onChange={(e) => set({ restrictions: e.target.value })}
              placeholder="e.g. No loud music after 10 PM, no pets"
              className="w-full p-3 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving || hasPendingUploads}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-400 hover:from-pink-600 hover:to-emerald-500 shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all"
          >
            <span>{saving ? 'Saving…' : hasPendingUploads ? 'Waiting for uploads…' : isEdit ? 'Save changes' : 'Publish listing'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
