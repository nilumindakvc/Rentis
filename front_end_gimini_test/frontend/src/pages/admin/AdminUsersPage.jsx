import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import EmptyState from '../../components/common/EmptyState'
import { adminUsersApi } from '../../services/adminApi'
import { Search, UserCheck, ShieldAlert } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = (params) => {
    setLoading(true)
    adminUsersApi
      .list(params)
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleSearch = (e) => {
    e.preventDefault()
    load({ q: q || undefined })
  }

  const toggleActive = async (u) => {
    const updated = await adminUsersApi.setStatus(u.id, !u.is_active)
    setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">User Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage customer and owner accounts across the platform.</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all"
          >
            Search
          </button>
        </form>

        {loading && <LoadingSpinner label="Loading users…" />}
        {error && <ErrorAlert error={error} />}
        {!loading && !error && users.length === 0 && <EmptyState title="No users found" />}

        {!loading && !error && users.length > 0 && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Phone</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Joined</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-white">{u.name}</td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-400">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/20">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">{u.phone || '—'}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full border ${
                            u.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => toggleActive(u)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                            u.is_active
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-600 hover:text-white'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {u.is_active ? 'Suspend' : 'Reactivate'}
                        </button>
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
