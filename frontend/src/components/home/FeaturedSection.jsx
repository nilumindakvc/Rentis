import { Link } from "react-router-dom";
import PropertyGrid from "../property/PropertyGrid";
import LoadingSpinner from "../common/LoadingSpinner";

export default function FeaturedSection({ properties, loading }) {
  if (!loading && properties.length === 0) {
    return null;
  }

  return (
    <section className="py-4 mb-5">
      <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-2">
        <div>
          <h2 className="h4 mb-1">Featured</h2>
          <p className="text-muted mb-0">Handpicked deals from across every category.</p>
        </div>
        <Link to="/search?featured=true" className="small text-nowrap">
          See all →
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading…" />
      ) : (
        <PropertyGrid properties={properties} columns={4} />
      )}
    </section>
  );
}
