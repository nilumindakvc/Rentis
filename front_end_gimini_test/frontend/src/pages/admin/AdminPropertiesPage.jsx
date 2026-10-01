import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import { adminPropertiesApi } from '../../services/adminApi'

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = (params) => {
    setLoading(true)
    adminPropertiesApi
      .list(params)
      .then(setProperties)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleFilterChange = (value) => {
    setStatusFilter(value)
    load({ status_filter: value || undefined })
  }

  const handleStatusChange = async (p, status) => {
    const updated = await adminPropertiesApi.setStatus(p.id, status)
    setProperties((prev) => prev.map((x) => (x.id === p.id ? updated : x)))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Properties & Listings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Moderate property status across the ecosystem.</p>
        </div>

        {/* Filter Dropdown */}
        <div className="max-w-xs">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="" className="bg-slate-900 text-white">All statuses</option>
            <option value="published" className="bg-slate-900 text-white">Published</option>
            <option value="draft" className="bg-slate-900 text-white">Draft</option>
            <option value="archived" className="bg-slate-900 text-white">Archived</option>
          </select>
        </div>

        {loading && <LoadingSpinner label="Loading listings…" />}
        {error && <ErrorAlert error={error} />}
        {!loading && !error && properties.length === 0 && <EmptyState title="No listings found" />}

        {!loading && !error && properties.length > 0 && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4">Title</th>
                    <th className="px-5 py-4">Owner</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Views</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Change Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {properties.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-white">
                        <Link to={`/admin/properties/${p.id}`} className="hover:text-pink-400 transition-colors">
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-300">{p.owner_name}</td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {p.category_name} · {p.subtype_name}
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-400">
                        {p.price_currency} {Number(p.min_price).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-400">{p.view_count}</td>
                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/20">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <select
                          value={p.status}
                          onChange={(e) => handleStatusChange(p, e.target.value)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="published" className="bg-slate-900 text-white">Published</option>
                          <option value="draft" className="bg-slate-900 text-white">Draft</option>
                          <option value="archived" className="bg-slate-900 text-white">Archived</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
