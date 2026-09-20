import Card from 'react-bootstrap/Card'

export default function PropertySection({ title, rows }) {
  const visible = rows.filter(([, value]) => value !== undefined && value !== null && value !== '')
  if (visible.length === 0) return null
  return (
    <Card className="mb-3">
      <Card.Header className="fw-semibold">{title}</Card.Header>
      <Card.Body>
        <dl className="row mb-0">
          {visible.map(([label, value]) => (
            <div className="col-sm-6 mb-2" key={label}>
              <dt className="small text-muted fw-normal">{label}</dt>
              <dd className="mb-0">{value}</dd>
            </div>
          ))}
        </dl>
      </Card.Body>
    </Card>
  )
}
