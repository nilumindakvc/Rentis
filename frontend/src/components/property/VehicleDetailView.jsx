import { useEffect, useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
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

const CALENDAR_RENTAL_TERMS = ["medium_term", "short_term"];

function boolLabel(val) {
  if (val === true) return "Yes";
  if (val === false) return "No";
  return null;
}

export default function VehicleDetailView({ property, showFavorite = true, actions }) {
  const { user } = useAuth();
  const showCalendar = CALENDAR_RENTAL_TERMS.includes(property.rental_term);
  const canBook = showCalendar && user?.role === "customer";
  const [blocks, setBlocks] = useState([]);
  const vd = property.vehicle_details;

  useEffect(() => {
    if (!showCalendar) return;
    availabilityApi.list(property.id).then(setBlocks).catch(() => setBlocks([]));
  }, [property.id, showCalendar]);

  return (
    <Row className="g-4">
      <Col lg={7}>
        <PhotoGallery photos={property.photos} />

        <div className="d-flex justify-content-between align-items-start mt-4 mb-1">
          <div>
            <Badge bg="light" text="dark" className="border mb-2">
              {property.primary_category_name} · {property.category_name} · {property.subtype_name}
            </Badge>
            <h2 className="h4 mb-1">{property.title}</h2>
            <p className="text-muted mb-0">{property.address_text}</p>
          </div>
          {showFavorite && (
            <FavoriteButton propertyId={property.id} initialFavorited={property.is_favorited} />
          )}
        </div>

        {property.description && <p className="mt-3">{property.description}</p>}

        <PropertySection
          title="Vehicle"
          rows={[
            ["Make", vd?.make],
            ["Model", vd?.model],
            ["Year", vd?.year],
            ["Color", vd?.color],
            ["Fuel type", vd?.fuel_type ? vd.fuel_type.charAt(0).toUpperCase() + vd.fuel_type.slice(1) : null],
            ["Transmission", vd?.transmission ? vd.transmission.charAt(0).toUpperCase() + vd.transmission.slice(1) : null],
            ["Mileage", vd?.mileage_km != null ? `${Number(vd.mileage_km).toLocaleString()} km` : null],
            ["Seats", vd?.seats],
            ["Engine", vd?.engine_cc != null ? `${vd.engine_cc} cc` : null],
            ["Air conditioning", boolLabel(vd?.has_ac)],
            ["GPS", boolLabel(vd?.has_gps)],
            ["Driver included", boolLabel(vd?.driver_included)],
          ]}
        />

        <PropertySection
          title="Rental"
          rows={[
            ["Minimum price", `${property.price_currency} ${Number(property.min_price).toLocaleString()}`],
            [
              "Security deposit",
              property.security_deposit
                ? `${property.price_currency} ${Number(property.security_deposit).toLocaleString()}`
                : null,
            ],
            ["Rental duration", RENTAL_TERM_LABELS[property.rental_term] || property.rental_term],
            ["Renewal terms", property.renewal_terms],
            ["Availability", property.availability_status],
            [
              "Additional charges",
              (property.additional_charges || []).map((c) => `${c.label}: ${c.amount}`).join(", "),
            ],
          ]}
        />

        <PropertySection
          title="Rules"
          rows={[
            ["Permitted usage", property.permitted_usage],
            ["Restrictions", property.restrictions],
          ]}
        />

        <PropertyReviews propertyId={property.id} rentalTerm={property.rental_term} />
      </Col>

      <Col lg={5}>
        <Card className="mb-3">
          <Card.Body>
            <h3 className="h6 mb-2">Location</h3>
            {property.latitude != null && property.longitude != null ? (
              <MapView
                markers={[{ id: property.id, lat: property.latitude, lng: property.longitude, title: property.title }]}
                center={[property.latitude, property.longitude]}
                zoom={14}
                height={280}
              />
            ) : (
              <p className="text-muted small mb-0">No map location provided.</p>
            )}
          </Card.Body>
        </Card>

        {showCalendar && (
          <Card className="mb-3">
            <Card.Body>
              <h3 className="h6 mb-2">Availability</h3>
              {canBook ? (
                <BookingRequestForm propertyId={property.id} blocks={blocks} />
              ) : (
                <AvailabilityCalendar blocks={blocks} />
              )}
            </Card.Body>
          </Card>
        )}

        {actions && (
          <Card>
            <Card.Body>
              <h3 className="h6 mb-1">Owner</h3>
              <p className="mb-3">{property.owner_name}</p>
              {actions}
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  );
}
