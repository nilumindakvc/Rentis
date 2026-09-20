import { NavLink, useNavigate } from 'react-router-dom'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../notifications/NotificationBell'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Navbar bg="white" expand="md" className="border-bottom shadow-sm mb-4" sticky="top">
      <Container>
        <Navbar.Brand as={NavLink} to="/" style={{ color: 'var(--rentis-accent)' }}>
          Rentis
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/search">
              Search
            </Nav.Link>
            {user?.role === 'owner' && (
              <>
                <Nav.Link as={NavLink} to="/owner/dashboard">
                  My Listings
                </Nav.Link>
                <Nav.Link as={NavLink} to="/owner/listings/new">
                  Add Listing
                </Nav.Link>
              </>
            )}
            {user?.role === 'customer' && (
              <Nav.Link as={NavLink} to="/customer/dashboard">
                My Dashboard
              </Nav.Link>
            )}
            {user && (
              <Nav.Link as={NavLink} to="/messages">
                Messages
              </Nav.Link>
            )}
          </Nav>
          <Nav className="align-items-md-center gap-2">
            {user ? (
              <>
                <NotificationBell />
                <span className="text-muted small d-none d-md-inline">
                  {user.name} <span className="text-capitalize">({user.role})</span>
                </span>
                <Button size="sm" variant="outline-primary" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login">
                  Login
                </Nav.Link>
                <Button as={NavLink} to="/signup" size="sm" variant="primary">
                  Sign up
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
