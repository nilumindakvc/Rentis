import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
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
  if (error) return <Container><ErrorAlert error={error} /></Container>
  if (!property) return null

  return (
    <Container>
      <PropertyDetailView property={property} actions={<ContactOwnerForm propertyId={property.id} />} />
    </Container>
  )
}
