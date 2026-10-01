// Curated groupings for the homepage — a UI-level suggestion of which
// subtypes are typical for each rental duration, not a database constraint
// (any subtype can technically be listed under any rental_term).
export const RENTAL_SECTIONS = [
  {
    key: "short_term",
    title: "Rent for a day",
    description:
      "Halls, venues and getaways booked by the day — availability calendar coming soon.",
    tinted: true,
    subtypeSlugs: [
      "education-classroom",
      "office-meeting-conference-room",
      "living-villa",
      "living-guest-house",
      "events-event-hall",
      "events-wedding-hall",
      "events-conference-hall",
      "events-party-function-space",
    ],
  },
  {
    key: "medium_term",
    title: "Short-term rentals",
    description:
      "By the week or month — parking, a room, or a place while you’re between leases.",
    tinted: true,
    subtypeSlugs: [
      "vehicle-parking-space",
      "living-room",
      "living-boarding-house",
    ],
  },
  {
    key: "long_term",
    title: "Long-term rentals",
    description:
      "Years-long leases for homes and businesses settling in for the long haul.",
    tinted: false,
    subtypeSlugs: [
      "healthcare-clinic",
      "healthcare-medical-center",
      "healthcare-dental-clinic-space",
      "healthcare-pharmacy-space",
      "hospitality-hotel",
      "vehicle-vehicle-yard",
      "industrial-warehouse",
      "industrial-factory",
      "food-restaurant-space",
      "food-cafe-space",
      "retail-shop",
      "retail-showroom",
      "office-office-building",
      "office-individual-office",
      "living-house",
      "living-apartment-flat",
    ],
  },
];
