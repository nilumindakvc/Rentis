import { useState } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80'

export default function PhotoGallery({ photos = [] }) {
  const items = photos.length > 0 ? photos : [{ id: 'placeholder', url: PLACEHOLDER }]
  const [currentIndex, setCurrentIndex] = useState(0)

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
  }

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl mb-6">
      {/* Main Image Container */}
      <div className="relative h-[320px] sm:h-[450px] w-full overflow-hidden flex items-center justify-center">
        <img
          src={items[currentIndex]?.url || PLACEHOLDER}
          alt={`Photo ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Carousel Controls */}
        {items.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-4 p-2.5 rounded-full bg-slate-950/70 border border-slate-700/80 text-slate-200 hover:text-pink-400 hover:border-pink-500/50 backdrop-blur-md transition-all shadow-md"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-4 p-2.5 rounded-full bg-slate-950/70 border border-slate-700/80 text-slate-200 hover:text-pink-400 hover:border-pink-500/50 backdrop-blur-md transition-all shadow-md"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Photo Counter */}
            <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 backdrop-blur-md flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {currentIndex + 1} / {items.length}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {items.length > 1 && (
        <div className="flex items-center gap-2 p-3 bg-slate-900/90 border-t border-slate-800 overflow-x-auto">
          {items.map((photo, idx) => (
            <button
              key={photo.id || idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-16 w-24 rounded-lg overflow-hidden shrink-0 transition-all ${
                idx === currentIndex
                  ? 'ring-2 ring-pink-500 scale-95 opacity-100 shadow-md shadow-pink-500/20'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
