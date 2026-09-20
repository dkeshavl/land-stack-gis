import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../context/ThemeContext";
import LayerSwitcher from "./LayerSwitcher";

const MIN_CADASTRE_ZOOM = 15;

// Basemap configurations strictly using 100% free OpenStreetMap & elevation providers (Zero API keys)
export const GET_BASEMAP_CONFIGS = (isDark = false) => ({
  streets: {
    id: "streets",
    name: isDark ? "Night Vector" : "Blueprint Vector",
    sublabel: "OpenStreetMap Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  satellite: {
    id: "satellite",
    name: "Satellite",
    sublabel: "Esri World Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 19
  },
  topographic: {
    id: "topographic",
    name: isDark ? "Dark Topo" : "Topography",
    sublabel: "OpenTopoMap Elevation",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a>',
    maxZoom: 17
  }
});

/**
 * Adaptive Blueprint Polygons:
 * - Dark Mode Map: color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1
 * - Light Mode Map: color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1
 * - Hover / Active State (Both Modes): color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.3
 */
const getParcelStyle = (feature, isSelected = false, isDark = true) => {
  if (isSelected) {
    return {
      color: "#10b981",
      weight: 2,
      fillColor: "#10b981",
      fillOpacity: 0.3,
      opacity: 1,
      lineCap: "round",
      lineJoin: "round"
    };
  }

  if (isDark) {
    return {
      color: "#3b82f6",
      weight: 1,
      fillColor: "#3b82f6",
      fillOpacity: 0.1,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    };
  }

  return {
    color: "#2563eb",
    weight: 1,
    fillColor: "#3b82f6",
    fillOpacity: 0.1,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round"
  };
};

/**
 * Imperative Cadastre Vector Layer
 *
 * 1. Initializes a persistent L.geoJSON instance on the Leaflet Canvas engine.
 * 2. Uses a Set to track rendered ULPINs for client-side spatial deduplication.
 * 3. Injects only newly discovered polygons via layerRef.current.addData() without DOM thrashing.
 * 4. Manages hover, theme adaptation, and selection in O(1) time without unmounting or re-rendering existing vectors.
 */
function ImperativeCadastreLayer({
  selectedUlpIn,
  onParcelSelect,
  refreshKey,
  onZoomChange,
  geoJsonRef,
  isDark = true
}) {
  const map = useMap();
  const renderedUlpinsRef = useRef(new Set());
  const ulpinLayerMapRef = useRef(new Map());
  const selectedUlpInRef = useRef(selectedUlpIn);
  const isDarkRef = useRef(isDark);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const prevSelectedUlpinRef = useRef(null);

  // Sync isDark and selected ULPIN refs
  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  // Sync selected ULPIN ref for event listeners
  useEffect(() => {
    selectedUlpInRef.current = selectedUlpIn;
  }, [selectedUlpIn]);

  // Helper to imperatively inject features into existing canvas layer
  const injectFeatures = useCallback((featuresToAdd) => {
    if (!geoJsonRef.current || typeof geoJsonRef.current.addData !== "function") return;
    const rawList = Array.isArray(featuresToAdd?.features)
      ? featuresToAdd.features
      : Array.isArray(featuresToAdd)
      ? featuresToAdd
      : [];

    const newFeatures = rawList.filter((feat) => {
      const ulpin = feat?.properties?.ulpin || feat?.ulpin;
      if (!ulpin || renderedUlpinsRef.current?.has(ulpin)) {
        return false;
      }
      renderedUlpinsRef.current.add(ulpin);
      return true;
    });

    if (newFeatures.length > 0) {
      geoJsonRef.current.addData({
        type: "FeatureCollection",
        features: newFeatures
      });
    }
  }, [geoJsonRef]);

  // Viewport fetcher with BBox query & spatial deduplication
  const fetchViewportParcels = useCallback(() => {
    const zoom = map.getZoom();
    onZoomChange(zoom);

    // Zoom-gating: only load parcels at street scale (>= 15)
    if (zoom < MIN_CADASTRE_ZOOM) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const bounds = map.getBounds();
        const bboxString = bounds.toBBoxString(); // minLng,minLat,maxLng,maxLat

        const res = await fetch(`/api/parcels?bbox=${bboxString}&t=${Date.now()}`, {
          signal: abortControllerRef.current.signal
        });

        if (!res.ok) return;
        const data = await res.json();

        // SPATIAL DEDUPLICATION / CACHING:
        const rawFeatures = Array.isArray(data?.features)
          ? data.features
          : Array.isArray(data)
          ? data
          : [];

        if (rawFeatures.length > 0) {
          injectFeatures(rawFeatures);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.warn("Spatial BBox fetch notice:", err?.message || err);
        }
      }
    }, 250);
  }, [map, onZoomChange, injectFeatures]);

  // Map viewport events
  useMapEvents({
    moveend: fetchViewportParcels,
    zoomend: fetchViewportParcels
  });

  // Initialize imperative L.geoJSON layer
  useEffect(() => {
    const layer = L.geoJSON(null, {
      style: (feature) => {
        const isSelected = feature?.properties?.ulpin === selectedUlpInRef.current;
        return getParcelStyle(feature, isSelected, isDarkRef.current);
      },
      onEachFeature: (feature, l) => {
        const ulpin = feature.properties?.ulpin;
        if (!ulpin) return;

        ulpinLayerMapRef.current.set(ulpin, l);

        // Lightweight tooltip on hover with high contrast
        l.bindTooltip(ulpin, {
          sticky: true,
          direction: "auto",
          className: "custom-gis-tooltip"
        });

        l.on({
          click: async (e) => {
            if (e) {
              if (typeof e.stopPropagation === "function") e.stopPropagation();
              if (e.originalEvent) L.DomEvent.stopPropagation(e);
            }
            if (!ulpin) return;

            // Extract any baseline properties available on the polygon (e.g. from parcels.json or bbox)
            const baselineProps = feature?.properties || {};

            // 1. Immediately provide parcel selection with baseline properties
            if (onParcelSelect) {
              onParcelSelect(ulpin, { ulpin, ...baselineProps }, true);
            }

            try {
              // 2. Fetch full parcel metadata from hydration endpoint
              let res = await fetch(`/api/parcel/${encodeURIComponent(ulpin)}`);
              if (!res.ok && res.status === 404) {
                res = await fetch(`/api/parcels/${encodeURIComponent(ulpin)}`);
              }
              if (res.ok) {
                const data = await res.json();
                const parcelData = data.data || data;
                // 3. Populate sidebar with real owner, zoning & tax metadata
                if (onParcelSelect) {
                  onParcelSelect(ulpin, { ulpin, ...baselineProps, ...parcelData }, false);
                }
              } else {
                if (onParcelSelect) {
                  onParcelSelect(ulpin, { ulpin, ...baselineProps }, false);
                }
              }
            } catch (err) {
              console.warn("Notice hydrating parcel metadata on click, using baseline:", err);
              if (onParcelSelect) {
                onParcelSelect(ulpin, { ulpin, ...baselineProps }, false);
              }
            }
          },
          mouseover: () => {
            if (selectedUlpInRef.current !== ulpin) {
              l.setStyle({
                color: "#10b981",
                weight: 2,
                fillColor: "#10b981",
                fillOpacity: 0.3
              });
            }
          },
          mouseout: () => {
            if (selectedUlpInRef.current !== ulpin) {
              l.setStyle(getParcelStyle(feature, false, isDarkRef.current));
            }
          }
        });
      }
    });

    layer.addTo(map);
    geoJsonRef.current = layer;

    // Immediately load guaranteed base cadastral parcel polygons from /parcels.json
    fetch("/parcels.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((geoData) => {
        if (geoData?.features) {
          injectFeatures(geoData.features);
        }
      })
      .catch((e) => console.warn("Notice loading base parcels.json:", e));

    // Viewport query for live PostGIS streaming if available
    fetchViewportParcels();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
      geoJsonRef.current = null;
      renderedUlpinsRef.current.clear();
      ulpinLayerMapRef.current.clear();
    };
  }, [map, onParcelSelect, fetchViewportParcels, geoJsonRef]);

  // Dynamically re-style all polygons when user toggles Light/Dark mode
  useEffect(() => {
    if (geoJsonRef.current && typeof geoJsonRef.current.setStyle === "function") {
      geoJsonRef.current.setStyle((feature) => {
        const isSelected = (feature?.properties?.ulpin || feature?.ulpin) === selectedUlpInRef.current;
        return getParcelStyle(feature, isSelected, isDark);
      });
    }
  }, [isDark, geoJsonRef]);

  // O(1) Selection Restyling without re-rendering or unmounting the layer
  useEffect(() => {
    const prevUlpin = prevSelectedUlpinRef.current;
    if (prevUlpin && prevUlpin !== selectedUlpIn && ulpinLayerMapRef.current.has(prevUlpin)) {
      const prevLayer = ulpinLayerMapRef.current.get(prevUlpin);
      prevLayer.setStyle(getParcelStyle(prevLayer.feature, false, isDark));
    }

    if (selectedUlpIn && ulpinLayerMapRef.current.has(selectedUlpIn)) {
      const curLayer = ulpinLayerMapRef.current.get(selectedUlpIn);
      curLayer.setStyle(getParcelStyle(curLayer.feature, true, isDark));
      curLayer.bringToFront();
    }

    prevSelectedUlpinRef.current = selectedUlpIn;
  }, [selectedUlpIn, isDark]);

  // Handle explicit cache invalidation / refreshKey (e.g., after mutation or reset)
  useEffect(() => {
    if (refreshKey > 0 && geoJsonRef.current) {
      geoJsonRef.current.clearLayers();
      renderedUlpinsRef.current.clear();
      ulpinLayerMapRef.current.clear();
      fetchViewportParcels();
    }
  }, [refreshKey, fetchViewportParcels, geoJsonRef]);

  return null;
}

/**
 * MapViewController: Handles container resizing, camera fly-to with safe zoom clamping, and external centroid flyTo
 */
function MapViewController({ selectedUlpIn, geoJsonRef, onMapReady }) {
  const map = useMap();

  // Expose map reference and register global gis:flyTo event listener
  useEffect(() => {
    window.gisMap = map;
    if (onMapReady) onMapReady(map);

    const handleFlyTo = (e) => {
      const { lat, lng, zoom = 18, duration = 1.5 } = e.detail || {};
      if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
        const maxAllowedZoom = map.getMaxZoom() || 18;
        const safeZoom = Math.min(zoom, maxAllowedZoom);
        map.flyTo([lat, lng], safeZoom, {
          duration,
          easeLinearity: 0.25
        });
      }
    };

    window.addEventListener("gis:flyTo", handleFlyTo);
    return () => {
      window.removeEventListener("gis:flyTo", handleFlyTo);
      if (window.gisMap === map) window.gisMap = null;
    };
  }, [map, onMapReady]);

  useEffect(() => {
    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [map]);

  useEffect(() => {
    if (!selectedUlpIn) return;

    let found = false;
    if (geoJsonRef.current && typeof geoJsonRef.current.eachLayer === "function") {
      try {
        geoJsonRef.current.eachLayer((layer) => {
          const featureUlpin = layer?.feature?.properties?.ulpin || layer?.feature?.ulpin;
          if (featureUlpin === selectedUlpIn) {
            if (layer?.getBounds && typeof layer.getBounds === "function") {
              const bounds = layer.getBounds();
              if (bounds && typeof bounds.isValid === "function" && bounds.isValid()) {
                found = true;
                const isMobile = window.innerWidth < 768;
                map.flyToBounds(bounds, {
                  maxZoom: 18,
                  duration: 1.2,
                  easeLinearity: 0.25,
                  paddingTopLeft: [40, 40],
                  paddingBottomRight: isMobile ? [40, 240] : [420, 40]
                });
              }
            }
          }
        });
      } catch (err) {
        console.warn("MapViewController flyToBounds notice:", err);
      }
    }

    // Fallback flyTo coordinates if layer bounds aren't yet available
    if (!found) {
      const FALLBACK_CENTROIDS = {
        "1234567890ABCD": [12.9298, 77.5843],
        "1234567891ABCE": [12.9231, 77.5877],
        "1234567892ABCF": [12.9245, 77.5862],
        "1234567893ABCG": [12.9260, 77.5850],
        "1234567894ABCH": [12.9275, 77.5835],
        "1234567895ABCI": [12.9288, 77.5820],
        "1234567896ABCJ": [12.9302, 77.5810],
        "1234567897ABCK": [12.9315, 77.5800],
        "29572001218407": [12.9338, 77.5917]
      };
      if (FALLBACK_CENTROIDS[selectedUlpIn]) {
        const [cLat, cLng] = FALLBACK_CENTROIDS[selectedUlpIn];
        map.flyTo([cLat, cLng], 17, { duration: 1.2 });
      }
    }
  }, [selectedUlpIn, map, geoJsonRef]);

  return null;
}

/**
 * MapEmptyClickHandler: Clears selected parcel and green highlight when clicking empty map space
 */
function MapEmptyClickHandler({ onClearSelection }) {
  useMapEvents({
    click: () => {
      if (onClearSelection) {
        onClearSelection();
      }
    }
  });
  return null;
}

function MapDashboard({
  selectedUlpIn,
  selectedParcel,
  onParcelSelect,
  setSelectedParcel,
  onMapReady,
  refreshKey = 0,
  refreshCurrentParcel: externalRefreshCurrentParcel
}) {
  const { isDark } = useTheme();
  const geoJsonRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(16);
  const [baseMap, setBaseMap] = useState("streets");

  const basemapConfigs = GET_BASEMAP_CONFIGS(isDark);
  const activeBasemap = basemapConfigs[baseMap] || basemapConfigs.streets;

  const handleZoomChange = useCallback((zoom) => {
    setCurrentZoom(zoom);
  }, []);

  const handleMapReady = useCallback((map) => {
    setMapInstance(map);
    if (onMapReady) onMapReady(map);
  }, [onMapReady]);

  // Auto-Refresh Callback: Re-hydrates current parcel from backend and updates sidebar state
  const refreshCurrentParcel = useCallback(
    async (targetUlpin) => {
      if (typeof externalRefreshCurrentParcel === "function") {
        return await externalRefreshCurrentParcel(targetUlpin);
      }

      const currentUlpin =
        targetUlpin ||
        selectedUlpIn ||
        (selectedParcel && (selectedParcel.ulpin || selectedParcel.id));

      if (!currentUlpin) {
        console.warn("refreshCurrentParcel: No active ULPIN found to refresh.");
        return null;
      }

      try {
        const cleanUlpin = String(currentUlpin).replace(/[^a-zA-Z0-9]/g, "").trim();
        let res = await fetch(`/api/parcel/${cleanUlpin}?t=${Date.now()}`);
        if (!res.ok && res.status === 404) {
          res = await fetch(`/api/parcels/${cleanUlpin}?t=${Date.now()}`);
        }
        if (!res.ok) {
          throw new Error(`Failed to refresh parcel data: HTTP ${res.status}`);
        }
        const json = await res.json();
        const newData = json.data || json;

        if (typeof setSelectedParcel === "function") {
          setSelectedParcel(newData);
        }
        if (typeof onParcelSelect === "function") {
          onParcelSelect(newData.ulpin || cleanUlpin, newData, false);
        }

        return newData;
      } catch (err) {
        console.error("Auto-refresh current parcel error:", err);
        return null;
      }
    },
    [externalRefreshCurrentParcel, selectedUlpIn, selectedParcel, setSelectedParcel, onParcelSelect]
  );

  // Expose to window for global access if needed
  useEffect(() => {
    window.gisRefreshCurrentParcel = refreshCurrentParcel;
    return () => {
      if (window.gisRefreshCurrentParcel === refreshCurrentParcel) {
        delete window.gisRefreshCurrentParcel;
      }
    };
  }, [refreshCurrentParcel]);

  const handleClearSelection = useCallback(() => {
    if (onParcelSelect) {
      onParcelSelect(null, null, false);
    }
    if (setSelectedParcel) {
      setSelectedParcel(null);
    }
  }, [onParcelSelect, setSelectedParcel]);

  return (
    <div className="relative h-full w-full">
      {/* 1. Zoom Gatekeeping Banner with Interactive Direct "Zoom to Cadastre" CTA */}
      {currentZoom < MIN_CADASTRE_ZOOM && (
        <div className="absolute top-14 sm:top-[68px] left-1/2 -translate-x-1/2 z-[1000] transition-all duration-300">
          <div
            className={`flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-none border shadow-2xl backdrop-blur-md text-xs sm:text-sm font-medium transition duration-300 ${
              isDark
                ? "bg-neutral-950/80 border-neutral-800 text-white"
                : "bg-white/80 border-gray-300 text-black"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="hidden sm:inline font-mono uppercase text-xs tracking-wider">Zoom in closer for cadastre</span>
            <span className="sm:hidden font-mono uppercase text-xs">Zoom in</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded-none border ${
                isDark
                  ? "bg-neutral-900 border-neutral-800 text-neutral-400"
                  : "bg-neutral-100 border-gray-200 text-neutral-600"
              }`}
            >
              L{currentZoom}/{MIN_CADASTRE_ZOOM}
            </span>
            <button
              type="button"
              onClick={() => {
                const targetMap = mapInstance || window.gisMap;
                if (targetMap) {
                  targetMap.setZoom(MIN_CADASTRE_ZOOM);
                }
              }}
              className="ml-1 bg-black text-white hover:bg-gray-800 dark:bg-transparent dark:border dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest cursor-pointer"
              aria-label="Zoom directly to Cadastral Level 15"
            >
              Zoom In
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Segmented Basemap Switcher (Mathematically Centered & Responsive) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-sm md:max-w-max md:w-auto flex justify-center"
      >
        <LayerSwitcher currentLayer={baseMap} onLayerChange={setBaseMap} />
      </div>

      {/* 3. Main Leaflet Map Container with Canvas Engine (preferCanvas={true}) */}
      <MapContainer
        center={[12.9250, 77.5850]}
        zoom={16}
        scrollWheelZoom
        zoomControl={false}
        preferCanvas={true}
        className={`h-full w-full ${isDark ? "dark-map-container" : ""}`}
      >
        {/* Relocated Zoom Control to bottom-right to prevent toolbar collision on mobile */}
        <ZoomControl position="bottomright" />

        {/* Empty area click listener to clear active parcel selection */}
        <MapEmptyClickHandler onClearSelection={handleClearSelection} />

        <TileLayer
          key={`${activeBasemap.id}-${isDark ? "dark" : "light"}`}
          url={activeBasemap.url}
          attribution={activeBasemap.attribution}
          maxZoom={activeBasemap.maxZoom}
          className={baseMap === "satellite" ? "" : isDark ? "dark-map-tiles" : ""}
        />

        {/* Imperative Cadastre Vector Layer (BBox stream, Deduplication & Canvas injection) */}
        <ImperativeCadastreLayer
          selectedUlpIn={selectedUlpIn}
          onParcelSelect={onParcelSelect}
          refreshKey={refreshKey}
          onZoomChange={handleZoomChange}
          geoJsonRef={geoJsonRef}
          isDark={isDark}
        />

        {/* View controller to manage flyToBounds & resize invalidation */}
        <MapViewController
          selectedUlpIn={selectedUlpIn}
          geoJsonRef={geoJsonRef}
          onMapReady={handleMapReady}
        />
      </MapContainer>
    </div>
  );
}

export default MapDashboard;