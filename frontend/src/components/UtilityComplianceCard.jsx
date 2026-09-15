/**
 * UtilityComplianceCard Component for Land Stack GIS
 * Displays Municipal Utility Connections, Environmental Restrictions, and Circle Rate Valuations.
 *
 * Props:
 * - utilities: object (waterSupply, electricityGrid, sewageNetwork, environmental)
 * - valuation: object (circleRate, unitArea, guidelineValue, lastRevisionDate)
 */
function UtilityComplianceCard({ utilities, valuation }) {
  if (!utilities && !valuation) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-bold text-slate-900">Utility & Environmental Compliance</h3>
        <p className="text-xs text-slate-400 italic">No municipal infrastructure records on file.</p>
      </section>
    );
  }

  const {
    waterSupply = "Not Connected",
    waterConnectionId,
    electricityGrid = "Standard Grid Connection",
    sewageNetwork = "Municipal Line Accessible",
    environmental = {}
  } = utilities || {};

  const {
    circleRate = "₹4,500 / sq.ft.",
    unitArea = "2,000 sq.ft.",
    guidelineValue = "₹90.0 Lakh",
    lastRevisionDate = "2026-01-01"
  } = valuation || {};

  const isEcoClear = (environmental.status || "").toLowerCase().includes("compliant") ||
    (environmental.status || "").toLowerCase().includes("clear");
  const isWetlandWarning = (environmental.wetlandProximity || "").toLowerCase().includes("caution") ||
    (environmental.wetlandProximity || "").toLowerCase().includes("buffer");

  return (
    <div className="space-y-4">
      {/* 1. Guideline Value & Circle Rate Card */}
      <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-blue-100/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-950">
              Guideline Land Valuation
            </h3>
          </div>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
            Official Circle Rate
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white/80 p-2.5 shadow-xs border border-blue-50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Circle Rate</span>
            <p className="mt-0.5 font-bold text-slate-900 text-sm sm:text-base text-blue-700">{circleRate}</p>
            <span className="text-[10px] text-slate-400">Govt Minimum Base</span>
          </div>

          <div className="rounded-lg bg-white/80 p-2.5 shadow-xs border border-blue-50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Guideline Value</span>
            <p className="mt-0.5 font-black text-slate-900 text-sm sm:text-base">{guidelineValue}</p>
            <span className="text-[10px] text-slate-400">Area: {unitArea}</span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
          <span>Stamps & Registration Dept Benchmark</span>
          <span>Revised: {lastRevisionDate}</span>
        </div>
      </section>

      {/* 2. Utility Infrastructure Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Utility Infrastructure
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Grid Linked
          </span>
        </div>

        <div className="mt-3 space-y-2.5 text-xs">
          {/* Water Supply */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-blue-500 text-sm">💧</span>
              <div>
                <p className="font-semibold text-slate-800">Piped Water Supply</p>
                {waterConnectionId && (
                  <p className="text-[10px] text-slate-400 font-mono">ID: {waterConnectionId}</p>
                )}
              </div>
            </div>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              {waterSupply}
            </span>
          </div>

          {/* Electricity Grid */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-sm">⚡</span>
              <div>
                <p className="font-semibold text-slate-800">Power Grid</p>
                <p className="text-[10px] text-slate-400">Distribution Transformer</p>
              </div>
            </div>
            <span className="text-right text-[11px] font-semibold text-slate-700 max-w-[170px] truncate" title={electricityGrid}>
              {electricityGrid}
            </span>
          </div>

          {/* Sewage & Drainage */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 text-sm">🚰</span>
              <div>
                <p className="font-semibold text-slate-800">Sewerage & Drainage</p>
                <p className="text-[10px] text-slate-400">Underground Trunk Line</p>
              </div>
            </div>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              {sewageNetwork}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Environmental Compliance & Hazard Card */}
      <section
        className={`rounded-xl border p-4 shadow-sm transition ${
          isWetlandWarning
            ? "border-amber-200 bg-amber-50/40"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Environmental Compliance
            </h3>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isWetlandWarning
                ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                : "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isWetlandWarning ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            {environmental.status || (isEcoClear ? "Compliant" : "Under Review")}
          </span>
        </div>

        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Eco-Sensitive Zone (ESZ):</span>
            <span className="font-semibold text-slate-800">{environmental.ecoSensitiveZone || "Clear"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Water Body / Wetland Proximity:</span>
            <span
              className={`font-semibold ${
                isWetlandWarning ? "text-amber-800 font-bold" : "text-slate-800"
              }`}
            >
              {environmental.wetlandProximity || "None (Safe)"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Flood Hazard Vulnerability:</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                environmental.floodRisk === "Moderate"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {environmental.floodRisk || "Low"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default UtilityComplianceCard;
