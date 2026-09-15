import { useEffect, useState } from "react";
import EncumbranceCard from "./EncumbranceCard";
import UtilityComplianceCard from "./UtilityComplianceCard";

function DataRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-800">{value || "Not available"}</span>
    </div>
  );
}

function StatusBadge({ value }) {
  const isPositive = value === "Paid" || value === "Approved";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isPositive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
      {value || "Unknown"}
    </span>
  );
}

function ParcelPanel({ selectedUlpIn, onApplyMutation, refreshKey = 0 }) {
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedUlpIn) return;
    
    let isMounted = true;
    const loadParcel = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/parcel/${selectedUlpIn}`);
        const result = await response.json();
        if (!isMounted) return;
        if (!response.ok) throw new Error(result.message || "Unable to load parcel data");
        setParcel(result.data);
      } catch (err) {
        if (!isMounted) return;
        setParcel(null);
        setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadParcel();
    return () => {
      isMounted = false;
    };
  }, [selectedUlpIn, refreshKey]);

  if (!selectedUlpIn) {
    return (
      <aside className="flex h-full flex-col items-center justify-center bg-white p-8 text-center">
        <div className="max-w-xs">
          <div className="mb-4 text-5xl">⌖</div>
          <h2 className="text-lg font-bold text-slate-800">Select a land parcel</h2>
          <p className="mt-2 text-sm text-slate-500">
            Click a parcel polygon on the GIS map or use the global search bar.
          </p>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400">Need to update land ownership?</p>
            <button
              onClick={() => onApplyMutation && onApplyMutation(null)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Apply for Mutation</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  const isPending = (parcel?.ownership?.mutationStatus || "").toLowerCase() === "pending";

  return (
    <aside className="flex h-full flex-col overflow-y-auto bg-white p-5">
      <div className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Land Stack Record</p>
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
            RoR Live
          </span>
        </div>
        <h2 className="mt-2 text-xl font-bold text-slate-900">Parcel Details</h2>
        <p className="mt-1 font-mono text-xs font-semibold text-slate-500">ULPIN: {selectedUlpIn}</p>
      </div>

      {loading && <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">Fetching records...</div>}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {parcel && !loading && (
        <div className="space-y-5 flex-1">
          {/* Active Mutation Notification Card if Pending */}
          {isPending && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Mutation In Progress
                </span>
              </div>
              <p className="mt-1.5 text-xs text-amber-900">
                Application <span className="font-mono font-bold">{parcel.ownership?.applicationId || "Pending"}</span> is queued for Revenue Officer approval.
              </p>
              {parcel.ownership?.pendingNewOwner && (
                <div className="mt-2 rounded-lg bg-white/80 p-2 text-[11px] text-amber-950 border border-amber-200/60">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transferee / Buyer:</span>
                    <span className="font-bold">{parcel.ownership.pendingNewOwner}</span>
                  </div>
                  {parcel.ownership.transferReason && (
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-500">Deed Type:</span>
                      <span className="font-semibold">{parcel.ownership.transferReason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Ownership & Revenue Section */}
          <section className="rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">Ownership and Revenue</h3>
              <button
                onClick={() => onApplyMutation && onApplyMutation(selectedUlpIn)}
                title="Apply for ownership mutation"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
              >
                <span>+ Transfer</span>
              </button>
            </div>

            <DataRow label="Owner Name" value={parcel.ownership?.ownerName} />
            <DataRow label="Khasra Number" value={parcel.ownership?.khasraNumber} />
            <div className="flex justify-between py-3">
              <span className="text-sm text-slate-500">Mutation Status</span>
              <StatusBadge value={parcel.ownership?.mutationStatus} />
            </div>

            {parcel.ownership?.previousOwner && (
              <DataRow label="Previous Owner" value={parcel.ownership.previousOwner} />
            )}
            {parcel.ownership?.approvedAt && (
              <DataRow
                label="Last Approved"
                value={new Date(parcel.ownership.approvedAt).toLocaleDateString()}
              />
            )}
          </section>

          {/* Encumbrance & Legal Status Section */}
          <EncumbranceCard encumbrance={parcel.encumbrance} />

          {/* Municipal Tax Section */}
          <section className="rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="mb-2 font-bold text-slate-900">Municipal Tax</h3>
            <div className="flex justify-between border-b border-slate-100 py-3">
              <span className="text-sm text-slate-500">Tax Status</span>
              <StatusBadge value={parcel.tax?.propertyTaxStatus} />
            </div>
            <DataRow label="Last Paid Date" value={parcel.tax?.lastPaidDate} />
            <DataRow label="Tax Amount" value={parcel.tax?.amount} />
          </section>

          {/* Town Planning Section */}
          <section className="rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="mb-2 font-bold text-slate-900">Town Planning</h3>
            <DataRow label="Zone Type" value={parcel.zoning?.zoneType} />
            <DataRow label="Land Use" value={parcel.zoning?.landUse} />
            <DataRow label="Permissible Height" value={parcel.zoning?.maxHeight} />
          </section>

          {/* Utility Infrastructure & Environmental Compliance */}
          <UtilityComplianceCard
            utilities={parcel.utilities}
            valuation={parcel.valuation}
          />
        </div>
      )}

      {/* Persistent Citizen Action Button at Bottom of Sidebar */}
      {parcel && !loading && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <button
            onClick={() => onApplyMutation && onApplyMutation(selectedUlpIn)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
          >
            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Apply for Ownership Transfer</span>
          </button>
        </div>
      )}
    </aside>
  );
}

export default ParcelPanel;