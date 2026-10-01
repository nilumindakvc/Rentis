import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PropertyDetailView from '../components/property/PropertyDetailView'
import ContactOwnerForm from '../components/property/ContactOwnerForm'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import { propertiesApi } from '../services/api'

export default function PropertyDetailPage() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    propertiesApi
      .getById(id)
      .then(setProperty)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner label="Loading property…" />
  if (error) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><ErrorAlert error={error} /></div>
  if (!property) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <PropertyDetailView property={property} actions={<ContactOwnerForm propertyId={property.id} />} />
    </div>
  )
}
