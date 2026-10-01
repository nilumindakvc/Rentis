import { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import LoadingSpinner from "../common/LoadingSpinner";
import { reviewsApi } from "../../services/api";

const REVIEWABLE_RENTAL_TERMS = ["short_term", "medium_term"];

export default function PropertyReviews({ propertyId, rentalTerm }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!REVIEWABLE_RENTAL_TERMS.includes(rentalTerm)) {
      setLoading(false);
      return;
    }
    reviewsApi
      .listForProperty(propertyId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [propertyId, rentalTerm]);

  if (!REVIEWABLE_RENTAL_TERMS.includes(rentalTerm)) return null;
  if (loading) return <LoadingSpinner />;

  return (
    <section className="mt-4">
      <h3 className="h5 mb-3">Reviews</h3>
      {reviews.length === 0 ? (
        <p className="text-muted small">No reviews yet.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <Card.Body>
                <div className="d-flex justify-content-between gap-3">
                  <strong>{review.customer_name}</strong>
                  <span
                    className="property-review__stars"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                {review.comment && (
                  <p className="mb-0 mt-2">{review.comment}</p>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
