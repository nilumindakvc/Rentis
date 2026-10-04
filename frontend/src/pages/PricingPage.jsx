import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";

const PLANS = [
  { key: "starter", name: "Starter" },
  { key: "professional", name: "Professional" },
  { key: "enterprise", name: "Enterprise" },
];

export default function PricingPage() {
  return (
    <Container className="py-5" style={{ maxWidth: 720 }}>
      <p className="text-uppercase small fw-bold text-muted mb-2">Pricing</p>
      <h1 className="h3 mb-3">Plans built for every kind of owner.</h1>
      <p className="text-muted mb-4">
        We're putting the finishing touches on Rentit Starter, Professional, and Enterprise —
        full pricing and plan details are coming soon.
      </p>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {PLANS.map((p) => (
          <span key={p.key} className="badge rounded-pill text-bg-light border px-3 py-2 fw-normal">
            {p.name}
          </span>
        ))}
      </div>

      <p className="mb-0">
        In the meantime, you can{" "}
        <Link to="/signup?role=owner">create a free owner account</Link> and start listing today.
      </p>
    </Container>
  );
}
