import { Link } from 'react-router-dom'
import Container from 'react-bootstrap/Container'

export default function NotFoundPage() {
  return (
    <Container className="text-center py-5">
      <h1 className="h3 mb-2">Page not found</h1>
      <p className="text-muted mb-4">The page you're looking for doesn't exist.</p>
      <Link to="/">Back to home</Link>
    </Container>
  )
}
