import { useState, useEffect, useRef } from "react";

/**
 * Trigger Button Component for AI Satellite Change Detection
 * Strict SpaceX / Palantir terminal styling:
 * border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-mono text-xs px-4 py-2 uppercase tracking-widest transition-colors
 */
export function AIScanTriggerButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-mono text-xs px-4 py-2 uppercase tracking-widest transition-colors rounded-none cursor-pointer inline-flex items-center gap-2 select-none ${className}`}
      title="Execute Sentinel-2 / Cartosat-3 Automated Change Detection Inference"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>RUN AI SATELLITE SCAN</span>
    </button>
  );
}

/**
 * Hardcoded Defense-Grade Spatial Risk Alert Dataset
 */
const DETECTED_ALERTS = [
  {
    id: "ALERT-001",
    headline: "UNREGISTERED STRUCTURE DETECTED ON Khasra 326/3. Confidence: 94.2%.",
    severity: "CRITICAL",
    category: "UNAUTHORIZED_CONSTRUCTION",
    ulpin: "29572001218407",
    khasra: "326/3",
    confidence: "94.2%",
    coordinates: "12.9338° N, 77.5917° E",
    surfaceChange: "+184.6 sq.m new impervious concrete plinth",
    baselineEpoch: "2024-Q1 (Fallow Agricultural Land - NDVI 0.68)",
    currentEpoch: "2026-Q3 (Permanent Reinforced Concrete Superstructure - NDVI 0.09)",
    sensor: "Cartosat-3 Panchromatic (0.28m) + Sentinel-2 MSI",
    violationType: "Absence of Town Planning (BDA/BBMP) Sanctioned Plan",
    defaultTicketId: "TKT-INS-2026-3263"
  },
  {
    id: "ALERT-002",
    headline: "ENCROACHMENT RISK: 2.4m expansion beyond cadastral bounds on ULPIN 29572001218435.",
    severity: "HIGH_RISK",
    category: "BOUNDARY_ENCROACHMENT",
    ulpin: "29572001218435",
    khasra: "149/2",
    confidence: "96.8%",
    coordinates: "12.9298° N, 77.5843° E",
    surfaceChange: "2.4m linear fence & paved expansion beyond statutory polyline",
    baselineEpoch: "2024-Q1 (Survey Settlement Marker 149/2-East Verified)",
    currentEpoch: "2026-Q3 (Boundary breach into 9m Government Stormwater Buffer)",
    sensor: "ISRO Cartosat-3 Stereo Pair + PostGIS Polygon Diff",
    violationType: "Section 192-A Karnataka Land Revenue Act (Government Land Encroachment)",
    defaultTicketId: "TKT-INS-2026-8435"
  }
];

/**
 * AIAnalyticsModule Component
 * Simulates an AI/ML Satellite Change Detection Engine inside the Admin Dashboard
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the scanning modal is active
 * @param {Function} props.onClose - Modal dismissal callback
 * @param {Function} [props.onInspectParcel] - Callback to locate/zoom to parcel on Citizen Map
 */
export default function AIAnalyticsModule({
  isOpen,
  onClose,
  onInspectParcel
}) {
  const [phase, setPhase] = useState("scanning"); // "scanning" | "results"
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [flaggedTickets, setFlaggedTickets] = useState({});
  const [scanProgress, setScanProgress] = useState(0);
  const modalRef = useRef(null);

  // Sound/Vibration haptic feedback or visual pulse trigger
  const [scanTimestamp, setScanTimestamp] = useState("");

  // Scan simulation sequence
  const startScanSimulation = () => {
    setPhase("scanning");
    setScanProgress(0);
    setTerminalLogs([]);
    setScanTimestamp(new Date().toISOString());

    const logSteps = [
      { delay: 100, progress: 15, text: "> [SYS_INIT] ESTABLISHING SECURE UPLINK TO ISRO/SENTINEL-2 CONSTELLATION..." },
      { delay: 400, progress: 35, text: "> INITIATING ML INFERENCE (CNN-RESNET50-CHANGE-DETECTION-V4)..." },
      { delay: 850, progress: 60, text: "> DOWNLOADING MULTI-SPECTRAL TILES (BAND 2, 4, 8, 12 - SWIR/NIR)..." },
      { delay: 1200, progress: 80, text: "> COMPARING 2024 VS 2026 SATELLITE OPTICS..." },
      { delay: 1550, progress: 92, text: "> INTERSECTING SURFACE ANOMALIES WITH POSTGIS STATUTORY CADASTRAL BOUNDS..." },
      { delay: 1900, progress: 99, text: "> DETECTING UNREGISTERED PLINTH EXPANSIONS & VECTOR DEVIATIONS..." },
      { delay: 2050, progress: 100, text: "> [OK] INFERENCE COMPLETE: 2 CRITICAL SPATIAL VIOLATIONS FLAGGED." }
    ];

    const timeouts = [];

    logSteps.forEach((step) => {
      const t = setTimeout(() => {
        setTerminalLogs((prev) => [...prev, step.text]);
        setScanProgress(step.progress);
      }, step.delay);
      timeouts.push(t);
    });

    // Switch to results after 2100ms
    const completeTimer = setTimeout(() => {
      setPhase("results");
    }, 2150);
    timeouts.push(completeTimer);

    return () => timeouts.forEach((t) => clearTimeout(t));
  };

  // Launch scan whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    const cleanup = startScanSimulation();
    return () => {
      if (cleanup) cleanup();
    };
  }, [isOpen]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle flagging for field inspection
  const handleFlagInspection = (alertItem) => {
    const isAlreadyFlagged = Boolean(flaggedTickets[alertItem.id]);
    if (isAlreadyFlagged) return;

    const ticketId = alertItem.defaultTicketId;
    setFlaggedTickets((prev) => ({
      ...prev,
      [alertItem.id]: {
        ticketId,
        flaggedAt: new Date().toLocaleTimeString("en-IN", { hour12: false }),
        officer: "Tahsildar (Zone South)"
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-scan-title"
      className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-4xl bg-white dark:bg-[#050505] border border-gray-300 dark:border-neutral-800 rounded-none shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-hidden font-mono"
      >
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-[#0c0c0c] border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2.5 w-2.5 bg-emerald-500 rounded-none animate-pulse" />
              <span className="h-2.5 w-2.5 bg-amber-500 rounded-none opacity-60" />
              <span className="h-2.5 w-2.5 bg-rose-500 rounded-none opacity-60" />
            </div>
            <div className="min-w-0 truncate">
              <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-500 tracking-[0.2em] uppercase mr-2">
                [ORBITAL_RECON // PS-26014]
              </span>
              <h2
                id="ai-scan-title"
                className="inline text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider"
              >
                AI/ML SATELLITE CHANGE DETECTION
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block border border-gray-300 dark:border-neutral-700 bg-white dark:bg-black px-2 py-0.5 text-[9px] font-bold tracking-wider text-gray-600 dark:text-neutral-400">
              SENTINEL-2 / CARTOSAT-3
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-bold text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-neutral-700"
              aria-label="Close AI Change Detection Dialog"
            >
              [✕ ESC]
            </button>
          </div>
        </div>

        {/* Modal Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Phase 1: Scanning State (2 Seconds Animation) */}
          {phase === "scanning" && (
            <div className="space-y-6 py-6">
              {/* Radar Grid Animation Bar */}
              <div className="relative border border-emerald-500/40 bg-emerald-950/10 dark:bg-emerald-950/20 p-6 text-emerald-600 dark:text-emerald-400 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                    <span className="animate-spin text-sm">◵</span>
                    <span>ORBITAL INFERENCE PIPELINE RUNNING</span>
                  </div>
                  <span className="text-xs font-bold tracking-wider">
                    {scanProgress}% COMPLETE
                  </span>
                </div>

                {/* Progress Track */}
                <div className="w-full h-1.5 bg-gray-200 dark:bg-neutral-800 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-150 ease-out"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-gray-600 dark:text-neutral-400 pt-2 border-t border-emerald-500/20">
                  <div>
                    <span className="text-gray-400 dark:text-neutral-600 block">SENSOR:</span>
                    <span className="font-bold text-gray-800 dark:text-neutral-200">ISRO Cartosat-3</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-neutral-600 block">BASE EPOCH:</span>
                    <span className="font-bold text-gray-800 dark:text-neutral-200">2024-Q1 Ortho</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-neutral-600 block">TARGET EPOCH:</span>
                    <span className="font-bold text-gray-800 dark:text-neutral-200">2026-Q3 Ortho</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-neutral-600 block">RESOLUTION:</span>
                    <span className="font-bold text-gray-800 dark:text-neutral-200">0.28m Pan / 10m Multi</span>
                  </div>
                </div>
              </div>

              {/* Streaming Monospace Log Console */}
              <div className="border border-gray-300 dark:border-neutral-800 bg-gray-50 dark:bg-[#070707] p-4 space-y-2 min-h-[160px]">
                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-500 pb-2 border-b border-gray-200 dark:border-neutral-800/80">
                  // TELEMETRY LOGS STREAM
                </div>
                <div className="space-y-1.5 text-xs">
                  {terminalLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`leading-relaxed animate-fade-in ${
                        log.includes("[OK]")
                          ? "text-emerald-600 dark:text-emerald-400 font-bold"
                          : log.includes("2024 VS 2026")
                          ? "text-amber-600 dark:text-amber-400 font-bold"
                          : "text-gray-700 dark:text-neutral-300"
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                  <div className="inline-block h-3.5 w-2 bg-emerald-500 animate-pulse ml-0.5" />
                </div>
              </div>
            </div>
          )}

          {/* Phase 2: Results Display (Simulated Risk Alert Grid) */}
          {phase === "results" && (
            <div className="space-y-6">
              {/* Telemetry Summary Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-100 dark:bg-[#0a0a0a] border border-gray-300 dark:border-neutral-800 text-[10px] tracking-wider uppercase">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-rose-500 rounded-none animate-pulse" />
                  <span className="font-bold text-gray-900 dark:text-white">
                    2 HIGH-CONFIDENCE ANOMALIES IDENTIFIED
                  </span>
                  <span className="text-gray-500 dark:text-neutral-500">|</span>
                  <span className="text-gray-600 dark:text-neutral-400">
                    SCAN TIMESTAMP: {scanTimestamp ? scanTimestamp.slice(11, 19) + " UTC" : "ACTIVE"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startScanSimulation}
                    className="border border-gray-400 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white px-2.5 py-1 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    ↻ RE-RUN SCAN
                  </button>
                </div>
              </div>

              {/* Military / Defense Terminal Risk Alert Grid */}
              <div className="space-y-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-neutral-500">
                  // CRITICAL SPATIAL DEVIATION ALERTS
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {DETECTED_ALERTS.map((alert) => {
                    const flagInfo = flaggedTickets[alert.id];
                    const isFlagged = Boolean(flagInfo);

                    return (
                      <div
                        key={alert.id}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-500/50 text-red-600 dark:text-red-400 p-4 font-mono text-xs rounded-none transition-all duration-150 space-y-3 shadow-sm"
                      >
                        {/* Alert Header Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-500/30 pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-red-600 text-white dark:bg-red-500 dark:text-black text-[9px] font-bold tracking-widest uppercase">
                              {alert.severity}
                            </span>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-gray-900 dark:text-white">
                              {alert.id} • {alert.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] tracking-wider text-red-700 dark:text-red-300 font-bold">
                              CONFIDENCE: {alert.confidence}
                            </span>
                          </div>
                        </div>

                        {/* Primary Mandated Headline */}
                        <div className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-red-700 dark:text-red-300 leading-snug">
                          {alert.headline}
                        </div>

                        {/* Forensic Intelligence Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white/70 dark:bg-black/40 border border-red-500/20 p-3 text-gray-800 dark:text-neutral-200">
                          <div>
                            <span className="text-gray-500 dark:text-neutral-500 block text-[9px] uppercase tracking-wider">
                              Spatial Coordinates & Cadastre:
                            </span>
                            <span className="font-bold">{alert.coordinates}</span> (Khasra: {alert.khasra})
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-neutral-500 block text-[9px] uppercase tracking-wider">
                              Target ULPIN Vector:
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">{alert.ulpin}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-neutral-500 block text-[9px] uppercase tracking-wider">
                              2024 Satellite Baseline:
                            </span>
                            <span className="text-gray-600 dark:text-neutral-400">{alert.baselineEpoch}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-neutral-500 block text-[9px] uppercase tracking-wider">
                              2026 Satellite Optical Change:
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-semibold">{alert.currentEpoch}</span>
                          </div>
                          <div className="sm:col-span-2 pt-1 border-t border-gray-200 dark:border-neutral-800 text-[10px]">
                            <span className="text-gray-500 dark:text-neutral-500 uppercase tracking-wider mr-1">
                              Statutory Violation Code:
                            </span>
                            <span className="font-semibold text-gray-800 dark:text-neutral-300">
                              {alert.violationType}
                            </span>
                          </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                          {/* Left: Flag status indicator */}
                          <div>
                            {isFlagged ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-500/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                <span>✓ WORK ORDER DISPATCHED:</span>
                                <span className="underline">{flagInfo.ticketId}</span>
                                <span className="text-gray-500 dark:text-neutral-500">({flagInfo.flaggedAt})</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500 dark:text-neutral-500 uppercase tracking-wider">
                                STATUS: PENDING FIELD VERIFICATION
                              </span>
                            )}
                          </div>

                          {/* Right Action Buttons */}
                          <div className="flex items-center gap-2">
                            {/* Mandated Ghost Button: FLAG FOR FIELD INSPECTION */}
                            <button
                              type="button"
                              onClick={() => handleFlagInspection(alert)}
                              disabled={isFlagged}
                              className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors rounded-none cursor-pointer inline-flex items-center gap-1.5 ${
                                isFlagged
                                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 cursor-not-allowed opacity-90"
                                  : "border-red-500/70 text-red-700 dark:text-red-400 hover:bg-red-500/10 hover:border-red-600 active:bg-red-500/20"
                              }`}
                            >
                              <span>{isFlagged ? "✓ FLAGGED FOR INSPECTION" : "FLAG FOR FIELD INSPECTION"}</span>
                            </button>

                            {/* Locate Vector on Map Button */}
                            {typeof onInspectParcel === "function" && (
                              <button
                                type="button"
                                onClick={() => {
                                  onInspectParcel(alert.ulpin);
                                  onClose();
                                }}
                                className="border border-gray-400 dark:border-neutral-700 text-gray-800 dark:text-neutral-300 hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors rounded-none cursor-pointer inline-flex items-center gap-1"
                                title={`Inspect ${alert.ulpin} on Citizen Cadastral Map`}
                              >
                                <span>VIEW ON MAP ↗</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statutory Notice Banner */}
              <div className="p-3 border border-gray-300 dark:border-neutral-800 bg-gray-50 dark:bg-[#070707] text-[10px] text-gray-500 dark:text-neutral-400 leading-relaxed">
                <span className="font-bold text-gray-800 dark:text-neutral-200">
                  LEGAL DISCLAIMER & STATUTORY PROCEDURE:
                </span>{" "}
                AI/ML satellite difference vectors are generated via automated bi-temporal optical comparisons.
                Under Section 67 of the Land Revenue Act, satellite alerts serve as preliminary reconnaissance
                and mandate on-ground total station DGPS survey verification by a licensed Revenue Surveyor prior to
                eviction notice issuance.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-gray-100 dark:bg-[#0c0c0c] border-t border-gray-200 dark:border-neutral-800 flex items-center justify-between text-[10px] text-gray-500 dark:text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-none" />
            <span>AI CORE: V4.2.8 // ORBITAL INFERENCE SEC_LVL_4</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-gray-700 dark:text-neutral-300 hover:text-black dark:hover:text-white px-3 py-1 uppercase tracking-wider font-bold transition-colors cursor-pointer"
          >
            DISMISS TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
}
