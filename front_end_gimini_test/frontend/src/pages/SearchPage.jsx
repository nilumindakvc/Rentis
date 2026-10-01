import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import FilterBar from "../components/property/FilterBar";
import PropertyGrid from "../components/property/PropertyGrid";
import MapView from "../components/property/MapView";
import Pagination from "../components/common/Pagination";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorAlert from "../components/common/ErrorAlert";
import { propertiesApi } from "../services/api";
import { MapPin, Search } from "lucide-react";

const PAGE_SIZE = 9;

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category_id: searchParams.get("category_id") || "",
    subtype_id: searchParams.get("subtype_id") || "",
    q: "",
    min_price: "",
    max_price: "",
    rental_term: searchParams.get("rental_term") || "",
    sort: "newest",
  });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({
    items: [],
    total: 0,
    page: 1,
    page_size: PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (currentFilters, currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...currentFilters,
        page: currentPage,
        page_size: PAGE_SIZE,
      };
      Object.keys(params).forEach((k) => {
        if (params[k] === "" || params[k] === undefined) delete params[k];
      });
      const data = await propertiesApi.search(params);
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleApply = () => {
    setPage(1);
    load(filters, 1);
  };

  const pageCount = Math.max(1, Math.ceil((result.total || 0) / PAGE_SIZE));
  const markers = (result.items || [])
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      lat: p.latitude,
      lng: p.longitude,
      title: p.title,
      property: p,
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onSubmit={handleApply}
      />

      {error && <ErrorAlert error={error} className="mb-6" />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Results Grid */}
        <div className="lg:col-span-8">
          {loading ? (
            <LoadingSpinner label="Searching listings…" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  {result.total} propert{result.total === 1 ? "y" : "ies"} found
                </span>
              </div>
              <PropertyGrid properties={result.items} columns={3} />
              <Pagination
                page={page}
                pageCount={pageCount}
                onChange={setPage}
              />
            </>
          )}
        </div>

        {/* Map View Side panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Interactive Map
            </h3>
            <MapView
              markers={markers}
              height={520}
              renderPopup={(m) => (
                <div className="p-2 text-slate-900">
                  <div className="font-bold text-sm mb-1">{m.title}</div>
                  <Link to={`/properties/${m.id}`} className="text-xs font-semibold text-pink-600 hover:underline">
                    View details →
                  </Link>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
