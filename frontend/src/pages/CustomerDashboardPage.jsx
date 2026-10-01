import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorAlert from "../components/common/ErrorAlert";
import EmptyState from "../components/common/EmptyState";
import PropertyGrid from "../components/property/PropertyGrid";
import ReviewForm from "../components/dashboard/ReviewForm";
import { favoritesApi, bookingsApi, reviewsApi } from "../services/api";

const STATUS_VARIANT = {
  pending: "warning",
  accepted: "success",
  rejected: "secondary",
  cancelled: "secondary",
};
const PAYMENT_VARIANT = { unpaid: "secondary", paid: "success" };

function FavoritesTab() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    favoritesApi
      .list()
      .then(setFavorites)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;
  if (favorites.length === 0) {
    return (
      <EmptyState
        title="No saved properties yet"
        message="Tap the star on any listing to save it here."
      />
    );
  }
  return <PropertyGrid properties={favorites} />;
}

function MyBookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([bookingsApi.mine(), reviewsApi.mine()])
      .then(([nextBookings, nextReviews]) => {
        setBookings(nextBookings);
        setReviews(nextReviews);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCancel = async (id) => {
    const updated = await bookingsApi.cancel(id);
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
  };

  const handlePay = async (id) => {
    const { url } = await bookingsApi.checkout(id);
    window.location.href = url;
  };

  const handleReviewSaved = (savedReview) => {
    setReviews((prev) => {
      const exists = prev.some((review) => review.id === savedReview.id);
      return exists
        ? prev.map((review) => (review.id === savedReview.id ? savedReview : review))
        : [savedReview, ...prev];
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;
  if (bookings.length === 0) {
    return (
      <EmptyState
        title="No booking requests yet"
        message="Request dates on a short-term or medium-term listing to see it here."
      />
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {bookings.map((b) => {
        const review = reviews.find((item) => item.booking_id === b.id);
        const eligible = b.status === "accepted" || b.payment_status === "paid";
        return (
          <Card key={b.id}>
          <Card.Body className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Link
                  to={`/properties/${b.property_id}`}
                  className="fw-semibold text-decoration-none"
                >
                  {b.property_title}
                </Link>
                <Badge
                  bg={STATUS_VARIANT[b.status]}
                  className="text-capitalize"
                >
                  {b.status}
                </Badge>
                {b.status === "accepted" && (
                  <Badge
                    bg={PAYMENT_VARIANT[b.payment_status]}
                    className="text-capitalize"
                  >
                    {b.payment_status}
                  </Badge>
                )}
              </div>
              <p className="mb-1 small">
                {b.start_date} → {b.end_date} · {b.currency}{" "}
                {Number(b.amount).toLocaleString()}
              </p>
              {b.message && (
                <p className="mb-1 text-muted small">{b.message}</p>
              )}
            </div>
            {b.status === "pending" && (
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => handleCancel(b.id)}
              >
                Cancel request
              </Button>
            )}
            {b.status === "accepted" && b.payment_status === "unpaid" && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handlePay(b.id)}
              >
                Pay now
              </Button>
            )}
          </Card.Body>
            {eligible && (
              <Card.Footer>
                <ReviewForm booking={b} review={review} onSaved={handleReviewSaved} />
              </Card.Footer>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default function CustomerDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab =
    searchParams.get("tab") === "bookings" ? "bookings" : "favorites";
  const paymentResult = searchParams.get("payment");

  return (
    <Container>
      <h1 className="h4 mb-4">My dashboard</h1>
      {paymentResult === "success" && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSearchParams({ tab: "bookings" })}
        >
          Payment successful — the owner has been notified.
        </Alert>
      )}
      {paymentResult === "cancelled" && (
        <Alert
          variant="warning"
          dismissible
          onClose={() => setSearchParams({ tab: "bookings" })}
        >
          Payment was cancelled. You can try again from the booking below.
        </Alert>
      )}
      <Tabs
        activeKey={activeTab}
        onSelect={(key) =>
          setSearchParams(key === "bookings" ? { tab: "bookings" } : {})
        }
        className="mb-3"
      >
        <Tab eventKey="favorites" title="Favorites">
          <FavoritesTab />
        </Tab>
        <Tab eventKey="bookings" title="My Bookings">
          <MyBookingsTab />
        </Tab>
      </Tabs>
    </Container>
  );
}
