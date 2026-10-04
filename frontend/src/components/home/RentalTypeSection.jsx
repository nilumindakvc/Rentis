import { Link } from "react-router-dom";
import PropertyGrid from "../property/PropertyGrid";
import LoadingSpinner from "../common/LoadingSpinner";
import RentalTypeCarousel from "./RentalTypeCarousel";

export default function RentalTypeSection({
  title,
  description,
  rentalTerm,
  searchHref,
  chips,
  carouselSlides,
  properties,
  loading,
}) {
  const seeAllHref = searchHref ?? `/search?rental_term=${rentalTerm}`;

  return (
    <section className="rental-type-section py-4 mb-5">
      <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-2">
        <div>
          <h2 className="h4 mb-1">{title}</h2>
          <p className="text-muted mb-0">{description}</p>
        </div>
        <Link to={seeAllHref} className="small text-nowrap">
          See all →
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading…" />
      ) : (
        <>
          <RentalTypeCarousel slides={carouselSlides} />

          {chips && chips.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mb-3 mt-3">
              {chips.map((chip) => (
                <Link
                  key={chip.id}
                  to={chip.href}
                  className="badge rounded-pill text-bg-light border text-decoration-none px-3 py-2 fw-normal"
                >
                  {chip.name}
                </Link>
              ))}
            </div>
          )}

          <PropertyGrid properties={properties} columns={4} />
        </>
      )}
    </section>
  );
}
