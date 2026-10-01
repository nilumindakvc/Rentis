import { useEffect, useState } from "react";
import PhotoGallery from "./PhotoGallery";
import MapView from "./MapView";
import FavoriteButton from "./FavoriteButton";
import PropertySection from "./PropertySection";
import AvailabilityCalendar from "./AvailabilityCalendar";
import BookingRequestForm from "./BookingRequestForm";
import PropertyReviews from "./PropertyReviews";
import { RENTAL_TERM_LABELS } from "../../constants/categoryIcons";
import { availabilityApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { MapPin, User, Calendar as CalendarIcon } from "lucide-react";

const CALENDAR_RENTAL_TERMS = ["medium_term", "short_term"];

export default function PropertyDetailView({
  property,
  showFavorite = true,
  actions,
}) {
  const { user } = useAuth();
  const showCalendar = CALENDAR_RENTAL_TERMS.includes(property.rental_term);
  const canBook = showCalendar && user?.role === "customer";
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    if (!showCalendar) return;
    availabilityApi
      .list(property.id)
      .then(setBlocks)
      .catch(() => setBlocks([]));
  }, [property.id, showCalendar]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Info (Left Column) */}
      <div className="lg:col-span-7 space-y-6">
        <PhotoGallery photos={property.photos} />

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 mb-3">
                {property.category_name} · {property.subtype_name}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{property.title}</h1>
              <p className="flex items-center gap-1.5 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{property.address_text}</span>
              </p>
            </div>
            {showFavorite && (
              <FavoriteButton
                propertyId={property.id}
                initialFavorited={property.is_favorited}
              />
            )}
          </div>

          {property.description && (
            <p className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-300 leading-relaxed">
              {property.description}
            </p>
          )}
        </div>

        <PropertySection
          title="Property Details"
          rows={[
            [
              "Size",
              property.size_value
                ? `${property.size_value} ${property.size_unit || ""}`
                : null,
            ],
            ["Layout", property.layout_description],
            ["Facilities", (property.facilities || []).join(", ")],
            ["Condition", property.condition],
            ["Furnishing", property.furnishing],
            ["Capacity", property.capacity],
          ]}
        />

        <PropertySection
          title="Rental Terms & Pricing"
          rows={[
            [
              "Minimum price",
              `${property.price_currency} ${Number(property.min_price).toLocaleString()}`,
            ],
            [
              "Security deposit",
              property.security_deposit
                ? `${property.price_currency} ${Number(property.security_deposit).toLocaleString()}`
                : null,
            ],
            [
              "Rental duration",
              RENTAL_TERM_LABELS[property.rental_term] || property.rental_term,
            ],
            ["Renewal terms", property.renewal_terms],
            ["Availability", property.availability_status],
            [
              "Additional charges",
              (property.additional_charges || [])
                .map((c) => `${c.label}: ${c.amount}`)
                .join(", "),
            ],
          ]}
        />

        <PropertySection
          title="Rules & Policies"
          rows={[
            ["Permitted usage", property.permitted_usage],
            ["Restrictions", property.restrictions],
            ["Parking / access", property.parking_access],
          ]}
        />

        <PropertyReviews
          propertyId={property.id}
          rentalTerm={property.rental_term}
        />
      </div>

      {/* Sidebar (Right Column) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Map Box */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Location Map
          </h3>
          {property.latitude != null && property.longitude != null ? (
            <MapView
              markers={[
                {
                  id: property.id,
                  lat: property.latitude,
                  lng: property.longitude,
                  title: property.title,
                },
              ]}
              center={[property.latitude, property.longitude]}
              zoom={14}
              height={280}
            />
          ) : (
            <p className="text-xs text-slate-400">No map location provided for this property.</p>
          )}
        </div>

        {/* Availability / Booking Box */}
        {showCalendar && (
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-pink-400" />
              Availability & Booking
            </h3>
            {canBook ? (
              <BookingRequestForm propertyId={property.id} blocks={blocks} />
            ) : (
              <AvailabilityCalendar blocks={blocks} />
            )}
          </div>
        )}

        {/* Owner Contact Actions Box */}
        {actions && (
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Listing Owner</span>
                <span className="text-base font-bold text-white">{property.owner_name}</span>
              </div>
            </div>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
