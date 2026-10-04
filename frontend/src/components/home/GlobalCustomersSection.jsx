import { useEffect, useState } from "react";

const PAGE_SIZE = 3;
const AUTOPLAY_MS = 4500;

function chunk(items, size) {
  const pages = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

function PartnerCard({ partner }) {
  const content = (
    <>
      <span className="global-customers__logo">
        <img src={partner.logo_url} alt="" loading="lazy" />
      </span>
      <span className="global-customers__name">{partner.name}</span>
    </>
  );

  if (partner.website_url) {
    return (
      <a
        href={partner.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="global-customers__card"
      >
        {content}
      </a>
    );
  }

  return <div className="global-customers__card">{content}</div>;
}

export default function GlobalCustomersSection({ partners }) {
  const pages = chunk(partners || [], PAGE_SIZE);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (pages.length <= 1) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setPage((p) => (p + 1) % pages.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(intervalId);
  }, [pages.length]);

  if (!partners || partners.length === 0) {
    return null;
  }

  const showPage = (index) => setPage((index + pages.length) % pages.length);
  const current = pages[page] || [];

  return (
    <section className="global-customers">
      <div className="global-customers__copy">
        <h2 className="global-customers__title">Our global customers</h2>
        <p className="global-customers__description">
          Trusted by property businesses around the world.
        </p>
      </div>

      <div className="global-customers__carousel">
        {pages.length > 1 && (
          <button
            type="button"
            className="global-customers__arrow global-customers__arrow--prev"
            aria-label="Previous partners"
            onClick={() => showPage(page - 1)}
          >
            &#8249;
          </button>
        )}

        <div className="global-customers__row">
          {current.map((p) => (
            <PartnerCard key={p.id} partner={p} />
          ))}
        </div>

        {pages.length > 1 && (
          <button
            type="button"
            className="global-customers__arrow global-customers__arrow--next"
            aria-label="Next partners"
            onClick={() => showPage(page + 1)}
          >
            &#8250;
          </button>
        )}
      </div>

      {pages.length > 1 && (
        <div className="global-customers__pagination" aria-label="Choose a page">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`global-customers__dot${index === page ? " is-active" : ""}`}
              aria-label={`Show partners page ${index + 1}`}
              aria-current={index === page ? "true" : undefined}
              onClick={() => showPage(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
