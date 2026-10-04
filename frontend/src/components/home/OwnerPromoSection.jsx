import { Link } from "react-router-dom";

const BENEFITS = [
  {
    key: "categories",
    title: "Every category, one listing",
    detail: "List daily, short-term, and long-term rentals from a single account.",
    node: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    key: "calendar",
    title: "Effortless bookings",
    detail: "Manage availability and requests with a built-in calendar.",
    node: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <rect x="4" y="5.5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 9.5h16M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M8.5 13.5h2.5M13 13.5h2.5M8.5 17h2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "chat",
    title: "Real-time chat",
    detail: "Message renters directly and answer questions instantly.",
    node: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <path
          d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H6a2 2 0 0 1-2-2V6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M8 9h8M8 12.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "payments",
    title: "Secure payouts",
    detail: "Get paid safely, direct to your account, every time.",
    node: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 14.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function OwnerPromoSection() {
  return (
    <section className="owner-promo">
      <div className="container">
        <div className="owner-promo__copy">
          <p className="owner-promo__eyebrow">For property owners</p>
          <h2 className="owner-promo__title">Turn your property into income.</h2>
          <p className="owner-promo__description">
            List with Rentit and reach renters looking for daily stays, short-term rentals, and
            long-term homes — all from one owner account.
          </p>

          <ul className="owner-promo__benefits">
            {BENEFITS.map((b) => (
              <li className="owner-promo__benefit-card" key={b.key}>
                <span className="owner-promo__benefit-icon">{b.node}</span>
                <span className="owner-promo__benefit-title">{b.title}</span>
                <span className="owner-promo__benefit-detail">{b.detail}</span>
              </li>
            ))}
          </ul>

          <div className="owner-promo__actions">
            <Link to="/signup?role=owner" className="btn owner-promo__cta">
              Become an owner
            </Link>
            <Link to="/pricing" className="btn owner-promo__secondary-cta">
              See pricing plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
