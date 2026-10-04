import { Link } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'

const FOOTER_BG = '#1e0f1d'
const FOOTER_BORDER = '#3d1f3c'
const MUTED = '#b89ab6'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ backgroundColor: FOOTER_BG, color: '#e8d5e7' }}>
      <Container className="py-5">
        <Row className="g-4">
          {/* Brand */}
          <Col xs={12} sm={6} md={3}>
            <h2 className="fw-bold mb-2" style={{ color: '#d8a8d6', fontSize: '1.3rem' }}>
              Rentis
            </h2>
            <p className="mb-0" style={{ color: MUTED, fontSize: '0.9rem', lineHeight: 1.6 }}>
              Find your perfect rental — homes, offices, and more across Sri Lanka.
            </p>
          </Col>

          {/* Explore */}
          <Col xs={6} sm={3} md={3}>
            <h6 className="fw-semibold mb-3" style={{ color: '#e8d5e7', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Explore
            </h6>
            <ul className="list-unstyled mb-0" style={{ fontSize: '0.9rem' }}>
              {[
                { to: '/', label: 'Home' },
                { to: '/search', label: 'Search' },
                { to: '/pricing', label: 'Pricing' },
              ].map(({ to, label }) => (
                <li key={to} className="mb-2">
                  <Link to={to} style={{ color: MUTED, textDecoration: 'none' }}
                    onMouseEnter={e => (e.target.style.color = '#e8d5e7')}
                    onMouseLeave={e => (e.target.style.color = MUTED)}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          {/* Account */}
          <Col xs={6} sm={3} md={3}>
            <h6 className="fw-semibold mb-3" style={{ color: '#e8d5e7', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Account
            </h6>
            <ul className="list-unstyled mb-0" style={{ fontSize: '0.9rem' }}>
              {[
                { to: '/login', label: 'Login' },
                { to: '/signup', label: 'Sign Up' },
                { to: '/owner/dashboard', label: 'Owner Dashboard' },
              ].map(({ to, label }) => (
                <li key={to} className="mb-2">
                  <Link to={to} style={{ color: MUTED, textDecoration: 'none' }}
                    onMouseEnter={e => (e.target.style.color = '#e8d5e7')}
                    onMouseLeave={e => (e.target.style.color = MUTED)}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          {/* Contact */}
          <Col xs={12} sm={6} md={3}>
            <h6 className="fw-semibold mb-3" style={{ color: '#e8d5e7', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Contact
            </h6>
            <ul className="list-unstyled mb-0" style={{ color: MUTED, fontSize: '0.9rem' }}>
              <li className="mb-2">support@rentis.lk</li>
              <li className="mb-2">0743417926</li>
              <li>Colombo, Sri Lanka</li>
            </ul>
          </Col>
        </Row>
      </Container>

      <div style={{ borderTop: `1px solid ${FOOTER_BORDER}` }}>
        <Container>
          <p className="mb-0 py-3 text-center" style={{ color: MUTED, fontSize: '0.8rem' }}>
            © {year} Rentis. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  )
}
