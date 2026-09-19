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
    <div className="flex min-h-full flex-1 items-center justify-center bg-white dark:bg-black p-4 sm:p-6 lg:p-8 font-sans select-none">
      <div className="w-full max-w-md rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.06)] dark:shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-none border border-gray-300 dark:border-neutral-700 bg-white dark:bg-black text-gray-900 dark:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-700 dark:text-neutral-300">
              Department of Revenue
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400">• Official SSO</span>
          </div>

          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-black dark:text-white uppercase sm:text-3xl font-sans">
            Revenue Officer Portal
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400 font-mono">
            Sign in with government credentials to review and sanction land mutations.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-5 rounded-none border border-rose-400 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs font-mono text-rose-700 dark:text-rose-400">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-700 dark:text-neutral-400 font-mono">
              Officer Email ID
            </label>
            <div className="relative mt-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@revenue.gov.in"
                className="w-full rounded-none border border-gray-300 dark:border-neutral-800 bg-white dark:bg-black px-3.5 py-2.5 text-xs font-mono text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-600 focus:border-gray-900 dark:focus:border-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-700 dark:text-neutral-400 font-mono">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-mono uppercase tracking-wider text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
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
                className="w-full rounded-none border border-gray-300 dark:border-neutral-800 bg-white dark:bg-black px-3.5 py-2.5 text-xs font-mono text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-600 focus:border-gray-900 dark:focus:border-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Role Designation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-700 dark:text-neutral-400 font-mono">
              Designation / Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-none border border-gray-300 dark:border-neutral-800 bg-white dark:bg-black px-3 py-2.5 text-xs font-mono text-gray-800 dark:text-neutral-200 focus:border-gray-900 dark:focus:border-white focus:outline-none transition"
            >
              <option className="bg-white dark:bg-black text-gray-900 dark:text-white">Tahsildar / Sub-Registrar</option>
              <option className="bg-white dark:bg-black text-gray-900 dark:text-white">District Town Planning Officer (DTCP)</option>
              <option className="bg-white dark:bg-black text-gray-900 dark:text-white">Village Administrative Officer (VAO)</option>
              <option className="bg-white dark:bg-black text-gray-900 dark:text-white">District Revenue Collector</option>
            </select>
          </div>

          {/* 2FA Security PIN */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-700 dark:text-neutral-400 font-mono">
              Digital Certificate PIN (2FA)
            </label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="1234"
              className="mt-1 w-full rounded-none border border-gray-300 dark:border-neutral-800 bg-white dark:bg-black px-3.5 py-2.5 font-mono text-xs font-bold text-gray-900 dark:text-white tracking-widest focus:border-gray-900 dark:focus:border-white focus:outline-none transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-none border border-gray-900 bg-gray-900 text-white hover:bg-black dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-white dark:hover:text-black px-4 py-3 text-xs font-mono font-bold uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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

            {/* Quick 1-Click Demo Fill & Cancel */}
            <div className="flex items-center justify-between gap-2 pt-1 font-mono">
              <button
                type="button"
                onClick={handleQuickDemoFill}
                className="text-[11px] font-bold text-gray-600 hover:text-black dark:text-neutral-400 dark:hover:text-white underline uppercase tracking-wider cursor-pointer"
              >
                Auto-fill Officer Demo
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-[11px] text-gray-500 hover:text-black dark:text-neutral-500 dark:hover:text-white uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Return to Map
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Security Badge Footer */}
        <div className="mt-6 border-t border-gray-200 dark:border-neutral-900 pt-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 dark:text-neutral-500 font-mono uppercase tracking-wider">
            <svg className="h-3.5 w-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
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
