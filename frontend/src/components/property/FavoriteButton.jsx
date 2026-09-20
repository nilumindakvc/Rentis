import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { favoritesApi } from '../../services/api'

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
      className="btn btn-sm p-0 border-0 bg-transparent"
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
      title={favorited ? 'Remove from favorites' : 'Save to favorites'}
      style={{ fontSize: '1.1rem', lineHeight: 1 }}
    >
      {favorited ? '★' : '☆'}
    </button>
  )
}
