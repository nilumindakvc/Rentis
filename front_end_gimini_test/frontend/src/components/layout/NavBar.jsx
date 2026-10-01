import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../notifications/NotificationBell'
import { Sparkles, Menu, X, Search, Home, PlusCircle, LayoutDashboard, MessageSquare, LogOut, User } from 'lucide-react'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'text-pink-400 bg-pink-500/10 border border-pink-500/20 shadow-sm shadow-pink-500/10'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 mb-6 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-emerald-400 p-0.5 shadow-md shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-emerald-400">
              Rentis
            </span>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/search" className={linkClass}>
              <Search className="w-4 h-4" />
              <span>Search</span>
            </NavLink>

            {user?.role === 'owner' && (
              <>
                <NavLink to="/owner/dashboard" className={linkClass}>
                  <Home className="w-4 h-4" />
                  <span>My Listings</span>
                </NavLink>
                <NavLink to="/owner/listings/new" className={linkClass}>
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Add Listing</span>
                </NavLink>
              </>
            )}

            {user?.role === 'customer' && (
              <NavLink to="/customer/dashboard" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>My Dashboard</span>
              </NavLink>
            )}

            {user && (
              <NavLink to="/messages" className={linkClass}>
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Messages</span>
              </NavLink>
            )}
          </nav>

          {/* Desktop Auth / User Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-slate-200">{user.name}</div>
                    <div className="text-[10px] text-emerald-400 capitalize font-mono">{user.role}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-pink-400 rounded-lg border border-slate-700/80 hover:border-pink-500/40 hover:bg-pink-500/10 transition-all duration-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-all"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-200 active:scale-[0.98]"
                >
                  Sign up
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            {user && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-pink-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800/80 space-y-2 animate-fadeIn">
            <NavLink to="/search" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
              <Search className="w-4 h-4" />
              <span>Search</span>
            </NavLink>

            {user?.role === 'owner' && (
              <>
                <NavLink to="/owner/dashboard" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  <Home className="w-4 h-4" />
                  <span>My Listings</span>
                </NavLink>
                <NavLink to="/owner/listings/new" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>Add Listing</span>
                </NavLink>
              </>
            )}

            {user?.role === 'customer' && (
              <NavLink to="/customer/dashboard" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                <LayoutDashboard className="w-4 h-4" />
                <span>My Dashboard</span>
              </NavLink>
            )}

            {user && (
              <NavLink to="/messages" className={linkClass} onClick={() => setMobileMenuOpen(false)}>
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Messages</span>
              </NavLink>
            )}

            <div className="pt-3 border-t border-slate-800">
              {user ? (
                <div className="space-y-3">
                  <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{user.name}</div>
                      <div className="text-xs text-emerald-400 capitalize">{user.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-pink-400 rounded-lg bg-pink-500/10 border border-pink-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <NavLink
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-semibold text-slate-300 rounded-lg border border-slate-700"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-pink-500 to-rose-600"
                  >
                    Sign up
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
