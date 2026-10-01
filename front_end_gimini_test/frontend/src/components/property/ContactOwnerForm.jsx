import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { conversationsApi } from '../../services/api'
import ErrorAlert from '../common/ErrorAlert'
import { Send, LogIn } from 'lucide-react'

export default function ContactOwnerForm({ propertyId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!user) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 flex items-center justify-between">
        <span>Log in as a customer to message the owner.</span>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pink-400 bg-pink-500/10 border border-pink-500/30 rounded-lg hover:bg-pink-500 hover:text-white transition-all"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Log in</span>
        </Link>
      </div>
    )
  }

  if (user.role !== 'customer') {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const conversation = await conversationsApi.start({ property_id: propertyId, message })
      navigate(`/messages/${conversation.id}`)
    } catch (err) {
      setError(err)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <ErrorAlert error={error} />
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Message to owner</label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I'm interested in this property — is it still available?"
          required
          className="w-full p-3 text-sm rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 disabled:opacity-50 transition-all"
      >
        <Send className="w-4 h-4" />
        <span>{submitting ? 'Sending…' : 'Message owner'}</span>
      </button>
    </form>
  )
}
