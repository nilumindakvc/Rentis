import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";

import { useAuth } from "../context/AuthContext";
import { plansApi, subscriptionsApi } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorAlert from "../components/common/ErrorAlert";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12.5l2.5 2.5 5.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlanFeature({ included, children }) {
  return (
    <li className={included ? "is-included" : "is-excluded"}>
      <span className="pricing-card__feature-icon">{included ? <CheckIcon /> : <DashIcon />}</span>
      <span>{children}</span>
    </li>
  );
}

function formatPrice(plan) {
  if (!plan.monthly_price_lkr) return { amount: "Free", period: null };
  return { amount: `LKR ${Number(plan.monthly_price_lkr).toLocaleString()}`, period: "/ month" };
}

export default function PricingPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(null);

  useEffect(() => {
    const calls = [plansApi.list()];
    if (isOwner) calls.push(subscriptionsApi.mine());

    Promise.all(calls)
      .then(([plansResult, subResult]) => {
        setPlans(plansResult);
        if (subResult) setSubscription(subResult);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [isOwner]);

  const handleCheckout = async (planCode) => {
    setRedirecting(planCode);
    setError(null);
    try {
      const { url } = await subscriptionsApi.checkout(planCode);
      window.location.href = url;
    } catch (err) {
      setError(err);
      setRedirecting(null);
    }
  };

  const handlePortal = async () => {
    setRedirecting("portal");
    setError(null);
    try {
      const { url } = await subscriptionsApi.portal();
      window.location.href = url;
    } catch (err) {
      setError(err);
      setRedirecting(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const currentPlanCode = subscription?.plan?.code;
  const isPaidSubscriber =
    subscription && subscription.billing_status !== "free";

  return (
    <Container className="pricing-page" style={{ maxWidth: 1020 }}>
      <p className="pricing-page__eyebrow">Pricing</p>
      <h1 className="pricing-page__title">Plans built for every kind of owner.</h1>
      <p className="pricing-page__subtitle">
        Start free, upgrade to Pro when you need more listings and booking requests.
      </p>

      <ErrorAlert error={error} className="mb-3" />

      {isPaidSubscriber && (
        <div className="alert alert-info d-flex align-items-center gap-2 mb-3">
          You&apos;re on the <strong>{subscription.plan.name}</strong> plan.{" "}
          <Button
            variant="link"
            className="p-0 ms-1"
            disabled={redirecting === "portal"}
            onClick={handlePortal}
          >
            {redirecting === "portal" ? "Redirecting…" : "Manage billing →"}
          </Button>
        </div>
      )}

      <div className="pricing-grid">
        {plans.map((plan) => {
          const isCurrent = currentPlanCode === plan.code;
          const isPro = plan.code === "pro";
          const isBusiness = plan.code === "business";
          const isFree = plan.code === "free";
          const price = formatPrice(plan);
          const hasTrial = !subscription?.has_used_trial && (isPro || isBusiness);

          let ctaLabel;
          let ctaDisabled = false;
          let ctaAction = null;

          if (isCurrent) {
            ctaLabel = isPaidSubscriber ? "Manage billing" : "Current plan";
            ctaDisabled = false;
            ctaAction = isPaidSubscriber ? handlePortal : null;
          } else if (isFree) {
            ctaLabel = "Downgrade to Free";
            ctaDisabled = false;
            ctaAction = handlePortal;
          } else if (plan.stripe_price_id) {
            if (redirecting === plan.code) {
              ctaLabel = "Redirecting…";
              ctaDisabled = true;
            } else {
              ctaLabel = hasTrial
                ? `Start ${plan.name} — 14-day free trial`
                : `Upgrade to ${plan.name}`;
              ctaAction = () => handleCheckout(plan.code);
            }
          } else {
            ctaLabel = `Switch to ${plan.name}`;
            ctaDisabled = true;
          }

          return (
            <div
              key={plan.code}
              className={`pricing-card pricing-card--${isFree ? "free" : "pro"}`}
            >
              {isPro && <span className="pricing-card__ribbon">Most popular</span>}

              <div className="pricing-card__header">
                <h2 className="pricing-card__name">{plan.name}</h2>
                {isCurrent && <span className="pricing-card__current">Current plan</span>}
              </div>

              <div className="pricing-card__price">
                <span className="pricing-card__price-amount">{price.amount}</span>
                {price.period && <span className="pricing-card__price-period">{price.period}</span>}
              </div>
              <p className="pricing-card__tagline">{plan.description}</p>

              {hasTrial && isOwner && !isCurrent && (
                <p className="pricing-card__trial-note">
                  14-day free trial for new subscribers
                </p>
              )}

              <ul className="pricing-card__features">
                {(plan.features || []).map((feature, idx) => (
                  <PlanFeature key={idx} included={feature.included}>
                    {feature.text}
                  </PlanFeature>
                ))}
              </ul>

              {isOwner ? (
                <Button
                  className="pricing-card__cta"
                  disabled={ctaDisabled || (isCurrent && !isPaidSubscriber)}
                  onClick={ctaAction || undefined}
                >
                  {ctaLabel}
                </Button>
              ) : (
                <Button as={Link} to="/signup?role=owner" className="pricing-card__cta">
                  {isFree ? "Create a free owner account" : `Sign up to get ${plan.name}`}
                </Button>
              )}
            </div>
          );
        })}

      </div>
    </Container>
  );
}
