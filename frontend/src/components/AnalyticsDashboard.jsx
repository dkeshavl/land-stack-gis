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

  // Palette generator for zoning distribution bars
  const getZoneColor = (index, zone) => {
    const colors = [
      { bg: "bg-blue-600", text: "text-blue-700", badge: "bg-blue-50 text-blue-700 border-blue-200" },
      { bg: "bg-emerald-600", text: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      { bg: "bg-purple-600", text: "text-purple-700", badge: "bg-purple-50 text-purple-700 border-purple-200" },
      { bg: "bg-amber-500", text: "text-amber-700", badge: "bg-amber-50 text-amber-700 border-amber-200" },
      { bg: "bg-cyan-600", text: "text-cyan-700", badge: "bg-cyan-50 text-cyan-700 border-cyan-200" }
    ];
    if (zone.toLowerCase().includes("commercial")) return colors[2];
    if (zone.toLowerCase().includes("residential")) return colors[0];
    if (zone.toLowerCase().includes("mixed")) return colors[1];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Synthesizing Cadastral GIS Analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex-1 p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-bold text-red-700">{error || "Unable to load analytics data"}</p>
          <button
            onClick={fetchMetrics}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700"
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
    <div className="space-y-6">
      {/* Top Controls & Sync Bar */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
              Executive BI Dashboard
            </span>
            <span className="text-xs text-slate-400">• Real-Time Cadastral Intelligence</span>
          </div>
          <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
            State Land & Revenue Analytics
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetrics}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Analytics</span>
          </button>

          {onSwitchToRegistry && (
            <button
              onClick={onSwitchToRegistry}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              Manage Approvals →
            </button>
          )}
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Estimated Value */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Land Valuation
            </span>
            <span className="rounded-full bg-emerald-50 p-1.5 text-emerald-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{totalEstimatedValue}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <span>↑ Cadastral Benchmark Value</span>
          </div>
        </div>

        {/* Tax Compliance Rate */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tax Compliance
            </span>
            <span className="rounded-full bg-blue-50 p-1.5 text-blue-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 sm:text-3xl">{taxMetrics.complianceRate}%</p>
            <span className="text-xs text-slate-400">compliance</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Paid: {taxMetrics.paidCount}</span>
            <span>Due: {taxMetrics.dueCount}</span>
          </div>
        </div>

        {/* Pending Mutations / Title Transfers */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Pending Title Clearances
            </span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900 sm:text-3xl">{mutationMetrics.pending}</p>
          <div className="mt-2 text-[11px] font-semibold text-amber-800">
            {mutationMetrics.pending > 0
              ? `${mutationMetrics.pendingRate}% of registry requires verification`
              : "All title mutations cleared"}
          </div>
        </div>

        {/* Total Parcels */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cadastral Units (ULPIN)
            </span>
            <span className="rounded-full bg-slate-100 p-1.5 text-slate-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{totalParcels}</p>
          <div className="mt-2 text-[11px] text-slate-500">
            Verified GeoJSON Polygons Mapped
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Land Use & Zoning Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                Zoning & Land Use Allocation
              </h3>
              <p className="text-xs text-slate-500">
                Spatial footprint distribution according to Town Planning Master Plan
              </p>
            </div>
            <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
              Master Plan 2031
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="mt-6">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
              {zoningDistribution.map((item, idx) => {
                const color = getZoneColor(idx, item.zone);
                return (
                  <div
                    key={item.zone}
                    style={{ width: `${item.percentage}%` }}
                    className={`${color.bg} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                    title={`${item.zone}: ${item.count} parcels (${item.percentage}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Detailed Zone Cards */}
          <div className="mt-6 space-y-3">
            {zoningDistribution.map((item, idx) => {
              const color = getZoneColor(idx, item.zone);
              return (
                <div
                  key={item.zone}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${color.bg}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.zone}</p>
                      <p className="text-[10px] text-slate-400">Permissible Cadastral Density</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-900">{item.count} Parcels</span>
                    <span className="ml-2 font-mono text-xs font-semibold text-slate-500">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Municipal Tax Collection Performance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                Municipal Tax Revenue Performance
              </h3>
              <p className="text-xs text-slate-500">
                Property tax realization vs pending municipal arrears
              </p>
            </div>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              FY 2026-27
            </span>
          </div>

          {/* Visual Dual-Tone Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>Paid: {taxMetrics.paidCount} Parcels ({taxMetrics.complianceRate}%)</span>
              <span>Due: {taxMetrics.dueCount} Parcels ({100 - taxMetrics.complianceRate}%)</span>
            </div>
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-amber-200 p-0.5 shadow-inner">
              <div
                style={{ width: `${taxMetrics.complianceRate}%` }}
                className="rounded-full bg-emerald-500 transition-all duration-500"
                title={`Collected: ${taxMetrics.complianceRate}%`}
              />
            </div>
          </div>

          {/* Tax Metrics Breakdown Cards */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Realized Collections
              </span>
              <p className="mt-1 text-xl font-black text-emerald-900">{taxMetrics.totalTaxCollected}</p>
              <p className="mt-0.5 text-[10px] text-emerald-700">Paid to Urban Local Body</p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Outstanding Arrears
              </span>
              <p className="mt-1 text-xl font-black text-amber-900">{taxMetrics.totalTaxDue}</p>
              <p className="mt-0.5 text-[10px] text-amber-700">Actionable Revenue Notice Queue</p>
            </div>
          </div>

          {/* Total Revenue Assessed Banner */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
            <span className="font-semibold text-slate-600">Total Tax Assessed across mapped ULPINs:</span>
            <span className="font-mono font-bold text-slate-900">{taxMetrics.totalTaxAssessed}</span>
          </div>
        </div>
      </div>

      {/* Title Mutation Resolution Health Indicator */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              Title Mutation & Dispute Resolution Workflow Health
            </h3>
            <p className="text-xs text-slate-500">
              Department of Land Resources (DoLR) National Standards Compliance
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Resolution Ratio: {mutationMetrics.approved} / {totalParcels} Approved
          </span>
        </div>

        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
          <div
            style={{ width: `${totalParcels > 0 ? (mutationMetrics.approved / totalParcels) * 100 : 0}%` }}
            className="rounded-full bg-blue-600 transition-all duration-500"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            {mutationMetrics.approved} Titles Approved & Finalized
          </span>
          <span className="flex items-center gap-1.5 font-medium text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {mutationMetrics.pending} Applications Pending Verification
          </span>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
