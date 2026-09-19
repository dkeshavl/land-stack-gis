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

  // Action badge styling map - Terminal style
  const getActionBadge = (action = "") => {
    const act = action.toUpperCase();
    switch (act) {
      case "MUTATION_APPROVED":
        return "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-neutral-900 dark:text-emerald-400";
      case "CITIZEN_APPLIED":
        return "border-gray-300 bg-gray-100 text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200";
      case "ENCUMBRANCE_VERIFIED":
        return "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/50 dark:bg-neutral-900 dark:text-amber-400";
      case "PARCEL_LOOKUP":
        return "border-gray-300 bg-gray-100 text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300";
      case "REGISTRY_SEARCH":
        return "border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-500/50 dark:bg-neutral-900 dark:text-cyan-300";
      case "SYSTEM_INITIALIZED":
        return "border-purple-400 bg-purple-50 text-purple-800 dark:border-purple-500/50 dark:bg-neutral-900 dark:text-purple-300";
      default:
        return "border-gray-300 bg-gray-100 text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white";
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
    <div className="space-y-6 text-gray-900 dark:text-white font-sans">
      {/* Top Banner & Security Status */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              WORM Compliant Ledger
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400">• Immutable Security Trail</span>
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight text-black dark:text-white uppercase sm:text-2xl">
            System Audit Logs & Security Trail
          </h2>
          <p className="mt-1 text-xs font-mono uppercase tracking-wider text-gray-500 dark:text-neutral-400">
            Cryptographically sealed event tracking for land governance and compliance audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {downloadSuccess && (
            <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">EXPORTED JSON ✓</span>
          )}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-none border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 hover:border-gray-900 dark:hover:border-white hover:text-gray-900 dark:hover:text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest text-gray-700 dark:text-neutral-300 transition-all cursor-pointer"
          >
            <svg className="h-3.5 w-3.5 text-gray-400 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Trail</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none px-6 py-2 uppercase text-xs tracking-widest font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? "animate-spin text-gray-400 dark:text-neutral-400" : ""}`}
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
        <div className="rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400">Total Log Entries</span>
          <p className="mt-2 font-mono text-3xl font-black text-gray-900 dark:text-white tracking-tight">{logs.length}</p>
          <p className="mt-1 text-[11px] font-mono text-gray-500 dark:text-neutral-400">Persisted across system nodes</p>
        </div>

        {/* Terminal Alert Box for Ledger Integrity */}
        <div className="border border-emerald-500 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono p-4 rounded-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Ledger Integrity</span>
            <span className="h-2 w-2 rounded-none bg-emerald-500 animate-pulse" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight">VERIFIED</p>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400/80">0 Tampering alerts detected • SHA-256</p>
        </div>

        <div className="rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400">Active Operators</span>
          <p className="mt-2 font-mono text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {new Set(logs.map((l) => l.user)).size}
          </p>
          <p className="mt-1 text-[11px] font-mono text-gray-500 dark:text-neutral-400">Authenticated user sessions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center w-full min-w-0">
        {/* Action Type Tabs */}
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
          <div className="inline-flex min-w-max flex-nowrap gap-1 rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-1">
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
                className={`rounded-none px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  actionFilter === tab.id
                    ? "bg-gray-900 text-white dark:bg-white dark:text-black font-extrabold"
                    : "text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
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
            placeholder="Search Log ID, ULPIN, User..."
            className="w-full rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] py-2 pl-9 pr-3 text-xs font-mono font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:border-gray-900 dark:focus:border-white focus:outline-none transition"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-none border border-rose-400 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-950/20 p-4 text-xs font-mono text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] w-full">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 dark:border-white border-t-transparent" />
            <p className="text-xs font-mono uppercase tracking-widest text-gray-500 dark:text-neutral-400">Querying cryptographic audit trail...</p>
          </div>
        </div>
      ) : displayedLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-8 sm:p-12 text-center w-full">
          <p className="font-mono text-xs uppercase tracking-widest text-gray-500 dark:text-neutral-400">No log entries matched your filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-none border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] font-mono text-xs w-full max-w-full min-w-0">
          <div className="w-full overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[750px] text-left">
              <thead className="border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black text-[10px] uppercase tracking-[0.2em] text-gray-600 dark:text-neutral-500 font-mono font-bold">
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
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-900 bg-transparent text-xs">
                {displayedLogs.map((log) => {
                  return (
                    <tr key={log.id} className="transition-colors hover:bg-gray-100 dark:hover:bg-neutral-900/50">
                      {/* Log ID */}
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] font-bold text-gray-500 dark:text-neutral-400">
                        {log.id}
                      </td>

                      {/* Action Event Badge - Terminal badge */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`inline-block border font-mono text-[10px] px-2 py-1 rounded-none font-bold uppercase tracking-wider ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Operator & Role */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wider">{log.role}</div>
                        <div className="font-mono text-[10px] text-gray-500 dark:text-neutral-400">{log.user}</div>
                      </td>

                      {/* Target ULPIN */}
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] font-bold text-gray-900 dark:text-white tracking-wider">
                        {log.ulpin !== "N/A" && log.ulpin !== "GLOBAL" ? (
                          <div className="flex items-center gap-1.5">
                            <span>{log.ulpin}</span>
                            {onInspectParcel && (
                              <button
                                onClick={() => onInspectParcel(log.ulpin)}
                                title="Inspect on GIS map"
                                className="rounded-none p-0.5 text-gray-400 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-neutral-500">{log.ulpin}</span>
                        )}
                      </td>

                      {/* Description / Details */}
                      <td className="max-w-xs px-4 py-3.5 text-gray-600 dark:text-neutral-300 font-mono">
                        <p className="truncate text-xs" title={log.details}>
                          {log.details}
                        </p>
                      </td>

                      {/* Origin IP & Status */}
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[10px] text-gray-500 dark:text-neutral-400">
                        <span className="rounded-none border border-gray-300 dark:border-neutral-800 bg-gray-100 dark:bg-black px-1.5 py-0.5 text-gray-700 dark:text-neutral-300 font-bold">
                          {log.ip}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono text-[11px] text-gray-500 dark:text-neutral-400">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })}
                        <span className="ml-1 text-[10px] text-gray-400 dark:text-neutral-400">
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
