import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Menu, X, ChevronDown } from "lucide-react";

/**
 * Auto-panning background drift controller for React-Leaflet.
 * 30ms interval calling panBy([1, 1], { animate: false }) to simulate continuous satellite crawl.
 */
function MapDriftController() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const interval = setInterval(() => {
      try {
        map.panBy([1.2, 1.2], { animate: false });
      } catch {
        // Safe failover if unmounted mid-pan
      }
    }, 30);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [map]);

  return null;
}

/**
 * 1. The Auto-Panning Background Map Component (Hero Section)
 */
function CinematicMapBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 h-full w-full pointer-events-none overflow-hidden opacity-85 md:opacity-100"
    >
      <style>{`
        .cinematic-map-root .leaflet-tile-pane,
        .cinematic-map-root .leaflet-tile {
          filter: invert(100%) hue-rotate(180deg) brightness(105%) contrast(140%) !important;
        }
        .cinematic-map-root .leaflet-container {
          background: #000000 !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        attributionControl={false}
        className="h-full w-full pointer-events-none cinematic-map-root"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-map-tiles"
        />
        <MapDriftController />
      </MapContainer>
    </div>
  );
}

/**
 * 2. The Exploded CAD 3D Isometric Background (Citizen Section)
 * Responsive: sits below text on mobile (opacity-100, h-[400px]), 50% absolute stage on desktop
 */
function IsometricParcelBackground() {
  return (
    <div
      aria-hidden="true"
      className="relative md:absolute md:right-0 w-full md:w-1/2 h-[400px] md:h-full mt-8 md:mt-0 opacity-100 z-10 flex items-center justify-center overflow-hidden pointer-events-none select-none"
    >
      {/* Ambient Blue Radial Backlight */}
      <div className="absolute w-[350px] sm:w-[500px] md:w-[600px] h-[350px] sm:h-[500px] md:h-[600px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />

      {/* 1. The 3D Stage (Flex centered, scaled for mobile) */}
      <div className="w-[360px] sm:w-[480px] lg:w-[620px] xl:w-[700px] h-[360px] sm:h-[480px] lg:h-[620px] xl:h-[700px] perspective-[1000px] lg:perspective-[1200px] flex items-center justify-center pointer-events-none scale-[0.6] md:scale-100">
        {/* Isometric 3D Root Wrapper */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            transform: "rotateX(60deg) rotateZ(-45deg)",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Layer 1: The Base Grid (translateZ: 0px) */}
          <div
            className="w-[320px] sm:w-[440px] lg:w-[540px] h-[320px] sm:h-[440px] lg:h-[540px] border border-blue-900/40 bg-[linear-gradient(to_right,#1e3a8a22_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a22_1px,transparent_1px)] bg-[size:40px_40px] absolute flex items-center justify-center shadow-[inset_0_0_40px_rgba(30,58,138,0.2)]"
            style={{
              transform: "translateZ(0px)",
              transformStyle: "preserve-3d"
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-blue-500/20" />
              <div className="h-full w-[1px] bg-blue-500/20 absolute" />
            </div>
            <span className="absolute top-2 left-2 text-[9px] font-mono text-blue-500/40">CRS: EPSG:4326</span>
            <span className="absolute bottom-2 right-2 text-[9px] font-mono text-blue-500/40">Z_DATUM: 0.00m</span>
          </div>

          {/* Layer 2: The Glowing Parcel (translateZ: 80px) */}
          <div
            className="absolute inset-0 flex items-center justify-center animate-pulse"
            style={{
              transform: "translateZ(80px)",
              transformStyle: "preserve-3d"
            }}
          >
            <div className="relative w-[240px] sm:w-[300px] lg:w-[360px] h-[210px] sm:h-[260px] lg:h-[310px] bg-blue-500/20 border-2 border-blue-400 shadow-[0_0_50px_rgba(59,130,246,0.6)] backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#60a5fa22_1px,transparent_1px),linear-gradient(to_bottom,#60a5fa22_1px,transparent_1px)] bg-[size:25px_25px] rounded-xl overflow-hidden" />
              <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" viewBox="0 0 300 260">
                <polygon
                  points="25,20 265,35 285,225 45,245 15,135"
                  fill="rgba(59, 130, 246, 0.25)"
                  stroke="#93C5FD"
                  strokeWidth="2.5"
                  style={{ filter: "drop-shadow(0 0 25px rgba(59,130,246,0.9))" }}
                />
                <circle cx="25" cy="20" r="5" fill="#FFFFFF" />
                <circle cx="265" cy="35" r="5" fill="#FFFFFF" />
                <circle cx="285" cy="225" r="5" fill="#FFFFFF" />
                <circle cx="45" cy="245" r="5" fill="#FFFFFF" />
                <circle cx="15" cy="135" r="5" fill="#FFFFFF" />
                <line x1="150" y1="28" x2="165" y2="235" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.8" />
              </svg>
              <div className="relative z-10 px-3 py-1 rounded-md bg-black/60 border border-blue-400/40 text-[10px] font-mono text-blue-200 tracking-wider">
                PARCEL_ID: 29572001
              </div>
            </div>
          </div>

          {/* Layer 3: The Floating Hologram Card (translateZ: 160px) */}
          <div
            className="absolute z-30"
            style={{
              transform: "translateZ(160px) rotateX(-90deg) rotateY(45deg)",
              transformStyle: "preserve-3d"
            }}
          >
            <div className="bg-black/70 border border-blue-400/50 p-3.5 sm:p-4 rounded-lg backdrop-blur-md w-56 sm:w-64 shadow-[0_0_35px_rgba(59,130,246,0.45)] flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                  CADASTRAL DOSSIER
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="text-white font-mono text-sm sm:text-base font-extrabold tracking-tight mb-2">
                ULPIN: 29572001193845
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-emerald-400 text-xs tracking-widest font-bold">
                  OWNER: VERIFIED
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-[10px] font-bold text-emerald-300">
                  ROR #482
                </span>
              </div>
              <div className="text-blue-300 text-xs font-mono font-medium">
                AREA: 2,450 SQ.M
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. The Massive 3D "Server Terminal Wall" (Revenue Administration Section)
 * Responsive: absolute background overlay on mobile (opacity-15), 50% relative stage on desktop (opacity-100)
 */
function DataWallBackground() {
  const auditLogs = [
    { tag: "[SYS_OK]", type: "ok", text: "MUTATION: 0x8f4d...3a19 | TAH_ID: 9942 | ENCRYPT: OK" },
    { tag: "[POSTGIS]", type: "spatial", text: "TOPOLOGY_VALID: 24 NODES | GAPS: 0 | EPSG:4326" },
    { tag: "[CAD_SEAL]", type: "legal", text: "MERKLE_ROOT: 0x3e12...b944 | SIG: Ed25519" },
    { tag: "[REG_SYNC]", type: "legal", text: "SRO_NORTH_DEED_12A | DOC: #194022 | STAMP: OK" },
    { tag: "[ENCUMBRANCE]", type: "legal", text: "SBI_AGRI_NODE | LIEN: NONE | STAY: CLEARED" },
    { tag: "[MUTATION]", type: "ok", text: "ROR_RECORD_GENERATED | ULPIN: 29572001841021" },
    { tag: "[AUDIT_LOG]", type: "legal", text: "DIST_COMMISSIONER | IP: 10.24.18.91 | AUTH: OK" },
    { tag: "[TAX_ASSESS]", type: "legal", text: "REVENUE_DEMAND_CLEAR | RECEIPT: KTK948201" },
    { tag: "[GEO_SPLIT]", type: "spatial", text: "PARENT: 29-582-01 | SUBDIV: 2 PLOTS | ±0.01m" },
    { tag: "[HEARTBEAT]", type: "ok", text: "PEER_NODES: 14 | SYNC: 99.98% | LAT: 12ms" },
    { tag: "[CADASTRE]", type: "spatial", text: "PARCEL_SEALED | SV_8819 | BENCHMARK: B-401" },
    { tag: "[DPI_GATEWAY]", type: "spatial", text: "INGESTION: 1,420 TX/SEC | BUFFER: NOMINAL" },
    { tag: "[COURT_STAY]", type: "legal", text: "INJUNCTION_SCAN | QUERY: 29572001 | 0_RECORDS" },
    { tag: "[ROR_DISPATCH]", type: "ok", text: "FORM_12A_FINALIZED | SMS_DISPATCHED" },
    { tag: "[POSTGIS]", type: "spatial", text: "RTREE_GIST_REINDEX | cadastral_poly | 18ms" },
    { tag: "[CONSENSUS]", type: "ok", text: "DISTRICT_NODE_01 | BLOCK: #849102 | QUORUM: 5/5" },
    { tag: "[INSPECTION]", type: "spatial", text: "FIELD_GEOJSON | 12.9716, 77.5946 | VERIFIED" },
    { tag: "[MORTGAGE]", type: "legal", text: "CANARA_BANK_RELEASE | NOC: NOC/2026/9102" },
    { tag: "[SYS_OK]", type: "ok", text: "MUTATION_HASH: 0x91ae...77cc | SYNC: SUCCESS" },
    { tag: "[LAND_REFORM]", type: "legal", text: "SEC_104_CHECK | INAM: NO | DISPUTE: NONE" },
    { tag: "[API_SEC]", type: "ok", text: "MTLS_VERIFIED | CLIENT: STATE_REVENUE_PORTAL" },
    { tag: "[SURVEY_DRONE]", type: "spatial", text: "ORTHOPHOTO_TILES | GSD: 2.5cm | 4K_READY" },
    { tag: "[AUDIT_CHAIN]", type: "legal", text: "PREV_HASH: 0x4a12...99ee | SIGNED_LEAF" },
    { tag: "[ENCUMBRANCE]", type: "legal", text: "HDFC_MORTGAGE_SCAN | NO_ACTIVE_CHARGE" },
    { tag: "[SUBDIVISION]", type: "spatial", text: "CHUNKS: PLOT_A (1220m²) PLOT_B (1230m²)" },
    { tag: "[INTEGRITY]", type: "ok", text: "OVERLAP_FILTER: 0_ANOMALIES | STATUS: GREEN" },
    { tag: "[TAHSIL_QUEUE]", type: "ok", text: "PENDING: 0 | AVG_RESOLUTION: 18.4_MIN" },
    { tag: "[POSTGIS_RPC]", type: "spatial", text: "ST_Intersects_Batch | 45 PARCELS | 0_GAPS" },
    { tag: "[ROR_VAULT]", type: "ok", text: "IMMUTABLE_BLOB | CID: QmZ948a...44fe" },
    { tag: "[HEARTBEAT]", type: "ok", text: "REPLICATION_LAG: 0.00ms | HEALTH: 100%" },
    { tag: "[REV_INSPECTOR]", type: "legal", text: "DSC_TOKEN: NIC_CA_GOV_IND | VERIFIED" },
    { tag: "[MUTATION]", type: "ok", text: "SUCCESSION_AFFIDAVIT | AFF-99410 | VALID" },
    { tag: "[BHARAT_GRID]", type: "spatial", text: "ULPIN_RESOLVER | LAT: 8ms | ACCURACY: 100%" },
    { tag: "[SECURITY]", type: "ok", text: "TAMPER_DETECTION: 18,400 PARCELS | SCORE: 1.00" },
    { tag: "[DEED_HOOK]", type: "legal", text: "TITLE_CONVEYANCE_EVENT | REG_PORTAL_LOGGED" },
    { tag: "[DPI_ARCH]", type: "spatial", text: "REVENUE_LAYER_SYNC | CADASTRE_V4.2 | READY" }
  ];

  const seamlessLogs = [...auditLogs, ...auditLogs];

  return (
    <div
      aria-hidden="true"
      className="relative md:absolute md:left-0 w-full md:w-1/2 h-[400px] md:h-full mt-8 md:mt-0 opacity-100 z-10 flex items-center justify-center overflow-hidden pointer-events-none select-none"
    >
      <style>{`
        @keyframes scrollUp {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-50%);
          }
        }
        .animate-scroll-up {
          animation: scrollUp 36s linear infinite;
        }
      `}</style>

      {/* Ambient Emerald Radial Glow */}
      <div className="absolute w-[360px] sm:w-[480px] lg:w-[520px] h-[360px] sm:h-[480px] lg:h-[520px] bg-emerald-950/40 blur-[120px] rounded-full pointer-events-none" />

      {/* The 3D Glass Terminal Container (Flex centered, scaled for mobile) */}
      <div className="w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[500px] xl:max-w-[540px] h-[440px] sm:h-[480px] lg:h-[520px] max-h-[65vh] perspective-[1200px] flex items-center justify-center pointer-events-none scale-[0.6] md:scale-100">
        {/* Rotated Glass Terminal Wall */}
        <div
          className="w-full h-full bg-black/80 border border-teal-500/30 backdrop-blur-md shadow-[0_0_50px_rgba(20,184,166,0.12)] overflow-hidden flex flex-col rounded-2xl relative"
          style={{
            transform: "rotateY(16deg) translateZ(0px)",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-teal-500/25 bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-emerald-950/80 shrink-0 z-20">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/90 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/90 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-teal-400 inline-block animate-pulse" />
              <span className="ml-2 text-[10px] sm:text-xs font-mono font-bold tracking-widest text-teal-300 uppercase truncate">
                DISTRICT AUDIT ENGINE // REVENUE_DAEMON
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono text-cyan-400/80 shrink-0">
              PORT: 5432 [POSTGIS]
            </div>
          </div>

          {/* Scrolling Stream Viewport with Top & Bottom Fade Mask */}
          <div className="relative flex-1 overflow-hidden">
            {/* Top & Bottom Gradient Fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-transparent via-15% via-85% to-black/85 z-20 pointer-events-none" />

            {/* The Dense Data Stream with High-Tech Syntax Highlight */}
            <div className="animate-scroll-up px-5 py-3 flex flex-col gap-2">
              {seamlessLogs.map((log, idx) => {
                const tagColor =
                  log.type === "spatial"
                    ? "text-cyan-400"
                    : log.type === "legal"
                    ? "text-teal-300"
                    : "text-emerald-400";
                return (
                  <div
                    key={idx}
                    className="text-[11px] lg:text-xs font-mono tracking-wider leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-[0_0_6px_rgba(45,212,191,0.25)] flex items-center gap-2"
                  >
                    <span className={`${tagColor} font-bold shrink-0`}>
                      {log.tag}
                    </span>
                    <span className="text-neutral-300/90 truncate">
                      {log.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onNavigate }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGoCitizen = () => {
    onNavigate?.("citizen");
    navigate("/citizen");
  };

  const handleGoAdmin = () => {
    onNavigate?.("admin");
    navigate("/admin");
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white overflow-x-hidden relative select-none scroll-smooth">
      {/* 1. Cinematic Header (Fixed Glassmorphic Frosted Glass) */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-16 py-4 md:py-6 bg-black/50 backdrop-blur-md border-b border-white/10">
        {/* Left (Logo) */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-xl font-bold tracking-[0.2em] uppercase text-white hover:opacity-80 transition-opacity cursor-pointer"
          >
            LAND STACK
          </button>
        </div>

        {/* Center (Navigation - hidden on mobile, visible on desktop) */}
        <nav className="hidden md:flex items-center gap-10">
          <button
            type="button"
            onClick={() => scrollToSection("citizen-portal")}
            className="text-xs font-bold tracking-[0.15em] uppercase text-white hover:text-neutral-400 transition-colors cursor-pointer"
          >
            CITIZEN PORTAL
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("revenue-administration")}
            className="text-xs font-bold tracking-[0.15em] uppercase text-white hover:text-neutral-400 transition-colors cursor-pointer"
          >
            ADMINISTRATION
          </button>

          <button
            type="button"
            onClick={handleGoCitizen}
            className="text-xs font-bold tracking-[0.15em] uppercase text-white hover:text-neutral-400 transition-colors cursor-pointer"
          >
            DPI ARCHITECTURE
          </button>
        </nav>

        {/* Right (Menu / Login) */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleGoAdmin}
            className="hidden md:block text-xs font-bold tracking-[0.15em] uppercase text-white hover:text-neutral-400 transition-colors cursor-pointer"
          >
            LOGIN
          </button>

          {/* Minimalist Hamburger Toggle (only on mobile) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="block md:hidden text-white hover:text-neutral-400 transition-colors cursor-pointer p-1"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 stroke-[1.5]" />
            ) : (
              <Menu className="h-6 w-6 stroke-[1.5]" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (SpaceX-style Minimal Overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md flex flex-col justify-center px-12 space-y-8 md:hidden">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              scrollToSection("citizen-portal");
            }}
            className="text-left text-lg font-bold tracking-[0.2em] uppercase text-white hover:text-neutral-400 transition-colors cursor-pointer"
          >
            CITIZEN PORTAL
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              scrollToSection("revenue-administration");
            }}
            className="text-left text-lg font-bold tracking-[0.2em] uppercase text-white hover:text-neutral-400 transition-colors cursor-pointer"
          >
            ADMINISTRATION
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleGoCitizen();
            }}
            className="text-left text-lg font-bold tracking-[0.2em] uppercase text-white hover:text-neutral-400 transition-colors cursor-pointer"
          >
            DPI ARCHITECTURE
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleGoAdmin();
            }}
            className="text-left text-lg font-bold tracking-[0.2em] uppercase text-white hover:text-neutral-400 transition-colors cursor-pointer"
          >
            LOGIN
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: HERO (Live Auto-Panning Dark GIS Map + Vignette + Palantir HUD)
          ========================================================================= */}
      <section
        id="hero"
        className="relative min-h-[100svh] w-full flex flex-col md:flex-row items-start md:items-center justify-center md:justify-between px-6 md:px-16 pt-32 pb-16 md:py-0 overflow-hidden bg-black"
      >
        {/* 1. Auto-Panning Background Map Component */}
        <CinematicMapBackground />

        {/* 2. The Cinematic Vignette (Shadow Overlays) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-black/80 via-black/40 to-transparent md:from-black md:via-black/80 md:to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/70 md:via-black/40 md:to-black"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black via-transparent to-black/40 md:to-black/60"
        />

        {/* 4. Foreground Hero Typography & SpaceX Button */}
        <div className="z-20 flex flex-col items-start text-left w-full max-w-3xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-blue-500 mb-4 font-mono">
            SMART INDIA HACKATHON 2026
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold uppercase tracking-tight text-white mb-6 leading-tight">
            UPDATING INDIA'S CADASTRE
          </h1>

          <p className="text-base md:text-lg text-neutral-400 max-w-md mb-8 leading-relaxed">
            A unified, GIS-based Digital Public Infrastructure resolving land disputes through a single source of truth.
          </p>

          <div className="w-full md:w-auto flex justify-start">
            <button
              type="button"
              onClick={handleGoCitizen}
              className="border-2 border-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase text-white hover:bg-white hover:text-black transition-all duration-300 w-[fit-content] md:w-auto inline-block text-center cursor-pointer"
            >
              INITIATE DEMO
            </button>
          </div>
        </div>

        {/* 3. HUD Tracking Elements (The "Palantir" Vibe) - Desktop Right Column */}
        <div
          aria-hidden="true"
          className="z-20 w-full md:w-1/2 pointer-events-none hidden lg:flex flex-col items-end select-none"
        >
          <div className="relative w-[300px] h-[300px] border border-white/10 bg-white/[0.01] backdrop-blur-[1px]">
            <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-2 border-l-2 border-white" />
            <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-2 border-r-2 border-white" />
            <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-2 border-l-2 border-white" />
            <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-2 border-r-2 border-white" />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-[1px] bg-white/40" />
              <div className="h-8 w-[1px] bg-white/40 absolute" />
              <div className="w-16 h-16 rounded-full border border-white/20 absolute animate-pulse opacity-40" />
            </div>

            <div className="absolute top-2.5 left-3 text-[10px] font-mono text-neutral-400 tracking-wider">
              TARGET_ACQ://0x4A12
            </div>
            <div className="absolute top-2.5 right-3 text-[10px] font-mono text-emerald-400 tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              GEO_SYNC
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-3 text-xs text-neutral-500 font-mono tracking-widest">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0 shadow-sm shadow-red-500/50" />
            <span>LAT 12.9716 / LNG 77.5946 / TRK: ACTIVE</span>
          </div>
        </div>

        {/* SpaceX-style Ambient Scroll Indicator */}
        <div
          onClick={() => scrollToSection("citizen-portal")}
          className="absolute bottom-8 right-8 md:right-16 z-20 hidden sm:flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400">
            SCROLL
          </span>
          <ChevronDown className="h-4 w-4 animate-bounce text-white" />
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CITIZEN TRANSPARENCY (Exploded 3D CAD Parcel Background)
          ========================================================================= */}
      <section
        id="citizen-portal"
        className="relative min-h-[100svh] w-full flex flex-col md:flex-row bg-black overflow-hidden pb-16 md:pb-0"
      >
        {/* Text Block: Pushed to top half on mobile, vertical center on desktop */}
        <div className="w-full md:w-1/2 flex flex-col items-start text-left px-6 md:px-16 pt-24 md:pt-0 z-20 md:justify-center">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-blue-500 mb-4 font-mono">
            PUBLIC SPATIAL DATA INFRASTRUCTURE
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold uppercase tracking-tight text-white mb-6 leading-tight">
            CITIZEN PORTAL
          </h2>
          <p className="text-base md:text-lg text-neutral-400 max-w-md mb-8 leading-relaxed">
            Instant ULPIN lookups. Transparent Record of Rights. Seamless Form 12-A digital mutations.
          </p>
          <div className="w-full md:w-auto flex justify-start">
            <button
              type="button"
              onClick={handleGoCitizen}
              className="border-2 border-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase text-white hover:bg-white hover:text-black transition-all duration-300 w-[fit-content] md:w-auto inline-block text-center cursor-pointer"
            >
              EXPLORE CITIZEN UI
            </button>
          </div>
        </div>

        {/* 3D Parcel: Sits below text on mobile, absolute right on desktop */}
        <IsometricParcelBackground />
      </section>

      {/* =========================================================================
          SECTION 3: REVENUE GOVERNANCE (Massive 3D Glass Terminal Wall)
          ========================================================================= */}
      <section
        id="revenue-administration"
        className="relative min-h-[100svh] w-full flex flex-col md:flex-row bg-black overflow-hidden pb-16 md:pb-0"
      >
        {/* Text Block: First in DOM so on mobile (flex-col) it is on top, right-aligned on desktop */}
        <div className="w-full md:w-1/2 flex flex-col items-start text-left md:items-end md:text-right md:ml-auto px-6 md:px-16 pt-24 md:pt-0 z-20 md:justify-center">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-emerald-400 mb-4 font-mono">
            STATUTORY REVENUE ADMINISTRATION
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold uppercase tracking-tight text-white mb-6 leading-tight">
            REVENUE ADMINISTRATION
          </h2>
          <p className="text-base md:text-lg text-neutral-400 max-w-md mb-8 leading-relaxed">
            Live cadastral updates, automated encumbrance checks, and immutable district-wide audit trails for government officers.
          </p>
          <div className="w-full md:w-auto flex justify-start md:justify-end">
            <button
              type="button"
              onClick={handleGoAdmin}
              className="border-2 border-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase text-white hover:bg-white hover:text-black transition-all duration-300 w-[fit-content] md:w-auto inline-block text-center cursor-pointer"
            >
              ENTER ADMIN CONSOLE
            </button>
          </div>
        </div>

        {/* 3D Terminal: Second in DOM so sits below text on mobile, absolute left on desktop */}
        <DataWallBackground />
      </section>

      {/* Polished Footer */}
      <footer className="w-full py-8 px-6 border-t border-neutral-900 bg-black flex flex-col md:flex-row items-center justify-center md:justify-between text-center gap-4">
        <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-neutral-500">
          LAND STACK © 2026
        </span>
        <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-neutral-500">
          MINISTRY OF RURAL DEVELOPMENT | SIH PS 26014
        </span>
      </footer>
    </div>
  );
}
