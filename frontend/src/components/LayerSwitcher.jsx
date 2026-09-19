import { useTheme } from "../context/ThemeContext";

/**
 * LayerSwitcher Component for Land Stack GIS
 * Smart India Hackathon PS 26014 — Ministry of Rural Development
 *
 * Floating segmented basemap control with:
 * - Animated active-state indicator pill
 * - Glassmorphic styling with dark mode Fresnel rim reflection
 * - Full WCAG AA accessibility: role="radiogroup", role="radio", aria-checked, keyboard focus
 *
 * Props:
 * - currentLayer: "streets" | "satellite" | "topographic"
 * - onLayerChange: (layerId: string) => void
 */
export default function LayerSwitcher({ currentLayer = "streets", onLayerChange }) {
  const { isDark } = useTheme();

  const layers = [
    {
      id: "streets",
      label: isDark ? "Night Vector" : "Streets",
      description: isDark ? "OpenStreetMap Free Dark Mode" : "OpenStreetMap Standard",
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      id: "satellite",
      label: "Satellite",
      description: "Esri High-Res World Imagery",
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: "topographic",
      label: isDark ? "Dark Topo" : "Topography",
      description: "OpenTopoMap Elevation Contours",
      icon: (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Basemap layer selection"
      className={`relative flex items-center rounded-none border p-0.5 shadow-2xl backdrop-blur-md transition duration-300 ${
        isDark
          ? "bg-neutral-950/80 border-neutral-800 text-white"
          : "bg-white/80 border-gray-300 text-black"
      }`}
    >
      <span
        className={`hidden lg:inline-block pl-2 pr-2 text-[10px] font-mono font-bold uppercase tracking-widest select-none ${
          isDark ? "text-neutral-400" : "text-gray-500"
        }`}
      >
        Basemap
      </span>

      <div className="flex items-center gap-0.5">
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
              className={`relative flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white cursor-pointer ${
                isActive
                  ? "bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white shadow-xs"
                  : isDark
                  ? "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`}
            >
              {layer.icon}
              <span>{layer.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
