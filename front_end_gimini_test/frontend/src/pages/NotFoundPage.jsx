import { Link } from 'react-router-dom'
import { Home, Compass } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-2">404 - Page not found</h1>
      <p className="text-sm text-slate-400 max-w-sm mb-6">The page you are looking for does not exist or has been moved.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 transition-all"
      >
        <Home className="w-4 h-4" />
        <span>Back to home</span>
      </Link>
    </div>
  )
}
