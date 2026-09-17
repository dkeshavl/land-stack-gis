import { useEffect, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 3 reliable, API-key-free professional basemaps
const BASEMAP_CONFIGS = {
  streets: {
    id: "streets",
    name: "Streets",
    sublabel: "OpenStreetMap",
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
    name: "Topographic",
    sublabel: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17
  }
};

// Automatically fits to dataset bounds on initial load and flies to selected parcel
function MapViewController({ selectedUlpIn, geoJsonRef, geoData, isInitialFitDone, setIsInitialFitDone }) {
  const map = useMap();

  // Initial fit to bounds when GeoJSON loads
  useEffect(() => {
    if (!geoJsonRef.current || !geoData || isInitialFitDone) return;
    try {
      const bounds = geoJsonRef.current.getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        setIsInitialFitDone(true);
      }
    } catch (err) {
      console.warn("Could not fit initial map bounds:", err);
    }
  }, [geoData, map, geoJsonRef, isInitialFitDone, setIsInitialFitDone]);

  // Ensure map recalculates container dimensions on mount or resize
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [map]);

  // Fly to selected parcel when selectedUlpIn changes
  useEffect(() => {
    if (!selectedUlpIn || !geoJsonRef.current) return;

    geoJsonRef.current.eachLayer((layer) => {
      if (layer.feature?.properties?.ulpin === selectedUlpIn) {
        if (layer.getBounds && typeof layer.getBounds === "function") {
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            const isMobile = window.innerWidth < 768;
            map.flyToBounds(bounds, {
              maxZoom: 18,
              duration: 0.9,
              paddingTopLeft: [40, 40],
              paddingBottomRight: isMobile ? [40, 240] : [40, 40]
            });
          }
        }
      }
    });
  }, [selectedUlpIn, map, geoJsonRef]);

  return null;
}

function MapDashboard({ selectedUlpIn, onParcelSelect }) {
  const geoJsonRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const [baseMap, setBaseMap] = useState("streets"); // "streets" | "satellite" | "topographic"
  const [isInitialFitDone, setIsInitialFitDone] = useState(false);

  // Fetch local GeoJSON dataset
  useEffect(() => {
    fetch("/parcels.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Could not load parcels:", err));
  }, []);

  const activeBasemap = BASEMAP_CONFIGS[baseMap] || BASEMAP_CONFIGS.streets;

  /**
   * Dynamic GeoJSON style function:
   * 1. Unselected polygons: default transparent blue fill (fillColor: '#3b82f6', fillOpacity: 0.4) and a thin border (weight: 1).
   * 2. Selected polygon: bright amber/yellow (fillColor: '#f59e0b', fillOpacity: 0.8) with matching solid border (weight: 2).
   * 3. Absolutely NO square bounding boxes or rectangular outlines are drawn; the style applies strictly to the organic polygon path.
   */
  const getParcelStyle = (feature) => {
    const isSelected = feature?.properties?.ulpin === selectedUlpIn;

    if (isSelected) {
      return {
        fillColor: "#f59e0b",
        fillOpacity: 0.8,
        color: "#f59e0b",
        weight: 2,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round"
      };
    }

    return {
      fillColor: "#3b82f6",
      fillOpacity: 0.4,
      color: "#2563eb",
      weight: 1,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round"
    };
  };

  const handleEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const ulpin = props.ulpin;
    const ownerName = props.ownerName ? ` | ${props.ownerName}` : "";
    const khasra = props.khasraNumber ? ` (Khasra ${props.khasraNumber})` : "";

    layer.bindTooltip(`ULPIN: ${ulpin}${ownerName}${khasra}`, { sticky: true });

    layer.on({
      click: () => {
        onParcelSelect(ulpin);
      },
      mouseover: () => {
        if (selectedUlpIn !== ulpin) {
          layer.setStyle({
            fillColor: "#60a5fa",
            fillOpacity: 0.6,
            color: "#1d4ed8",
            weight: 1.5
          });
        }
      },
      mouseout: () => {
        if (selectedUlpIn !== ulpin) {
          layer.setStyle(getParcelStyle(feature));
        }
      }
    });
  };

  return (
    <div className="relative h-full w-full">
      {/* 3-Option Basemap Control Panel in Top-Right Corner */}
      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-[1000] flex items-center rounded-xl border border-slate-200/90 bg-white/95 p-0.5 sm:p-1 shadow-lg backdrop-blur-md transition hover:shadow-xl">
        <span className="hidden md:inline-block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Basemap
        </span>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* 1. Streets (OpenStreetMap) */}
          <button
            type="button"
            id="basemap-streets-btn"
            onClick={() => setBaseMap("streets")}
            title="OpenStreetMap Standard (Street View)"
            className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all ${
              baseMap === "streets"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Streets</span>
          </button>

          {/* 2. Satellite (Esri World Imagery) */}
          <button
            type="button"
            id="basemap-satellite-btn"
            onClick={() => setBaseMap("satellite")}
            title="Esri World Imagery (High-Resolution Satellite)"
            className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all ${
              baseMap === "satellite"
                ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-800"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Satellite</span>
          </button>

          {/* 3. Topographic (OpenTopoMap) */}
          <button
            type="button"
            id="basemap-topographic-btn"
            onClick={() => setBaseMap("topographic")}
            title="OpenTopoMap (Topography & Contours)"
            className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all ${
              baseMap === "topographic"
                ? "bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-600"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Topo</span>
          </button>
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <MapContainer
        center={[30.208, 74.457]}
        zoom={16}
        scrollWheelZoom
        className="h-full w-full"
      >
        {/* Dynamic Tile Layer with unique key to guarantee clean layer remounting */}
        <TileLayer
          key={activeBasemap.id}
          url={activeBasemap.url}
          attribution={activeBasemap.attribution}
          maxZoom={activeBasemap.maxZoom}
        />

        {/* View controller to manage fitBounds and flyToBounds */}
        <MapViewController
          selectedUlpIn={selectedUlpIn}
          geoJsonRef={geoJsonRef}
          geoData={geoData}
          isInitialFitDone={isInitialFitDone}
          setIsInitialFitDone={setIsInitialFitDone}
        />

        {/* Vector GeoJSON Polygon Overlays */}
        {geoData && (
          <GeoJSON
            key={`${baseMap}-${selectedUlpIn}`}
            ref={geoJsonRef}
            data={geoData}
            style={getParcelStyle}
            onEachFeature={handleEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapDashboard;