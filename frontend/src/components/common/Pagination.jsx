import BsPagination from 'react-bootstrap/Pagination'

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null

  const items = []
  for (let p = 1; p <= pageCount; p += 1) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) {
      items.push(
        <BsPagination.Item key={p} active={p === page} onClick={() => onChange(p)}>
          {p}
        </BsPagination.Item>,
      )
    } else if (items[items.length - 1]?.key !== 'ellipsis') {
      items.push(<BsPagination.Ellipsis key={`ellipsis-${p}`} disabled />)
    }
  }

  return (
    <BsPagination className="justify-content-center mt-4">
      <BsPagination.Prev disabled={page <= 1} onClick={() => onChange(page - 1)} />
      {items}
      <BsPagination.Next disabled={page >= pageCount} onClick={() => onChange(page + 1)} />
    </BsPagination>
  )
}
