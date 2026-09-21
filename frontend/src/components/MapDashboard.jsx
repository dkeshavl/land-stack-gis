import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, ZoomControl, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../context/ThemeContext";
import LayerSwitcher from "./LayerSwitcher";
import LayerController, { INITIAL_LAYER_STATE, INITIAL_LOADING_LAYERS } from "./LayerController";
import { fetchOSMLayer, MIN_OVERPASS_ZOOM } from "../utils/overpass";

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
 * ==============================================================================
 * Real Public Coordinate GeoJSON FeatureCollections for Jayanagar, Bengaluru
 * Landmarks: Yediyur Lake, Madhavan Park, 4th Block Complex, RV Road Rajakaluve, 3rd Block
 * Center Coordinates: Approx 12.9300° N, 77.5800° E
 * Strict RFC 7946 Standard: [Longitude, Latitude]
 * ==============================================================================
 */

// 1. mockEnvData: Real Lake & Environmental Restrictions (Yediyur Lake & Madhavan Park)
export const mockEnvData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "env-yediyur-lake",
      properties: {
        type: "Eco-Sensitive Zone / Water Body",
        name: "Yediyur Lake",
        restriction: "BBMP Mandate: No Construction within 30m buffer zone.",
        authority: "BBMP Lakes Division / KSPCB",
        statutory_buffer: "30m Mandatory Green Buffer Zone"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.5732, 12.9328],
            [77.5756, 12.9324],
            [77.5772, 12.9341],
            [77.5770, 12.9363],
            [77.5752, 12.9368],
            [77.5731, 12.9351],
            [77.5732, 12.9328]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "env-madhavan-park",
      properties: {
        type: "Eco-Sensitive Zone / Water Body",
        name: "Madhavan Park",
        restriction: "BBMP Mandate: No Construction within 30m buffer zone.",
        authority: "BBMP Horticulture Department",
        zone_code: "P-SP (Park & Open Space)"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.5838, 12.9350],
            [77.5866, 12.9350],
            [77.5868, 12.9376],
            [77.5840, 12.9376],
            [77.5838, 12.9350]
          ]
        ]
      }
    }
  ]
};

// 2. mockZoningData: Real Commercial Zones (Jayanagar 4th Block Shopping Complex)
export const mockZoningData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "zone-jayanagar-4th-block-complex",
      properties: {
        zone: "Commercial (C-2)",
        name: "Jayanagar 4th Block Complex",
        floor_area_ratio: 2.5,
        permissible_uses: "Retail High Street, Banking, Hypermarket, Commercial Offices",
        master_plan: "BDA Revised Master Plan 2031 (CDP)"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.5815, 12.9275],
            [77.5848, 12.9275],
            [77.5848, 12.9308],
            [77.5815, 12.9308],
            [77.5815, 12.9275]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "zone-11th-main-commercial-spine",
      properties: {
        zone: "Commercial (C-2)",
        name: "11th Main Commercial Corridor",
        floor_area_ratio: 2.5,
        permissible_uses: "Commercial High-Street Retail & Transit Amenities"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.5820, 12.9242],
            [77.5842, 12.9242],
            [77.5842, 12.9272],
            [77.5820, 12.9272],
            [77.5820, 12.9242]
          ]
        ]
      }
    }
  ]
};

// 3. mockWaterLines: Real Infrastructure near RV Road / Namma Metro Green Line
export const mockWaterLines = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "rajakaluve-rv-road-metro-main",
      properties: {
        type: "Primary Stormwater Drain (Rajakaluve)",
        maintenance_authority: "BBMP",
        depth: "4.2m",
        corridor: "Namma Metro Green Line / Rashtriya Vidyalaya Road",
        statutory_buffer: "50m NGT Statutory Encroachment Buffer"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.5802, 12.9210],
          [77.5802, 12.9255],
          [77.5803, 12.9300],
          [77.5804, 12.9345],
          [77.5805, 12.9380],
          [77.5806, 12.9415]
        ]
      }
    },
    {
      type: "Feature",
      id: "rajakaluve-yediyur-feeder",
      properties: {
        type: "Primary Stormwater Drain (Rajakaluve)",
        maintenance_authority: "BBMP",
        depth: "3.8m",
        corridor: "Yediyur Basin Link Feeder"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.5748, 12.9338],
          [77.5775, 12.9325],
          [77.5803, 12.9318],
          [77.5845, 12.9310]
        ]
      }
    }
  ]
};

// 4. mockEncumbranceData: Realistic Legal Dispute in Jayanagar 3rd Block
export const mockEncumbranceData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "encumb-parcel-3rd-block-48a",
      properties: {
        status: "Court Injunction Active",
        khasra: "326/3",
        legal_code: "Section 192-A Karnataka Land Revenue Act (Encroachment)",
        case_no: "OS/2026/8492",
        parcel_location: "Jayanagar 3rd Block (Near 14th Cross)",
        court: "City Civil Court, Bengaluru"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.5826, 12.9325],
            [77.5835, 12.9325],
            [77.5835, 12.9335],
            [77.5826, 12.9335],
            [77.5826, 12.9325]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "encumb-parcel-3rd-block-52b",
      properties: {
        status: "Court Injunction Active",
        khasra: "326/4",
        legal_code: "Section 192-A Karnataka Land Revenue Act (Encroachment)",
        case_no: "OS/2026/8492",
        parcel_location: "Jayanagar 3rd Block (Near 15th Cross)",
        court: "Commercial Division High Court of Karnataka"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.5838, 12.9328],
            [77.5847, 12.9328],
            [77.5847, 12.9338],
            [77.5838, 12.9338],
            [77.5838, 12.9328]
          ]
        ]
      }
    }
  ]
};

/**
 * High-Contrast Leaflet Styling Objects matching SpaceX/Palantir DPI Aesthetic:
 * - Zoning Style: color: '#8b5cf6' (Purple), weight: 2, fillOpacity: 0.15
 * - Encumbrance Style: color: '#ef4444' (Red), weight: 2, fillColor: '#ef4444', fillOpacity: 0.35, dashArray: '4 4'
 * - Water Lines Style: color: '#06b6d4' (Cyan), weight: 4, opacity: 0.85
 * - Environmental Style: color: '#10b981' (Emerald Green), weight: 2, fillOpacity: 0.15, dashArray: '8 4'
 */
export const zoningStyle = {
  color: "#8b5cf6",
  weight: 2,
  fillColor: "#8b5cf6",
  fillOpacity: 0.18
};

export const encumbranceStyle = {
  color: "#ef4444",
  weight: 2,
  fillColor: "#ef4444",
  fillOpacity: 0.35,
  dashArray: "4 4"
};

export const waterLinesStyle = {
  color: "#06b6d4",
  weight: 4,
  opacity: 0.85
};
export const waterStyle = waterLinesStyle; // Alias for compatibility

export const envStyle = {
  color: "#10b981",
  weight: 2,
  fillColor: "#10b981",
  fillOpacity: 0.18,
  dashArray: "8 4"
};
export const environmentalStyle = envStyle; // Alias for compatibility

/**
 * Stark Monospace Terminal UI HTML Generator for Leaflet Popups
 * Format: bg-black text-white font-mono text-xs rounded-none
 * Iterates through properties and renders clean `> KEY: VALUE` terminal readouts
 */
export const createTerminalPopupHtml = (feature, layerCategory, categoryColor) => {
  const rawProps = feature?.properties || {};
  const tags = rawProps.tags || {};

  // Extract high-priority OSM tags or fallback properties
  const primaryName =
    tags.name ||
    rawProps.name ||
    tags.landuse ||
    tags.leisure ||
    tags.waterway ||
    tags.water ||
    rawProps.type ||
    "OSM_VECTOR_FEATURE";

  const displayEntries = [];

  // Mandated highlights: tags.name, tags.landuse, leisure, waterway
  if (tags.name) {
    displayEntries.push(["NAME", tags.name]);
  }
  if (tags.landuse) {
    displayEntries.push(["LAND USE", tags.landuse]);
  }
  if (tags.leisure) {
    displayEntries.push(["LEISURE", tags.leisure]);
  }
  if (tags.waterway) {
    displayEntries.push(["WATERWAY", tags.waterway]);
  }
  if (tags.water) {
    displayEntries.push(["WATER BODY", tags.water]);
  }

  // Append remaining tags (scalar values only)
  Object.entries(tags).forEach(([k, v]) => {
    if (
      !["name", "landuse", "leisure", "waterway", "water"].includes(k) &&
      typeof v !== "object" &&
      v !== undefined &&
      v !== null
    ) {
      displayEntries.push([k.replace(/_/g, " ").toUpperCase(), String(v)]);
    }
  });

  // If no OSM tags were extracted, fall back to top-level properties (e.g. baseline cadastre/mock)
  if (displayEntries.length === 0) {
    Object.entries(rawProps).forEach(([k, v]) => {
      if (k !== "tags" && typeof v !== "object" && v !== undefined && v !== null) {
        displayEntries.push([k.replace(/_/g, " ").toUpperCase(), String(v)]);
      }
    });
  }

  // Build monospace terminal readout lines: > KEY: VALUE
  const terminalLines = displayEntries
    .slice(0, 10)
    .map(([key, value]) => `
      <div style="margin-bottom: 5px; line-height: 1.5; font-family: 'JetBrains Mono', monospace; font-size: 11px; display: flex; align-items: baseline; gap: 6px;">
        <span style="color: ${categoryColor}; font-weight: 800; user-select: none;">&gt;</span>
        <span style="color: #9ca3af; text-transform: uppercase; font-weight: 600; white-space: nowrap;">${key}:</span>
        <span style="color: #ffffff; font-weight: 700; word-break: break-word;">${value}</span>
      </div>
    `)
    .join("");

  return `
    <div class="bg-black text-white font-mono text-xs rounded-none" style="background-color: #000000; color: #ffffff; font-family: 'JetBrains Mono', monospace; font-size: 11px; border: 1px solid ${categoryColor}; border-radius: 0px; padding: 12px 14px; min-width: 280px; max-width: 360px; box-shadow: 0 16px 36px rgba(0,0,0,0.95);">
      <!-- Terminal Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #222222; padding-bottom: 6px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-block; width: 6px; height: 6px; background-color: ${categoryColor}; border-radius: 0;"></span>
          <span style="font-size: 9px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: ${categoryColor};">
            [${layerCategory}]
          </span>
        </div>
        <span style="font-size: 9px; color: #666666; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.1em;">OSM // OVERPASS</span>
      </div>

      <!-- Feature Name Callout -->
      <div style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #1a1a1a;">
        <div style="font-size: 8px; color: #888888; text-transform: uppercase; letter-spacing: 0.15em;">IDENTIFIER</div>
        <div style="font-size: 12px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em; word-break: break-word;">
          ${primaryName}
        </div>
      </div>

      <!-- Monospace Properties Readout -->
      <div style="background: #080808; border: 1px solid #1a1a1a; padding: 8px 10px; margin-bottom: 8px; border-radius: 0; max-height: 180px; overflow-y: auto;">
        ${terminalLines || '<div style="color: #666666; font-size: 10px;">NO ADDITIONAL TAGS FOUND</div>'}
      </div>

      <!-- Terminal Footer Status -->
      <div style="font-size: 9px; color: #666666; text-transform: uppercase; letter-spacing: 0.1em; border-top: 1px solid #1a1a1a; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
        <span>SYS.SRC: OPENSTREETMAP</span>
        <span style="color: ${categoryColor}; font-weight: 700;">● LIVE_STREAM</span>
      </div>
    </div>
  `;
};

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

/**
 * Stark SpaceX / Palantir Map Scanning Overlay (Rule 2)
 * Appears ONLY when ANY layer is currently loading (Object.values(loadingLayers).some(Boolean)).
 */
function MapScanningOverlay({ loadingLayers }) {
  const isAnyLoading = Object.values(loadingLayers || {}).some(Boolean);
  const [asciiIndex, setAsciiIndex] = useState(0);

  useEffect(() => {
    if (!isAnyLoading) return;
    const timer = setInterval(() => {
      setAsciiIndex((i) => (i + 1) % 4);
    }, 120);
    return () => clearInterval(timer);
  }, [isAnyLoading]);

  if (!isAnyLoading) return null;

  const ASCII_FRAMES = ["/", "—", "\\", "|"];

  return (
    <div className="absolute inset-0 z-[500] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-200">
      <div className="bg-[#050505] border border-emerald-500/50 p-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
        <div className="font-mono text-emerald-400 text-xs tracking-[0.2em] uppercase flex items-center gap-2">
          <span>&gt; ACQUIRING SPATIAL VECTORS</span>
          <span className="font-bold text-emerald-300 select-none">
            {ASCII_FRAMES[asciiIndex]}
          </span>
          <span className="inline-block animate-pulse font-bold text-emerald-400 select-none">
            █
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * OSMViewportManager:
 * - Listens for moveend and zoomend events via useMapEvents
 * - Extracts current Leaflet map bounds
 * - Queries the Overpass API for active layers (Zoning, Environment, Utilities)
 * - Manages debouncing, AbortController cancellation, and loading state
 */
function OSMViewportManager({
  activeLayers,
  loadingLayers,
  setLoadingLayers,
  onOSMDataUpdate,
  setIsOsmLoading,
  setOsmLoadingLayers,
  onZoomChange
}) {
  const map = useMap();
  const debounceTimerRef = useRef(null);
  const abortControllersRef = useRef({});

  const executeOSMQueries = useCallback(() => {
    const zoom = map.getZoom();
    if (onZoomChange) {
      onZoomChange(zoom);
    }

    // Zoom limit guard: prevent downloading huge areas
    if (zoom < MIN_OVERPASS_ZOOM) {
      Object.values(abortControllersRef.current).forEach((c) => c?.abort());
      abortControllersRef.current = {};
      setIsOsmLoading(false);
      setOsmLoadingLayers([]);
      return;
    }

    const bounds = map.getBounds();
    if (!bounds || !bounds.isValid || !bounds.isValid()) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const isZoningActive = Boolean(activeLayers?.zoning || activeLayers?.landUseZoning);
      const isEnvActive = Boolean(activeLayers?.envRestrictions || activeLayers?.environmentalRestrictions);
      const isUtilActive = Boolean(activeLayers?.waterLines || activeLayers?.waterSewageLines);

      const tasks = [];
      const loadingLabels = [];

      if (isEnvActive) {
        tasks.push({ key: "environment", type: "environment", label: "ENVIRONMENT" });
        loadingLabels.push("ENVIRONMENT");
      }
      if (isZoningActive) {
        tasks.push({ key: "zoning", type: "zoning", label: "ZONING" });
        loadingLabels.push("ZONING");
      }
      if (isUtilActive) {
        tasks.push({ key: "utilities", type: "utilities", label: "UTILITIES" });
        loadingLabels.push("UTILITIES");
      }

      if (tasks.length === 0) {
        setIsOsmLoading(false);
        setOsmLoadingLayers([]);
        return;
      }

      setIsOsmLoading(true);
      setOsmLoadingLayers(loadingLabels);

      let pendingCount = tasks.length;

      tasks.forEach((task) => {
        // Cancel existing pending query for this category
        if (abortControllersRef.current[task.key]) {
          abortControllersRef.current[task.key].abort();
        }

        const ctrl = new AbortController();
        abortControllersRef.current[task.key] = ctrl;

        fetchOSMLayer(task.type, bounds, {
          signal: ctrl.signal,
          setLoadingLayers
        })
          .then((geoJson) => {
            if (geoJson && geoJson.features) {
              onOSMDataUpdate(task.key, geoJson);
            }
          })
          .catch((err) => {
            if (err.name !== "AbortError") {
              console.warn(`[OSM ${task.label}] Query error:`, err.message);
            }
          })
          .finally(() => {
            pendingCount -= 1;
            if (pendingCount <= 0) {
              setIsOsmLoading(false);
              setOsmLoadingLayers([]);
            }
          });
      });
    }, 400);
  }, [map, activeLayers, onOSMDataUpdate, setIsOsmLoading, setOsmLoadingLayers, onZoomChange, setLoadingLayers]);

  // Hook into Leaflet viewport events
  useMapEvents({
    moveend: executeOSMQueries,
    zoomend: executeOSMQueries
  });

  // Re-run immediately when active layer toggles change
  useEffect(() => {
    executeOSMQueries();
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      Object.values(abortControllersRef.current).forEach((c) => c?.abort());
    };
  }, [executeOSMQueries]);

  return null;
}

function MapDashboard({
  selectedUlpIn,
  selectedParcel,
  onParcelSelect,
  setSelectedParcel,
  onMapReady,
  refreshKey = 0,
  refreshCurrentParcel: externalRefreshCurrentParcel,
  activeLayers: externalActiveLayers,
  onLayersChange
}) {
  const { isDark } = useTheme();
  const geoJsonRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(16);
  const [baseMap, setBaseMap] = useState("streets");
  const [activeLayers, setActiveLayers] = useState(
    externalActiveLayers || INITIAL_LAYER_STATE
  );

  // Dynamic OpenStreetMap vector layers state
  const [osmData, setOsmData] = useState({
    environment: null,
    zoning: null,
    utilities: null
  });
  const [isOsmLoading, setIsOsmLoading] = useState(false);
  const [osmLoadingLayers, setOsmLoadingLayers] = useState([]);
  const [osmVersion, setOsmVersion] = useState(0);

  // Strict Rule 1: Loading state tracking which layers are currently being fetched
  const [loadingLayers, setLoadingLayers] = useState(INITIAL_LOADING_LAYERS);

  const handleOSMDataUpdate = useCallback((layerKey, geoJson) => {
    setOsmData((prev) => ({
      ...prev,
      [layerKey]: geoJson
    }));
    setOsmVersion((v) => v + 1);
  }, []);

  // Strict Rule 1: Clear out any old "imperfect" GeoJSON data for that layer the moment user toggles
  const handleToggleLayer = useCallback((layerId, nextState) => {
    const canonicalKey =
      layerId === "landUseZoning" || layerId === "zoning"
        ? "zoning"
        : layerId === "waterSewageLines" || layerId === "waterLines"
        ? "utilities"
        : layerId === "environmentalRestrictions" || layerId === "envRestrictions"
        ? "environment"
        : null;

    if (canonicalKey) {
      // Clear out old GeoJSON data immediately so the map is clean while the new accurate data fetches
      setOsmData((prev) => ({
        ...prev,
        [canonicalKey]: null
      }));
      setOsmVersion((v) => v + 1);

      // Instantly activate loading indicator state when turning ON
      setLoadingLayers((prev) => ({
        ...prev,
        [layerId]: nextState,
        [canonicalKey]: nextState,
        ...(canonicalKey === "zoning" ? { landUseZoning: nextState, zoning: nextState } : {}),
        ...(canonicalKey === "utilities" ? { waterSewageLines: nextState, waterLines: nextState } : {}),
        ...(canonicalKey === "environment" ? { environmentalRestrictions: nextState, envRestrictions: nextState } : {})
      }));
    }
  }, []);

  // Sync external active layers if controlled from parent
  useEffect(() => {
    if (externalActiveLayers) {
      setActiveLayers(externalActiveLayers);
    }
  }, [externalActiveLayers]);

  const handleLayersChange = useCallback(
    (nextLayers) => {
      setActiveLayers(nextLayers);
      if (typeof onLayersChange === "function") {
        onLayersChange(nextLayers);
      }
    },
    [onLayersChange]
  );

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

  // Check if any OSM layer is toggled on while below minimum zoom threshold
  const hasActiveOsmLayers = Boolean(
    activeLayers?.zoning ||
    activeLayers?.landUseZoning ||
    activeLayers?.waterLines ||
    activeLayers?.waterSewageLines ||
    activeLayers?.envRestrictions ||
    activeLayers?.environmentalRestrictions
  );

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

      {/* 2. Overpass Telemetry HUD: Loading State & Zoom Limit Gate */}
      {isOsmLoading && (
        <div className="absolute top-16 left-4 z-[1000] pointer-events-none transition-all duration-200">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-none border border-cyan-500/60 bg-black/90 text-white font-mono text-[11px] shadow-2xl backdrop-blur-md">
            <span className="inline-block w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
            <span className="tracking-widest uppercase font-bold text-cyan-400">
              QUERYING SATELLITE DATA...
            </span>
            {osmLoadingLayers.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 border border-neutral-700 bg-neutral-900 text-neutral-300">
                [{osmLoadingLayers.join(" + ")}]
              </span>
            )}
          </div>
        </div>
      )}

      {hasActiveOsmLayers && currentZoom < MIN_OVERPASS_ZOOM && (
        <div className="absolute top-28 sm:top-[112px] left-1/2 -translate-x-1/2 z-[1000] pointer-events-none transition-all duration-200">
          <div className="flex items-center gap-2 px-3 py-1 rounded-none border border-amber-500/40 bg-black/90 text-amber-400 font-mono text-[10px] uppercase tracking-wider backdrop-blur-md shadow-xl">
            <span className="h-1.5 w-1.5 bg-amber-400 animate-pulse"></span>
            <span>OSM STREAM PAUSED: ZOOM TO LEVEL {MIN_OVERPASS_ZOOM}+ FOR LIVE VECTORS</span>
          </div>
        </div>
      )}

      {/* 3. Floating Segmented Basemap Switcher (Mathematically Centered & Responsive) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm md:max-w-max md:w-auto flex justify-center"
      >
        <LayerSwitcher currentLayer={baseMap} onLayerChange={setBaseMap} />
      </div>

      {/* 4. Main Leaflet Map Container with Canvas Engine (preferCanvas={true}) */}
      <MapContainer
        center={[12.9300, 77.5800]}
        zoom={16}
        scrollWheelZoom
        zoomControl={false}
        preferCanvas={true}
        className={`h-full w-full relative z-0 ${isDark ? "dark-map-container" : ""}`}
      >
        {/* Relocated Zoom Control to bottom-right to prevent toolbar collision on mobile */}
        <ZoomControl position="bottomright" />

        {/* Empty area click listener to clear active parcel selection */}
        <MapEmptyClickHandler onClearSelection={handleClearSelection} />

        {/* OpenStreetMap Live Overpass Viewport Manager */}
        <OSMViewportManager
          activeLayers={activeLayers}
          loadingLayers={loadingLayers}
          setLoadingLayers={setLoadingLayers}
          onOSMDataUpdate={handleOSMDataUpdate}
          setIsOsmLoading={setIsOsmLoading}
          setOsmLoadingLayers={setOsmLoadingLayers}
          onZoomChange={handleZoomChange}
        />

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

        {/* Dynamic GeoJSON Layer 1: Land Use & Zoning (Purple #8b5cf6) - only renders when live data loaded */}
        {(activeLayers?.zoning || activeLayers?.landUseZoning) && osmData.zoning && (
          <GeoJSON
            key={`zoning-layer-osm-${osmVersion}`}
            data={osmData.zoning}
            style={zoningStyle}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              const t = p.tags || {};
              const name = t.name || p.name || t.landuse || p.zone || "Zoning Area";
              layer.bindPopup(createTerminalPopupHtml(feature, "LAND USE & ZONING", "#8b5cf6"), {
                className: "custom-gis-popup",
                closeButton: true
              });
              layer.bindTooltip(`ZONING: ${name}`, {
                sticky: true,
                className: "custom-gis-tooltip"
              });
            }}
          />
        )}

        {/* Static GeoJSON Layer 2: Encumbrance Flags (Statutory Red #ef4444) */}
        {(activeLayers?.encumbrance || activeLayers?.encumbranceFlags) && (
          <GeoJSON
            key="encumbrance-layer"
            data={mockEncumbranceData}
            style={encumbranceStyle}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindPopup(createTerminalPopupHtml(feature, "ENCUMBRANCE / DISPUTE", "#ef4444"), {
                className: "custom-gis-popup",
                closeButton: true
              });
              layer.bindTooltip(`ENCUMBRANCE: ${p.status} [${p.case_no || "CASE"}]`, {
                sticky: true,
                className: "custom-gis-tooltip"
              });
            }}
          />
        )}

        {/* Dynamic GeoJSON Layer 3: Water & Sewage Lines / Stormwater Drains (Cyan #06b6d4) - only renders when live data loaded */}
        {(activeLayers?.waterLines || activeLayers?.waterSewageLines) && osmData.utilities && (
          <GeoJSON
            key={`water-layer-osm-${osmVersion}`}
            data={osmData.utilities}
            style={waterStyle}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              const t = p.tags || {};
              const name = t.name || p.name || t.waterway || p.type || "Stormwater Drain";
              layer.bindPopup(createTerminalPopupHtml(feature, "MUNICIPAL UTILITY", "#06b6d4"), {
                className: "custom-gis-popup",
                closeButton: true
              });
              layer.bindTooltip(`DRAINAGE: ${name}`, {
                sticky: true,
                className: "custom-gis-tooltip"
              });
            }}
          />
        )}

        {/* Dynamic GeoJSON Layer 4: Environmental Restrictions Buffer (Emerald #10b981) - only renders when live data loaded */}
        {(activeLayers?.envRestrictions || activeLayers?.environmentalRestrictions) && osmData.environment && (
          <GeoJSON
            key={`env-layer-osm-${osmVersion}`}
            data={osmData.environment}
            style={envStyle}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              const t = p.tags || {};
              const name = t.name || p.name || t.leisure || t.water || p.type || "Eco Buffer";
              layer.bindPopup(createTerminalPopupHtml(feature, "ECO RESTRICTION", "#10b981"), {
                className: "custom-gis-popup",
                closeButton: true
              });
              layer.bindTooltip(`ECO BUFFER: ${name}`, {
                sticky: true,
                className: "custom-gis-tooltip"
              });
            }}
          />
        )}

        {/* View controller to manage flyToBounds & resize invalidation */}
        <MapViewController
          selectedUlpIn={selectedUlpIn}
          geoJsonRef={geoJsonRef}
          onMapReady={handleMapReady}
        />
      </MapContainer>

      {/* Strict Rule 2: Map Scanning Overlay with Stark SpaceX/Palantir Terminal Aesthetic */}
      <MapScanningOverlay loadingLayers={loadingLayers} />

      {/* 5. Floating Spatial Data Layers HUD (Stark SpaceX/Palantir Controller) */}
      <LayerController
        activeLayers={activeLayers}
        loadingLayers={loadingLayers}
        onLayersChange={handleLayersChange}
        onToggleLayer={handleToggleLayer}
      />
    </div>
  );
}

export default MapDashboard;