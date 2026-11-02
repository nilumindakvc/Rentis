import { useEffect, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import { settingsApi } from '../../services/api'

export default function SystemBanner() {
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    settingsApi.getBanner().then(setBanner).catch(() => {})
  }, [])

  if (!banner?.enabled || !banner.message) return null

  return (
    <Alert variant="warning" className="mb-0 text-center rounded-0">
      {banner.message}
    </Alert>
  )
}
