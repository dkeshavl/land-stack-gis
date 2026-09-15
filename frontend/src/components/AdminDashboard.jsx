import { useState, useEffect } from "react";
import AnalyticsDashboard from "./AnalyticsDashboard";
import AuditLogsView from "./AuditLogsView";

/**
 * AdminDashboard Component for Land Stack GIS
 * For Revenue Officers / Town Planners to review and approve land record mutations.
 *
 * Props:
 * - onInspectParcel: (ulpin: string) => void (Switches to citizen map and zooms to parcel)
 */
function AdminDashboard({ onInspectParcel }) {
  const [adminTab, setAdminTab] = useState("registry"); // "registry" | "analytics" | "audit"
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTab, setFilterTab] = useState("pending"); // "pending" | "approved" | "all"
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch all parcels from backend
  const refreshParcels = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parcels");
      const result = await res.json();
      if (res.ok && result.success) {
        setParcels(result.data || []);
      } else {
        throw new Error(result.message || "Failed to load parcel registry");
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
        if (result.success) {
          setParcels(result.data || []);
        } else {
          setError(result.message || "Failed to load parcel registry");
        }
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

  // Show auto-dismissing toast
  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle approving a pending mutation
  const handleApprove = async (ulpin) => {
    setActionLoading((prev) => ({ ...prev, [ulpin]: true }));
    try {
      const res = await fetch(`/api/parcel/${ulpin}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const result = await res.json();

      if (res.ok && result.success) {
        // Update local state dynamically
        setParcels((prev) =>
          prev.map((item) =>
            item.ulpin === ulpin
              ? {
                  ...item,
                  ownership: {
                    ...item.ownership,
                    mutationStatus: "Approved",
                    approvedAt: result.data?.ownership?.approvedAt || new Date().toISOString()
                  }
                }
              : item
          )
        );
        showToast(`Mutation approved for ULPIN: ${ulpin}`);
      } else {
        throw new Error(result.message || "Failed to approve mutation");
      }
    } catch (err) {
      console.error("Approval error:", err);
      showToast(err.message || "Approval request failed", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [ulpin]: false }));
    }
  };

  // Stats calculation
  const totalParcels = parcels.length;
  const pendingParcels = parcels.filter(
    (p) => (p.ownership?.mutationStatus || "").toLowerCase() === "pending"
  );
  const approvedParcels = parcels.filter(
    (p) => (p.ownership?.mutationStatus || "").toLowerCase() === "approved"
  );

  // Filtered parcels based on tab and search
  const displayedParcels = parcels
    .filter((p) => {
      const status = (p.ownership?.mutationStatus || "").toLowerCase();
      if (filterTab === "pending") return status === "pending";
      if (filterTab === "approved") return status === "approved";
      return true;
    })
    .filter((p) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchUlpin = p.ulpin.toLowerCase().includes(term);
      const matchOwner = p.ownership?.ownerName?.toLowerCase().includes(term);
      const matchKhasra = p.ownership?.khasraNumber?.toLowerCase().includes(term);
      const matchZone = p.zoning?.zoneType?.toLowerCase().includes(term);
      return matchUlpin || matchOwner || matchKhasra || matchZone;
    });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-5 sm:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xl backdrop-blur transition">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              toastMessage.type === "error"
                ? "bg-red-100 text-red-600"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {toastMessage.type === "error" ? "✕" : "✓"}
          </div>
          <span className="text-sm font-semibold text-slate-800">{toastMessage.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
              Department of Revenue
            </span>
            <span className="text-xs font-semibold text-slate-400">SIH 26014 Workflow Engine</span>
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Land Records Governance Portal
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Review ownership title mutations, zoning compliance, and municipal clearance requests.
          </p>
        </div>

        {adminTab === "registry" && (
          <button
            onClick={refreshParcels}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95 disabled:opacity-50 sm:self-auto"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Records
          </button>
        )}
      </div>

      {/* Top Level Navigation Tabs: Registry vs Analytics */}
      <div className="mb-6 flex items-center border-b border-slate-200">
        <button
          onClick={() => setAdminTab("registry")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            adminTab === "registry"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Parcel Registry & Approvals</span>
          {pendingParcels.length > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-800">
              {pendingParcels.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab("analytics")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            adminTab === "analytics"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Analytics & Insights</span>
        </button>

        <button
          onClick={() => setAdminTab("audit")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            adminTab === "audit"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Audit Logs & Security Trail</span>
        </button>
      </div>

      {adminTab === "analytics" ? (
        <AnalyticsDashboard onSwitchToRegistry={() => setAdminTab("registry")} />
      ) : adminTab === "audit" ? (
        <AuditLogsView onInspectParcel={onInspectParcel} />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered Parcels</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{totalParcels}</p>
              <p className="mt-1 text-xs text-slate-400">Synchronized with Leaflet Spatial Engine</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Review</p>
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-amber-900">{pendingParcels.length}</p>
              <p className="mt-1 text-xs text-amber-700">Action required from Revenue Officer</p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Approved Mutations</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-900">{approvedParcels.length}</p>
              <p className="mt-1 text-xs text-emerald-700">Updated across Cadastral registries</p>
            </div>
          </div>

      {/* Filter and Search Bar */}
      <div className="mb-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {/* Filter Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setFilterTab("pending")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              filterTab === "pending"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Pending Review</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                filterTab === "pending" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {pendingParcels.length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab("approved")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              filterTab === "approved"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Approved</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                filterTab === "approved" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {approvedParcels.length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab("all")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              filterTab === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Parcels ({totalParcels})
          </button>
        </div>

        {/* Search within Admin */}
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by ULPIN, Owner, Khasra..."
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Main Table / Card View */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-500">Loading cadastral registry records...</p>
          </div>
        </div>
      ) : displayedParcels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
            ✓
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">
            {filterTab === "pending" ? "No Pending Mutations" : "No Records Found"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {filterTab === "pending"
              ? "All parcel ownership mutation applications have been processed and approved."
              : "No parcels match the current filter or search criteria."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">ULPIN</th>
                  <th className="px-5 py-3.5">Owner & Khasra</th>
                  <th className="px-5 py-3.5">Zoning / Land Use</th>
                  <th className="px-5 py-3.5">Property Tax</th>
                  <th className="px-5 py-3.5">Mutation Status</th>
                  <th className="px-5 py-3.5 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedParcels.map((parcel) => {
                  const ulpin = parcel.ulpin;
                  const isPending =
                    (parcel.ownership?.mutationStatus || "").toLowerCase() === "pending";
                  const isUpdating = actionLoading[ulpin];

                  return (
                    <tr
                      key={ulpin}
                      className="transition hover:bg-slate-50/80"
                    >
                      {/* ULPIN */}
                      <td className="whitespace-nowrap px-5 py-4 font-mono font-bold text-blue-700">
                        <div className="flex items-center gap-2">
                          <span>{ulpin}</span>
                          {onInspectParcel && (
                            <button
                              onClick={() => onInspectParcel(ulpin)}
                              title="Inspect on GIS Map"
                              className="rounded p-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Owner & Khasra */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{parcel.ownership?.ownerName || "Unknown"}</div>
                        {parcel.ownership?.pendingNewOwner && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/60">
                            <span>Transfer to:</span>
                            <span className="font-bold text-amber-900">{parcel.ownership.pendingNewOwner}</span>
                          </div>
                        )}
                        {parcel.ownership?.transferReason && (
                          <div className="text-[10px] text-slate-400">Reason: {parcel.ownership.transferReason}</div>
                        )}
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          Khasra No: <span className="font-semibold text-slate-700">{parcel.ownership?.khasraNumber || "-"}</span>
                        </div>
                      </td>

                      {/* Zoning */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{parcel.zoning?.zoneType || "General"}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{parcel.zoning?.landUse || "-"}</div>
                      </td>

                      {/* Tax */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            parcel.tax?.propertyTaxStatus === "Paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {parcel.tax?.propertyTaxStatus || "Unknown"}
                        </span>
                        <div className="mt-1 text-[11px] text-slate-500">{parcel.tax?.amount || "-"}</div>
                      </td>

                      {/* Mutation Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            isPending
                              ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                              : "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isPending ? "bg-amber-500 animate-ping" : "bg-emerald-500"
                            }`}
                          />
                          {parcel.ownership?.mutationStatus || "Pending"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        {isPending ? (
                          <button
                            onClick={() => handleApprove(ulpin)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {isUpdating ? (
                              <>
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                <span>Approving...</span>
                              </>
                            ) : (
                              <>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Approve Title</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
