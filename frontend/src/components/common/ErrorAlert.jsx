import Alert from 'react-bootstrap/Alert'

export default function ErrorAlert({ error, className }) {
  if (!error) return null
  const message =
    error?.response?.data?.detail ||
    error?.message ||
    'Something went wrong. Please try again.'
  return (
    <Alert variant="danger" className={className}>
      {typeof message === 'string' ? message : 'Something went wrong. Please try again.'}
    </Alert>
  )
}
