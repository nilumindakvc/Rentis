// Headline subtypes shown in each major section's carousel — a curated
// subset of RENTAL_SECTIONS' full subtype list, picked for broad appeal.
// Each needs a real listing to exist for its photo to show (seed data covers
// all of these); if none exists yet the slide just falls back gracefully.

export const VEHICLE_HIGHLIGHTS = [
  {
    slug: "vehicle-cars-sedan",
    label: "Cars",
    blurb: "Sedans, SUVs and hatchbacks for any trip.",
  },
  {
    slug: "vehicle-motorcycles-scooter",
    label: "Scooters",
    blurb: "Two wheels for quick city errands.",
  },
  {
    slug: "vehicle-vans-passenger-bus",
    label: "Vans & Buses",
    blurb: "Group transport sorted in one booking.",
  },
  {
    slug: "vehicle-boats-speedboat",
    label: "Boats",
    blurb: "Hit the water with a speedboat or catamaran.",
  },
];

export const GOOD_HIGHLIGHTS = [
  {
    slug: "good-electronics-camera",
    label: "Cameras",
    blurb: "Pro camera gear for shoots and events.",
  },
  {
    slug: "good-event-tables-chairs",
    label: "Event Gear",
    blurb: "Tables, chairs and tents for any occasion.",
  },
  {
    slug: "good-tools-power-tools",
    label: "Power Tools",
    blurb: "Get the job done without buying a full kit.",
  },
  {
    slug: "good-sports-bicycles",
    label: "Bicycles",
    blurb: "Bikes and outdoor gear for adventures.",
  },
];

export const RENTAL_TYPE_HIGHLIGHTS = {
  short_term: [
    {
      slug: "events-wedding-hall",
      label: "Wedding Halls",
      blurb: "Grand venues ready for your big celebration.",
    },
    {
      slug: "living-villa",
      label: "Villas",
      blurb: "Private getaways with space to relax and unwind.",
    },
    {
      slug: "events-conference-hall",
      label: "Conference Halls",
      blurb: "Professional venues for seminars and corporate events.",
    },
    {
      slug: "living-guest-house",
      label: "Guest Houses",
      blurb: "Comfortable short stays, ready whenever you arrive.",
    },
  ],
  medium_term: [
    {
      slug: "living-boarding-house",
      label: "Boarding Houses",
      blurb: "Shared living with the comforts of home, by the month.",
    },
    {
      slug: "living-room",
      label: "Rooms",
      blurb: "A private room near where you need to be.",
    },
    {
      slug: "vehicle-parking-space",
      label: "Parking Spaces",
      blurb: "Secure parking by the week or month.",
    },
  ],
};
