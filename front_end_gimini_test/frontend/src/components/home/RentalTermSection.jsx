import { Link } from "react-router-dom";
import PropertyGrid from "../property/PropertyGrid";
import LoadingSpinner from "../common/LoadingSpinner";
import { ArrowRight, Sparkles } from "lucide-react";

export default function RentalTermSection({
  title,
  description,
  rentalTerm,
  subtypes,
  properties,
  tinted,
  loading,
}) {
  return (
    <section className={`py-8 px-4 sm:px-6 rounded-2xl mb-10 transition-all ${
      tinted 
        ? 'bg-slate-900/60 border border-slate-800/80 shadow-xl' 
        : 'bg-slate-950/30'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h2>
          </div>
          <p className="text-sm text-slate-400 max-w-xl">{description}</p>
        </div>
        <Link
          to={`/search?rental_term=${rentalTerm}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-pink-400 hover:text-pink-300 transition-colors group shrink-0"
        >
          <span>See all</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {subtypes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {subtypes.map((s) => (
            <Link
              key={s.id}
              to={`/search?rental_term=${rentalTerm}&category_id=${s.category_id}&subtype_id=${s.id}`}
              className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-slate-900 text-slate-300 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-200"
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading listings..." />
      ) : (
        <PropertyGrid properties={properties} columns={4} />
      )}
    </section>
  );
}
