import { AlertCircle } from 'lucide-react'

export default function ErrorAlert({ error, className = '' }) {
  if (!error) return null
  const message =
    error?.response?.data?.detail ||
    error?.message ||
    'Something went wrong. Please try again.'

  return (
    <div
      className={`flex items-center gap-3 p-4 text-sm rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 shadow-sm ${className}`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
      <div>{typeof message === 'string' ? message : 'Something went wrong. Please try again.'}</div>
    </div>
  )
}
