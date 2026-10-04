import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import { taxonomyApi, propertiesApi } from "../services/api";
import RentalTermSection from "../components/home/RentalTermSection";
import RentalTypeSection from "../components/home/RentalTypeSection";
import FeaturedSection from "../components/home/FeaturedSection";
import HeroIconReels from "../components/home/HeroIconReels";
import OwnerPromoSection from "../components/home/OwnerPromoSection";
import SmartAlertsSection from "../components/home/SmartAlertsSection";
import { RENTAL_SECTIONS } from "../constants/rentalSections";
import {
  RENTAL_TYPE_HIGHLIGHTS,
  VEHICLE_HIGHLIGHTS,
  GOOD_HIGHLIGHTS,
} from "../constants/rentalTypeHighlights";

const HERO_SLIDES = [
  {
    title: "Find a space that feels like yours.",
    description:
      "From city apartments to event halls and villas, discover places for the way you live and work.",
  },
  {
    title: "Rent any vehicle you need.",
    description:
      "Cars, motorcycles, vans, boats and heavy equipment — the right ride for every journey.",
  },
  {
    title: "Borrow the gear without buying it.",
    description:
      "Cameras, tools, furniture, event supplies and more — rent what you need, when you need it.",
  },
];

// Small rotating glyphs that echo the site's core ideas: a place to live,
// property types available to rent — a home, a hotel stay, a shop to lease,
// a villa with a pool, open ground for events.
const HERO_ICONS = [
  {
    key: "home",
    label: "A place to call home",
    node: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
        <path
          d="M3 11.5 12 4l9 7.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "hotel",
    label: "Stay somewhere special",
    node: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
        <rect x="6" y="3" width="12" height="18" rx="1" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M18 7h2v11a1 1 0 0 1-1 1h-1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 7h2M13 7h2M9 10.5h2M13 10.5h2M9 14h2M13 14h2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M10.5 21v-3.5a1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5V21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "shop",
    label: "Space to open shop",
    node: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
        <path
          d="M4 9 5 4h14l1 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 20v-4a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "car",
    label: "A vehicle for every trip",
    node: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
        <path
          d="M4 11 6.5 6h11L20 11"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="2" y="11" width="20" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    key: "camera",
    label: "Gear to get the job done",
    node: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
        <path
          d="M9 3h6l2 2h3a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3l2-2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

const PLACEHOLDER_PHOTO = "https://placehold.co/1200x700?text=Rentit";

// Long-term keeps the simpler chip-based treatment; short_term and
// medium_term get the bigger carousel-led sections, in priority order.
const MAJOR_SECTION_ORDER = ["short_term", "medium_term"];
const SIMPLE_SECTION_ORDER = ["long_term"];

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [sectionProperties, setSectionProperties] = useState({});
  const [carouselSlides, setCarouselSlides] = useState({});
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [vehicleProperties, setVehicleProperties] = useState([]);
  const [vehicleCarouselSlides, setVehicleCarouselSlides] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [goodProperties, setGoodProperties] = useState([]);
  const [goodCarouselSlides, setGoodCarouselSlides] = useState([]);
  const [goodLoading, setGoodLoading] = useState(true);
  const [primaryCategoryIds, setPrimaryCategoryIds] = useState({ place: null, vehicle: null, good: null });
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroQuery, setHeroQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    taxonomyApi
      .getCategories()
      .then((cats) => {
        setCategories(cats);
        const vehiclePrimaryId = cats.find((c) => c.slug.startsWith("vehicle-"))?.primary_category_id ?? null;
        const goodPrimaryId = cats.find((c) => c.slug.startsWith("good-"))?.primary_category_id ?? null;
        const placePrimaryId = cats.find((c) => !c.slug.startsWith("vehicle-") && !c.slug.startsWith("good-"))?.primary_category_id ?? null;
        setPrimaryCategoryIds({ place: placePrimaryId, vehicle: vehiclePrimaryId, good: goodPrimaryId });
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (primaryCategoryIds.place === null) return;

    Promise.all(
      RENTAL_SECTIONS.map((s) =>
        propertiesApi
          .search({ rental_term: s.key, primary_category_id: primaryCategoryIds.place, page_size: 4, sort: "newest" })
          .then((r) => r.items)
          .catch(() => []),
      ),
    )
      .then((results) => {
        const next = {};
        RENTAL_SECTIONS.forEach((s, i) => {
          next[s.key] = results[i];
        });
        setSectionProperties(next);
      })
      .finally(() => setLoading(false));
  }, [primaryCategoryIds]);

  useEffect(() => {
    propertiesApi
      .search({ featured: true, page_size: 8, sort: "newest" })
      .then((r) => setFeaturedProperties(r.items))
      .catch(() => setFeaturedProperties([]))
      .finally(() => setFeaturedLoading(false));
  }, []);


  // Fetch latest properties for vehicle and goods sections.
  useEffect(() => {
    if (primaryCategoryIds.vehicle === null && primaryCategoryIds.good === null) return;

    if (primaryCategoryIds.vehicle !== null) {
      propertiesApi
        .search({ primary_category_id: primaryCategoryIds.vehicle, page_size: 4, sort: "newest" })
        .then((r) => setVehicleProperties(r.items))
        .catch(() => setVehicleProperties([]))
        .finally(() => setVehicleLoading(false));
    } else {
      setVehicleLoading(false);
    }

    if (primaryCategoryIds.good !== null) {
      propertiesApi
        .search({ primary_category_id: primaryCategoryIds.good, page_size: 4, sort: "newest" })
        .then((r) => setGoodProperties(r.items))
        .catch(() => setGoodProperties([]))
        .finally(() => setGoodLoading(false));
    } else {
      setGoodLoading(false);
    }
  }, [primaryCategoryIds]);

  // For each major section's carousel, pull one real, recent listing per
  // headline subtype so the slide shows an actual photo from real inventory
  // rather than a generic stock image.
  useEffect(() => {
    if (categories.length === 0) return;

    const allSubtypes = categories.flatMap((c) =>
      c.subtypes.map((s) => ({ ...s, category_id: c.id, primary_category_id: c.primary_category_id })),
    );

    Object.entries(RENTAL_TYPE_HIGHLIGHTS).forEach(([rentalTerm, highlights]) => {
      Promise.all(
        highlights.map((h) => {
          const subtype = allSubtypes.find((s) => s.slug === h.slug);
          if (!subtype) return Promise.resolve(null);
          return propertiesApi
            .search({ subtype_id: subtype.id, rental_term: rentalTerm, page_size: 1, sort: "newest" })
            .then((r) => ({ highlight: h, subtype, property: r.items[0] || null }))
            .catch(() => ({ highlight: h, subtype, property: null }));
        }),
      ).then((results) => {
        const slides = results
          .filter((r) => r && r.subtype)
          .map((r) => ({
            key: r.highlight.slug,
            image: r.property?.primary_photo_url || PLACEHOLDER_PHOTO,
            eyebrow: r.subtype.name,
            title: r.highlight.label,
            description: r.highlight.blurb,
            href: `/search?rental_term=${rentalTerm}&category_id=${r.subtype.category_id}&subtype_id=${r.subtype.id}`,
          }));
        setCarouselSlides((prev) => ({ ...prev, [rentalTerm]: slides }));
      });
    });

    const buildPrimarySlides = (highlights, setter) => {
      Promise.all(
        highlights.map((h) => {
          const subtype = allSubtypes.find((s) => s.slug === h.slug);
          if (!subtype) return Promise.resolve(null);
          return propertiesApi
            .search({ subtype_id: subtype.id, page_size: 1, sort: "newest" })
            .then((r) => ({ highlight: h, subtype, property: r.items[0] || null }))
            .catch(() => ({ highlight: h, subtype, property: null }));
        }),
      ).then((results) => {
        const slides = results
          .filter((r) => r && r.subtype)
          .map((r) => ({
            key: r.highlight.slug,
            image: r.property?.primary_photo_url || PLACEHOLDER_PHOTO,
            eyebrow: r.subtype.name,
            title: r.highlight.label,
            description: r.highlight.blurb,
            href: `/search?primary_category_id=${r.subtype.primary_category_id}&subtype_id=${r.subtype.id}`,
          }));
        setter(slides);
      });
    };

    buildPrimarySlides(VEHICLE_HIGHLIGHTS, setVehicleCarouselSlides);
    buildPrimarySlides(GOOD_HIGHLIGHTS, setGoodCarouselSlides);
  }, [categories]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((index) => (index + 1) % HERO_SLIDES.length);
    }, 7000);

    return () => window.clearInterval(intervalId);
  }, []);

  const showSlide = (index) => {
    setActiveSlide((index + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const trimmed = heroQuery.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  const subtypesFor = (slugs) => {
    const all = categories.flatMap((c) =>
      c.subtypes.map((s) => ({ ...s, category_id: c.id })),
    );
    return slugs
      .map((slug) => all.find((s) => s.slug === slug))
      .filter(Boolean);
  };

  const sectionByKey = (key) => RENTAL_SECTIONS.find((s) => s.key === key);

  return (
    <>
      <section className="home-hero" aria-label="Featured rental spaces">
        <Container className="home-hero__content">
        <HeroIconReels icons={HERO_ICONS} />
          <div className="home-hero__copy">
            <div className="home-hero__copy-text" key={activeSlide}>
              <h1 className="home-hero__title">{HERO_SLIDES[activeSlide].title}</h1>
              <p className="home-hero__description">
                {HERO_SLIDES[activeSlide].description}
              </p>
            </div>

            <div className="home-hero__actions">
              <Button as={Link} to="/search" className="home-hero__cta" size="lg">
                Explore rentals
              </Button>

              <form className="home-hero__search" role="search" onSubmit={handleHeroSearch}>
                <input
                  type="text"
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="Search by location, property type…"
                  aria-label="Search properties"
                />
                <button type="submit" className="home-hero__search-btn" aria-label="Search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <line
                      x1="21"
                      y1="21"
                      x2="16.65"
                      y2="16.65"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          <div className="home-hero__controls">
            <div className="home-hero__pagination" aria-label="Choose a slide">
              {HERO_SLIDES.map((slide, index) => (
                <button
                  className={`home-hero__dot${index === activeSlide ? " is-active" : ""}`}
                  key={slide.title}
                  type="button"
                  aria-label={`Show slide ${index + 1}: ${slide.title}`}
                  aria-current={index === activeSlide ? "true" : undefined}
                  onClick={() => showSlide(index)}
                >
                  <span className="home-hero__dot-track" aria-hidden="true">
                    {index === activeSlide && <span className="home-hero__dot-fill" />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container className="home-listings">
        <FeaturedSection properties={featuredProperties} loading={featuredLoading} />

        {(() => {
          const vehicleChips = categories
            .filter((c) => c.primary_category_id === primaryCategoryIds.vehicle)
            .map((c) => ({
              id: c.id,
              name: c.name,
              href: `/search?primary_category_id=${primaryCategoryIds.vehicle}&category_id=${c.id}`,
            }));
          return (
            <RentalTypeSection
              title="Vehicles"
              description="Cars, motorcycles, vans, boats and heavy equipment for every need."
              searchHref={primaryCategoryIds.vehicle ? `/search?primary_category_id=${primaryCategoryIds.vehicle}` : "/search"}
              chips={vehicleChips}
              carouselSlides={vehicleCarouselSlides}
              properties={vehicleProperties}
              loading={vehicleLoading}
            />
          );
        })()}

        {(() => {
          const goodChips = categories
            .filter((c) => c.primary_category_id === primaryCategoryIds.good)
            .map((c) => ({
              id: c.id,
              name: c.name,
              href: `/search?primary_category_id=${primaryCategoryIds.good}&category_id=${c.id}`,
            }));
          return (
            <RentalTypeSection
              title="Goods"
              description="Electronics, tools, furniture, event gear and more — rent instead of buy."
              searchHref={primaryCategoryIds.good ? `/search?primary_category_id=${primaryCategoryIds.good}` : "/search"}
              chips={goodChips}
              carouselSlides={goodCarouselSlides}
              properties={goodProperties}
              loading={goodLoading}
            />
          );
        })()}

        {MAJOR_SECTION_ORDER.map((key) => {
          const s = sectionByKey(key);
          const placeHref = primaryCategoryIds.place
            ? `/search?rental_term=${key}&primary_category_id=${primaryCategoryIds.place}`
            : `/search?rental_term=${key}`;
          const chips = subtypesFor(s.subtypeSlugs).map((sub) => ({
            id: sub.id,
            name: sub.name,
            href: primaryCategoryIds.place
              ? `/search?rental_term=${key}&primary_category_id=${primaryCategoryIds.place}&subtype_id=${sub.id}`
              : `/search?rental_term=${key}&subtype_id=${sub.id}`,
          }));
          return (
            <RentalTypeSection
              key={key}
              title={s.title}
              description={s.description}
              rentalTerm={key}
              searchHref={placeHref}
              chips={chips}
              carouselSlides={carouselSlides[key] || []}
              properties={sectionProperties[key] || []}
              loading={loading || !carouselSlides[key]}
            />
          );
        })}

        {SIMPLE_SECTION_ORDER.map((key) => {
          const s = sectionByKey(key);
          const placeHref = primaryCategoryIds.place
            ? `/search?rental_term=${key}&primary_category_id=${primaryCategoryIds.place}`
            : `/search?rental_term=${key}`;
          return (
            <RentalTermSection
              key={key}
              title={s.title}
              description={s.description}
              rentalTerm={key}
              searchHref={placeHref}
              subtypes={subtypesFor(s.subtypeSlugs)}
              properties={sectionProperties[key] || []}
              tinted={s.tinted}
              loading={loading}
            />
          );
        })}
      </Container>

      <SmartAlertsSection />
      <OwnerPromoSection />
    </>
  );
}
