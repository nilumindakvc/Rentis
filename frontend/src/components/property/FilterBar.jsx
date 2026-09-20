import { useEffect, useMemo, useState } from 'react'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import { taxonomyApi } from '../../services/api'

const RENTAL_TERMS = [
  { value: '', label: 'Any duration' },
  { value: 'long_term', label: 'Long-term (years)' },
  { value: 'medium_term', label: 'Medium-term (months)' },
  { value: 'short_term', label: 'Short-term (days)' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

export default function FilterBar({ filters, onChange, onSubmit }) {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    taxonomyApi.getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  const subtypes = useMemo(() => {
    const cat = categories.find((c) => String(c.id) === String(filters.category_id))
    return cat?.subtypes || []
  }, [categories, filters.category_id])

  const set = (patch) => onChange({ ...filters, ...patch })

  const handleCategoryChange = (e) => {
    set({ category_id: e.target.value, subtype_id: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.()
  }

  return (
    <Form onSubmit={handleSubmit} className="bg-white border rounded-3 p-3 mb-4 shadow-sm">
      <Row className="g-2 align-items-end">
        <Col md={3} sm={6}>
          <Form.Label className="small text-muted mb-1">Search</Form.Label>
          <Form.Control
            placeholder="Title or address…"
            value={filters.q || ''}
            onChange={(e) => set({ q: e.target.value })}
          />
        </Col>
        <Col md={2} sm={6}>
          <Form.Label className="small text-muted mb-1">Category</Form.Label>
          <Form.Select value={filters.category_id || ''} onChange={handleCategoryChange}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2} sm={6}>
          <Form.Label className="small text-muted mb-1">Type</Form.Label>
          <Form.Select
            value={filters.subtype_id || ''}
            onChange={(e) => set({ subtype_id: e.target.value })}
            disabled={!filters.category_id}
          >
            <option value="">All types</option>
            {subtypes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={1} sm={6}>
          <Form.Label className="small text-muted mb-1">Min price</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={filters.min_price || ''}
            onChange={(e) => set({ min_price: e.target.value })}
          />
        </Col>
        <Col md={1} sm={6}>
          <Form.Label className="small text-muted mb-1">Max price</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={filters.max_price || ''}
            onChange={(e) => set({ max_price: e.target.value })}
          />
        </Col>
        <Col md={2} sm={6}>
          <Form.Label className="small text-muted mb-1">Duration</Form.Label>
          <Form.Select
            value={filters.rental_term || ''}
            onChange={(e) => set({ rental_term: e.target.value })}
          >
            {RENTAL_TERMS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={1} sm={6}>
          <Form.Label className="small text-muted mb-1">Sort</Form.Label>
          <Form.Select value={filters.sort || 'newest'} onChange={(e) => set({ sort: e.target.value })}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>
      <div className="mt-3 d-flex gap-2">
        <Button type="submit" variant="primary" size="sm">
          Apply filters
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          onClick={() => onChange({ sort: 'newest' })}
        >
          Reset
        </Button>
      </div>
    </Form>
  )
}
