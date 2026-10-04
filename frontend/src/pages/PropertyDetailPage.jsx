import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import PropertyDetailView from '../components/property/PropertyDetailView'
import VehicleDetailView from '../components/property/VehicleDetailView'
import GoodDetailView from '../components/property/GoodDetailView'
import ContactOwnerForm from '../components/property/ContactOwnerForm'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorAlert from '../components/common/ErrorAlert'
import { propertiesApi } from '../services/api'

function DetailView({ property }) {
  const slug = property.primary_category_name?.toLowerCase()
  const actions = <ContactOwnerForm propertyId={property.id} />
  if (slug === 'vehicle') return <VehicleDetailView property={property} actions={actions} />
  if (slug === 'good') return <GoodDetailView property={property} actions={actions} />
  return <PropertyDetailView property={property} actions={actions} />
}

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

  if (loading) return <LoadingSpinner label="Loading listing…" />
  if (error) return <Container><ErrorAlert error={error} /></Container>
  if (!property) return null

  return (
    <Container>
      <DetailView property={property} />
    </Container>
  )
}
