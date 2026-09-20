import Spinner from 'react-bootstrap/Spinner'

export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="d-flex align-items-center justify-content-center py-5 gap-2 text-muted">
      <Spinner animation="border" size="sm" role="status" />
      <span>{label}</span>
    </div>
  )
}
