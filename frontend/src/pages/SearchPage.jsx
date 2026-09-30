import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import FilterBar from "../components/property/FilterBar";
import PropertyGrid from "../components/property/PropertyGrid";
import MapView from "../components/property/MapView";
import Pagination from "../components/common/Pagination";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorAlert from "../components/common/ErrorAlert";
import { propertiesApi } from "../services/api";

const PAGE_SIZE = 9;

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category_id: searchParams.get("category_id") || "",
    subtype_id: searchParams.get("subtype_id") || "",
    q: "",
    min_price: "",
    max_price: "",
    rental_term: searchParams.get("rental_term") || "",
    sort: "newest",
  });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({
    items: [],
    total: 0,
    page: 1,
    page_size: PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (currentFilters, currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...currentFilters,
        page: currentPage,
        page_size: PAGE_SIZE,
      };
      Object.keys(params).forEach((k) => {
        if (params[k] === "" || params[k] === undefined) delete params[k];
      });
      const data = await propertiesApi.search(params);
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleApply = () => {
    setPage(1);
    load(filters, 1);
  };

  const pageCount = Math.max(1, Math.ceil((result.total || 0) / PAGE_SIZE));
  const markers = (result.items || [])
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      lat: p.latitude,
      lng: p.longitude,
      title: p.title,
      property: p,
    }));

  return (
    <Container fluid className="px-3 px-md-4">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onSubmit={handleApply}
      />

      {error && <ErrorAlert error={error} />}

      <Row className="g-4">
        <Col lg={8}>
          {loading ? (
            <LoadingSpinner label="Searching listings…" />
          ) : (
            <>
              <p className="text-muted small">
                {result.total} propert{result.total === 1 ? "y" : "ies"} found
              </p>
              <PropertyGrid properties={result.items} columns={3} />
              <Pagination
                page={page}
                pageCount={pageCount}
                onChange={setPage}
              />
            </>
          )}
        </Col>
        <Col lg={4}>
          <div className="sticky-top" style={{ top: 90 }}>
            <p className="text-muted small mb-3">Location</p>
            <MapView
              markers={markers}
              height={520}
              renderPopup={(m) => (
                <div>
                  <div className="fw-semibold">{m.title}</div>
                  <Link to={`/properties/${m.id}`}>View details</Link>
                </div>
              )}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
