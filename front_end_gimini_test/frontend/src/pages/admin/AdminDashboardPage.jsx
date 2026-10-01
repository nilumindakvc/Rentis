import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorAlert from '../../components/common/ErrorAlert'
import { adminStatsApi } from '../../services/adminApi'
import { Users, UserCheck, MessageSquare, Building2, ShieldAlert } from 'lucide-react'

function StatTile({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value ?? "—"}</div>
        <div className="text-xs text-slate-400 font-medium capitalize">{label}</div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    adminStatsApi.summary().then(setStats).catch(setError).finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Platform Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">Summary of system activity, accounts, and listings.</p>
        </div>

        {loading && <LoadingSpinner label="Loading admin statistics…" />}
        {error && <ErrorAlert error={error} />}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              label="Owners"
              value={stats.total_owners}
              icon={Users}
              colorClass="bg-pink-500/10 text-pink-400 border border-pink-500/20"
            />
            <StatTile
              label="Customers"
              value={stats.total_customers}
              icon={UserCheck}
              colorClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            />
            <StatTile
              label="Conversations"
              value={stats.total_conversations}
              icon={MessageSquare}
              colorClass="bg-teal-500/10 text-teal-400 border border-teal-500/20"
            />
            <StatTile
              label="Total Messages"
              value={stats.total_messages}
              icon={MessageSquare}
              colorClass="bg-rose-500/10 text-rose-400 border border-rose-500/20"
            />

            {Object.entries(stats.listings_by_status).map(([status, count]) => (
              <StatTile
                key={status}
                label={`Listings — ${status}`}
                value={count}
                icon={Building2}
                colorClass="bg-slate-800 text-slate-300 border border-slate-700"
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
