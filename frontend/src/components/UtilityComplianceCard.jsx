/**
 * UtilityComplianceCard Component for Land Stack GIS (SpaceX Stark Theme)
 * Displays Municipal Utility Connections, Environmental Restrictions, and Circle Rate Valuations.
 *
 * Props:
 * - utilities: object (waterSupply, electricityGrid, sewageNetwork, environmental)
 * - valuation: object (circleRate, unitArea, guidelineValue, lastRevisionDate)
 */
function UtilityComplianceCard({ utilities, valuation }) {
  if (!utilities && !valuation) {
    return (
      <section className="rounded-none border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#050505] p-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
          Utility & Environmental Compliance
        </h3>
        <p className="text-xs text-gray-400 italic">No municipal infrastructure records on file.</p>
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

  const isEcoClear =
    (environmental.status || "").toLowerCase().includes("compliant") ||
    (environmental.status || "").toLowerCase().includes("clear");
  const isWetlandWarning =
    (environmental.wetlandProximity || "").toLowerCase().includes("caution") ||
    (environmental.wetlandProximity || "").toLowerCase().includes("buffer");

  return (
    <div className="space-y-3.5">
      {/* 1. Guideline Value & Circle Rate Card */}
      <section className="rounded-none border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#050505] p-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center border border-black dark:border-white text-black dark:text-white font-mono text-[10px] rounded-none">
              ₹
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Guideline Land Valuation
            </h3>
          </div>
          <span className="border border-gray-300 dark:border-neutral-800 bg-gray-100 dark:bg-[#111] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-700 dark:text-neutral-300 rounded-none">
            Official Circle Rate
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-none bg-gray-50 dark:bg-[#111] p-3 border border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              Circle Rate
            </span>
            <p className="mt-1 font-mono font-bold text-black dark:text-white text-sm sm:text-base">
              {circleRate}
            </p>
            <span className="text-[10px] font-mono text-gray-500 dark:text-neutral-500">Govt Minimum Base</span>
          </div>

          <div className="rounded-none bg-gray-50 dark:bg-[#111] p-3 border border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              Guideline Value
            </span>
            <p className="mt-1 font-mono font-bold text-black dark:text-white text-sm sm:text-base">
              {guidelineValue}
            </p>
            <span className="text-[10px] font-mono text-gray-500 dark:text-neutral-500">Area: {unitArea}</span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-gray-500 dark:text-neutral-500">
          <span>Stamps & Registration Dept Benchmark</span>
          <span>Revised: {lastRevisionDate}</span>
        </div>
      </section>

      {/* 2. Utility Infrastructure Card */}
      <section className="rounded-none border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#050505] p-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center border border-black dark:border-white text-black dark:text-white font-mono text-[10px] rounded-none">
              ⚡
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Utility Infrastructure
            </h3>
          </div>
          <span className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none">
            Grid Linked
          </span>
        </div>

        <div className="mt-3 space-y-2.5 text-xs">
          {/* Water Supply */}
          <div className="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-neutral-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">💧</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Piped Water Supply</p>
                {waterConnectionId && (
                  <p className="text-[10px] text-gray-500 dark:text-neutral-400 font-mono">ID: {waterConnectionId}</p>
                )}
              </div>
            </div>
            <span className="border border-gray-300 dark:border-neutral-800 bg-gray-100 dark:bg-[#111] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-800 dark:text-neutral-200 rounded-none">
              {waterSupply}
            </span>
          </div>

          {/* Electricity Grid */}
          <div className="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-neutral-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Power Grid</p>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">Distribution Transformer</p>
              </div>
            </div>
            <span className="text-right text-[11px] font-mono font-bold text-gray-900 dark:text-white max-w-[170px] truncate" title={electricityGrid}>
              {electricityGrid}
            </span>
          </div>

          {/* Sewage & Drainage */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">🚰</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Sewerage & Drainage</p>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">Underground Trunk Line</p>
              </div>
            </div>
            <span className="border border-gray-300 dark:border-neutral-800 bg-gray-100 dark:bg-[#111] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-800 dark:text-neutral-200 rounded-none">
              {sewageNetwork}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Environmental Compliance & Hazard Card */}
      <section
        className={`rounded-none border p-4 transition-colors ${
          isWetlandWarning
            ? "border-amber-500/40 bg-amber-500/10"
            : "border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#050505]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center border border-black dark:border-white text-black dark:text-white font-mono text-[10px] rounded-none">
              🌱
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Environmental Compliance
            </h3>
          </div>

          <span
            className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-none ${
              isWetlandWarning
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
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
            <span className="text-gray-500 dark:text-neutral-400">Eco-Sensitive Zone (ESZ):</span>
            <span className="font-semibold text-gray-900 dark:text-white">{environmental.ecoSensitiveZone || "Clear"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-neutral-400">Water Body / Wetland Proximity:</span>
            <span
              className={`font-semibold ${
                isWetlandWarning ? "text-amber-700 dark:text-amber-300 font-bold" : "text-gray-900 dark:text-white"
              }`}
            >
              {environmental.wetlandProximity || "None (Safe)"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-neutral-400">Flood Hazard Vulnerability:</span>
            <span
              className={`border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-none ${
                environmental.floodRisk === "Moderate"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
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
