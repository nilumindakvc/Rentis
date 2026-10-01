import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { taxonomyApi, propertiesApi } from "../services/api";
import RentalTermSection from "../components/home/RentalTermSection";
import { RENTAL_SECTIONS } from "../constants/rentalSections";
import homeImage from "../assets/rental-hero-home.jpg";
import officeImage from "../assets/rental-hero-office.jpg";
import homeawayImage from "../assets/rental-hero-homeaway.jpg";
import { ArrowRight, Sparkles, ChevronRight } from "lucide-react";

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
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative h-[550px] sm:h-[620px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        {/* Background Slides */}
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.image}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === activeSlide ? "opacity-100 scale-105" : "opacity-0 scale-100"
            }`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl px-6 sm:px-12 py-12">
          <div key={activeSlide} className="space-y-6 animate-fadeIn">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              {HERO_SLIDES[activeSlide].eyebrow}
            </span>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
              {HERO_SLIDES[activeSlide].title}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-xl">
              {HERO_SLIDES[activeSlide].description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/search"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-400 hover:from-pink-600 hover:to-emerald-500 shadow-lg shadow-pink-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <span>Explore rentals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-950/60 p-2 rounded-full border border-slate-800/80 backdrop-blur-md">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.eyebrow}
              type="button"
              onClick={() => showSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === activeSlide
                  ? "w-8 bg-gradient-to-r from-pink-500 to-emerald-400 shadow-sm shadow-pink-500/50"
                  : "w-2.5 bg-slate-700 hover:bg-slate-500"
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Rental Sections Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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
      </div>
    </div>
  );
}
