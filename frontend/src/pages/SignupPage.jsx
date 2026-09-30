import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";
import { useAuth } from "../context/AuthContext";
import ErrorAlert from "../components/common/ErrorAlert";
import signupImage from "../assets/rental-hero-homeaway.jpg";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await signup(form);
      navigate(user.role === "owner" ? "/owner/dashboard" : "/", {
        replace: true,
      });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="login-page signup-page">
      <div className="login-layout">
        <section
          className="login-story"
          aria-label="Find or list a rental space"
        >
          <img src={signupImage} alt="A modern home available for rent" />
          <div className="login-story__shade" />
          <div className="login-story__content">
            <p className="login-story__eyebrow">
              A better way to find your place
            </p>
            <h2>Find your next place. Or share yours.</h2>
            <p>
              Join a community bringing renters and property owners together.
            </p>
          </div>
        </section>

        <section className="login-form-panel" aria-labelledby="signup-heading">
          <div className="login-form-inner signup-form-inner">
            <p className="login-form__eyebrow">GET STARTED</p>
            <h1 id="signup-heading">Create your account</h1>
            <p className="login-form__intro">
              Choose how you want to use Rentis.
            </p>

            <ErrorAlert error={error} />
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="signup-role">
                <Form.Label className="d-block">I want to…</Form.Label>
                <ButtonGroup className="signup-role-picker">
                  <ToggleButton
                    id="role-customer"
                    type="radio"
                    variant="outline-primary"
                    name="role"
                    value="customer"
                    checked={form.role === "customer"}
                    onChange={() => set({ role: "customer" })}
                  >
                    <span className="signup-role-choice__title">
                      Rent a space
                    </span>
                    <span className="signup-role-choice__description">
                      Find a place to stay, work, or gather
                    </span>
                  </ToggleButton>
                  <ToggleButton
                    id="role-owner"
                    type="radio"
                    variant="outline-primary"
                    name="role"
                    value="owner"
                    checked={form.role === "owner"}
                    onChange={() => set({ role: "owner" })}
                  >
                    <span className="signup-role-choice__title">
                      List a space
                    </span>
                    <span className="signup-role-choice__description">
                      Share your property with renters
                    </span>
                  </ToggleButton>
                </ButtonGroup>
              </Form.Group>
              <div className="signup-fields-grid">
                <Form.Group controlId="signup-name">
                  <Form.Label>Full name</Form.Label>
                  <Form.Control
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="signup-email">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                    required
                  />
                </Form.Group>
              </div>
              <Form.Group className="mb-3" controlId="signup-phone">
                <Form.Label>
                  Phone <span className="signup-optional">Optional</span>
                </Form.Label>
                <Form.Control
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-4" controlId="signup-password">
                <Form.Label>Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => set({ password: e.target.value })}
                    required
                  />
                  <Button
                    className="login-password-toggle"
                    type="button"
                    variant="outline-secondary"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                </InputGroup>
              </Form.Group>
              <Button
                type="submit"
                variant="primary"
                className="login-submit w-100"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? "Creating account…" : "Create account"}
              </Button>
            </Form>

            <p className="login-form__signup">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </Container>
  );
}
