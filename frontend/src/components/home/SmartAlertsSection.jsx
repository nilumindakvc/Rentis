const STEPS = [
  {
    key: "interests",
    title: "Set your interests",
    detail:
      "Choose the categories, rental types, locations and price ranges you care about — vehicles, goods, or places.",
    node: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 3v3M12 18v3M3 12h3M18 12h3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "alert",
    title: "Get alerted instantly",
    detail:
      "The moment an owner publishes a listing that matches your profile, you receive a notification — no searching required.",
    node: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <path
          d="M6 10a6 6 0 0 1 12 0v4l2 2H4l2-2v-4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M10 20a2 2 0 0 0 4 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="17" cy="5" r="3" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: "control",
    title: "Stay in control",
    detail:
      "Update or pause your alerts at any time from your account. You decide what matters and how often you hear from us.",
    node: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <path
          d="M4 6h16M4 12h10M4 18h6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="19" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

export default function SmartAlertsSection() {
  return (
    <section className="smart-alerts">
      <div className="container">
        <div className="smart-alerts__inner">
          <div className="smart-alerts__copy">
            <p className="smart-alerts__eyebrow">
              <span className="smart-alerts__badge">Coming soon</span>
              Smart alerts
            </p>
            <h2 className="smart-alerts__title">Never miss a listing that's right for you.</h2>
            <p className="smart-alerts__description">
              Tell us what you're looking for once. When an owner publishes a matching listing —
              the right vehicle, the right space, the right price — we'll let you know straight away.
            </p>
          </div>

          <ul className="smart-alerts__steps">
            {STEPS.map((s) => (
              <li className="smart-alerts__step" key={s.key}>
                <span className="smart-alerts__step-icon">{s.node}</span>
                <span className="smart-alerts__step-title">{s.title}</span>
                <span className="smart-alerts__step-detail">{s.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
