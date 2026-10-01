import { useEffect, useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import { reviewsApi } from "../../services/api";
import { Star, MessageSquareQuote } from "lucide-react";

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
    <section className="mt-8 pt-6 border-t border-slate-800">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareQuote className="w-5 h-5 text-pink-400" />
        <h3 className="text-xl font-bold text-white">Reviews ({reviews.length})</h3>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">No reviews yet for this listing.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="font-bold text-sm text-slate-100">{review.customer_name}</span>
                <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${review.rating} out of 5 stars`}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-slate-300 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
