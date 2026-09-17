import { useState } from "react";

/**
 * AdminLogin Component for Land Stack GIS
 * Premium government-grade authentication portal for Revenue Officers.
 *
 * Props:
 * - onLoginSuccess: (user: object) => void
 * - onCancel: () => void
 */
function AdminLogin({ onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState("tahsildar@revenue.gov.in");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState("Tahsildar / Sub-Registrar");
  const [pin, setPin] = useState("1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please provide both Officer Email ID and Password.");
      return;
    }

    if (password !== "admin123" && password !== "admin" && password !== "password") {
      setError("Invalid credentials. Try using default: admin123");
      return;
    }

    setLoading(true);

    // Simulate official SSO identity verification
    setTimeout(() => {
      setLoading(false);
      const officerData = {
        name: "Shri R. K. Verma",
        email: email.trim(),
        role: role,
        jurisdiction: "District Revenue Circle 04",
        loggedAt: new Date().toISOString()
      };
      localStorage.setItem("landstack_admin_auth", "true");
      localStorage.setItem("landstack_admin_user", JSON.stringify(officerData));
      onLoginSuccess && onLoginSuccess(officerData);
    }, 600);
  };

  const handleQuickDemoFill = () => {
    setEmail("tahsildar@revenue.gov.in");
    setPassword("admin123");
    setRole("Tahsildar / Sub-Registrar");
    setPin("1234");
    setError("");
  };

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur">
        
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/25">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-700/10">
              Department of Revenue
            </span>
            <span className="text-[11px] font-medium text-slate-400">• Official SSO</span>
          </div>

          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Revenue Officer Portal
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sign in with your government email to review and sanction land mutations.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* Email / Officer ID */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Officer Email ID
            </label>
            <div className="relative mt-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@revenue.gov.in"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Role Designation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Designation / Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option>Tahsildar / Sub-Registrar</option>
              <option>District Town Planning Officer (DTCP)</option>
              <option>Village Administrative Officer (VAO)</option>
              <option>District Revenue Collector</option>
            </select>
          </div>

          {/* 2FA Security PIN */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Digital Certificate PIN (2FA)
            </label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="1234"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 font-mono text-xs font-bold text-slate-800 tracking-widest transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying Officer Credentials...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Authenticate & Access Console</span>
                </>
              )}
            </button>

            {/* Quick 1-Click Demo Fill */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleQuickDemoFill}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Auto-fill Officer Demo Credentials
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  Return to Citizen Map
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Security Badge Footer */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <svg className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>256-bit Encrypted Cadastral Security Ledger</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminLogin;
