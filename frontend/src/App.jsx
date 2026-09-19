import { useState, useEffect } from "react";
import { useTheme } from "./context/ThemeContext";
import LandingPage from "./components/LandingPage";
import MapDashboard from "./components/MapDashboard";
import ParcelPanel from "./components/ParcelPanel";
import SearchBar from "./components/SearchBar";
import BottomSheet from "./components/BottomSheet";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import ServiceRequestModal from "./components/ServiceRequestModal";
import ThemeToggle from "./components/ThemeToggle";

function App() {
  const { isDark } = useTheme();
  const [selectedUlpIn, setSelectedUlpIn] = useState(null);
  const [selectedParcelData, setSelectedParcelData] = useState(null);
  const [isParcelLoading, setIsParcelLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [currentView, setCurrentView] = useState("landing"); // "landing" | "citizen" | "admin"
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    () => localStorage.getItem("landstack_admin_auth") === "true"
  );
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [mutationModalUlpin, setMutationModalUlpin] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Handle parcel selection with hydration data and loading flag
  const handleParcelSelect = (ulpin, data = null, loading = false) => {
    setSelectedUlpIn(ulpin);
    setSelectedParcelData(data);
    setIsParcelLoading(loading);
  };

  // Auto-Refresh callback: re-hydrates current parcel from backend and syncs sidebar & canvas
  const refreshCurrentParcel = async (targetUlpin) => {
    const ulpinToFetch = targetUlpin || selectedUlpIn;
    if (!ulpinToFetch) return null;

    try {
      setIsParcelLoading(true);
      const cleanUlpin = String(ulpinToFetch).replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
      const res = await fetch(`/api/parcels/${cleanUlpin}?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        const freshData = json.data || json;
        setSelectedUlpIn(freshData.ulpin || cleanUlpin);
        setSelectedParcelData(freshData);
        setRefreshKey((prev) => prev + 1);
        return freshData;
      }
    } catch (err) {
      console.error("Failed to auto-refresh parcel:", err);
    } finally {
      setIsParcelLoading(false);
    }
    return null;
  };

  // Switch to citizen map view and locate parcel
  const handleInspectParcel = (ulpin, data = null) => {
    setSelectedUlpIn(ulpin);
    setSelectedParcelData(data);
    setIsParcelLoading(false);
    setRefreshKey((prev) => prev + 1);
    setCurrentView("citizen");
  };

  // Open mutation application modal
  const handleOpenMutationModal = (targetUlpin) => {
    setMutationModalUlpin(targetUlpin || selectedUlpIn || "");
    setIsMutationModalOpen(true);
  };

  // Handle successful mutation submission
  const handleMutationSuccess = async (_data, appliedUlpin) => {
    const targetUlpin = appliedUlpin || selectedUlpIn;
    if (targetUlpin) {
      await refreshCurrentParcel(targetUlpin);
    }
    setRefreshKey((prev) => prev + 1);
    setToastMessage("Mutation Successful: Record of Rights Updated");
  };

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem("landstack_admin_user");
      return stored ? JSON.parse(stored) : { name: "Shri R. K. Verma", role: "Tahsildar / Sub-Registrar" };
    } catch {
      return { name: "Shri R. K. Verma", role: "Tahsildar / Sub-Registrar" };
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    localStorage.removeItem("landstack_admin_auth");
    localStorage.removeItem("landstack_admin_user");
    setCurrentView("citizen");
  };

  // If in landing view, render full dedicated Landing Page
  if (currentView === "landing") {
    return <LandingPage onNavigate={setCurrentView} />;
  }

  return (
    <main className="flex h-screen w-full max-w-full flex-col overflow-hidden bg-white dark:bg-[#050505] text-gray-900 dark:text-white transition-colors font-sans">
      <header className="relative z-[1100] shrink-0 w-full max-w-full bg-white dark:bg-[#050505] border-b border-gray-200 dark:border-neutral-800 transition-colors">
        {/* Top Navbar Row */}
        <div className="flex h-14 md:h-16 w-full max-w-full items-center justify-between gap-2 px-3 sm:px-6">
          {/* Brand / Title (Clickable to return to Landing Page) - SpaceX Aesthetic */}
          <button
            onClick={() => setCurrentView("landing")}
            className="flex shrink-0 items-center gap-2 sm:gap-3 text-left focus:outline-none group cursor-pointer"
            title="Return to Landing Page Overview"
          >
            <div className="flex h-8 w-8 items-center justify-center border border-black dark:border-white text-black dark:text-white font-mono font-bold text-xs tracking-wider rounded-none">
              LS
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-base font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-gray-900 dark:text-white group-hover:opacity-75 transition-opacity font-sans whitespace-nowrap">
                  Land Stack
                </h1>
                <span className="border border-gray-300 dark:border-neutral-800 px-1 py-0.5 text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest text-gray-600 dark:text-neutral-400 rounded-none whitespace-nowrap">
                  DPI CORE
                </span>
              </div>
              <p className="hidden text-[10px] font-mono tracking-wider uppercase text-gray-500 dark:text-neutral-500 lg:block">
                Ministry of Rural Development • PS 26014
              </p>
            </div>
          </button>

          {/* Centered Search Bar on Desktop */}
          {currentView === "citizen" ? (
            <div className="hidden md:flex flex-1 max-w-lg justify-center px-4">
              <SearchBar map={mapInstance} onSelectParcel={handleParcelSelect} />
            </div>
          ) : (
            <div className="hidden flex-1 justify-center px-4 md:flex">
              <div className="flex items-center gap-2 border border-gray-300 dark:border-neutral-800 bg-gray-50 dark:bg-[#111] px-3.5 py-1.5 text-xs text-gray-700 dark:text-neutral-300 font-mono tracking-wider uppercase rounded-none">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Officer Session: Active</span>
              </div>
            </div>
          )}

          {/* Header Right Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Quick Apply Button in Citizen View (Desktop only) */}
            {currentView === "citizen" && (
              <button
                onClick={() => handleOpenMutationModal(selectedUlpIn)}
                className="hidden md:inline-flex items-center gap-2 bg-black text-white hover:bg-gray-800 dark:bg-transparent dark:border dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none px-5 py-2 uppercase text-xs tracking-widest font-bold cursor-pointer"
              >
                + Apply for Mutation
              </button>
            )}

            {/* Desktop Portal Switcher (hidden on mobile) */}
            <div className="hidden md:inline-flex border border-gray-300 dark:border-neutral-800 bg-gray-100 dark:bg-[#111] p-0.5 rounded-none">
              <button
                onClick={() => setCurrentView("landing")}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer rounded-none ${
                  currentView === "landing"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-gray-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                }`}
                title="Overview / Landing Page"
              >
                Overview
              </button>

              <button
                onClick={() => setCurrentView("citizen")}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer rounded-none ${
                  currentView === "citizen"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-gray-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Map
              </button>

              <button
                onClick={() => setCurrentView("admin")}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer rounded-none ${
                  currentView === "admin"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-gray-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Admin
              </button>
            </div>

            {/* Global Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* Mobile 3-Lines Hamburger Button (≡) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden items-center justify-center h-8 w-8 border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-[#111] text-gray-900 dark:text-white rounded-none cursor-pointer focus:outline-none"
              aria-label="Toggle Navigation Menu"
              title="Navigation Options"
            >
              {isMobileMenuOpen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile 3-Lines Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur-md px-4 py-4 space-y-4 md:hidden font-mono z-[1200] max-w-full overflow-hidden">
            {/* If Admin is Logged In, display Admin Name and Logout in 3 lines menu */}
            {isAdminLoggedIn && currentView === "admin" && (
              <div className="border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center bg-gray-200 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-[10px] font-bold text-gray-900 dark:text-white">
                    RV
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white uppercase leading-tight">
                      {adminUser?.name || "Shri R. K. Verma"}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-neutral-500 uppercase leading-tight">
                      {adminUser?.role || "Tahsildar"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleAdminLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="border border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold cursor-pointer transition-colors"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Portal Switcher Options in 3 lines menu */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-500 font-bold">
                Select View
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => {
                    setCurrentView("landing");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer ${
                    currentView === "landing"
                      ? "bg-black text-white dark:bg-white dark:text-black font-extrabold"
                      : "border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Overview / Landing
                </button>
                <button
                  onClick={() => {
                    setCurrentView("citizen");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer ${
                    currentView === "citizen"
                      ? "bg-black text-white dark:bg-white dark:text-black font-extrabold"
                      : "border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Citizen GIS Map
                </button>
                <button
                  onClick={() => {
                    setCurrentView("admin");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer ${
                    currentView === "admin"
                      ? "bg-black text-white dark:bg-white dark:text-black font-extrabold"
                      : "border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Admin Portal {isAdminLoggedIn ? "(Officer Active)" : "(Login)"}
                </button>
              </div>
            </div>

            {/* Quick Apply Button on mobile if in citizen view */}
            {currentView === "citizen" && (
              <button
                onClick={() => {
                  handleOpenMutationModal(selectedUlpIn);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black py-2.5 uppercase text-xs tracking-widest font-bold transition-colors cursor-pointer"
              >
                + Apply for Mutation
              </button>
            )}
          </div>
        )}

        {/* Mobile Search Row (Full width on mobile screens, Citizen View only) */}
        {currentView === "citizen" && (
          <div className="border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#050505] px-3 pb-2.5 pt-2 md:hidden">
            <SearchBar map={mapInstance} onSelectParcel={handleParcelSelect} />
          </div>
        )}
      </header>

      {/* Main View Container */}
      {currentView === "citizen" ? (
        <section className="relative flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Map Section */}
          <div className="relative flex-1 min-h-0">
            <MapDashboard
              selectedUlpIn={selectedUlpIn}
              onParcelSelect={handleParcelSelect}
              onMapReady={setMapInstance}
              refreshKey={refreshKey}
              refreshCurrentParcel={refreshCurrentParcel}
            />

            {/* DPI Cadastre Badge (Bottom Left) - Palantir Blueprint Glassmorphic */}
            <div
              className={`absolute bottom-5 left-5 z-[1000] hidden rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md sm:block transition duration-300 ${
                isDark
                  ? "bg-neutral-950/70 border-neutral-800 text-white"
                  : "bg-white/70 border-gray-200 text-black"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isDark ? "text-white" : "text-black"
                }`}>
                  Cadastral Registry Node
                </p>
              </div>
              <p className={`mt-1 text-[11px] font-medium ${
                isDark ? "text-neutral-400" : "text-neutral-600"
              }`}>
                Live PostGIS Canvas Engine • Click any boundary to inspect.
              </p>
            </div>

            {/* Mobile tap hint when no parcel is selected */}
            {!selectedUlpIn && (
              <div
                className={`pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-mono font-bold shadow-xl backdrop-blur-md sm:hidden transition duration-300 ${
                  isDark
                    ? "bg-neutral-950/70 border-neutral-800 text-white"
                    : "bg-white/70 border-gray-200 text-black"
                }`}
              >
                <span>📍</span>
                <span>Tap any parcel polygon to inspect</span>
              </div>
            )}
          </div>

          {/* Mobile Bottom Sheet (<768px) with 3 real snap points */}
          <BottomSheet
            isOpen={Boolean(selectedUlpIn)}
            onClose={() => handleParcelSelect(null)}
          >
            <ParcelPanel
              selectedUlpIn={selectedUlpIn}
              parcelData={selectedParcelData}
              isExternalLoading={isParcelLoading}
              onApplyMutation={handleOpenMutationModal}
              refreshKey={refreshKey}
            />
          </BottomSheet>

          {/* Desktop Right Sidebar (>=768px) with Tabbed Dossier */}
          <aside className="hidden md:flex md:w-[480px] lg:w-[500px] md:flex-col border-l border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#050505] z-10 shrink-0">
            <ParcelPanel
              selectedUlpIn={selectedUlpIn}
              parcelData={selectedParcelData}
              isExternalLoading={isParcelLoading}
              onApplyMutation={handleOpenMutationModal}
              refreshKey={refreshKey}
            />
          </aside>
        </section>
      ) : !isAdminLoggedIn ? (
        <section className="flex min-h-0 flex-1 overflow-hidden bg-white dark:bg-[#050505]">
          <AdminLogin
            onLoginSuccess={(officerData) => {
              setIsAdminLoggedIn(true);
              if (officerData) setAdminUser(officerData);
            }}
            onCancel={() => setCurrentView("citizen")}
          />
        </section>
      ) : (
        <section className="flex min-h-0 flex-1 overflow-hidden w-full max-w-full bg-white dark:bg-[#050505]">
          <AdminDashboard
            onInspectParcel={handleInspectParcel}
            onMutationUpdated={() => setRefreshKey((prev) => prev + 1)}
            onLogout={handleAdminLogout}
          />
        </section>
      )}

      {/* Service Request / Mutation Modal */}
      <ServiceRequestModal
        isOpen={isMutationModalOpen}
        initialUlpin={mutationModalUlpin}
        onClose={() => setIsMutationModalOpen(false)}
        onSuccess={handleMutationSuccess}
        refreshCurrentParcel={refreshCurrentParcel}
      />

      {/* Global Mutation Success Notification Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[2500] flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-900 text-white px-5 py-3.5 text-xs sm:text-sm font-bold shadow-xl animate-fade-in"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-black">
            ✓
          </span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-3 text-emerald-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}

export default App;