import { Link } from 'react-router-dom'
import { RENTAL_TERM_LABELS } from '../../constants/categoryIcons'
import FavoriteButton from './FavoriteButton'
import { MapPin, Tag } from 'lucide-react'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'

export default function PropertyCard({ property, onFavoriteChange }) {
  const photo = property.primary_photo_url || PLACEHOLDER

  return (
    <div className="group relative flex flex-col h-full rounded-2xl bg-slate-900/80 border border-slate-800/80 overflow-hidden shadow-lg shadow-black/40 hover:border-pink-500/40 hover:shadow-pink-500/10 transition-all duration-300 transform hover:-translate-y-1">
      {/* Image & Favorite Button Container */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <Link to={`/properties/${property.id}`} className="block w-full h-full">
          <img
            src={photo}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
        </Link>

        {/* Favorite Icon */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton propertyId={property.id} onChange={onFavoriteChange} />
        </div>

        {/* Rental Term Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-950/80 border border-emerald-500/30 text-emerald-400 backdrop-blur-md">
            <Tag className="w-3 h-3 text-emerald-400" />
            {RENTAL_TERM_LABELS[property.rental_term] || property.rental_term}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category & Subtype Badge */}
        <div className="mb-2">
          <span className="inline-block text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
            {property.category_name} · {property.subtype_name}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-100 group-hover:text-pink-400 transition-colors line-clamp-1 mb-1">
          <Link to={`/properties/${property.id}`}>{property.title}</Link>
        </h3>

        {/* Address */}
        <p className="flex items-center gap-1 text-xs text-slate-400 mb-4 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{property.address_text}</span>
        </p>

        {/* Price Section */}
        <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Starting from</span>
            <span className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              {property.price_currency} {Number(property.min_price).toLocaleString()}
            </span>
          </div>

          <Link
            to={`/properties/${property.id}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500 hover:text-white transition-all"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
