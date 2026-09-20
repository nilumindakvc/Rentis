import { Link } from 'react-router-dom'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import { RENTAL_TERM_LABELS } from '../../constants/categoryIcons'
import FavoriteButton from './FavoriteButton'

const PLACEHOLDER = 'https://placehold.co/400x300?text=Rentis'

export default function PropertyCard({ property, onFavoriteChange }) {
  const photo = property.primary_photo_url || PLACEHOLDER

  return (
    <Card className="property-card shadow-sm">
      <Link to={`/properties/${property.id}`}>
        <Card.Img variant="top" src={photo} alt={property.title} />
      </Link>
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <Badge bg="light" text="dark" className="border">
            {property.category_name} · {property.subtype_name}
          </Badge>
          <FavoriteButton propertyId={property.id} onChange={onFavoriteChange} />
        </div>
        <Card.Title className="fs-6 mb-1">
          <Link to={`/properties/${property.id}`} className="text-decoration-none text-dark">
            {property.title}
          </Link>
        </Card.Title>
        <Card.Text className="text-muted small mb-2">{property.address_text}</Card.Text>
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <span className="fw-semibold">
            {property.price_currency} {Number(property.min_price).toLocaleString()}
          </span>
          <Badge bg="secondary" className="fw-normal">
            {RENTAL_TERM_LABELS[property.rental_term] || property.rental_term}
          </Badge>
        </div>
      </Card.Body>
    </Card>
  )
}
