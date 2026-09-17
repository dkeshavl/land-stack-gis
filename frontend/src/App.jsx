import { useState } from "react";
import MapDashboard from "./components/MapDashboard";
import ParcelPanel from "./components/ParcelPanel";
import SearchBar from "./components/SearchBar";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import ServiceRequestModal from "./components/ServiceRequestModal";

function App() {
  const [selectedUlpIn, setSelectedUlpIn] = useState(null);
  const [currentView, setCurrentView] = useState("citizen"); // "citizen" | "admin"
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    () => localStorage.getItem("landstack_admin_auth") === "true"
  );
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
      <header className="relative z-[1100] shrink-0 border-b border-slate-200 bg-white shadow-sm">
        {/* Top Navbar Row */}
        <div className="flex h-14 md:h-16 items-center justify-between gap-2 px-3 sm:px-6">
          {/* Brand / Title */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm sm:text-base shadow-sm">
              LS
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-lg">Land Stack</h1>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 sm:text-[10px]">
                  GIS Core
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-500 lg:block">Digital Public Infrastructure for Land Governance</p>
            </div>
          </div>

          {/* Centered Search Bar on Desktop */}
          {currentView === "citizen" ? (
            <div className="hidden md:flex flex-1 max-w-md justify-center px-4">
              <SearchBar onSelectParcel={setSelectedUlpIn} />
            </div>
          ) : (
            <div className="hidden flex-1 justify-center px-4 md:flex">
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Government Workflow Session Active</span>
              </div>
            </div>
          )}

          {/* Header Right Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Quick Apply Button in Citizen View (Desktop only) */}
            {currentView === "citizen" && (
              <button
                onClick={() => handleOpenMutationModal(selectedUlpIn)}
                className="hidden xl:inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-95"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>Apply for Mutation</span>
              </button>
            )}

            {/* Portal Switcher (Citizen vs Admin) */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 sm:p-1 shadow-inner">
              <button
                onClick={() => setCurrentView("citizen")}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-md px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold transition ${
                  currentView === "citizen"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="hidden sm:inline">Citizen Map</span>
                <span className="sm:hidden">Map</span>
              </button>

              <button
                onClick={() => setCurrentView("admin")}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-md px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold transition ${
                  currentView === "admin"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="hidden sm:inline">Admin Portal</span>
                <span className="sm:hidden">Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Row (Full width on mobile screens, Citizen View only) */}
        {currentView === "citizen" && (
          <div className="border-t border-slate-100 px-3 pb-2.5 pt-2 md:hidden">
            <SearchBar onSelectParcel={setSelectedUlpIn} />
          </div>
        )}
      </header>

      {/* Main View Container */}
      {currentView === "citizen" ? (
        <section className="relative flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Map Section (Flex-1 takes remaining space) */}
          <div className="relative flex-1 min-h-0">
            <MapDashboard selectedUlpIn={selectedUlpIn} onParcelSelect={setSelectedUlpIn} />

            <div className="absolute bottom-5 left-5 z-[1000] hidden rounded-lg bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:block">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Parcel Map</p>
              <p className="mt-1 text-xs text-slate-500">Click a polygon or search above to inspect.</p>
            </div>

            {/* Mobile tap hint when no parcel is selected */}
            {!selectedUlpIn && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 rounded-full bg-slate-900/85 px-3.5 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur sm:hidden">
                <span>📍</span>
                <span>Tap any parcel polygon to inspect</span>
              </div>
            )}
          </div>

          {/* Mobile Backdrop Overlay (dismiss bottom sheet on click) */}
          {selectedUlpIn && (
            <div
              onClick={() => setSelectedUlpIn(null)}
              className="fixed inset-0 z-[1990] bg-slate-900/30 backdrop-blur-[2px] transition-opacity md:hidden"
            />
          )}

          {/* Sidebar: Bottom Sheet on Mobile (<768px), Standard Panel on Desktop (>=768px) */}
          <aside
            className={`fixed bottom-0 left-0 right-0 z-[2000] flex w-full max-h-[60vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-in-out md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:w-[400px] md:max-h-none md:rounded-none md:border-l md:border-slate-200 md:shadow-none md:translate-y-0 ${
              selectedUlpIn ? "translate-y-0" : "translate-y-full md:translate-y-0"
            }`}
          >
            {/* Visual Drag Handle & Close on Mobile */}
            <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-1 md:hidden">
              <div className="w-6" />
              <div className="h-1.5 w-12 rounded-full bg-slate-300" />
              <button
                onClick={() => setSelectedUlpIn(null)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ParcelPanel
                selectedUlpIn={selectedUlpIn}
                onApplyMutation={handleOpenMutationModal}
                refreshKey={refreshKey}
              />
            </div>
          </aside>
        </section>
      ) : !isAdminLoggedIn ? (
        <section className="flex min-h-0 flex-1 overflow-hidden">
          <AdminLogin
            onLoginSuccess={() => setIsAdminLoggedIn(true)}
            onCancel={() => setCurrentView("citizen")}
          />
        </section>
      ) : (
        <section className="flex min-h-0 flex-1 overflow-hidden">
          <AdminDashboard
            onInspectParcel={handleInspectParcel}
            onLogout={() => {
              setIsAdminLoggedIn(false);
              localStorage.removeItem("landstack_admin_auth");
              localStorage.removeItem("landstack_admin_user");
              setCurrentView("citizen");
            }}
          />
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