import PropertyCard from './PropertyCard'
import EmptyState from '../common/EmptyState'

export default function PropertyGrid({ properties, columns = 3 }) {
  if (!properties || properties.length === 0) {
    return <EmptyState title="No properties found" message="Try widening your filters." />
  }

  const gridColsClass = 
    columns === 4 
      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={`grid ${gridColsClass} gap-6`}>
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  )
}
