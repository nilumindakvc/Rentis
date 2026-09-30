import { useEffect, useMemo, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { taxonomyApi } from "../../services/api";

const RENTAL_TERMS = [
  { value: "", label: "Any duration" },
  { value: "long_term", label: "Long-term (years)" },
  { value: "medium_term", label: "Medium-term (months)" },
  { value: "short_term", label: "Short-term (days)" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export default function FilterBar({ filters, onChange, onSubmit }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    taxonomyApi
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const subtypes = useMemo(() => {
    const cat = categories.find(
      (c) => String(c.id) === String(filters.category_id),
    );
    return cat?.subtypes || [];
  }, [categories, filters.category_id]);

  const set = (patch) => onChange({ ...filters, ...patch });

  const handleCategoryChange = (e) => {
    set({ category_id: e.target.value, subtype_id: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <Form onSubmit={handleSubmit} className="search-filter mb-4">
      <div className="search-filter__header">
        <div>
          <p className="search-filter__eyebrow">PROPERTY SEARCH</p>
          <h1>Find your next space</h1>
          <p className="search-filter__intro">
            Narrow down listings to find the right fit.
          </p>
        </div>
      </div>

      <div className="search-filter__fields">
        <Form.Group
          className="search-filter__field search-filter__field--query"
          controlId="filter-search-query"
        >
          <Form.Label>Search</Form.Label>
          <Form.Control
            placeholder="Title or address…"
            value={filters.q || ""}
            onChange={(e) => set({ q: e.target.value })}
          />
        </Form.Group>
        <Form.Group
          className="search-filter__field"
          controlId="filter-search-category"
        >
          <Form.Label>Category</Form.Label>
          <Form.Select
            value={filters.category_id || ""}
            onChange={handleCategoryChange}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group
          className="search-filter__field"
          controlId="filter-search-type"
        >
          <Form.Label>Type</Form.Label>
          <Form.Select
            value={filters.subtype_id || ""}
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
        </Form.Group>
        <div className="search-filter__field search-filter__price-field">
          <span className="search-filter__label">Price range</span>
          <div className="search-filter__price-inputs">
            <Form.Control
              type="number"
              min={0}
              aria-label="Minimum price"
              placeholder="Min"
              value={filters.min_price || ""}
              onChange={(e) => set({ min_price: e.target.value })}
            />
            <span aria-hidden="true">to</span>
            <Form.Control
              type="number"
              min={0}
              aria-label="Maximum price"
              placeholder="Max"
              value={filters.max_price || ""}
              onChange={(e) => set({ max_price: e.target.value })}
            />
          </div>
        </div>
        <Form.Group
          className="search-filter__field"
          controlId="filter-search-duration"
        >
          <Form.Label>Duration</Form.Label>
          <Form.Select
            value={filters.rental_term || ""}
            onChange={(e) => set({ rental_term: e.target.value })}
          >
            {RENTAL_TERMS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group
          className="search-filter__field"
          controlId="filter-search-sort"
        >
          <Form.Label>Sort by</Form.Label>
          <Form.Select
            value={filters.sort || "newest"}
            onChange={(e) => set({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </div>

      <div className="search-filter__actions">
        <span>Adjust any combination, then apply your filters.</span>
        <div>
          <Button type="submit" variant="primary" size="sm">
            Apply filters
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => onChange({ sort: "newest" })}
          >
            Clear filters
          </Button>
        </div>
      </div>
    </Form>
  );
}
