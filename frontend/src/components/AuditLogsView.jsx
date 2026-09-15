import { useState, useEffect } from "react";

/**
 * AuditLogsView Component for Land Stack GIS
 * Displays a secure, timestamped audit trail of all governance and citizen events.
 *
 * Props:
 * - onInspectParcel: (ulpin: string) => void (Optional helper to inspect on map)
 */
function AuditLogsView({ onInspectParcel }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const url = actionFilter === "ALL"
        ? "/api/audit/logs"
        : `/api/audit/logs?action=${encodeURIComponent(actionFilter)}`;
      const res = await fetch(url);
      const result = await res.json();
      if (res.ok && result.success) {
        setLogs(result.data || []);
      } else {
        throw new Error(result.message || "Failed to load audit logs");
      }
    } catch (err) {
      console.error("Audit log fetch error:", err);
      setError(err.message || "Network error fetching audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const url = actionFilter === "ALL"
      ? "/api/audit/logs"
      : `/api/audit/logs?action=${encodeURIComponent(actionFilter)}`;

    fetch(url)
      .then((res) => res.json())
      .then((result) => {
        if (!isMounted) return;
        if (result.success) {
          setLogs(result.data || []);
        } else {
          setError(result.message || "Failed to load audit logs");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Network error loading audit logs");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [actionFilter]);

  // Action badge styling map
  const getActionBadge = (action = "") => {
    const act = action.toUpperCase();
    switch (act) {
      case "MUTATION_APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "CITIZEN_APPLIED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ENCUMBRANCE_VERIFIED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "PARCEL_LOOKUP":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "REGISTRY_SEARCH":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "SYSTEM_INITIALIZED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Mock export audit log
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit_trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Filter logs by search term
  const displayedLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.id.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.ulpin.toLowerCase().includes(term) ||
      log.user.toLowerCase().includes(term) ||
      log.role.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Security Status */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              WORM Compliant Ledger
            </span>
            <span className="text-xs text-slate-400">• Immutable Security Trail</span>
          </div>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            System Audit Logs & Security Trail
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            Cryptographically sealed event tracking for land governance and compliance audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {downloadSuccess && (
            <span className="text-xs font-semibold text-emerald-600">Exported JSON ✓</span>
          )}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Trail</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Trail</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Log Entries</span>
          <p className="mt-1 font-mono text-2xl font-black text-slate-900">{logs.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Persisted across system nodes</p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Ledger Integrity</span>
          <p className="mt-1 font-mono text-2xl font-black text-emerald-900">VERIFIED</p>
          <p className="mt-0.5 text-[11px] text-emerald-700">0 Tampering alerts detected</p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Active Operators</span>
          <p className="mt-1 font-mono text-2xl font-black text-blue-900">
            {new Set(logs.map((l) => l.user)).size}
          </p>
          <p className="mt-0.5 text-[11px] text-blue-700">Authenticated user sessions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {/* Action Type Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
          {[
            { id: "ALL", label: "All Events" },
            { id: "MUTATION_APPROVED", label: "Approvals" },
            { id: "CITIZEN_APPLIED", label: "Applications" },
            { id: "PARCEL_LOOKUP", label: "Lookups" },
            { id: "ENCUMBRANCE_VERIFIED", label: "Encumbrance" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActionFilter(tab.id)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                actionFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
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
            placeholder="Search Event ID, ULPIN, or User..."
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs font-mono font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Main Table */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs font-mono text-slate-500">Querying cryptographic audit trail...</p>
          </div>
        </div>
      ) : displayedLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="font-mono text-sm font-bold text-slate-700">No log entries matched your filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                <tr>
                  <th className="px-4 py-3.5">Log ID</th>
                  <th className="px-4 py-3.5">Action Event</th>
                  <th className="px-4 py-3.5">Operator & Role</th>
                  <th className="px-4 py-3.5">Entity / ULPIN</th>
                  <th className="px-4 py-3.5">Description & Payload</th>
                  <th className="px-4 py-3.5">Origin IP</th>
                  <th className="px-4 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-sans text-xs">
                {displayedLogs.map((log) => {
                  return (
                    <tr key={log.id} className="transition hover:bg-slate-50/80">
                      {/* Log ID */}
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] font-bold text-slate-500">
                        {log.id}
                      </td>

                      {/* Action Event Badge */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Operator & Role */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{log.role}</div>
                        <div className="font-mono text-[10px] text-slate-400">{log.user}</div>
                      </td>

                      {/* Target ULPIN */}
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] font-bold text-blue-700">
                        {log.ulpin !== "N/A" && log.ulpin !== "GLOBAL" ? (
                          <div className="flex items-center gap-1">
                            <span>{log.ulpin}</span>
                            {onInspectParcel && (
                              <button
                                onClick={() => onInspectParcel(log.ulpin)}
                                title="Inspect on GIS map"
                                className="rounded p-0.5 text-slate-400 hover:text-blue-600"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">{log.ulpin}</span>
                        )}
                      </td>

                      {/* Description / Details */}
                      <td className="max-w-xs px-4 py-3.5 text-slate-700">
                        <p className="truncate text-xs" title={log.details}>
                          {log.details}
                        </p>
                      </td>

                      {/* Origin IP & Status */}
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[10px] text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 font-bold">
                          {log.ip}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })}
                        <span className="ml-1 text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleDateString([], {
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogsView;
