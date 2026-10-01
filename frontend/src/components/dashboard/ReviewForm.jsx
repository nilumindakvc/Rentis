import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { reviewsApi } from "../../services/api";

export default function ReviewForm({ booking, review, onSaved }) {
  const [rating, setRating] = useState(review?.rating || 5);
  const [comment, setComment] = useState(review?.comment || "");
  const [showName, setShowName] = useState(review?.show_name || false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!review);

  useEffect(() => {
    setRating(review?.rating || 5);
    setComment(review?.comment || "");
    setShowName(review?.show_name || false);
  }, [review]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        rating: Number(rating),
        comment: comment.trim() || null,
        show_name: showName,
      };
      const savedReview = review
        ? await reviewsApi.update(review.id, payload)
        : await reviewsApi.create({ booking_id: booking.id, ...payload });
      onSaved(savedReview);
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSaving(false);
    }
  };

  if (review && !isEditing) {
    return (
      <div className="review-form__submitted mt-3 border-top pt-3">
        <div className="d-flex justify-content-between align-items-center">
          <span className="small fw-semibold">Your review</span>
          <button
            type="button"
            className="review-form__edit"
            aria-label="Edit review"
            title="Edit review"
            onClick={() => setIsEditing(true)}
          >
            &#9998;
          </button>
        </div>
        <div className="review-rating mt-2" aria-label={`${review.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <span key={value} className={`review-rating__star${value <= review.rating ? " is-selected" : ""}`}>
              {value <= review.rating ? "★" : "☆"}
            </span>
          ))}
        </div>
        {review.comment && <p className="mb-0 mt-2 small">{review.comment}</p>}
      </div>
    );
  }

  return (
    <Form onSubmit={submit} className="mt-3 border-top pt-3">
      <Form.Label className="small fw-semibold">
        {review ? "Your review" : "Add a review"}
      </Form.Label>
      {error && (
        <Alert variant="danger" className="small py-2">
          {error.response?.data?.detail || "Unable to save review."}
        </Alert>
      )}
      <div className="review-form__fields">
        <Form.Group className="review-form__rating">
          <Form.Label className="small">Rating</Form.Label>
          <div className="review-rating" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`review-rating__star${value <= rating ? " is-selected" : ""}`}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                aria-pressed={value === rating}
                onClick={() => setRating(value)}
              >
                {value <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
        </Form.Group>
        <Form.Group className="review-form__comment">
          <Form.Label className="small">Comment</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Share your experience"
            maxLength={2000}
          />
        </Form.Group>
        <Form.Check
          type="checkbox"
          label="Show my name publicly with this review"
          checked={showName}
          onChange={(event) => setShowName(event.target.checked)}
        />
        <Button type="submit" size="sm" className="align-self-start" disabled={saving}>
          {saving ? "Saving..." : review ? "Update review" : "Submit review"}
        </Button>
      </div>
    </Form>
  );
}
