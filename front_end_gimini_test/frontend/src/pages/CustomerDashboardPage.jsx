import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorAlert from "../components/common/ErrorAlert";
import EmptyState from "../components/common/EmptyState";
import PropertyGrid from "../components/property/PropertyGrid";
import ReviewForm from "../components/dashboard/ReviewForm";
import { favoritesApi, bookingsApi } from "../services/api";
import { Heart, Calendar, CreditCard, CheckCircle2, AlertTriangle, X } from "lucide-react";

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

  if (loading) return <LoadingSpinner label="Loading saved properties…" />;
  if (error) return <ErrorAlert error={error} />;
  if (favorites.length === 0) {
    return (
      <EmptyState
        title="No saved properties yet"
        message="Tap the heart on any listing to save it here."
      />
    );
  }
  return <PropertyGrid properties={favorites} />;
}

function MyBookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    bookingsApi
      .mine()
      .then(setBookings)
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

  const handleReviewCreated = (bookingId) => () => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId ? { ...booking, has_review: true } : booking,
      ),
    );
  };

  if (loading) return <LoadingSpinner label="Loading your bookings…" />;
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
    <div className="space-y-4">
      {bookings.map((b) => (
        <div key={b.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Link
                  to={`/properties/${b.property_id}`}
                  className="text-base font-bold text-white hover:text-pink-400 transition-colors"
                >
                  {b.property_title}
                </Link>
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                  {b.status}
                </span>
                {b.status === "accepted" && (
                  <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full border ${
                    b.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}>
                    {b.payment_status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">{b.start_date} → {b.end_date}</span> ·{" "}
                <span className="font-bold text-emerald-400">{b.currency} {Number(b.amount).toLocaleString()}</span>
              </p>
              {b.message && (
                <p className="text-xs text-slate-400 mt-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 italic">
                  &ldquo;{b.message}&rdquo;
                </p>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {b.status === "pending" && (
                <button
                  onClick={() => handleCancel(b.id)}
                  className="px-4 py-2 text-xs font-bold text-rose-300 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-all"
                >
                  Cancel request
                </button>
              )}
              {b.status === "accepted" && b.payment_status === "unpaid" && (
                <button
                  onClick={() => handlePay(b.id)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay now</span>
                </button>
              )}
            </div>
          </div>

          {(b.status === "accepted" || b.payment_status === "paid") && !b.has_review && (
            <ReviewForm booking={b} onCreated={handleReviewCreated(b.id)} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CustomerDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "bookings" ? "bookings" : "favorites";
  const paymentResult = searchParams.get("payment");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Customer Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">Manage your saved listings and active booking requests.</p>
      </div>

      {paymentResult === "success" && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Payment successful — the owner has been notified.</span>
          </div>
          <button onClick={() => setSearchParams({ tab: "bookings" })} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {paymentResult === "cancelled" && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Payment was cancelled. You can try again from the booking below.</span>
          </div>
          <button onClick={() => setSearchParams({ tab: "bookings" })} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setSearchParams({})}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "favorites"
              ? "border-pink-500 text-pink-400 bg-pink-500/10 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Favorites</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: "bookings" })}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "bookings"
              ? "border-pink-500 text-pink-400 bg-pink-500/10 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Bookings</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === "favorites" && <FavoritesTab />}
        {activeTab === "bookings" && <MyBookingsTab />}
      </div>
    </div>
  );
}
