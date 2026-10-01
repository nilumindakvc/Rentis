import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { Shield, Users, Building, ShieldCheck, LogOut, Menu, X, LayoutDashboard } from 'lucide-react'

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
    }`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/90 border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <NavLink to="/admin" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                Rentis <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ADMIN</span>
              </span>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/admin" end className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/admin/users" className={linkClass}>
                <Users className="w-4 h-4" />
                <span>Users</span>
              </NavLink>
              <NavLink to="/admin/properties" className={linkClass}>
                <Building className="w-4 h-4" />
                <span>Listings</span>
              </NavLink>
              {admin?.role === 'super_admin' && (
                <NavLink to="/admin/admins" className={linkClass}>
                  <ShieldCheck className="w-4 h-4 text-pink-400" />
                  <span>Admins</span>
                </NavLink>
              )}
            </nav>

            {/* Desktop User Info & Logout */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-xs text-right">
                <div className="font-bold text-slate-200">{admin?.name}</div>
                <div className="text-[10px] text-emerald-400 capitalize font-mono">{admin?.role?.replace('_', ' ')}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-600 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white"
            >
              {mobileOpen ? <X className="w-6 h-6 text-pink-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden py-4 border-t border-slate-800 space-y-2">
              <NavLink to="/admin" end className={linkClass} onClick={() => setMobileOpen(false)}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/admin/users" className={linkClass} onClick={() => setMobileOpen(false)}>
                <Users className="w-4 h-4" />
                <span>Users</span>
              </NavLink>
              <NavLink to="/admin/properties" className={linkClass} onClick={() => setMobileOpen(false)}>
                <Building className="w-4 h-4" />
                <span>Listings</span>
              </NavLink>
              {admin?.role === 'super_admin' && (
                <NavLink to="/admin/admins" className={linkClass} onClick={() => setMobileOpen(false)}>
                  <ShieldCheck className="w-4 h-4 text-pink-400" />
                  <span>Admins</span>
                </NavLink>
              )}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs">
                  <div className="font-bold text-slate-200">{admin?.name}</div>
                  <div className="text-[10px] text-emerald-400 capitalize">{admin?.role?.replace('_', ' ')}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 rounded-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
