import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorAlert from "../components/common/ErrorAlert";
import loginImage from "../assets/rental-hero-home.jpg";
import { Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
      const redirectTo =
        location.state?.from ||
        (user.role === "owner" ? "/owner/dashboard" : "/");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 shadow-2xl min-h-[580px]">
        {/* Left Side Story Banner */}
        <section className="lg:col-span-6 relative overflow-hidden flex items-end p-8 sm:p-12 bg-slate-950">
          <img
            src={loginImage}
            alt="Rental living room"
            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Make room for what matters
            </span>
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Find a space for the life you&apos;re building.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Homes, workspaces, and places to gather, all in one platform.
            </p>
          </div>
        </section>

        {/* Right Side Form Panel */}
        <section className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-slate-900/70">
          <div className="max-w-sm mx-auto w-full space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest block mb-1">
                WELCOME BACK
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sign in to Rentis</h1>
              <p className="text-xs text-slate-400 mt-1">Continue to your rentals and messages.</p>
            </div>

            <ErrorAlert error={error} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-pink-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all duration-200"
              >
                <span>{submitting ? "Signing in…" : "Sign in"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
              New to Rentis?{" "}
              <Link to="/signup" className="font-bold text-pink-400 hover:underline">
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
