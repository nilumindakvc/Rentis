import { useState } from 'react'
import AvailabilityCalendar from './AvailabilityCalendar'
import ErrorAlert from '../common/ErrorAlert'
import { bookingsApi } from '../../services/api'
import { Calendar, CheckCircle2, Send } from 'lucide-react'

function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function BookingRequestForm({ propertyId, blocks }) {
  const [range, setRange] = useState()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!range?.from || !range?.to) return
    setSubmitting(true)
    setError(null)
    try {
      const booking = await bookingsApi.create({
        property_id: propertyId,
        start_date: toDateString(range.from),
        end_date: toDateString(range.to),
        message: message || undefined,
      })
      setSent(booking)
      setRange(undefined)
      setMessage('')
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold mb-1">Booking request sent!</div>
          <div>Dates: {sent.start_date} → {sent.end_date}. You&apos;ll be notified once the owner responds.</div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert error={error} />
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Pick your dates</span>
        </label>
        <AvailabilityCalendar blocks={blocks} mode="range" selected={range} onSelect={setRange} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Message (optional)</label>
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Anything the owner should know?"
          className="w-full p-3 text-sm rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !range?.from || !range?.to}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <Send className="w-4 h-4" />
        <span>{submitting ? 'Requesting…' : 'Request to book'}</span>
      </button>
    </form>
  )
}
