import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import { taxonomyApi, propertiesApi } from "../services/api";
import RentalTermSection from "../components/home/RentalTermSection";
import { RENTAL_SECTIONS } from "../constants/rentalSections";
import homeImage from "../assets/rental-hero-home.jpg";
import officeImage from "../assets/rental-hero-office.jpg";
import homeawayImage from "../assets/rental-hero-homeaway.jpg";

const HERO_SLIDES = [
  {
    image: homeImage,
    alt: "Bright, thoughtfully furnished living room",
    eyebrow: "A place to feel at home",
    title: "Find a space that feels like yours.",
    description:
      "From city apartments to a change-of-scene stay, find a place that fits the way you live.",
  },
  {
    image: officeImage,
    alt: "Open contemporary interior with generous natural light",
    eyebrow: "Room to do your best work",
    title: "Make space for your next idea.",
    description:
      "Explore offices, studios, and flexible workspaces for whatever you are building.",
  },
  {
    image: homeawayImage,
    alt: "Modern home set among leafy trees",
    eyebrow: "A setting worth gathering for",
    title: "Find the right place for the occasion.",
    description:
      "Discover welcoming venues and spaces for celebrations, get-togethers, and more.",
  },
];

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [sectionProperties, setSectionProperties] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    taxonomyApi
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    Promise.all(
      RENTAL_SECTIONS.map((s) =>
        propertiesApi
          .search({ rental_term: s.key, page_size: 4, sort: "newest" })
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
  }, []);

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

  const subtypesFor = (slugs) => {
    const all = categories.flatMap((c) =>
      c.subtypes.map((s) => ({ ...s, category_id: c.id })),
    );
    return slugs
      .map((slug) => all.find((s) => s.slug === slug))
      .filter(Boolean);
  };

  return (
    <>
      <section className="home-hero" aria-label="Featured rental spaces">
        <div className="home-hero__slides" aria-hidden="true">
          {HERO_SLIDES.map((slide, index) => (
            <div
              className={`home-hero__image${index === activeSlide ? " is-active" : ""}`}
              key={slide.image}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>
        <div className="home-hero__shade" />
        <div className="home-hero__content">
          <div className="home-hero__copy" key={activeSlide}>
            <p className="home-hero__eyebrow">
              {HERO_SLIDES[activeSlide].eyebrow}
            </p>
            <h1>{HERO_SLIDES[activeSlide].title}</h1>
            <p className="home-hero__description">
              {HERO_SLIDES[activeSlide].description}
            </p>
            <Button as={Link} to="/search" variant="light" size="lg">
              Explore rentals <span aria-hidden="true">&#8594;</span>
            </Button>
          </div>
        </div>

        <div className="home-hero__controls">
          <div className="home-hero__pagination" aria-label="Choose a slide">
            {HERO_SLIDES.map((slide, index) => (
              <button
                className={`home-hero__dot${index === activeSlide ? " is-active" : ""}`}
                key={slide.eyebrow}
                type="button"
                aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`}
                aria-current={index === activeSlide ? "true" : undefined}
                onClick={() => showSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <Container className="home-listings">
        {RENTAL_SECTIONS.map((s) => (
          <RentalTermSection
            key={s.key}
            title={s.title}
            description={s.description}
            rentalTerm={s.key}
            subtypes={subtypesFor(s.subtypeSlugs)}
            properties={sectionProperties[s.key] || []}
            tinted={s.tinted}
            loading={loading}
          />
        ))}
      </Container>
    </>
  );
}
