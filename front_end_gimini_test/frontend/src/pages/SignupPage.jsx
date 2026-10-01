import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorAlert from "../components/common/ErrorAlert";
import signupImage from "../assets/rental-hero-homeaway.jpg";
import { Eye, EyeOff, Sparkles, UserCheck, Home, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "customer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await signup(form);
      navigate(user.role === "owner" ? "/owner/dashboard" : "/", {
        replace: true,
      });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 shadow-2xl min-h-[620px]">
        {/* Left Side Story Banner */}
        <section className="lg:col-span-5 relative overflow-hidden flex items-end p-8 sm:p-12 bg-slate-950">
          <img
            src={signupImage}
            alt="Modern home for rent"
            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              A better way to find your place
            </span>
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Find your next place. Or share yours.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Join a community bringing renters and property owners together.
            </p>
          </div>
        </section>

        {/* Right Side Form Panel */}
        <section className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-slate-900/70">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest block mb-1">
                GET STARTED
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create your account</h1>
              <p className="text-xs text-slate-400 mt-1">Choose how you want to use Rentis.</p>
            </div>

            <ErrorAlert error={error} />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">I want to…</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => set({ role: "customer" })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      form.role === "customer"
                        ? "bg-pink-500/10 border-pink-500 text-pink-300 ring-2 ring-pink-500/20 shadow-md shadow-pink-500/10"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-100 mb-0.5">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      Rent a space
                    </div>
                    <div className="text-[11px] text-slate-400">Find a place to stay, work, or gather</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => set({ role: "owner" })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      form.role === "owner"
                        ? "bg-pink-500/10 border-pink-500 text-pink-300 ring-2 ring-pink-500/20 shadow-md shadow-pink-500/10"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-100 mb-0.5">
                      <Home className="w-4 h-4 text-pink-400" />
                      List a space
                    </div>
                    <div className="text-[11px] text-slate-400">Share your property with renters</div>
                  </button>
                </div>
              </div>

              {/* Grid of Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full name</label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    required
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                    required
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone <span className="text-[11px] text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => set({ password: e.target.value })}
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
                <span>{submitting ? "Creating account…" : "Create account"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-pink-400 hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
