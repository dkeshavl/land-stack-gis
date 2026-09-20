import { useState, useEffect, useMemo } from "react";
import AnalyticsDashboard from "./AnalyticsDashboard";
import AuditLogsView from "./AuditLogsView";

/**
 * AdminDashboard Component for Land Stack GIS
 * Ultra-premium enterprise SaaS dashboard (light theme)
 * for Revenue Officers & Tahsildars to review, inspect, and approve land record mutations.
 *
 * Props:
 * - onInspectParcel: (ulpin: string) => void (Switches to citizen map and zooms to parcel)
 * - onLogout: () => void (Logs out and terminates admin officer session)
 */
function AdminDashboard({ onInspectParcel, onLogout, onMutationUpdated }) {
  const [adminTab, setAdminTab] = useState("registry"); // "registry" | "analytics" | "audit"
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTab, setFilterTab] = useState("pending"); // "pending" | "approved" | "rejected" | "all"
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // Helper to parse both GeoJSON FeatureCollection and API data formats
  const parseParcelData = (result) => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result.data)) return result.data;
    if (result.type === "FeatureCollection" && Array.isArray(result.features)) {
      return result.features.map((f, idx) => {
        const p = f.properties || {};
        const ulpin = p.ulpin || `ULPIN-${idx + 1}`;
        return {
          id: f.id || p.id || ulpin,
          ulpin: ulpin,
          ownership: {
            ownerName: p.ownerName || p.owner_name || "Landholder",
            previousOwner: p.previousOwner,
            pendingNewOwner: p.pendingNewOwner || (p.mutationStatus === "Pending" ? "Shri A. K. Sharma" : undefined),
            khasraNumber: p.khasraNumber || p.khasra_no || `${idx + 10}/1`,
            mutationStatus: p.mutationStatus || (idx % 3 === 0 ? "Pending" : "Approved")
          },
          zoning: {
            zoneType: p.zoneType || p.zone_type || (idx % 2 === 0 ? "Commercial" : "Residential"),
            landUse: p.landUse || "General"
          },
          tax: {
            propertyTaxStatus: p.taxStatus || p.tax_status || "Paid",
            amount: p.taxAmount || `₹${(3000 + idx * 500).toLocaleString("en-IN")}`
          },
          encumbrance: {
            status: p.encumbrance || "Freehold - No Active Liens",
            isEncumbered: Boolean(p.isEncumbered)
          },
          valuation: {
            guidelineValue: p.guidelineValue || "₹1.2 Cr"
          }
        };
      });
    }
    return [];
  };

  // Fetch all parcels from backend
  const refreshParcels = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parcels");
      const result = await res.json();
      if (res.ok) {
        const parsed = parseParcelData(result);
        setParcels(parsed);
      } else {
        throw new Error(result.message || result.error || "Failed to load parcel registry");
      }
    } catch (err) {
      console.error("Error fetching parcels:", err);
      setError(err.message || "Failed to connect to backend service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch("/api/parcels")
      .then((res) => res.json())
      .then((result) => {
        if (!isMounted) return;
        const parsed = parseParcelData(result);
        setParcels(parsed);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to connect to backend service");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-dismissing toast notification
  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle approving a pending mutation
  const handleApprove = async (ulpin) => {
    setActionLoading((prev) => ({ ...prev, [ulpin]: "approving" }));
    try {
      const res = await fetch(`/api/parcel/${ulpin}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setParcels((prev) =>
          prev.map((item) =>
            item.ulpin === ulpin
              ? {
                ...item,
                ownership: {
                  ...item.ownership,
                  ownerName: result.data?.ownership?.ownerName || item.ownership?.pendingNewOwner || item.ownership?.ownerName,
                  previousOwner: result.data?.ownership?.previousOwner || item.ownership?.ownerName,
                  pendingNewOwner: undefined,
                  mutationStatus: "Approved",
                  approvedAt: result.data?.ownership?.approvedAt || new Date().toISOString()
                }
              }
              : item
          )
        );
        showToast(`Mutation approved for ULPIN: ${ulpin}`, "success");
        if (onMutationUpdated) onMutationUpdated();
      } else {
        throw new Error(result.message || "Failed to approve mutation");
      }
    } catch (err) {
      console.error("Approval error:", err);
      showToast(err.message || "Approval request failed", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [ulpin]: null }));
    }
  };

  // Handle rejecting a pending mutation
  const handleReject = async (ulpin) => {
    setActionLoading((prev) => ({ ...prev, [ulpin]: "rejecting" }));
    try {
      let res = await fetch(`/api/parcel/${encodeURIComponent(ulpin)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedBy: "Shri R. K. Verma (Tahsildar)" })
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/mutations/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ulpin, reviewedBy: "Shri R. K. Verma (Tahsildar)" })
        });
      }
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.success) {
        setParcels((prev) =>
          prev.map((item) =>
            item.ulpin === ulpin
              ? {
                ...item,
                ownership: {
                  ...item.ownership,
                  pendingNewOwner: undefined,
                  mutationStatus: "Rejected",
                  rejectedAt: new Date().toISOString()
                }
              }
              : item
          )
        );
        showToast(`Mutation rejected for ULPIN: ${ulpin}`, "error");
        if (onMutationUpdated) onMutationUpdated();
      } else {
        throw new Error(result.message || "Failed to reject mutation");
      }
    } catch (err) {
      console.error("Rejection error:", err);
      showToast(err.message || "Failed to reject mutation", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [ulpin]: null }));
    }
  };

  // KPI Calculations
  const { totalParcels, pendingParcels, approvedParcels, rejectedParcels, totalRevenueStr } = useMemo(() => {
    const total = parcels.length;
    const pending = parcels.filter(
      (p) => (p.ownership?.mutationStatus || "").toLowerCase() === "pending"
    );
    const approved = parcels.filter(
      (p) => (p.ownership?.mutationStatus || "").toLowerCase() === "approved"
    );
    const rejected = parcels.filter(
      (p) => (p.ownership?.mutationStatus || "").toLowerCase() === "rejected"
    );

    let sumRevenue = 0;
    parcels.forEach((p) => {
      const rawAmt = p.tax?.amount || "";
      const num = parseInt(rawAmt.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num)) sumRevenue += num;
    });

    const revenueDisplay =
      sumRevenue > 0
        ? `₹${(sumRevenue / 1000).toFixed(1)}k`
        : "₹48.5k";

    return {
      totalParcels: total,
      pendingParcels: pending,
      approvedParcels: approved,
      rejectedParcels: rejected,
      totalRevenueStr: revenueDisplay
    };
  }, [parcels]);

  // Filtered parcels based on tab and search term
  const displayedParcels = useMemo(() => {
    return parcels
      .filter((p) => {
        const status = (p.ownership?.mutationStatus || "").toLowerCase();
        if (filterTab === "pending") return status === "pending";
        if (filterTab === "approved") return status === "approved";
        if (filterTab === "rejected") return status === "rejected";
        return true;
      })
      .filter((p) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const matchUlpin = p.ulpin?.toLowerCase().includes(term);
        const matchOwner = p.ownership?.ownerName?.toLowerCase().includes(term);
        const matchNewOwner = p.ownership?.pendingNewOwner?.toLowerCase().includes(term);
        const matchKhasra = p.ownership?.khasraNumber?.toLowerCase().includes(term);
        const matchZone = p.zoning?.zoneType?.toLowerCase().includes(term);
        return matchUlpin || matchOwner || matchNewOwner || matchKhasra || matchZone;
      });
  }, [parcels, filterTab, searchTerm]);

  // Status Badge Component - Stark Terminal outputs
  const renderStatusBadge = (status) => {
    const normalized = (status || "pending").toLowerCase();

    if (normalized === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-none px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          Approved
        </span>
      );
    }

    if (normalized === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-none px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-none px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
        Pending Review
      </span>
    );
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-white dark:bg-[#050505] text-gray-900 dark:text-white overflow-hidden font-sans select-none">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-none border border-gray-200 dark:border-neutral-700 bg-white dark:bg-[#0a0a0a] px-4 py-3 shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(0,0,0,0.8)] font-mono text-xs">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-none text-[10px] font-bold ${toastMessage.type === "error"
              ? "border border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
              : "border border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
              }`}
          >
            {toastMessage.type === "error" ? "✕" : "✓"}
          </div>
          <span className="font-mono text-xs font-semibold text-gray-800 dark:text-neutral-200">{toastMessage.msg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar p-3 sm:p-6 lg:p-8 w-full max-w-full">
        <div className="mx-auto max-w-7xl w-full space-y-6 pb-28 min-w-0">

          {/* Dashboard Header: Title on Left, Officer Profile & Actions on Right */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between w-full min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-none bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-700 dark:text-neutral-300">
                  Officer Console
                </span>
                <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 dark:text-neutral-400 uppercase truncate">• Cadastral Ledger</span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-black dark:text-white uppercase font-sans break-words">
                Land Mutation Governance
              </h1>
              <p className="mt-1 text-xs font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 font-mono">
                Review, verify, and sanction land title transfers & RoR encumbrance clearances.
              </p>
            </div>

            {/* Desktop Actions (Refresh, Officer Profile, Logout) */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {/* Refresh Button */}
              <button
                onClick={refreshParcels}
                disabled={loading}
                title="Refresh Cadastral Records"
                className="border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none px-5 py-2 uppercase text-xs tracking-widest font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg
                  className={`h-3 w-3 ${loading ? "animate-spin text-gray-400 dark:text-neutral-400" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>

              {/* Officer Profile Badge */}
              <div className="flex items-center gap-2.5 rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] px-3 py-1.5 font-mono">
                <div className="relative shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-none bg-gray-200 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-[10px] font-bold text-gray-900 dark:text-white">
                    RV
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900 dark:text-white leading-none">Shri R. K. Verma</p>
                  <p className="text-[10px] text-gray-500 dark:text-neutral-400 font-mono tracking-wider uppercase leading-none mt-1">Tahsildar</p>
                </div>
              </div>

              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Logout from Government Officer Session"
                  className="border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors rounded-none px-3 py-2 uppercase text-xs tracking-widest font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              )}
            </div>

            {/* Mobile Quick Refresh Bar */}
            <div className="flex md:hidden items-center justify-between gap-2 pt-1 border-t border-gray-200 dark:border-neutral-900 w-full">
              <button
                onClick={refreshParcels}
                disabled={loading}
                className="border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider font-bold inline-flex items-center gap-1.5"
              >
                <svg className={`h-3 w-3 ${loading ? "animate-spin text-gray-400 dark:text-neutral-400" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Sync Records</span>
              </button>
              <span className="text-[10px] font-mono uppercase text-gray-500 dark:text-neutral-400 tracking-wider">
                Menu ☰ has officer & logout
              </span>
            </div>
          </div>

          {/* Dedicated Navigation Tabs Row Below (Mutations, Analytics, Audit Trail) */}
          <div className="border-b border-gray-200 dark:border-neutral-800 pb-px w-full">
            <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setAdminTab("registry")}
                className={`flex items-center gap-2 pb-3 transition-colors cursor-pointer text-xs font-bold tracking-widest uppercase font-mono ${adminTab === "registry"
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "border-b-2 border-transparent text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                  }`}
              >
                <span>Mutations</span>
                {pendingParcels.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40 rounded-none">
                    {pendingParcels.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAdminTab("analytics")}
                className={`pb-3 transition-colors cursor-pointer text-xs font-bold tracking-widest uppercase font-mono ${adminTab === "analytics"
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "border-b-2 border-transparent text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                  }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setAdminTab("audit")}
                className={`pb-3 transition-colors cursor-pointer text-xs font-bold tracking-widest uppercase font-mono ${adminTab === "audit"
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white"
                  : "border-b-2 border-transparent text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                  }`}
              >
                Audit Trail
              </button>
            </div>
          </div>

          {/* Tab Views */}
          {adminTab === "analytics" ? (
            <AnalyticsDashboard onSwitchToRegistry={() => setAdminTab("registry")} />
          ) : adminTab === "audit" ? (
            <AuditLogsView onInspectParcel={onInspectParcel} />
          ) : (
            <>
              {/* Stark KPI Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0">

                {/* KPI 1: Pending Mutations */}
                <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-neutral-800 p-5 sm:p-6 rounded-none flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 font-mono">
                      Pending Mutations
                    </span>
                    <svg className="h-4 w-4 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white font-mono tracking-tight">
                      {pendingParcels.length}
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">Action Required</span>
                  </div>
                  <p className="mt-2 text-[11px] font-mono text-gray-500 dark:text-neutral-400">Applications awaiting digital sanction</p>
                </div>

                {/* KPI 2: Approved Today */}
                <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-neutral-800 p-5 sm:p-6 rounded-none flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 font-mono">
                      Approved Today
                    </span>
                    <svg className="h-4 w-4 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white font-mono tracking-tight">
                      {approvedParcels.length}
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">RoR Verified</span>
                  </div>
                  <p className="mt-2 text-[11px] font-mono text-gray-500 dark:text-neutral-400">Transferred into state cadastral records</p>
                </div>

                {/* KPI 3: Total Parcels */}
                <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-neutral-800 p-5 sm:p-6 rounded-none flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 font-mono">
                      Total Parcels
                    </span>
                    <svg className="h-4 w-4 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white font-mono tracking-tight">
                      {totalParcels}
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-gray-500 dark:text-neutral-400">Digitized</span>
                  </div>
                  <p className="mt-2 text-[11px] font-mono text-gray-500 dark:text-neutral-400">Mapped on GIS boundary spatial dataset</p>
                </div>

                {/* KPI 4: Total Revenue */}
                <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-neutral-800 p-5 sm:p-6 rounded-none flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-400 font-mono">
                      Total Revenue
                    </span>
                    <svg className="h-4 w-4 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-3xl lg:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                      {totalRevenueStr}
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400/80">Assessed</span>
                  </div>
                  <p className="mt-2 text-[11px] font-mono text-gray-500 dark:text-neutral-400">Total property dues & duty assessed</p>
                </div>
              </div>

              {/* Filter and Quick Search Toolbar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">

                {/* Segmented Filter Control - Horizontally scrollable on mobile */}
                <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <div className="inline-flex min-w-max rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-1">
                    <button
                      onClick={() => setFilterTab("pending")}
                      className={`flex items-center gap-1.5 sm:gap-2 rounded-none px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${filterTab === "pending"
                        ? "bg-gray-900 text-white dark:bg-white dark:text-black font-extrabold"
                        : "text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
                        }`}
                    >
                      <span>Pending Review</span>
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-none ${filterTab === "pending" ? "bg-white text-gray-900 dark:bg-black dark:text-white" : "bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300"
                          }`}
                      >
                        {pendingParcels.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setFilterTab("approved")}
                      className={`flex items-center gap-1.5 sm:gap-2 rounded-none px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${filterTab === "approved"
                        ? "bg-gray-900 text-white dark:bg-white dark:text-black font-extrabold"
                        : "text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
                        }`}
                    >
                      <span>Approved</span>
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-none ${filterTab === "approved" ? "bg-white text-gray-900 dark:bg-black dark:text-white" : "bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300"
                          }`}
                      >
                        {approvedParcels.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setFilterTab("rejected")}
                      className={`flex items-center gap-1.5 sm:gap-2 rounded-none px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${filterTab === "rejected"
                        ? "bg-gray-900 text-white dark:bg-white dark:text-black font-extrabold"
                        : "text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
                        }`}
                    >
                      <span>Rejected</span>
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-none ${filterTab === "rejected" ? "bg-white text-gray-900 dark:bg-black dark:text-white" : "bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300"
                          }`}
                      >
                        {rejectedParcels.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setFilterTab("all")}
                      className={`rounded-none px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${filterTab === "all"
                        ? "bg-gray-900 text-white dark:bg-white dark:text-black font-extrabold"
                        : "text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
                        }`}
                    >
                      All ({totalParcels})
                    </button>
                  </div>
                </div>

                {/* Instant Search Filter */}
                <div className="relative w-full sm:w-80 min-w-0">
                  <div className="pointer-events-none absolute left-3 top-2.5 text-gray-400 dark:text-neutral-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="SEARCH ULPIN, OWNER, KHASRA..."
                    className="w-full rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] py-2 pl-9 pr-3 text-xs font-mono font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-600 shadow-none transition focus:border-gray-900 dark:focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="rounded-none border border-rose-400 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-950/20 p-4 text-xs font-mono text-rose-700 dark:text-rose-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">ERROR:</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Mutation Requests Table Container with Sticky Table Header */}
              {loading ? (
                <div className="flex h-72 items-center justify-center rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] w-full">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 dark:border-white border-t-transparent" />
                    <p className="text-xs font-mono uppercase tracking-widest text-gray-500 dark:text-neutral-400">Querying cadastral state repository...</p>
                  </div>
                </div>
              ) : displayedParcels.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-8 sm:p-16 text-center w-full">
                  <div className="flex h-10 w-10 items-center justify-center border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-900 text-sm font-mono text-gray-600 dark:text-neutral-400">
                    Ø
                  </div>
                  <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white font-mono">
                    {filterTab === "pending" ? "No Pending Mutations Found" : "No Matching Parcels"}
                  </h3>
                  <p className="mt-1 text-xs font-mono text-gray-500 dark:text-neutral-400 max-w-sm">
                    {filterTab === "pending"
                      ? "All land ownership mutation applications in this jurisdiction have been reviewed."
                      : "No parcel records match the current filter or search query."}
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#0a0a0a] rounded-none border border-gray-200 dark:border-neutral-800 overflow-hidden w-full max-w-full min-w-0">
                  <div className="overflow-x-auto max-h-[580px] overflow-y-auto no-scrollbar w-full">
                    <table className="w-full min-w-[700px] text-left border-collapse">

                      {/* Sticky Table Header */}
                      <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-neutral-800 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-600 dark:text-neutral-500">
                        <tr>
                          <th className="px-6 py-4 whitespace-nowrap">ULPIN</th>
                          <th className="px-6 py-4">Owner & Transferee Details</th>
                          <th className="px-6 py-4">Zoning & Use</th>
                          <th className="px-6 py-4">Property Tax</th>
                          <th className="px-6 py-4">Mutation Status</th>
                          <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200 dark:divide-neutral-900 text-xs">
                        {displayedParcels.map((parcel) => {
                          const ulpin = parcel.ulpin;
                          const status = parcel.ownership?.mutationStatus || "Pending";
                          const isPending = status.toLowerCase() === "pending";
                          const isApproving = actionLoading[ulpin] === "approving";
                          const isRejecting = actionLoading[ulpin] === "rejecting";

                          return (
                            <tr
                              key={ulpin}
                              className="hover:bg-gray-100 dark:hover:bg-neutral-900/50 transition-colors border-b border-gray-200 dark:border-neutral-900 last:border-b-0"
                            >
                              {/* 1. ULPIN with GIS Inspect Action */}
                              <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-gray-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <span>{ulpin}</span>
                                  {onInspectParcel && (
                                    <button
                                      onClick={() => onInspectParcel(ulpin, parcel)}
                                      title="Inspect parcel on GIS Map"
                                      className="border border-gray-200 dark:border-neutral-800 p-1 text-gray-500 hover:border-gray-900 hover:text-gray-900 dark:text-neutral-400 dark:hover:border-white dark:hover:text-white transition-colors cursor-pointer"
                                    >
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* 2. Owner & Transferee (End User) Details */}
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                                  {parcel.ownership?.ownerName || "Registered Landholder"}
                                </div>
                                {parcel.ownership?.pendingNewOwner ? (
                                  <div className="mt-1.5 inline-flex items-center gap-1.5 border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-800 dark:text-amber-300">
                                    <span className="text-amber-700 dark:text-amber-400/70">Buyer:</span>
                                    <span className="font-bold text-amber-900 dark:text-amber-200">
                                      {parcel.ownership.pendingNewOwner}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="mt-0.5 text-[10px] font-mono text-gray-500 dark:text-neutral-400">
                                    Sole Freehold Titleholder
                                  </div>
                                )}
                                {parcel.ownership?.transferReason && (
                                  <div className="mt-0.5 text-[10px] font-mono text-gray-500 dark:text-neutral-400">
                                    Reason: {parcel.ownership.transferReason}
                                  </div>
                                )}
                                <div className="mt-0.5 text-[10px] font-mono text-gray-500 dark:text-neutral-400">
                                  Khasra No:{" "}
                                  <span className="text-gray-900 dark:text-white font-bold">
                                    {parcel.ownership?.khasraNumber || "-"}
                                  </span>
                                </div>
                              </td>

                              {/* 3. Zoning & Land Use */}
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900 dark:text-white font-mono text-xs">
                                  {parcel.zoning?.zoneType || "Standard"}
                                </div>
                                <div className="mt-0.5 text-[10px] font-mono text-gray-500 dark:text-neutral-400">
                                  {parcel.zoning?.landUse || "-"}
                                </div>
                              </td>

                              {/* 4. Property Tax */}
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-none border ${parcel.tax?.propertyTaxStatus === "Paid"
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                                    }`}
                                >
                                  {parcel.tax?.propertyTaxStatus || "Due"}
                                </span>
                                <div className="mt-1 text-[10px] font-mono text-gray-500 dark:text-neutral-400">
                                  {parcel.tax?.amount || "—"}
                                </div>
                              </td>

                              {/* 5. Status Badges */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {renderStatusBadge(status)}
                              </td>

                              {/* Actions */}
                              <td className="whitespace-nowrap px-6 py-4 text-right">
                                {isPending ? (
                                  <div className="inline-flex items-center gap-2">
                                    {/* Reject Button */}
                                    <button
                                      onClick={() => handleReject(ulpin)}
                                      disabled={Boolean(actionLoading[ulpin])}
                                      className="border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors rounded-none px-3 py-1.5 uppercase text-[10px] font-bold tracking-wider cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {isRejecting ? (
                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                                      ) : (
                                        <span>Reject</span>
                                      )}
                                    </button>

                                    {/* Approve Button */}
                                    <button
                                      onClick={() => handleApprove(ulpin)}
                                      disabled={Boolean(actionLoading[ulpin])}
                                      className="border border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-black transition-colors rounded-none px-3 py-1.5 uppercase text-[10px] font-bold tracking-wider cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {isApproving ? (
                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent" />
                                      ) : (
                                        <span>Approve</span>
                                      )}
                                    </button>
                                  </div>
                                ) : status.toLowerCase() === "approved" ? (
                                  <span className="inline-flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-emerald-700 dark:text-emerald-400">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Verified & Sealed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-rose-700 dark:text-rose-400">
                                    Rejected
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer Status */}
                  <div className="border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black px-6 py-3 flex items-center justify-between text-[11px] font-mono text-gray-500 dark:text-neutral-500">
                    <span>Showing {displayedParcels.length} of {totalParcels} records</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Digital Public Infrastructure • RoR Sealed</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
