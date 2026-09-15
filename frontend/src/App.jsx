import { useState } from "react";
import MapDashboard from "./components/MapDashboard";
import ParcelPanel from "./components/ParcelPanel";
import SearchBar from "./components/SearchBar";
import AdminDashboard from "./components/AdminDashboard";
import ServiceRequestModal from "./components/ServiceRequestModal";

function App() {
  const [selectedUlpIn, setSelectedUlpIn] = useState(null);
  const [currentView, setCurrentView] = useState("citizen"); // "citizen" | "admin"
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [mutationModalUlpin, setMutationModalUlpin] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Switch to citizen map view and locate parcel
  const handleInspectParcel = (ulpin) => {
    setSelectedUlpIn(ulpin);
    setCurrentView("citizen");
  };

  // Open mutation application modal
  const handleOpenMutationModal = (targetUlpin) => {
    setMutationModalUlpin(targetUlpin || selectedUlpIn || "");
    setIsMutationModalOpen(true);
  };

  // Handle successful mutation submission
  const handleMutationSuccess = (_data, appliedUlpin) => {
    if (appliedUlpin) {
      setSelectedUlpIn(appliedUlpin);
    }
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <header className="relative z-[1100] flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
        {/* Brand / Title */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-base shadow-sm">
            LS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">Land Stack</h1>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                GIS Core
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-500 sm:block">Digital Public Infrastructure for Land Governance</p>
          </div>
        </div>

        {/* Global Search Bar (Only shown or prioritized in Citizen View) */}
        {currentView === "citizen" ? (
          <div className="flex flex-1 justify-center px-2">
            <SearchBar onSelectParcel={setSelectedUlpIn} />
          </div>
        ) : (
          <div className="hidden flex-1 justify-center px-2 md:flex">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Government Workflow Session Active</span>
            </div>
          </div>
        )}

        {/* Header Right Actions: Citizen Mutation Button + Portal Toggle */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Quick Apply Button in Citizen View */}
          {currentView === "citizen" && (
            <button
              onClick={() => handleOpenMutationModal(selectedUlpIn)}
              className="hidden items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-95 sm:inline-flex"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Apply for Mutation</span>
            </button>
          )}

          {/* Portal Switcher (Citizen vs Admin) */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-inner">
            <button
              onClick={() => setCurrentView("citizen")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                currentView === "citizen"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Citizen Map</span>
            </button>

            <button
              onClick={() => setCurrentView("admin")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                currentView === "admin"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Admin Portal</span>
            </button>
          </div>

          <div className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 xl:block">
            SIH 26014
          </div>
        </div>
      </header>

      {/* Main View Container */}
      {currentView === "citizen" ? (
        <section className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="relative min-h-[55vh]">
            <MapDashboard selectedUlpIn={selectedUlpIn} onParcelSelect={setSelectedUlpIn} />

            <div className="absolute bottom-5 left-5 z-[1000] rounded-lg bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Parcel Map</p>
              <p className="mt-1 text-xs text-slate-500">Click a polygon or search above to inspect.</p>
            </div>
          </div>

          <ParcelPanel
            selectedUlpIn={selectedUlpIn}
            onApplyMutation={handleOpenMutationModal}
            refreshKey={refreshKey}
          />
        </section>
      ) : (
        <section className="flex min-h-0 flex-1 overflow-hidden">
          <AdminDashboard onInspectParcel={handleInspectParcel} />
        </section>
      )}

      {/* Service Request / Mutation Modal */}
      <ServiceRequestModal
        isOpen={isMutationModalOpen}
        initialUlpin={mutationModalUlpin}
        onClose={() => setIsMutationModalOpen(false)}
        onSuccess={handleMutationSuccess}
      />
    </main>
  );
}

export default App;