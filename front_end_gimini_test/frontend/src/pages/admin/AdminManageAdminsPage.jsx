import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import { adminAdminsApi } from '../../services/adminApi'
import { ShieldCheck, UserPlus, Trash2 } from 'lucide-react'

const emptyForm = { name: '', email: '', password: '' }

export default function AdminManageAdminsPage() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const load = () => {
    setLoading(true)
    adminAdminsApi.list().then(setAdmins).catch(setError).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const admin = await adminAdminsApi.create(form)
      setAdmins((prev) => [...prev, admin])
      setForm(emptyForm)
    } catch (err) {
      setCreateError(err)
    } finally {
      setCreating(false)
    }
  }

  const handleRemove = async (admin) => {
    await adminAdminsApi.remove(admin.id)
    setAdmins((prev) => prev.filter((a) => a.id !== admin.id))
  }

  if (loading) return <AdminLayout><LoadingSpinner label="Loading admin accounts…" /></AdminLayout>

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-pink-400" />
            Admin Account Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Create and manage internal administrator credentials.</p>
        </div>

        <ErrorAlert error={error} />

        {/* Add Admin Form Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 max-w-3xl">
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add New Admin
          </h2>
          <ErrorAlert error={createError} />
          
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Admin Name"
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                placeholder="admin@rentis.com"
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
              >
                <span>{creating ? 'Adding…' : 'Add Admin'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Admins Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Added</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">{a.name}</td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-400">{a.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full border ${
                        a.role === 'super_admin' ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}>
                        {a.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {a.role !== 'super_admin' && (
                        <button
                          onClick={() => handleRemove(a)}
                          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Remove admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
