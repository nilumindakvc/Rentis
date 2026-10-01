import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AvailabilityCalendar from '../components/property/AvailabilityCalendar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import EmptyState from '../components/common/EmptyState'
import { propertiesApi, availabilityApi } from '../services/api'
import { ArrowLeft, Calendar, Trash2, Plus } from 'lucide-react'

function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function OwnerAvailabilityPage() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [range, setRange] = useState()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const load = () => {
    Promise.all([propertiesApi.getById(id), availabilityApi.list(id)])
      .then(([p, b]) => {
        setProperty(p)
        setBlocks(b)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleBlock = async () => {
    if (!range?.from || !range?.to) return
    setSaving(true)
    setError(null)
    try {
      await availabilityApi.create(id, {
        start_date: toDateString(range.from),
        end_date: toDateString(range.to),
        reason: reason || undefined,
      })
      setRange(undefined)
      setReason('')
      load()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (blockId) => {
    await availabilityApi.remove(id, blockId)
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
  }

  if (loading) return <LoadingSpinner label="Loading availability…" />

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
      <div>
        <Link
          to="/owner/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to dashboard</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Availability Management</h1>
        {property && <p className="text-xs text-slate-400 mt-0.5">{property.title}</p>}
      </div>

      <ErrorAlert error={error} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Picker Form */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Block New Dates
          </h2>

          <AvailabilityCalendar blocks={blocks} mode="range" selected={range} onSelect={setRange} />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Under maintenance, personal stay"
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          <button
            type="button"
            onClick={handleBlock}
            disabled={saving || !range?.from || !range?.to}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 disabled:opacity-40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{saving ? 'Blocking…' : 'Block these dates'}</span>
          </button>
        </div>

        {/* Blocked Periods List */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs">Blocked Periods ({blocks.length})</h2>

          {blocks.length === 0 ? (
            <EmptyState title="No blocked dates" message="This listing is open on every date." />
          ) : (
            <div className="divide-y divide-slate-800">
              {blocks.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">
                      {b.start_date} → {b.end_date}
                    </div>
                    {b.reason && <div className="text-xs text-slate-400 mt-0.5">{b.reason}</div>}
                  </div>
                  <button
                    onClick={() => handleRemove(b.id)}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Remove block"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
