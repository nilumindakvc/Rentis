import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null

  const items = []
  for (let p = 1; p <= pageCount; p += 1) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) {
      const isActive = p === page
      items.push(
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/25 ring-2 ring-pink-400/50'
              : 'text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          {p}
        </button>,
      )
    } else if (items[items.length - 1]?.key?.startsWith('ellipsis') !== true) {
      items.push(
        <span key={`ellipsis-${p}`} className="w-9 h-9 flex items-center justify-center text-slate-500">
          …
        </span>,
      )
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {items}

      <button
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label="Next Page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
