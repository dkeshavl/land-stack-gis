import { useState, useEffect } from "react";

/**
 * AnalyticsDashboard Component for Land Stack GIS
 * Visual data dashboard for government officials (Revenue Officers / Town Planners)
 *
 * Props:
 * - onSwitchToRegistry: () => void (Optional helper to navigate back to table)
 */
function AnalyticsDashboard({ onSwitchToRegistry }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/metrics");
      const result = await res.json();
      if (res.ok && result.success) {
        setMetrics(result.data);
      } else {
        throw new Error(result.message || "Failed to load analytics metrics");
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.message || "Network error fetching analytics metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch("/api/analytics/metrics")
      .then((res) => res.json())
      .then((result) => {
        if (!isMounted) return;
        if (result.success) {
          setMetrics(result.data);
        } else {
          setError(result.message || "Failed to load analytics");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Network error loading analytics");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Palette generator for zoning distribution bars - Stark High Contrast
  const getZoneColor = (index, zone) => {
    const colors = [
      { bg: "bg-gray-900 dark:bg-white", text: "text-gray-900 dark:text-white", badge: "border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-white" },
      { bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", badge: "border-emerald-700 text-emerald-600 dark:text-emerald-400" },
      { bg: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", badge: "border-sky-700 text-sky-600 dark:text-sky-400" },
      { bg: "bg-amber-400", text: "text-amber-700 dark:text-amber-300", badge: "border-amber-700 text-amber-700 dark:text-amber-300" },
      { bg: "bg-purple-400", text: "text-purple-700 dark:text-purple-300", badge: "border-purple-700 text-purple-700 dark:text-purple-300" }
    ];
    if (zone.toLowerCase().includes("commercial")) return colors[2];
    if (zone.toLowerCase().includes("residential")) return colors[0];
    if (zone.toLowerCase().includes("mixed")) return colors[1];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-1 items-center justify-center p-8 bg-white dark:bg-black text-gray-900 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 dark:border-white border-t-transparent" />
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400">
            Synthesizing Cadastral GIS Analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex-1 p-6">
        <div className="rounded-none border border-rose-400 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-950/20 p-6 text-center text-gray-900 dark:text-white">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">{error || "Unable to load analytics data"}</p>
          <button
            onClick={fetchMetrics}
            className="mt-4 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black rounded-none px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest transition-all cursor-pointer"
          >
            Retry Analytics Sync
          </button>
        </div>
      </div>
    );
  }

  const {
    totalParcels,
    totalEstimatedValue,
    taxMetrics = {},
    mutationMetrics = {},
    zoningDistribution = []
  } = metrics;

  return (
    <div className="space-y-6 text-gray-900 dark:text-white font-sans w-full max-w-full min-w-0">
      {/* Top Controls & Sync Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-neutral-800 pb-5 w-full min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-none bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-700 dark:text-neutral-300 whitespace-nowrap">
              Executive Analytics
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400 truncate">• Real-Time Cadastral Intelligence</span>
          </div>
          <h2 className="mt-2 text-xl font-black text-black dark:text-white uppercase sm:text-2xl break-words">
            State Land & Revenue Analytics
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={fetchMetrics}
            className="inline-flex items-center gap-2 rounded-none border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 hover:border-gray-900 dark:hover:border-white hover:text-gray-900 dark:hover:text-white px-3 sm:px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest text-gray-700 dark:text-neutral-300 transition-all cursor-pointer"
          >
            <svg className="h-3.5 w-3.5 text-gray-400 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>

          {onSwitchToRegistry && (
            <button
              onClick={onSwitchToRegistry}
              className="border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none px-6 py-2 uppercase text-xs tracking-widest font-bold cursor-pointer"
            >
              Mutations →
            </button>
          )}
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0">
        {/* Total Estimated Value */}
        <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-neutral-800 p-5 rounded-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400 font-mono">
              Total Land Valuation
            </span>
            <svg className="h-4 w-4 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-4 text-2xl font-black text-gray-900 dark:text-white sm:text-3xl font-mono tracking-tight">{totalEstimatedValue}</p>
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
            ↑ Cadastral Benchmark Value
          </div>
        </div>

        {/* Tax Compliance Rate */}
        <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-neutral-800 p-5 rounded-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400 font-mono">
              Tax Compliance
            </span>
            <svg className="h-4 w-4 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-2xl font-black text-gray-900 dark:text-white sm:text-3xl font-mono tracking-tight">{taxMetrics.complianceRate}%</p>
            <span className="text-[10px] font-mono uppercase text-gray-500 dark:text-neutral-400">Compliance</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-400 font-mono">
            <span>Paid: {taxMetrics.paidCount}</span>
            <span>Due: {taxMetrics.dueCount}</span>
          </div>
        </div>

        {/* Pending Mutations / Title Transfers */}
        <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-neutral-800 p-5 rounded-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400 font-mono">
              Pending Title Clearances
            </span>
            <span className="h-2 w-2 rounded-none bg-amber-500 dark:bg-amber-400 animate-pulse" />
          </div>
          <p className="mt-4 text-2xl font-black text-amber-600 dark:text-amber-400 sm:text-3xl font-mono tracking-tight">{mutationMetrics.pending}</p>
          <div className="mt-2 text-[11px] font-mono text-amber-600 dark:text-amber-400/80">
            {mutationMetrics.pending > 0
              ? `${mutationMetrics.pendingRate}% of registry requires verification`
              : "All title mutations cleared"}
          </div>
        </div>

        {/* Total Parcels */}
        <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-neutral-800 p-5 rounded-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400 font-mono">
              Cadastral Units (ULPIN)
            </span>
            <svg className="h-4 w-4 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="mt-4 text-2xl font-black text-gray-900 dark:text-white sm:text-3xl font-mono tracking-tight">{totalParcels}</p>
          <div className="mt-2 text-[11px] text-gray-500 dark:text-neutral-400 font-mono">
            Verified GeoJSON Polygons Mapped
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full min-w-0">
        {/* Chart 1: Land Use & Zoning Distribution */}
        <div className="rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-6 text-gray-900 dark:text-white">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider font-mono sm:text-base">
                Zoning & Land Use Allocation
              </h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 font-mono">
                Spatial footprint distribution according to Town Planning Master Plan
              </p>
            </div>
            <span className="rounded-none border border-gray-300 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-600 dark:text-neutral-400">
              Master Plan 2031
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="mt-6">
            <div className="flex h-3 w-full overflow-hidden rounded-none bg-gray-200 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 p-0">
              {zoningDistribution.map((item, idx) => {
                const color = getZoneColor(idx, item.zone);
                return (
                  <div
                    key={item.zone}
                    style={{ width: `${item.percentage}%` }}
                    className={`${color.bg} transition-all duration-500 rounded-none`}
                    title={`${item.zone}: ${item.count} parcels (${item.percentage}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Detailed Zone Cards */}
          <div className="mt-6 space-y-2">
            {zoningDistribution.map((item, idx) => {
              const color = getZoneColor(idx, item.zone);
              return (
                <div
                  key={item.zone}
                  className="flex items-center justify-between rounded-none border border-gray-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/30 p-3 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-900/70"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-none ${color.bg}`} />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide font-mono">{item.zone}</p>
                      <p className="text-[10px] text-gray-500 dark:text-neutral-400 font-mono">Permissible Cadastral Density</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">{item.count} Parcels</span>
                    <span className="ml-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Municipal Tax Collection Performance */}
        <div className="rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-6 text-gray-900 dark:text-white">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider font-mono sm:text-base">
                Municipal Tax Revenue Performance
              </h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 font-mono">
                Property tax realization vs pending municipal arrears
              </p>
            </div>
            <span className="rounded-none border border-emerald-300 dark:border-neutral-800 bg-emerald-50 dark:bg-neutral-900 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              FY 2026-27
            </span>
          </div>

          {/* Visual Dual-Tone Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-mono text-gray-500 dark:text-neutral-400 mb-2">
              <span>Paid: {taxMetrics.paidCount} Parcels ({taxMetrics.complianceRate}%)</span>
              <span>Due: {taxMetrics.dueCount} Parcels ({100 - taxMetrics.complianceRate}%)</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-none bg-gray-200 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 p-0">
              <div
                style={{ width: `${taxMetrics.complianceRate}%` }}
                className="rounded-none bg-emerald-500 transition-all duration-500"
                title={`Collected: ${taxMetrics.complianceRate}%`}
              />
            </div>
          </div>

          {/* Tax Metrics Breakdown Cards */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-none border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black p-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400">
                Realized Collections
              </span>
              <p className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{taxMetrics.totalTaxCollected}</p>
              <p className="mt-1 text-[10px] text-gray-500 dark:text-neutral-400 font-mono">Paid to Urban Local Body</p>
            </div>

            <div className="rounded-none border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black p-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400">
                Outstanding Arrears
              </span>
              <p className="mt-2 text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{taxMetrics.totalTaxDue}</p>
              <p className="mt-1 text-[10px] text-gray-500 dark:text-neutral-400 font-mono">Actionable Revenue Notice Queue</p>
            </div>
          </div>

          {/* Total Revenue Assessed Banner */}
          <div className="mt-4 flex items-center justify-between rounded-none border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black px-4 py-3 text-xs font-mono text-gray-500 dark:text-neutral-400">
            <span>Total Tax Assessed across mapped ULPINs:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white">{taxMetrics.totalTaxAssessed}</span>
          </div>
        </div>
      </div>

      {/* Title Mutation Resolution Health Indicator */}
      <div className="rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-6 text-gray-900 dark:text-white">
        <div className="flex flex-col justify-between gap-2 border-b border-gray-200 dark:border-neutral-800 pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider font-mono sm:text-base">
              Title Mutation & Dispute Resolution Workflow Health
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 font-mono">
              Department of Land Resources (DoLR) National Standards Compliance
            </p>
          </div>
          <span className="text-xs font-mono text-gray-600 dark:text-neutral-400 uppercase tracking-wider">
            Resolution: {mutationMetrics.approved} / {totalParcels} Approved
          </span>
        </div>

        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-none bg-gray-200 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-800 p-0">
          <div
            style={{ width: `${totalParcels > 0 ? (mutationMetrics.approved / totalParcels) * 100 : 0}%` }}
            className="rounded-none bg-gray-900 dark:bg-white transition-all duration-500"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-mono text-gray-600 dark:text-neutral-400">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-none bg-gray-900 dark:bg-white" />
            {mutationMetrics.approved} Titles Approved & Finalized
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-none bg-amber-500 dark:bg-amber-400" />
            {mutationMetrics.pending} Applications Pending Verification
          </span>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
