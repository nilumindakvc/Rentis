import { NavLink, useNavigate } from 'react-router-dom'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="md" className="mb-4">
        <Container>
          <Navbar.Brand as={NavLink} to="/admin">
            Rentis Admin
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-nav" />
          <Navbar.Collapse id="admin-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/admin" end>
                Dashboard
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/users">
                Users
              </Nav.Link>
              <Nav.Link as={NavLink} to="/admin/properties">
                Listings
              </Nav.Link>
              {admin?.role === 'super_admin' && (
                <Nav.Link as={NavLink} to="/admin/admins">
                  Admins
                </Nav.Link>
              )}
            </Nav>
            <Nav className="align-items-md-center gap-2">
              <span className="text-light small d-none d-md-inline">
                {admin?.name} <span className="text-capitalize">({admin?.role?.replace('_', ' ')})</span>
              </span>
              <Button size="sm" variant="outline-light" onClick={handleLogout}>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="pb-5">{children}</Container>
    </>
  )
}
