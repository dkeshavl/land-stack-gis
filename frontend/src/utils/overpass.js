import osmtogeojson from "osmtogeojson";

/**
 * OpenStreetMap Overpass API Endpoints
 * Primary: overpass-api.de
 * Fallback: kumi.systems / lz4.overpass-api.de
 */
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

// Minimum zoom level to query OSM data to prevent downloading massive geographic swathes
export const MIN_OVERPASS_ZOOM = 14;

// Cache map to store results by layer and approximate bbox to avoid redundant network queries
const queryCache = new Map();
const MAX_CACHE_ENTRIES = 50;

/**
 * Canonical layer category mapping to Overpass QL filter statements
 *
 * 1. Environment Layer:
 *    nwr["leisure"="park"] and nwr["water"="lake"]
 * 2. Zoning Layer:
 *    nwr["landuse"="commercial"] and nwr["landuse"="residential"]
 * 3. Utility Lines Layer:
 *    nwr["waterway"="drain"] and nwr["waterway"="ditch"]
 */
export const LAYER_QUERY_MAP = {
  // Environment Layer & aliases
  environment: [
    'nwr["leisure"="park"]',
    'nwr["water"="lake"]'
  ],
  envRestrictions: [
    'nwr["leisure"="park"]',
    'nwr["water"="lake"]'
  ],
  environmentalRestrictions: [
    'nwr["leisure"="park"]',
    'nwr["water"="lake"]'
  ],

  // Zoning Layer & aliases
  zoning: [
    'nwr["landuse"="commercial"]',
    'nwr["landuse"="residential"]'
  ],
  landUseZoning: [
    'nwr["landuse"="commercial"]',
    'nwr["landuse"="residential"]'
  ],

  // Utility Lines Layer & aliases
  utilities: [
    'nwr["waterway"="drain"]',
    'nwr["waterway"="ditch"]'
  ],
  waterLines: [
    'nwr["waterway"="drain"]',
    'nwr["waterway"="ditch"]'
  ],
  waterSewageLines: [
    'nwr["waterway"="drain"]',
    'nwr["waterway"="ditch"]'
  ]
};

/**
 * Normalizes input bounds into [south, west, north, east] numeric array
 * Accepts Leaflet LatLngBounds object or numeric bounding box
 */
export function normalizeBounds(bounds) {
  if (!bounds) return null;

  let south, west, north, east;

  if (typeof bounds.getSouth === "function") {
    south = bounds.getSouth();
    west = bounds.getWest();
    north = bounds.getNorth();
    east = bounds.getEast();
  } else if (Array.isArray(bounds) && bounds.length === 4) {
    [south, west, north, east] = bounds;
  } else if (bounds.south !== undefined && bounds.north !== undefined) {
    south = bounds.south;
    west = bounds.west;
    north = bounds.north;
    east = bounds.east;
  } else {
    return null;
  }

  // Sanity check coordinates
  if (isNaN(south) || isNaN(west) || isNaN(north) || isNaN(east)) {
    return null;
  }

  return { south, west, north, east };
}

/**
 * Generates an Overpass QL query string for a specific category and bounding box
 * Uses [out:json][bbox:south,west,north,east] parameter
 */
export function buildOverpassQuery(layerType, boundsObj) {
  const statements = LAYER_QUERY_MAP[layerType];
  if (!statements || statements.length === 0) {
    throw new Error(`Unknown layer category: "${layerType}"`);
  }

  const { south, west, north, east } = boundsObj;

  // Format Overpass QL with global bbox parameter and JSON output
  const query = `
[out:json][timeout:25][bbox:${south.toFixed(5)},${west.toFixed(5)},${north.toFixed(5)},${east.toFixed(5)}];
(
  ${statements.map((stmt) => `${stmt};`).join("\n  ")}
);
out body;
>;
out skel qt;
`.trim();

  return query;
}

/**
 * Lightweight fallback GeoJSON converter if osmtogeojson encounters an issue
 */
function simpleOsmToGeoJson(osmData) {
  if (!osmData || !Array.isArray(osmData.elements)) {
    return { type: "FeatureCollection", features: [] };
  }

  const nodeMap = new Map();
  const features = [];

  for (const el of osmData.elements) {
    if (el.type === "node" && el.lat && el.lon) {
      nodeMap.set(el.id, [el.lon, el.lat]);
    }
  }

  for (const el of osmData.elements) {
    if (el.type === "way" && Array.isArray(el.nodes)) {
      const coords = el.nodes.map((id) => nodeMap.get(id)).filter(Boolean);
      if (coords.length > 1) {
        const isClosed = coords.length > 3 &&
          coords[0][0] === coords[coords.length - 1][0] &&
          coords[0][1] === coords[coords.length - 1][1];

        features.push({
          type: "Feature",
          id: `osm/way/${el.id}`,
          properties: {
            id: el.id,
            type: el.type,
            tags: el.tags || {}
          },
          geometry: {
            type: isClosed ? "Polygon" : "LineString",
            coordinates: isClosed ? [coords] : coords
          }
        });
      }
    }
  }

  return { type: "FeatureCollection", features };
}

/**
 * Fetches dynamic vector data directly from OpenStreetMap via Overpass API
 *
 * @param {string} layerType - 'environment' | 'zoning' | 'utilities' (or their LayerController aliases)
 * @param {L.LatLngBounds|Array|Object} bounds - Current Leaflet map bounds
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
 * @param {boolean} [options.bypassCache] - Force fresh network query
 * @param {Function} [options.setLoadingLayers] - State setter to track layer fetching state
 * @param {Function} [setLoadingParam] - Optional direct setter function
 * @returns {Promise<GeoJSON.FeatureCollection>} GeoJSON FeatureCollection
 */
export async function fetchOSMLayer(layerType, bounds, options = {}, setLoadingParam) {
  const normBounds = normalizeBounds(bounds);
  if (!normBounds) {
    console.warn("[Overpass] Invalid bounds provided for fetchOSMLayer:", bounds);
    return { type: "FeatureCollection", features: [] };
  }

  // Canonicalize layerType
  const canonicalKey =
    layerType === "landUseZoning" ? "zoning" :
    layerType === "waterSewageLines" || layerType === "waterLines" ? "utilities" :
    layerType === "environmentalRestrictions" || layerType === "envRestrictions" ? "environment" :
    layerType;

  if (!LAYER_QUERY_MAP[canonicalKey]) {
    console.warn(`[Overpass] Unrecognized layer category: "${layerType}"`);
    return { type: "FeatureCollection", features: [] };
  }

  // Helper to safely update layer loading state
  const setLoadingFn =
    typeof options?.setLoadingLayers === "function"
      ? options.setLoadingLayers
      : typeof options === "function"
      ? options
      : typeof setLoadingParam === "function"
      ? setLoadingParam
      : null;

  const updateLoadingState = (isLoading) => {
    if (typeof setLoadingFn === "function") {
      setLoadingFn((prev) => {
        if (!prev || typeof prev !== "object") return prev;
        const next = { ...prev, [canonicalKey]: isLoading, [layerType]: isLoading };
        if (canonicalKey === "zoning") {
          next.zoning = isLoading;
          next.landUseZoning = isLoading;
        } else if (canonicalKey === "utilities") {
          next.utilities = isLoading;
          next.waterLines = isLoading;
          next.waterSewageLines = isLoading;
        } else if (canonicalKey === "environment") {
          next.environment = isLoading;
          next.envRestrictions = isLoading;
          next.environmentalRestrictions = isLoading;
        }
        return next;
      });
    }
  };

  // Check cache with rounded coordinates (~100m grid precision)
  const cacheKey = `${canonicalKey}_${normBounds.south.toFixed(3)}_${normBounds.west.toFixed(3)}_${normBounds.north.toFixed(3)}_${normBounds.east.toFixed(3)}`;

  if (!options.bypassCache && queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey);
  }

  const query = buildOverpassQuery(canonicalKey, normBounds);

  let lastError = null;

  // Strict Rule 1: Set loading state to true before fetch()
  updateLoadingState(true);

  try {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const getUrl = `${endpoint}?data=${encodeURIComponent(query)}`;
        let response;

        try {
          // Fast GET query (no CORS preflight overhead in browsers)
          response = await fetch(getUrl, {
            method: "GET",
            signal: options.signal
          });
        } catch (getErr) {
          if (getErr.name === "AbortError") throw getErr;
          // Fallback to POST
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: options.signal
          });
        }

        if (!response.ok) {
          throw new Error(`Overpass HTTP ${response.status}: ${response.statusText}`);
        }

        const osmJson = await response.json();

        // Convert Overpass JSON response to standard GeoJSON
        let geoJson;
        try {
          if (typeof osmtogeojson === "function") {
            geoJson = osmtogeojson(osmJson);
          } else if (osmtogeojson && typeof osmtogeojson.default === "function") {
            geoJson = osmtogeojson.default(osmJson);
          } else {
            geoJson = simpleOsmToGeoJson(osmJson);
          }
        } catch (convErr) {
          console.warn("[Overpass] osmtogeojson parse warning, using fallback parser:", convErr);
          geoJson = simpleOsmToGeoJson(osmJson);
        }

        // Guarantee tags object exists on every feature property for uniform popup rendering
        if (geoJson && Array.isArray(geoJson.features)) {
          geoJson.features.forEach((feat) => {
            if (!feat.properties) feat.properties = {};
            if (!feat.properties.tags) {
              feat.properties.tags = { ...feat.properties };
            }
          });
        }

        // Cache result
        if (queryCache.size >= MAX_CACHE_ENTRIES) {
          const firstKey = queryCache.keys().next().value;
          queryCache.delete(firstKey);
        }
        queryCache.set(cacheKey, geoJson);

        return geoJson;
      } catch (err) {
        if (err.name === "AbortError") {
          throw err; // Propagate aborts
        }
        lastError = err;
        console.warn(`[Overpass] Request failed via ${endpoint}:`, err.message);
      }
    }

    console.error(`[Overpass] All endpoints failed for "${canonicalKey}":`, lastError);
    return { type: "FeatureCollection", features: [] };
  } finally {
    // Strict Rule 1: Set loading state to false in finally block
    updateLoadingState(false);
  }
}
