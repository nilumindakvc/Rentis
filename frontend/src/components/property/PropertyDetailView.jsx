import { useEffect, useState } from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Badge from 'react-bootstrap/Badge'
import Card from 'react-bootstrap/Card'
import PhotoGallery from './PhotoGallery'
import MapView from './MapView'
import FavoriteButton from './FavoriteButton'
import PropertySection from './PropertySection'
import AvailabilityCalendar from './AvailabilityCalendar'
import BookingRequestForm from './BookingRequestForm'
import { RENTAL_TERM_LABELS } from '../../constants/categoryIcons'
import { availabilityApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const CALENDAR_RENTAL_TERMS = ['medium_term', 'short_term']

export default function PropertyDetailView({ property, showFavorite = true, actions }) {
  const { user } = useAuth()
  const showCalendar = CALENDAR_RENTAL_TERMS.includes(property.rental_term)
  const canBook = showCalendar && user?.role === 'customer'
  const [blocks, setBlocks] = useState([])

  useEffect(() => {
    if (!showCalendar) return
    availabilityApi
      .list(property.id)
      .then(setBlocks)
      .catch(() => setBlocks([]))
  }, [property.id, showCalendar])

  return (
    <Row className="g-4">
      <Col lg={7}>
        <PhotoGallery photos={property.photos} />

        <div className="d-flex justify-content-between align-items-start mt-4 mb-1">
          <div>
            <Badge bg="light" text="dark" className="border mb-2">
              {property.category_name} · {property.subtype_name}
            </Badge>
            <h2 className="h4 mb-1">{property.title}</h2>
            <p className="text-muted mb-0">{property.address_text}</p>
          </div>
          {showFavorite && (
            <FavoriteButton propertyId={property.id} initialFavorited={property.is_favorited} />
          )}
        </div>

        {property.description && <p className="mt-3">{property.description}</p>}

        <PropertySection
          title="Property"
          rows={[
            ['Size', property.size_value ? `${property.size_value} ${property.size_unit || ''}` : null],
            ['Layout', property.layout_description],
            ['Facilities', (property.facilities || []).join(', ')],
            ['Condition', property.condition],
            ['Furnishing', property.furnishing],
            ['Capacity', property.capacity],
          ]}
        />

        <PropertySection
          title="Rental"
          rows={[
            ['Minimum price', `${property.price_currency} ${Number(property.min_price).toLocaleString()}`],
            [
              'Security deposit',
              property.security_deposit
                ? `${property.price_currency} ${Number(property.security_deposit).toLocaleString()}`
                : null,
            ],
            ['Rental duration', RENTAL_TERM_LABELS[property.rental_term] || property.rental_term],
            ['Renewal terms', property.renewal_terms],
            ['Availability', property.availability_status],
            [
              'Additional charges',
              (property.additional_charges || []).map((c) => `${c.label}: ${c.amount}`).join(', '),
            ],
          ]}
        />

        <PropertySection
          title="Rules"
          rows={[
            ['Permitted usage', property.permitted_usage],
            ['Restrictions', property.restrictions],
            ['Parking / access', property.parking_access],
          ]}
        />
      </Col>

      <Col lg={5}>
        <Card className="mb-3">
          <Card.Body>
            <h3 className="h6 mb-2">Location</h3>
            {property.latitude != null && property.longitude != null ? (
              <MapView
                markers={[{ id: property.id, lat: property.latitude, lng: property.longitude, title: property.title }]}
                center={[property.latitude, property.longitude]}
                zoom={14}
                height={280}
              />
            ) : (
              <p className="text-muted small mb-0">No map location provided.</p>
            )}
          </Card.Body>
        </Card>

        {showCalendar && (
          <Card className="mb-3">
            <Card.Body>
              <h3 className="h6 mb-2">Availability</h3>
              {canBook ? (
                <BookingRequestForm propertyId={property.id} blocks={blocks} />
              ) : (
                <AvailabilityCalendar blocks={blocks} />
              )}
            </Card.Body>
          </Card>
        )}

        {actions && (
          <Card>
            <Card.Body>
              <h3 className="h6 mb-1">Owner</h3>
              <p className="mb-3">{property.owner_name}</p>
              {actions}
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  )
}
