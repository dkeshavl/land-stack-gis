import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  Navigate,
  Outlet
} from "react-router-dom";
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
import { INITIAL_LAYER_STATE } from "./components/LayerController";

/**
 * Stark Terminal-style 404 Page
 * Preserves the Palantir / SpaceX dark minimalist aesthetic
 */
function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black text-white px-6 font-mono selection:bg-emerald-500 selection:text-black">
      <div className="max-w-md w-full border border-neutral-800 bg-[#080808] p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
              KERNEL_ALERT
            </span>
          </div>
          <span className="text-[10px] text-neutral-600">ERR_CODE: 404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">404: SECTOR_NOT_FOUND</h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The requested coordinate or partition does not resolve to an active statutory cadastre
            pathway.
          </p>
        </div>

        <div className="border border-neutral-800 bg-neutral-950 p-3 text-[11px] text-emerald-400 font-mono">
          &gt; ROUTE_CHECK: UNKNOWN_VECTOR
          <br />
          &gt; STATUS: EXEC_ABORT
        </div>

        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className="w-full border border-white bg-transparent py-3 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all duration-200 cursor-pointer text-center"
        >
          [ RETURN TO ORBIT / ]
        </button>
      </div>
    </div>
  );
}

/**
 * Shared Dashboard Layout for /citizen and /admin routes.
 * Completely isolates the LandingPage (which stays full-bleed with no layout wrapper).
 */
function DashboardLayout({
  mapInstance,
  selectedUlpIn,
  handleParcelSelect,
  handleOpenMutationModal,
  isAdminLoggedIn,
  adminUser,
  handleAdminLogout,
  isMutationModalOpen,
  mutationModalUlpin,
  setIsMutationModalOpen,
  handleMutationSuccess,
  refreshCurrentParcel,
  toastMessage,
  setToastMessage
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isCitizen = location.pathname.startsWith("/citizen");
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <main className="flex h-screen w-full max-w-full flex-col overflow-hidden bg-white dark:bg-[#050505] text-gray-900 dark:text-white transition-colors font-sans">
      <header className="relative z-[1100] shrink-0 w-full max-w-full bg-white dark:bg-[#050505] border-b border-gray-200 dark:border-neutral-800 transition-colors">
        {/* Top Navbar Row */}
        <div className="flex h-14 md:h-16 w-full max-w-full items-center justify-between gap-2 px-3 sm:px-6">
          {/* Brand / Title (Clickable Link to Landing Page) - SpaceX Aesthetic */}
          <Link
            to="/"
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
          </Link>

          {/* Centered Search Bar on Desktop (Citizen View only) */}
          {isCitizen ? (
            <div className="hidden md:flex flex-1 max-w-2xl justify-center px-4">
              <SearchBar map={mapInstance} onSelectParcel={handleParcelSelect} />
            </div>
          ) : (
            <div className="hidden flex-1 justify-center px-4 md:flex">
              <div className="flex items-center gap-2 border border-gray-300 dark:border-neutral-800 bg-gray-50 dark:bg-[#111] px-3.5 py-1.5 text-xs text-gray-700 dark:text-neutral-300 font-mono tracking-wider uppercase rounded-none">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{isAdminLoggedIn ? "Officer Session: Active" : "Authentication Gateway"}</span>
              </div>
            </div>
          )}

          {/* Header Right Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Quick Apply Button in Citizen View (Desktop only) */}
            {isCitizen && (
              <button
                type="button"
                onClick={() => handleOpenMutationModal(selectedUlpIn)}
                className="hidden md:inline-flex items-center gap-2 bg-black text-white hover:bg-gray-800 dark:bg-transparent dark:border dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none px-5 py-2 uppercase text-xs tracking-widest font-bold cursor-pointer"
              >
                + Apply for Mutation
              </button>
            )}

            {/* Desktop Portal Switcher using React Router Links */}
            <nav className="hidden md:inline-flex border border-gray-300 dark:border-neutral-800 bg-gray-100 dark:bg-[#111] p-0.5 rounded-none">
              <Link
                to="/"
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer rounded-none text-gray-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                title="Overview / Landing Page"
              >
                Overview
              </Link>

              <Link
                to="/citizen"
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer rounded-none ${
                  isCitizen
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-gray-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Map
              </Link>

              <Link
                to="/admin"
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer rounded-none ${
                  isAdmin
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-gray-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Admin
              </Link>
            </nav>

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
            {/* If Admin is Logged In, display Admin Name and Logout */}
            {isAdminLoggedIn && isAdmin && (
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
                  type="button"
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

            {/* Portal Switcher Options in mobile drawer */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-500 font-bold">
                Select Route
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-white block"
                >
                  Overview / Landing
                </Link>
                <Link
                  to="/citizen"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer block ${
                    isCitizen
                      ? "bg-black text-white dark:bg-white dark:text-black font-extrabold"
                      : "border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Citizen GIS Map
                </Link>
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer block ${
                    isAdmin
                      ? "bg-black text-white dark:bg-white dark:text-black font-extrabold"
                      : "border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#0a0a0a] text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Admin Portal {isAdminLoggedIn ? "(Officer Active)" : "(Login)"}
                </Link>
              </div>
            </div>

            {/* Quick Apply Button on mobile if in citizen view */}
            {isCitizen && (
              <button
                type="button"
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
        {isCitizen && (
          <div className="border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#050505] px-3 pb-2.5 pt-2 md:hidden">
            <SearchBar map={mapInstance} onSelectParcel={handleParcelSelect} />
          </div>
        )}
      </header>

      {/* Routed Page Content via Outlet */}
      <Outlet />

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

/**
 * Citizen Map View Component
 */
function CitizenView({
  selectedUlpIn,
  selectedParcelData,
  isParcelLoading,
  handleParcelSelect,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  setMapInstance,
  refreshKey,
  refreshCurrentParcel,
  handleOpenMutationModal,
  activeLayers,
  setActiveLayers
}) {
  const { isDark } = useTheme();

  return (
    <section className="relative flex flex-1 flex-col overflow-hidden md:flex-row">
      {/* Map Section */}
      <div className="relative flex-1 min-h-0">
        <MapDashboard
          selectedUlpIn={selectedUlpIn}
          onParcelSelect={handleParcelSelect}
          onMapReady={setMapInstance}
          refreshKey={refreshKey}
          refreshCurrentParcel={refreshCurrentParcel}
          activeLayers={activeLayers}
          onLayersChange={setActiveLayers}
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
            <p
              className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Cadastral Registry Node
            </p>
          </div>
          <p
            className={`mt-1 text-[11px] font-medium ${
              isDark ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
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

        {/* Floating pill on mobile to re-open dossier when drawer is closed */}
        {selectedUlpIn && !isMobileDrawerOpen && (
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 border border-emerald-500 bg-black/90 px-4 py-2 text-xs font-mono font-bold text-white shadow-2xl backdrop-blur-md sm:hidden cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>DOSSIER: {selectedUlpIn}</span>
            <span className="text-emerald-400">▲</span>
          </button>
        )}
      </div>

      {/* Mobile Bottom Sheet (<768px): Closing drawer decouples from map selection */}
      <BottomSheet
        isOpen={Boolean(selectedUlpIn) && isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onApplyMutation={() => handleOpenMutationModal(selectedUlpIn)}
      >
        <ParcelPanel
          selectedUlpIn={selectedUlpIn}
          parcelData={selectedParcelData}
          isExternalLoading={isParcelLoading}
          onApplyMutation={handleOpenMutationModal}
          refreshKey={refreshKey}
          hideBottomAction={true}
        />
      </BottomSheet>

      {/* Desktop Right Sidebar (>=768px) */}
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
  );
}

/**
 * Admin View Component
 */
function AdminView({
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  setAdminUser,
  handleInspectParcel,
  handleAdminLogout,
  setRefreshKey
}) {
  const navigate = useNavigate();

  if (!isAdminLoggedIn) {
    return (
      <section className="flex min-h-0 flex-1 overflow-hidden bg-white dark:bg-[#050505]">
        <AdminLogin
          onLoginSuccess={(officerData) => {
            setIsAdminLoggedIn(true);
            if (officerData) setAdminUser(officerData);
          }}
          onCancel={() => navigate("/citizen")}
        />
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 overflow-hidden w-full max-w-full bg-white dark:bg-[#050505]">
      <AdminDashboard
        onInspectParcel={handleInspectParcel}
        onMutationUpdated={() => setRefreshKey((prev) => prev + 1)}
        onLogout={handleAdminLogout}
      />
    </section>
  );
}

/**
 * Master Application Content with state synchronization
 */
function AppContent() {
  const navigate = useNavigate();
  const [selectedUlpIn, setSelectedUlpIn] = useState(null);
  const [selectedParcelData, setSelectedParcelData] = useState(null);
  const [isParcelLoading, setIsParcelLoading] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    () => localStorage.getItem("landstack_admin_auth") === "true"
  );
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [mutationModalUlpin, setMutationModalUlpin] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeLayers, setActiveLayers] = useState(INITIAL_LAYER_STATE);

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem("landstack_admin_user");
      return stored
        ? JSON.parse(stored)
        : { name: "Shri R. K. Verma", role: "Tahsildar / Sub-Registrar" };
    } catch {
      return { name: "Shri R. K. Verma", role: "Tahsildar / Sub-Registrar" };
    }
  });

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
    if (ulpin) {
      setIsMobileDrawerOpen(true);
    } else {
      setIsMobileDrawerOpen(false);
    }
  };

  // Auto-Refresh callback: re-hydrates current parcel from backend
  const refreshCurrentParcel = async (targetUlpin) => {
    const ulpinToFetch = targetUlpin || selectedUlpIn;
    if (!ulpinToFetch) return null;

    try {
      setIsParcelLoading(true);
      const cleanUlpin = String(ulpinToFetch).replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
      let res = await fetch(`/api/parcel/${cleanUlpin}?t=${Date.now()}`);
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/parcels/${cleanUlpin}?t=${Date.now()}`);
      }
      if (res.ok) {
        const json = await res.json();
        const freshData = json.data || json;
        const parcelObj = { ulpin: freshData.ulpin || cleanUlpin, ...freshData };
        setSelectedUlpIn(parcelObj.ulpin || cleanUlpin);
        setSelectedParcelData(parcelObj);
        setRefreshKey((prev) => prev + 1);
        return parcelObj;
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
    setIsMobileDrawerOpen(true);
    navigate("/citizen");
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

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminUser(null);
    localStorage.removeItem("landstack_admin_auth");
    localStorage.removeItem("landstack_admin_user");
    navigate("/citizen");
  };

  return (
    <Routes>
      {/* 1. Full-Bleed Isolated Landing Page (Zero layout wrapper, 100% full-screen) */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Isolated Dashboard Layout specifically for Map and Admin */}
      <Route
        element={
          <DashboardLayout
            mapInstance={mapInstance}
            selectedUlpIn={selectedUlpIn}
            handleParcelSelect={handleParcelSelect}
            handleOpenMutationModal={handleOpenMutationModal}
            isAdminLoggedIn={isAdminLoggedIn}
            adminUser={adminUser}
            handleAdminLogout={handleAdminLogout}
            isMutationModalOpen={isMutationModalOpen}
            mutationModalUlpin={mutationModalUlpin}
            setIsMutationModalOpen={setIsMutationModalOpen}
            handleMutationSuccess={handleMutationSuccess}
            refreshCurrentParcel={refreshCurrentParcel}
            toastMessage={toastMessage}
            setToastMessage={setToastMessage}
          />
        }
      >
        <Route
          path="/citizen"
          element={
            <CitizenView
              selectedUlpIn={selectedUlpIn}
              selectedParcelData={selectedParcelData}
              isParcelLoading={isParcelLoading}
              handleParcelSelect={handleParcelSelect}
              isMobileDrawerOpen={isMobileDrawerOpen}
              setIsMobileDrawerOpen={setIsMobileDrawerOpen}
              setMapInstance={setMapInstance}
              refreshKey={refreshKey}
              refreshCurrentParcel={refreshCurrentParcel}
              handleOpenMutationModal={handleOpenMutationModal}
              activeLayers={activeLayers}
              setActiveLayers={setActiveLayers}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminView
              isAdminLoggedIn={isAdminLoggedIn}
              setIsAdminLoggedIn={setIsAdminLoggedIn}
              setAdminUser={setAdminUser}
              handleInspectParcel={handleInspectParcel}
              handleAdminLogout={handleAdminLogout}
              setRefreshKey={setRefreshKey}
            />
          }
        />
      </Route>

      {/* 3. Catch-All Route for 404s (Stark Terminal Aesthetic) */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

/**
 * Root Application wrapping the Router
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}