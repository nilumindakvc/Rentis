import { Link } from 'react-router-dom'
import PropertyGrid from '../property/PropertyGrid'
import LoadingSpinner from '../common/LoadingSpinner'

export default function RentalTermSection({ title, description, rentalTerm, subtypes, properties, tinted, loading }) {
  return (
    <section className={`py-4 px-3 px-md-4 rounded-4 mb-5 ${tinted ? 'section-tinted' : ''}`}>
      <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-2">
        <div>
          <h2 className="h5 mb-1">{title}</h2>
          <p className="text-muted small mb-0">{description}</p>
        </div>
        <Link to={`/search?rental_term=${rentalTerm}`} className="small text-nowrap">
          See all →
        </Link>
      </div>

      {subtypes.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {subtypes.map((s) => (
            <Link
              key={s.id}
              to={`/search?rental_term=${rentalTerm}&category_id=${s.category_id}&subtype_id=${s.id}`}
              className="badge rounded-pill text-bg-light border text-decoration-none px-3 py-2 fw-normal"
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {loading ? <LoadingSpinner label="Loading…" /> : <PropertyGrid properties={properties} columns={4} />}
    </section>
  )
}
