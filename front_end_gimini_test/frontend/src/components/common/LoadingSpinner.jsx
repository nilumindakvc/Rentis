import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
      <span className="text-sm font-medium text-slate-300">{label}</span>
    </div>
  )
}
