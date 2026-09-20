import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import PropertyCard from './PropertyCard'
import EmptyState from '../common/EmptyState'

export default function PropertyGrid({ properties, columns = 3 }) {
  if (!properties || properties.length === 0) {
    return <EmptyState title="No properties found" message="Try widening your filters." />
  }

  return (
    <Row xs={1} sm={2} md={columns} className="g-3">
      {properties.map((p) => (
        <Col key={p.id}>
          <PropertyCard property={p} />
        </Col>
      ))}
    </Row>
  )
}
