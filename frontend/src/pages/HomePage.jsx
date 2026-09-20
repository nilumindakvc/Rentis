import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import { taxonomyApi, propertiesApi } from '../services/api'
import RentalTermSection from '../components/home/RentalTermSection'
import { RENTAL_SECTIONS } from '../constants/rentalSections'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [sectionProperties, setSectionProperties] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    taxonomyApi.getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    Promise.all(
      RENTAL_SECTIONS.map((s) =>
        propertiesApi
          .search({ rental_term: s.key, page_size: 4, sort: 'newest' })
          .then((r) => r.items)
          .catch(() => [])
      )
    )
      .then((results) => {
        const next = {}
        RENTAL_SECTIONS.forEach((s, i) => {
          next[s.key] = results[i]
        })
        setSectionProperties(next)
      })
      .finally(() => setLoading(false))
  }, [])

  const subtypesFor = (slugs) => {
    const all = categories.flatMap((c) => c.subtypes.map((s) => ({ ...s, category_id: c.id })))
    return slugs.map((slug) => all.find((s) => s.slug === slug)).filter(Boolean)
  }

  return (
    <Container>
      <div className="text-center py-4 py-md-5">
        <h1 className="fw-bold mb-2" style={{ color: 'var(--rentis-accent)' }}>
          Rent almost any space.
        </h1>
        <p className="text-muted mb-4">
          Clinics, offices, warehouses, apartments, wedding halls and more — find the right
          rental for however long you need it.
        </p>
        <Button as={Link} to="/search" size="lg" variant="primary">
          Start searching
        </Button>
      </div>

      {RENTAL_SECTIONS.map((s) => (
        <RentalTermSection
          key={s.key}
          title={s.title}
          description={s.description}
          rentalTerm={s.key}
          subtypes={subtypesFor(s.subtypeSlugs)}
          properties={sectionProperties[s.key] || []}
          tinted={s.tinted}
          loading={loading}
        />
      ))}
    </Container>
  )
}
