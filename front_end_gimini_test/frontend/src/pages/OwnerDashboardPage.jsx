import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorAlert from "../components/common/ErrorAlert";
import EmptyState from "../components/common/EmptyState";
import {
  propertiesApi,
  ownerStatsApi,
  bookingsApi,
  paymentsApi,
} from "../services/api";
import { STRIPE_COUNTRIES } from "../constants/stripeCountries";
import {
  Building2,
  Eye,
  MessageSquare,
  PlusCircle,
  CalendarCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Info,
  Edit,
  Calendar,
  ExternalLink,
} from "lucide-react";

function StatTile({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value ?? "—"}</div>
        <div className="text-xs text-slate-400 font-medium">{label}</div>
      </div>
    </div>
  );
}

function PayoutStatusMessage({ tone, symbol, children }) {
  const badgeStyle = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    info: "bg-pink-500/10 border-pink-500/30 text-pink-300",
  }[tone];

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm mb-4 ${badgeStyle}`}>
      <span className="font-bold shrink-0">{symbol}</span>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function ListingsTab() {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([propertiesApi.getMine(), ownerStatsApi.summary()])
      .then(([l, s]) => {
        setListings(l);
        setStats(s);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading listings and stats…" />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-6">
      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Listings"
          value={stats?.total_listings}
          icon={Building2}
          colorClass="bg-pink-500/10 text-pink-400 border border-pink-500/20"
        />
        <StatTile
          label="Total Views"
          value={stats?.total_views}
          icon={Eye}
          colorClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        />
        <StatTile
          label="Conversations"
          value={stats?.total_conversations}
          icon={MessageSquare}
          colorClass="bg-teal-500/10 text-teal-400 border border-teal-500/20"
        />
        <StatTile
          label="Unread Messages"
          value={stats?.unread_messages}
          icon={MessageSquare}
          colorClass="bg-rose-500/10 text-rose-400 border border-rose-500/20"
        />
      </div>

      {/* Listings Table / Empty State */}
      {listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          message="Publish your first property to start receiving messages."
          action={
            <Link
              to="/owner/listings/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add listing</span>
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Title</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Views</th>
                  <th className="px-5 py-4">Conversations</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {listings.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">
                      <Link to={`/properties/${p.id}`} className="hover:text-pink-400 transition-colors">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {p.category_name} · {p.subtype_name}
                    </td>
                    <td className="px-5 py-4 font-semibold text-emerald-400">
                      {p.price_currency} {Number(p.min_price).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-bold uppercase rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{p.view_count}</td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{p.conversation_count}</td>
                    <td className="px-5 py-4 text-right space-x-3">
                      <Link
                        to={`/owner/listings/${p.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-pink-400 hover:underline"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>
                      {(p.rental_term === "medium_term" || p.rental_term === "short_term") && (
                        <Link
                          to={`/owner/listings/${p.id}/availability`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Availability</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingRequestsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    bookingsApi
      .forOwner()
      .then(setBookings)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAccept = async (id) => {
    await bookingsApi.accept(id);
    load();
  };

  const handleReject = async (id) => {
    const updated = await bookingsApi.reject(id);
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
  };

  if (loading) return <LoadingSpinner label="Loading booking requests…" />;
  if (error) return <ErrorAlert error={error} />;
  if (bookings.length === 0) {
    return (
      <EmptyState
        title="No booking requests yet"
        message="Requests for your short-term/medium-term listings will show up here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <div key={b.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
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
              <span className="font-semibold text-slate-300">{b.start_date} → {b.end_date}</span> · Customer: {b.customer_name} ·{" "}
              <span className="font-bold text-emerald-400">{b.currency} {Number(b.amount).toLocaleString()}</span>
            </p>

            {b.message && (
              <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 italic">
                &ldquo;{b.message}&rdquo;
              </p>
            )}
          </div>

          {b.status === "pending" && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleAccept(b.id)}
                className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20 transition-all"
              >
                Accept
              </button>
              <button
                onClick={() => handleReject(b.id)}
                className="px-4 py-2 text-xs font-bold text-rose-300 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-all"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PayoutsTab() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [country, setCountry] = useState("LK");
  const [pollAttempts, setPollAttempts] = useState(0);

  const checkPayoutStatus = () => {
    return paymentsApi
      .connectStatus()
      .then((nextStatus) => {
        setStatus(nextStatus);
        setError(null);
        return nextStatus;
      })
      .catch((requestError) => {
        setError(requestError);
        return null;
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    checkPayoutStatus();
  }, []);

  useEffect(() => {
    const refreshStatus = () => {
      checkPayoutStatus();
    };

    window.addEventListener("focus", refreshStatus);
    window.addEventListener("pageshow", refreshStatus);

    return () => {
      window.removeEventListener("focus", refreshStatus);
      window.removeEventListener("pageshow", refreshStatus);
    };
  }, []);

  useEffect(() => {
    if (!status?.connected || status.payouts_enabled || pollAttempts >= 12)
      return;

    const timeout = window.setTimeout(() => {
      checkPayoutStatus().then(() =>
        setPollAttempts((attempts) => attempts + 1),
      );
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [status, pollAttempts]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const { url } = await paymentsApi.connectOnboard(country);
      window.location.href = url;
    } catch (err) {
      setError(err);
      setConnecting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Checking payout status…" />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="max-w-xl p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-emerald-400" />
        Payout Account (Stripe Connect)
      </h2>

      {status?.payouts_enabled ? (
        <PayoutStatusMessage tone="success" symbol="✓">
          You&apos;re all set. Your payout account is connected and ready to receive payments directly.
        </PayoutStatusMessage>
      ) : status?.connected ? (
        <PayoutStatusMessage tone="warning" symbol="!">
          Your payout account is linked, but setup is incomplete. Continue in Stripe to finish enabling payouts.
        </PayoutStatusMessage>
      ) : (
        <PayoutStatusMessage tone="info" symbol="i">
          Connect a payout account with Stripe to receive payments after you accept a booking.
        </PayoutStatusMessage>
      )}

      {!status?.connected && !status?.payouts_enabled && (
        <div className="space-y-1.5 max-w-xs">
          <label htmlFor="payout-country" className="block text-xs font-semibold text-slate-300">
            Select Country
          </label>
          <select
            id="payout-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
          >
            {STRIPE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400">
            Cannot be changed once setup starts — pick where your payout bank account is located.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/25 disabled:opacity-50 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>
            {connecting
              ? "Redirecting…"
              : status?.payouts_enabled
                ? "Edit details"
                : status?.connected
                  ? "Continue setup"
                  : "Connect payout account"}
          </span>
        </button>
        <button
          type="button"
          onClick={checkPayoutStatus}
          className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-all"
        >
          Refresh status
        </button>
      </div>
    </div>
  );
}

const TAB_KEYS = ["listings", "bookings", "payouts"];

export default function OwnerDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = TAB_KEYS.includes(requestedTab) ? requestedTab : "listings";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Owner Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Manage your properties, availability, and earnings.</p>
        </div>
        <Link
          to="/owner/listings/new"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Listing</span>
        </Link>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setSearchParams({})}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "listings"
              ? "border-pink-500 text-pink-400 bg-pink-500/10 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>My Listings</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: "bookings" })}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "bookings"
              ? "border-pink-500 text-pink-400 bg-pink-500/10 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Booking Requests</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: "payouts" })}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "payouts"
              ? "border-pink-500 text-pink-400 bg-pink-500/10 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payouts</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === "listings" && <ListingsTab />}
        {activeTab === "bookings" && <BookingRequestsTab />}
        {activeTab === "payouts" && <PayoutsTab />}
      </div>
    </div>
  );
}
