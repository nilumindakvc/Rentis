import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { favoritesApi } from '../../services/api'
import { Heart } from 'lucide-react'

export default function FavoriteButton({ propertyId, initialFavorited, onChange }) {
  const { user } = useAuth()
  const [favorited, setFavorited] = useState(Boolean(initialFavorited))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setFavorited(Boolean(initialFavorited))
  }, [initialFavorited])

  if (!user || user.role !== 'customer') return null

  const toggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      if (favorited) {
        await favoritesApi.remove(propertyId)
        setFavorited(false)
        onChange?.(false)
      } else {
        await favoritesApi.add(propertyId)
        setFavorited(true)
        onChange?.(true)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
      title={favorited ? 'Remove from favorites' : 'Save to favorites'}
      className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
        favorited
          ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-sm shadow-pink-500/30 scale-105'
          : 'bg-slate-950/60 text-slate-400 border border-slate-700/60 hover:text-pink-400 hover:border-pink-500/30'
      }`}
    >
      <Heart className={`w-4 h-4 transition-transform duration-200 ${favorited ? 'fill-pink-500 text-pink-400' : ''}`} />
    </button>
  )
}
