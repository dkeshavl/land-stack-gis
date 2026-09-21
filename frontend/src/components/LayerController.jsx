import { useState, useEffect, useRef } from "react";
import L from "leaflet";

/**
 * Default layer activation state for Land Stack GIS
 * Cadastral Bounds is the statutory base and is permanently locked ON.
 */
export const INITIAL_LAYER_STATE = {
  cadastralBounds: true,
  zoning: false,
  landUseZoning: false,
  encumbrance: false,
  encumbranceFlags: false,
  waterLines: false,
  waterSewageLines: false,
  envRestrictions: false,
  environmentalRestrictions: false
};

/**
 * Initial layer loading state for tracking active live queries
 */
export const INITIAL_LOADING_LAYERS = {
  cadastralBounds: false,
  zoning: false,
  landUseZoning: false,
  encumbrance: false,
  encumbranceFlags: false,
  waterLines: false,
  waterSewageLines: false,
  envRestrictions: false,
  environmentalRestrictions: false
};

/**
 * Category & Layer Definitions
 * Organizes spatial data into the 3 strict categories mandated by SIH PS 26014
 */
export const LAYER_CATEGORIES = [
  {
    id: "base",
    title: "CATEGORY 1: BASE LAYER",
    layers: [
      {
        id: "cadastralBounds",
        label: "Cadastral Bounds",
        sublabel: "Statutory ULPIN vectors",
        locked: true,
        badge: "CORE",
        color: "#3b82f6"
      }
    ]
  },
  {
    id: "essential",
    title: "CATEGORY 2: ESSENTIAL GOVERNANCE",
    layers: [
      {
        id: "landUseZoning",
        label: "Land Use & Zoning",
        sublabel: "Master Plan 2031 & Zoning",
        locked: false,
        badge: "GOV",
        color: "#8b5cf6"
      },
      {
        id: "encumbranceFlags",
        label: "Encumbrance Flags",
        sublabel: "Liens, Mortgages & Disputes",
        locked: false,
        badge: "RISK",
        color: "#ef4444"
      }
    ]
  },
  {
    id: "utility",
    title: "CATEGORY 3: USE-CASE & UTILITY",
    layers: [
      {
        id: "waterSewageLines",
        label: "Water & Sewage Lines",
        sublabel: "Pipelines & Drainage Grid",
        locked: false,
        badge: "UTIL",
        color: "#06b6d4"
      },
      {
        id: "environmentalRestrictions",
        label: "Environmental Restrictions",
        sublabel: "ESZ, Wetlands & Forests",
        locked: false,
        badge: "ECO",
        color: "#10b981"
      }
    ]
  }
];

/**
 * Stark Square Checkbox Component
 * High-contrast SpaceX / Palantir aesthetic with square geometries and sharp borders.
 */
function StarkCheckbox({ checked, locked, disabled, onChange, label, id }) {
  const isInactive = locked || disabled;

  const handleKeyDown = (e) => {
    if (isInactive) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange?.();
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-disabled={isInactive}
      aria-label={label}
      tabIndex={isInactive ? -1 : 0}
      id={id}
      onClick={(e) => {
        e.stopPropagation();
        if (!isInactive && onChange) {
          onChange();
        }
      }}
      onKeyDown={handleKeyDown}
      className={`relative h-4 w-4 shrink-0 rounded-none border transition-colors duration-100 flex items-center justify-center select-none ${
        disabled
          ? "cursor-not-allowed border-amber-500/60 bg-amber-500/10 text-amber-500"
          : locked
          ? "cursor-not-allowed border-black dark:border-white bg-black dark:bg-white text-white dark:text-black opacity-90"
          : checked
          ? "cursor-pointer border-black dark:border-white bg-black dark:bg-white text-white dark:text-black focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-black dark:focus-visible:ring-white outline-none"
          : "cursor-pointer border-black dark:border-white bg-transparent text-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-black dark:focus-visible:ring-white outline-none"
      }`}
    >
      {checked && !disabled && (
        <svg
          className="h-3 w-3 stroke-[3]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="square"
          strokeLinejoin="miter"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {disabled && (
        <span className="h-1.5 w-1.5 bg-amber-500 animate-pulse rounded-none" />
      )}
    </div>
  );
}

/**
 * LayerController Component
 * Sleek, floating "Data Layers" control panel with stark SpaceX/Palantir aesthetic.
 *
 * @param {Object} props
 * @param {Object} [props.activeLayers] Controlled state object
 * @param {Object} [props.loadingLayers] Layer loading tracking flags
 * @param {Function} [props.onLayersChange] Callback when any layer is toggled: (nextLayers) => void
 * @param {Function} [props.onToggleLayer] Callback for specific layer toggle: (layerKey, isActive) => void
 * @param {string} [props.className] Optional custom class overrides
 */
export default function LayerController({
  activeLayers: externalLayers,
  loadingLayers = {},
  onLayersChange,
  onToggleLayer,
  className = ""
}) {
  const containerRef = useRef(null);
  const [internalLayers, setInternalLayers] = useState(INITIAL_LAYER_STATE);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeLayers = externalLayers || internalLayers;

  // Helper to determine whether a given layer is currently in flight
  const isLayerLoading = (layerId) => {
    if (!loadingLayers) return false;
    if (loadingLayers[layerId]) return true;
    if (layerId === "landUseZoning" && (loadingLayers.zoning || loadingLayers.landUseZoning)) return true;
    if (layerId === "waterSewageLines" && (loadingLayers.waterLines || loadingLayers.waterSewageLines || loadingLayers.utilities)) return true;
    if (layerId === "environmentalRestrictions" && (loadingLayers.envRestrictions || loadingLayers.environmentalRestrictions || loadingLayers.environment)) return true;
    if (layerId === "encumbranceFlags" && (loadingLayers.encumbrance || loadingLayers.encumbranceFlags)) return true;
    return false;
  };

  // Prevent Leaflet map gestures, clicks, and zoom events from bleeding through the floating HUD
  useEffect(() => {
    if (containerRef.current && typeof L !== "undefined" && L.DomEvent) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  const handleToggle = (layerId, isLocked) => {
    // Strict Rule 3: Disable toggle when locked or fetching
    if (isLocked || isLayerLoading(layerId)) return;

    const nextState = !activeLayers[layerId];
    const nextLayers = {
      ...activeLayers,
      [layerId]: nextState
    };

    // Keep alias keys synchronized
    if (layerId === "landUseZoning" || layerId === "zoning") {
      nextLayers.landUseZoning = nextState;
      nextLayers.zoning = nextState;
    }
    if (layerId === "encumbranceFlags" || layerId === "encumbrance") {
      nextLayers.encumbranceFlags = nextState;
      nextLayers.encumbrance = nextState;
    }
    if (layerId === "waterSewageLines" || layerId === "waterLines") {
      nextLayers.waterSewageLines = nextState;
      nextLayers.waterLines = nextState;
    }
    if (layerId === "environmentalRestrictions" || layerId === "envRestrictions") {
      nextLayers.environmentalRestrictions = nextState;
      nextLayers.envRestrictions = nextState;
    }

    if (!externalLayers) {
      setInternalLayers(nextLayers);
    }
    if (onLayersChange) {
      onLayersChange(nextLayers);
    }
    if (onToggleLayer) {
      onToggleLayer(layerId, nextState);
    }
  };

  // Count active canonical layers (5 total)
  const canonicalKeys = ["cadastralBounds", "landUseZoning", "encumbranceFlags", "waterSewageLines", "environmentalRestrictions"];
  const activeCount = canonicalKeys.filter((k) => Boolean(activeLayers[k] || (k === "landUseZoning" && activeLayers.zoning) || (k === "encumbranceFlags" && activeLayers.encumbrance) || (k === "waterSewageLines" && activeLayers.waterLines) || (k === "environmentalRestrictions" && activeLayers.envRestrictions))).length;
  const totalCount = canonicalKeys.length;

  return (
    <aside
      ref={containerRef}
      aria-label="Spatial Data Layers Controller"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className={`absolute top-24 right-4 z-[600] bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md border border-gray-300 dark:border-neutral-800 p-4 w-64 rounded-none shadow-2xl transition-all duration-200 select-none ${className}`}
    >
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200 dark:border-neutral-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-500"></span>
          </span>
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-gray-900 dark:text-white truncate">
            Data Layers
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 border border-gray-300 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-gray-600 dark:text-neutral-400">
            {activeCount}/{totalCount}
          </span>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? "Expand layer panel" : "Collapse layer panel"}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-neutral-700"
          >
            <span className="font-mono text-[10px] font-bold leading-none">
              {isCollapsed ? "[+]" : "[-]"}
            </span>
          </button>
        </div>
      </div>

      {/* Layer Groups Container */}
      {!isCollapsed && (
        <div className="space-y-4">
          {LAYER_CATEGORIES.map((category, catIdx) => (
            <div key={category.id} className="space-y-1.5">
              {/* Category Header with strict typography */}
              <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-500 dark:text-neutral-500 mb-2">
                {category.title}
              </h3>

              {/* Category Layer Rows */}
              <div className="space-y-1">
                {category.layers.map((layer) => {
                  const isActive = Boolean(activeLayers[layer.id]);
                  const isLoading = isLayerLoading(layer.id);

                  return (
                    <div
                      key={layer.id}
                      onClick={() => {
                        if (!layer.locked && !isLoading) {
                          handleToggle(layer.id, layer.locked);
                        }
                      }}
                      className={`group flex items-center justify-between gap-2.5 p-1.5 border transition-all duration-150 ${
                        layer.locked
                          ? "border-gray-200 dark:border-neutral-800/60 bg-gray-50/50 dark:bg-neutral-950/40 cursor-default"
                          : isLoading
                          ? "border-amber-500/40 bg-amber-500/5 cursor-not-allowed opacity-85"
                          : isActive
                          ? "border-gray-300 dark:border-neutral-700 bg-gray-50/80 dark:bg-neutral-900/50 cursor-pointer hover:border-black dark:hover:border-neutral-500"
                          : "border-transparent hover:border-gray-200 dark:hover:border-neutral-800/80 hover:bg-gray-50/50 dark:hover:bg-neutral-900/30 cursor-pointer"
                      }`}
                    >
                      {/* Left: Stark Checkbox & Layer Title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <StarkCheckbox
                          checked={isActive}
                          locked={layer.locked}
                          disabled={isLoading}
                          onChange={() => handleToggle(layer.id, layer.locked)}
                          label={layer.label}
                          id={`chk-${layer.id}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-none"
                              style={{ backgroundColor: layer.color }}
                              aria-hidden="true"
                            />
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider leading-tight ${
                                isLoading
                                  ? "text-amber-600 dark:text-amber-400"
                                  : isActive
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-600 dark:text-neutral-400 group-hover:text-gray-900 dark:group-hover:text-neutral-200"
                              }`}
                              title={layer.label}
                            >
                              {layer.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Stark State Indicator strictly adhering to Rule 3 */}
                      <div className="shrink-0 flex items-center gap-1">
                        {layer.locked ? (
                          <span className="font-mono text-[9px] font-bold text-gray-400 dark:text-neutral-500 tracking-wider">
                            [CORE]
                          </span>
                        ) : isLoading ? (
                          <span className="text-amber-500 animate-pulse font-mono text-[9px] font-bold tracking-wider">
                            [FETCHING...]
                          </span>
                        ) : isActive ? (
                          <span className="text-emerald-500 font-mono text-[9px] font-bold tracking-wider">
                            [ON]
                          </span>
                        ) : (
                          <span className="text-gray-500 font-mono text-[9px] font-bold tracking-wider">
                            [OFF]
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Separator between categories except last */}
              {catIdx < LAYER_CATEGORIES.length - 1 && (
                <div className="pt-1">
                  <div className="border-b border-gray-200/80 dark:border-neutral-900" />
                </div>
              )}
            </div>
          ))}

          {/* Footer Metadata */}
          <div className="pt-1 border-t border-gray-200 dark:border-neutral-900 flex items-center justify-between text-[9px] font-mono text-gray-400 dark:text-neutral-600 tracking-wider">
            <span>DPI_GIS_STACK</span>
            <span>SEC_V400</span>
          </div>
        </div>
      )}
    </aside>
  );
}
