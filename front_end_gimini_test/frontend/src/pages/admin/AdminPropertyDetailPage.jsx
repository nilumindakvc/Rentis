import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import PropertyDetailView from '../../components/property/PropertyDetailView'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import { adminPropertiesApi } from '../../services/adminApi'
import { ArrowLeft, Trash2 } from 'lucide-react'

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
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin/properties')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to listings</span>
        </button>

        {loading && <LoadingSpinner label="Loading listing…" />}
        <ErrorAlert error={error} />

        {!loading && property && (
          <PropertyDetailView
            property={property}
            showFavorite={false}
            actions={
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Change Status</label>
                  <select
                    value={property.status}
                    onChange={handleStatusChange}
                    disabled={savingStatus}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="published" className="bg-slate-900 text-white">Published</option>
                    <option value="draft" className="bg-slate-900 text-white">Draft</option>
                    <option value="archived" className="bg-slate-900 text-white">Archived</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-300 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleting ? 'Deleting…' : 'Delete listing'}</span>
                </button>
              </div>
            }
          />
        )}
      </div>
    </AdminLayout>
  )
}
