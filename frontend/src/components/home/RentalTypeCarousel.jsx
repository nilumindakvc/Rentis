import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function RentalTypeCarousel({ slides }) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setActiveSlide((index) => (index + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const showSlide = (index) => {
    setActiveSlide((index + slides.length) % slides.length);
  };

  return (
    <div className="rental-carousel" aria-label="Browse popular types">
      <div className="rental-carousel__backdrop">
        <div className="rental-carousel__slides" aria-hidden="true">
          {slides.map((slide, index) => (
            <div
              className={`rental-carousel__image${index === activeSlide ? " is-active" : ""}`}
              key={slide.key}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>
        <div className="rental-carousel__shade" />
      </div>

      <div className="rental-carousel__content" key={activeSlide}>
        <p className="rental-carousel__eyebrow">{slides[activeSlide].eyebrow}</p>
        <h3>{slides[activeSlide].title}</h3>
        <p className="rental-carousel__description">{slides[activeSlide].description}</p>
        <Link to={slides[activeSlide].href} className="btn btn-light rental-carousel__cta">
          Browse {slides[activeSlide].title} <span aria-hidden="true">&#8594;</span>
        </Link>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="rental-carousel__arrow rental-carousel__arrow--prev"
            aria-label="Previous"
            onClick={() => showSlide(activeSlide - 1)}
          >
            &#8249;
          </button>
          <button
            type="button"
            className="rental-carousel__arrow rental-carousel__arrow--next"
            aria-label="Next"
            onClick={() => showSlide(activeSlide + 1)}
          >
            &#8250;
          </button>

          <div className="rental-carousel__pagination" aria-label="Choose a slide">
            {slides.map((slide, index) => (
              <button
                className={`rental-carousel__dot${index === activeSlide ? " is-active" : ""}`}
                key={slide.key}
                type="button"
                aria-label={`Show slide ${index + 1}: ${slide.title}`}
                aria-current={index === activeSlide ? "true" : undefined}
                onClick={() => showSlide(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
