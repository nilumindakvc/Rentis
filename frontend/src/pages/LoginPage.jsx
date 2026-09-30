import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import { useAuth } from "../context/AuthContext";
import ErrorAlert from "../components/common/ErrorAlert";
import loginImage from "../assets/rental-hero-home.jpg";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
      const redirectTo =
        location.state?.from ||
        (user.role === "owner" ? "/owner/dashboard" : "/");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="login-page">
      <div className="login-layout">
        <section
          className="login-story"
          aria-label="Find a space that fits your life"
        >
          <img
            src={loginImage}
            alt="A welcoming, light-filled rental living room"
          />
          <div className="login-story__shade" />
          <div className="login-story__content">
            <p className="login-story__eyebrow">Make room for what matters</p>
            <h2>Find a space for the life you&apos;re building.</h2>
            <p>Homes, workspaces, and places to gather, all in one place.</p>
          </div>
        </section>

        <section className="login-form-panel" aria-labelledby="login-heading">
          <div className="login-form-inner">
            <p className="login-form__eyebrow">WELCOME BACK</p>
            <h1 id="login-heading">Sign in to Rentis</h1>
            <p className="login-form__intro">
              Continue to your rentals and messages.
            </p>

            <ErrorAlert error={error} />
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="login-email">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4" controlId="login-password">
                <Form.Label>Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </Form>

            <p className="login-form__signup">
              New to Rentis? <Link to="/signup">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </Container>
  );
}
