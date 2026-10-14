import Alert from 'react-bootstrap/Alert'

export default function ErrorAlert({ error, className, onClose }) {
  if (!error) return null
  const message =
    error?.response?.data?.detail ||
    error?.message ||
    'Something went wrong. Please try again.'
  return (
    <Alert
      variant="danger"
      className={className}
      dismissible={!!onClose}
      onClose={onClose}
    >
      {typeof message === 'string' ? message : 'Something went wrong. Please try again.'}
    </Alert>
  )
}
