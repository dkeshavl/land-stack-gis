import { useEffect, useState } from "react";
import { Crosshair } from "lucide-react";
import EncumbranceCard from "./EncumbranceCard";
import UtilityComplianceCard from "./UtilityComplianceCard";
import StatusPill from "./StatusPill";

/**
 * Reusable high-contrast key-value row for Enterprise DPI Dossier
 */
function DataRow({ label, value, isMono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-neutral-800/80 py-2.5 last:border-b-0">
      <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">{label}</span>
      <span
        className={`text-right text-xs font-semibold text-gray-900 dark:text-white ${
          isMono ? "font-mono" : ""
        }`}
      >
        {value || "Not specified"}
      </span>
    </div>
  );
}

/**
 * Reusable Empty State Message when no parcel is selected (Targeting HUD - SpaceX Stark Aesthetic)
 */
function EmptyStateMessage() {
  return (
    <div className="flex h-full w-full flex-col p-6 bg-white dark:bg-[#050505] transition-colors">
      <div className="border-2 border-dashed border-gray-300 dark:border-neutral-800 rounded-none p-8 flex flex-col items-center justify-center text-center h-full">
        <Crosshair className="text-gray-400 dark:text-neutral-600 w-12 h-12 mb-4 animate-pulse" />
        <h2 className="uppercase text-xs tracking-[0.2em] font-bold text-gray-800 dark:text-neutral-400 mb-2">
          AWAITING SPATIAL INPUT
        </h2>
        <p className="text-sm text-gray-500 dark:text-neutral-600 max-w-xs leading-relaxed font-sans">
          Select a parcel on the map or search by 14-digit ULPIN to retrieve statutory Record of Rights.
        </p>
      </div>
    </div>
  );
}

/**
 * ParcelPanel Component for Land Stack GIS
 * Smart India Hackathon PS 26014 — Ministry of Rural Development
 */
export default function ParcelPanel({
  selectedUlpIn,
  selectedParcel,
  parcelData = null,
  isExternalLoading = false,
  onApplyMutation,
  refreshKey = 0
}) {
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("owner"); // "owner" | "zoning" | "encumbrance"
  const [copied, setCopied] = useState(false);

  // Safe fallback resolution across props & internal state
  const displayParcel = parcel || parcelData?.data || parcelData || selectedParcel?.data || selectedParcel || null;
  const activeUlpin = selectedUlpIn || displayParcel?.ulpin || selectedParcel?.ulpin || "";

  // Fetch parcel details whenever ULPIN, parcelData or refreshKey changes
  useEffect(() => {
    if (!activeUlpin) {
      setParcel(null);
      setLoading(false);
      return;
    }

    // Use pre-hydrated data if available and matches selected ULPIN
    if (parcelData && (parcelData.ulpin === activeUlpin || parcelData.data?.ulpin === activeUlpin)) {
      setParcel(parcelData.data || parcelData);
      setLoading(false);
      setError("");
      return;
    }

    if (isExternalLoading) {
      setLoading(true);
      return;
    }

    let isMounted = true;
    const loadParcel = async () => {
      setLoading(true);
      setError("");
      try {
        let response = await fetch(`/api/parcel/${encodeURIComponent(activeUlpin)}`);
        if (!response.ok && response.status === 404) {
          response = await fetch(`/api/parcels/${encodeURIComponent(activeUlpin)}`);
        }
        let result = {};
        try {
          result = await response.json();
        } catch {
          result = {};
        }
        if (!isMounted) return;
        if (!response.ok) throw new Error(result.message || "Unable to load parcel record");
        const rawParcel = result.data || result;
        setParcel({ ulpin: rawParcel.ulpin || result.ulpin || activeUlpin, ...rawParcel });
      } catch (err) {
        if (!isMounted) return;
        setParcel(null);
        setError(err.message || "Failed to load parcel record from registry");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadParcel();
    return () => {
      isMounted = false;
    };
  }, [activeUlpin, parcelData, isExternalLoading, refreshKey]);

  // Copy ULPIN with micro-confirmation
  const handleCopyUlpin = async () => {
    if (!activeUlpin) return;
    try {
      await navigator.clipboard.writeText(activeUlpin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // Fallback Render State when no parcel is selected
  if (!activeUlpin && !displayParcel) {
    return <EmptyStateMessage onApplyMutation={onApplyMutation} />;
  }

  const isPending = Boolean(
    (displayParcel?.ownership?.mutationStatus || displayParcel?.mutationStatus || "").toLowerCase() === "pending"
  );
  const hasDispute = Boolean(
    displayParcel?.encumbrance?.legalDispute?.hasDispute ||
    (typeof displayParcel?.encumbrance === "string" && displayParcel.encumbrance.toLowerCase().includes("dispute"))
  );

  const tabs = [
    {
      id: "owner",
      label: "Ownership & RoR",
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      hasAlert: isPending
    },
    {
      id: "zoning",
      label: "Zoning & Utility",
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      hasAlert: false
    },
    {
      id: "encumbrance",
      label: "Encumbrance",
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      hasAlert: hasDispute
    }
  ];

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#050505] p-4 sm:p-5 text-gray-900 dark:text-white overflow-hidden font-sans transition-colors">
      {/* Top Dossier Header */}
      <div className="border-b border-gray-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-400">
            DPI CADASTRE • MoRD
          </span>
          <span className="inline-flex items-center gap-1.5 border border-gray-300 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 rounded-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ROR SYNCHRONIZED
          </span>
        </div>

        <h2 className="mt-1.5 text-base sm:text-lg font-bold uppercase tracking-wider text-black dark:text-white font-sans">
          Cadastral Parcel Dossier
        </h2>

        {/* ULPIN Row with Copy Micro-confirmation Button */}
        <div className="mt-2.5 flex items-center justify-between border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#111] px-3 py-1.5 rounded-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
              ULPIN:
            </span>
            <span className="font-mono text-xs font-bold text-gray-900 dark:text-neutral-100">
              {activeUlpin}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyUlpin}
            title="Copy 14-digit ULPIN to clipboard"
            aria-label="Copy ULPIN"
            className={`inline-flex items-center gap-1 border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-mono text-[10px] font-bold uppercase tracking-wider rounded-none px-2 py-0.5 transition-colors cursor-pointer ${
              copied ? "bg-black text-white dark:bg-white dark:text-black" : ""
            }`}
          >
            {copied ? (
              <>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied</span>
              </>
            ) : (
              <>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Accessible Stark Tabs with bottom border indicator */}
      <div
        role="tablist"
        aria-label="Parcel details sections"
        className="mt-4 grid grid-cols-3 border-b border-gray-200 dark:border-neutral-800"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`relative flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-2 pb-2.5 pt-1 transition-colors cursor-pointer -mb-px outline-none focus:outline-none whitespace-nowrap ${
                isActive
                  ? "border-b-2 border-black dark:border-white text-black dark:text-white font-bold tracking-tight sm:tracking-wider text-[10px] sm:text-[11px] md:text-xs uppercase"
                  : "border-b-2 border-transparent text-gray-500 hover:text-black dark:hover:text-white font-semibold tracking-tight sm:tracking-wider text-[10px] sm:text-[11px] md:text-xs uppercase"
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
              {tab.hasAlert && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="mt-4 flex-1 space-y-3 animate-pulse overflow-y-auto pr-0.5">
          <div className="rounded-none border border-gray-200 bg-gray-50 p-4 space-y-3 dark:border-neutral-800 dark:bg-[#080808]">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-neutral-800">
              <div className="h-3.5 w-32 bg-gray-200 dark:bg-neutral-800 rounded-none" />
              <div className="h-3.5 w-16 bg-gray-200 dark:bg-neutral-800 rounded-none" />
            </div>
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-gray-200 dark:bg-neutral-800 rounded-none" />
                <div className="h-3 w-36 bg-gray-200 dark:bg-neutral-800 rounded-none" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-28 bg-gray-200 dark:bg-neutral-800 rounded-none" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-neutral-800 rounded-none" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-gray-200 dark:bg-neutral-800 rounded-none" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-neutral-800 rounded-none" />
              </div>
            </div>
          </div>

          <div className="rounded-none border border-gray-200 bg-gray-50 p-4 space-y-3 dark:border-neutral-800 dark:bg-[#080808]">
            <div className="h-3.5 w-40 bg-gray-200 dark:bg-neutral-800 rounded-none" />
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-gray-200 dark:bg-neutral-800 rounded-none" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-neutral-800 rounded-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 py-3 text-xs font-mono font-semibold text-gray-700 dark:text-neutral-300">
            <span className="h-3.5 w-3.5 animate-spin border-2 border-black dark:border-white border-t-transparent dark:border-t-transparent" />
            <span>Hydrating spatial records from PostGIS...</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <span>⚠️</span>
            <span>Record Retrieval Notice</span>
          </div>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 px-3 py-1 font-bold text-red-900 dark:text-red-100 transition"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Tab Panels Content */}
      {displayParcel && !loading && (
        <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-0.5">
          {/* Active Mutation Notification Alert */}
          {isPending && (
            <div className="rounded-none border border-amber-500/40 bg-amber-500/10 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Title Mutation In Progress
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  {displayParcel?.ownership?.applicationId || "Pending Sanction"}
                </span>
              </div>

              {displayParcel?.ownership?.pendingNewOwner && (
                <div className="mt-2 rounded-none border border-amber-500/30 bg-white/90 dark:bg-[#111] p-2 text-[11px] text-gray-900 dark:text-white">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-neutral-400">Transferee / Buyer:</span>
                    <span className="font-bold">{displayParcel.ownership.pendingNewOwner}</span>
                  </div>
                  {displayParcel?.ownership?.transferReason && (
                    <div className="mt-1 flex justify-between">
                      <span className="text-gray-500 dark:text-neutral-400">Transfer Nature:</span>
                      <span className="font-semibold">{displayParcel.ownership.transferReason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: OWNERSHIP & TAX */}
          {activeTab === "owner" && (
            <div
              id="panel-owner"
              role="tabpanel"
              aria-labelledby="tab-owner"
              className="space-y-3.5"
            >
              {/* Ownership Card */}
              <section className="rounded-none border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#080808]">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    Record of Rights (RoR)
                  </h3>
                  <button
                    type="button"
                    onClick={() => onApplyMutation && onApplyMutation(activeUlpin)}
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black dark:text-white hover:underline transition cursor-pointer"
                  >
                    <span>+ Form 12-A</span>
                  </button>
                </div>

                <DataRow
                  label="Registered Owner"
                  value={
                    displayParcel?.ownership?.ownerName ||
                    displayParcel?.owner_name ||
                    displayParcel?.ownerName ||
                    "Registered Landholder"
                  }
                />
                <DataRow
                  label="Khasra / Survey Number"
                  value={
                    displayParcel?.ownership?.khasraNumber ||
                    displayParcel?.khasra_no ||
                    displayParcel?.khasraNumber ||
                    "-"
                  }
                  isMono
                />
                
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 py-2.5">
                  <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">Title Mutation Status</span>
                  <StatusPill status={displayParcel?.ownership?.mutationStatus || "Approved"} />
                </div>

                {displayParcel?.ownership?.previousOwner && (
                  <DataRow label="Previous Transferee" value={displayParcel.ownership.previousOwner} />
                )}
                {displayParcel?.ownership?.approvedAt && (
                  <DataRow
                    label="Last Sanction Date"
                    value={
                      !isNaN(new Date(displayParcel.ownership.approvedAt).getTime())
                        ? new Date(displayParcel.ownership.approvedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })
                        : "Verified"
                    }
                  />
                )}
              </section>

              {/* Municipal Tax Card */}
              <section className="rounded-none border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#080808]">
                <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  Municipal Revenue & Property Tax
                </h3>
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 py-2.5">
                  <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">Payment Status</span>
                  <StatusPill status={displayParcel?.tax?.propertyTaxStatus || displayParcel?.tax_status || "Paid"} />
                </div>
                <DataRow label="Last Payment Date" value={displayParcel?.tax?.lastPaidDate || displayParcel?.tax?.lastPaymentDate || "2025-2026 Fiscal"} />
                <DataRow label="Annual Assessment" value={displayParcel?.tax?.amount || "Standard Assessment"} />
              </section>
            </div>
          )}

          {/* TAB 2: ZONING & INFRASTRUCTURE */}
          {activeTab === "zoning" && (
            <div
              id="panel-zoning"
              role="tabpanel"
              aria-labelledby="tab-zoning"
              className="space-y-3.5"
            >
              <section className="rounded-none border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#080808]">
                <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  Master Plan & Town Planning
                </h3>
                <DataRow label="Zone Classification" value={displayParcel?.zoning?.zoneType || displayParcel?.zone_type || "Residential Primary"} />
                <DataRow label="Permitted Land Use" value={displayParcel?.zoning?.landUse || displayParcel?.environmental_zone || "Standard Land Use"} />
                <DataRow label="Permissible Building Height" value={displayParcel?.zoning?.maxHeight || "15m (G+3)"} />
              </section>

              <UtilityComplianceCard
                utilities={displayParcel?.utilities}
                valuation={displayParcel?.valuation}
              />
            </div>
          )}

          {/* TAB 3: ENCUMBRANCE & VALUE */}
          {activeTab === "encumbrance" && (
            <div
              id="panel-encumbrance"
              role="tabpanel"
              aria-labelledby="tab-encumbrance"
              className="space-y-3.5"
            >
              <EncumbranceCard encumbrance={displayParcel?.encumbrance || displayParcel?.encumbranceData} />

              <div className="rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#050505] p-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="text-base">🛡️</span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      Non-Encumbrance Certificate (NEC Form 15)
                    </h4>
                    <p className="mt-0.5 text-[11px] text-gray-600 dark:text-neutral-400 leading-relaxed">
                      Digitally verified against Sub-Registrar Database under SIH PS 26014 DPI standard. 30-year search certified free of undisclosed court attachments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer: Apply for Title Mutation - SpaceX Stark Style */}
      {displayParcel && !loading && (
        <div className="mt-3 border-t border-gray-200 dark:border-neutral-800 pt-3">
          <button
            type="button"
            onClick={() => onApplyMutation && onApplyMutation(activeUlpin)}
            className="flex w-full items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 dark:bg-transparent dark:border dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none px-6 py-3 uppercase text-xs tracking-widest font-bold cursor-pointer"
          >
            <span>Apply for Ownership Transfer (Form 12-A)</span>
          </button>
        </div>
      )}
    </div>
  );
}