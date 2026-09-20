import { useEffect, useRef } from "react";
import L from "leaflet";
import { useTheme } from "../context/ThemeContext";

/**
 * LayerSwitcher Component for Land Stack GIS
 * Smart India Hackathon PS 26014 — Ministry of Rural Development
 *
 * Floating segmented basemap control with:
 * - Equal-width buttons (flex-1)
 * - Single-line guaranteed text with whitespace-nowrap & responsive text-[9px] md:text-xs
 * - Perfectly aligned scalable icons (shrink-0 w-3 h-3 md:w-4 md:h-4)
 * - Full WCAG AA accessibility: role="radiogroup", role="radio", aria-checked
 * - Touch & Click event isolation preventing Leaflet map bleed-through
 */
export default function LayerSwitcher({ currentLayer = "streets", onLayerChange }) {
  const { isDark } = useTheme();
  const containerRef = useRef(null);

  // Prevent Leaflet canvas/map from receiving native click/touch propagation
  useEffect(() => {
    if (containerRef.current && typeof L !== "undefined" && L.DomEvent) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  const layers = [
    {
      id: "streets",
      label: isDark ? "Night Vector" : "Streets",
      description: isDark ? "OpenStreetMap Free Dark Mode" : "OpenStreetMap Standard",
      icon: (
        <svg
          className="shrink-0 w-3 h-3 md:w-4 md:h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      )
    },
    {
      id: "satellite",
      label: "Satellite",
      description: "Esri High-Res World Imagery",
      icon: (
        <svg
          className="shrink-0 w-3 h-3 md:w-4 md:h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    },
    {
      id: "topographic",
      label: isDark ? "Dark Topo" : "Topography",
      description: "OpenTopoMap Elevation Contours",
      icon: (
        <svg
          className="shrink-0 w-3 h-3 md:w-4 md:h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      )
    }
  ];

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Basemap layer selection"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="flex w-full bg-white dark:bg-[#111] border border-gray-300 dark:border-neutral-800 shadow-xl overflow-hidden"
    >
      {layers.map((layer) => {
        const isActive = currentLayer === layer.id;
        return (
          <button
            key={layer.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${layer.label} basemap: ${layer.description}`}
            title={layer.description}
            onClick={() => onLayerChange(layer.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 md:px-4 md:py-2.5 text-[9px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200 cursor-pointer rounded-none outline-none ${
              isActive
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-gray-600 hover:bg-gray-100 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
            }`}
          >
            {layer.icon}
            <span>{layer.label}</span>
          </button>
        );
      })}
    </div>
  );
}
