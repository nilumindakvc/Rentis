export default function EmptyState({ title, message, action }) {
  return (
    <div className="text-center py-5 text-muted">
      <h5 className="mb-2">{title}</h5>
      {message && <p className="mb-3">{message}</p>}
      {action}
    </div>
  )
}
