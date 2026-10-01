import { useEffect, useMemo, useState } from "react";
import { taxonomyApi } from "../../services/api";
import { Search, Filter, RotateCcw } from "lucide-react";

const RENTAL_TERMS = [
  { value: "", label: "Any duration" },
  { value: "long_term", label: "Long-term (years)" },
  { value: "medium_term", label: "Medium-term (months)" },
  { value: "short_term", label: "Short-term (days)" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export default function FilterBar({ filters, onChange, onSubmit }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    taxonomyApi
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const subtypes = useMemo(() => {
    const cat = categories.find(
      (c) => String(c.id) === String(filters.category_id),
    );
    return cat?.subtypes || [];
  }, [categories, filters.category_id]);

  const set = (patch) => onChange({ ...filters, ...patch });

  const handleCategoryChange = (e) => {
    set({ category_id: e.target.value, subtype_id: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1.5 mb-1">
            <Filter className="w-3.5 h-3.5 text-pink-400" />
            PROPERTY SEARCH
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Find your next space</h2>
          <p className="text-xs text-slate-400 mt-0.5">Narrow down listings to find the right fit.</p>
        </div>
      </div>

      {/* Fields */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search Query */}
        <div className="lg:col-span-2 space-y-1.5">
          <label htmlFor="filter-search-query" className="block text-xs font-semibold text-slate-300">
            Search Keyword
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="filter-search-query"
              type="text"
              placeholder="Title or address…"
              value={filters.q || ""}
              onChange={(e) => set({ q: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label htmlFor="filter-search-category" className="block text-xs font-semibold text-slate-300">
            Category
          </label>
          <select
            id="filter-search-category"
            value={filters.category_id || ""}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/60 border border-slate-700/80 text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
          >
            <option value="" className="bg-slate-900 text-white">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label htmlFor="filter-search-type" className="block text-xs font-semibold text-slate-300">
            Type
          </label>
          <select
            id="filter-search-type"
            value={filters.subtype_id || ""}
            onChange={(e) => set({ subtype_id: e.target.value })}
            disabled={!filters.category_id}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/60 border border-slate-700/80 text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="" className="bg-slate-900 text-white">All types</option>
            {subtypes.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="lg:col-span-2 space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Price range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              aria-label="Minimum price"
              placeholder="Min"
              value={filters.min_price || ""}
              onChange={(e) => set({ min_price: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
            <span className="text-xs text-slate-500 shrink-0">to</span>
            <input
              type="number"
              min={0}
              aria-label="Maximum price"
              placeholder="Max"
              value={filters.max_price || ""}
              onChange={(e) => set({ max_price: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <label htmlFor="filter-search-duration" className="block text-xs font-semibold text-slate-300">
            Duration
          </label>
          <select
            id="filter-search-duration"
            value={filters.rental_term || ""}
            onChange={(e) => set({ rental_term: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/60 border border-slate-700/80 text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
          >
            {RENTAL_TERMS.map((t) => (
              <option key={t.value} value={t.value} className="bg-slate-900 text-white">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="space-y-1.5">
          <label htmlFor="filter-search-sort" className="block text-xs font-semibold text-slate-300">
            Sort by
          </label>
          <select
            id="filter-search-sort"
            value={filters.sort || "newest"}
            onChange={(e) => set({ sort: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/60 border border-slate-700/80 text-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-slate-900 text-white">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-400">Adjust any combination, then apply your filters.</span>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onChange({ sort: "newest" })}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl border border-slate-700 hover:bg-slate-800 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear filters</span>
          </button>
          <button
            type="submit"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Apply filters</span>
          </button>
        </div>
      </div>
    </form>
  );
}
