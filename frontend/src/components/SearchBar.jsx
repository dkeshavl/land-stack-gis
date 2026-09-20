import { useState, useEffect, useRef, useId } from "react";

export default function SearchBar({
  map,
  onSelectParcel,
  setSelectedParcel,
  placeholder = "Search by 14-digit ULPIN (Bhu-Aadhaar), Owner, or Khasra..."
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxRef = useRef(null);
  const skipNextSearchRef = useRef(false);
  const abortControllerRef = useRef(null);
  const searchId = useId();

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Keyboard shortcut: Press '/' anywhere to focus the search bar
  useEffect(() => {
    const handleGlobalSlash = (e) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalSlash);
    return () => window.removeEventListener("keydown", handleGlobalSlash);
  }, []);

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Debounced autocomplete suggestions via Express API (300ms)
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      setAnnouncement("");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        });
        if (response.ok) {
          const data = await response.json();
          const matches = data.results || [];
          setResults(matches);
          setSelectedIndex(-1);
          setLoading(false);

          if (matches.length > 0) {
            setIsOpen(true);
            setAnnouncement(
              `${matches.length} parcel${matches.length > 1 ? "s" : ""} found for "${trimmed}". Use arrow keys to navigate.`
            );
          } else {
            setIsOpen(false);
          }
          return;
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Search suggestion error:", err);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Suggestion Click & Hydration Handler
  const handleSuggestionClick = async (suggestion) => {
    const rawUlpin = suggestion?.ulpin || (typeof suggestion === "string" ? suggestion : "");
    const cleanUlpin = String(rawUlpin || "").replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
    if (!cleanUlpin) return;

    // Clean up autocomplete UI immediately
    setIsOpen(false);
    setResults([]);
    setSelectedIndex(-1);
    setQuery(cleanUlpin);
    setLoading(true);
    setToastMessage(null);

    skipNextSearchRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      // Fetch full parcel metadata from hydration endpoint
      let response = await fetch(`/api/parcel/${cleanUlpin}`);
      if (!response.ok && response.status === 404) {
        response = await fetch(`/api/parcels/${cleanUlpin}`);
      }

      if (response.status === 404) {
        setToastMessage(`Cadastral record for ULPIN ${cleanUlpin} not found in database.`);
        setAnnouncement(`ULPIN ${cleanUlpin} not found in database`);
        return;
      }

      if (!response.ok) {
        throw new Error(`Hydration failed with status ${response.status}`);
      }

      const resJson = await response.json();
      const fullData = resJson.data || resJson;

      if (fullData && fullData.ulpin) {
        // Update sidebar state
        if (typeof setSelectedParcel === "function") {
          setSelectedParcel(fullData);
        }
        if (typeof onSelectParcel === "function") {
          onSelectParcel(fullData.ulpin, fullData, false);
        }

        // Safe coordinate extraction with robust centroids for demo & registry parcels
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
        const fb = FALLBACK_CENTROIDS[cleanUlpin] || [12.9298, 77.5843];
        const parsedLat = parseFloat(fullData.lat);
        const parsedLng = parseFloat(fullData.lng);
        const targetLat = !isNaN(parsedLat) ? parsedLat : fb[0];
        const targetLng = !isNaN(parsedLng) ? parsedLng : fb[1];

        // Fly map with safe zoom clamping (prevents OpenTopoMap blank tile crash)
        const activeMap = map || window.gisMap;
        if (activeMap && typeof activeMap.flyTo === "function" && !isNaN(targetLat) && !isNaN(targetLng)) {
          const maxAllowedZoom = activeMap.getMaxZoom ? activeMap.getMaxZoom() : 18;
          const safeZoom = Math.min(18, maxAllowedZoom);
          activeMap.flyTo([targetLat, targetLng], safeZoom, {
            animate: true,
            duration: 1.5
          });
        }

        // Secondary event dispatch
        if (!isNaN(targetLat) && !isNaN(targetLng)) {
          window.dispatchEvent(
            new CustomEvent("gis:flyTo", {
              detail: { lat: targetLat, lng: targetLng, zoom: 18, duration: 1.5 }
            })
          );
        }

        setAnnouncement(`Selected cadastral parcel ${fullData.ulpin}.`);
      } else {
        setToastMessage(`ULPIN ${cleanUlpin} not found in database.`);
      }
    } catch (err) {
      console.error("Hydration error on suggestion click:", err);
      setToastMessage(err.message || `Failed to fetch parcel ${cleanUlpin}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && results.length > 0) {
        setIsOpen(true);
      } else if (results.length > 0) {
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        handleSuggestionClick(results[selectedIndex]);
      } else {
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (selectedIndex >= 0 && results[selectedIndex]) {
      handleSuggestionClick(results[selectedIndex]);
      return;
    }

    const cleanUlpin = query.replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
    if (!cleanUlpin) return;

    handleSuggestionClick({ ulpin: cleanUlpin });
  };

  const handleClear = () => {
    skipNextSearchRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setLoading(false);
    setAnnouncement("Search cleared.");
    if (onSelectParcel) {
      onSelectParcel(null, null, false);
    }
    if (setSelectedParcel) {
      setSelectedParcel(null);
    }
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <form
        onSubmit={handleSubmit}
        role="search"
        className="flex w-full max-w-2xl items-center px-3 py-1.5 bg-gray-50 dark:bg-[#111] border border-gray-300 dark:border-neutral-800 focus-within:ring-1 focus-within:ring-black dark:focus-within:ring-white transition-all gap-2 rounded-none"
      >
        {/* Search SVG Icon (Shrink Protected) */}
        <div className="shrink-0 flex items-center text-gray-400 dark:text-neutral-500">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </div>

        {/* The Input Field (Truncation Fix) */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            skipNextSearchRef.current = false;
            setQuery(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search cadastral parcel by 14-digit ULPIN, Owner Name, or Khasra Number"
          className="w-full min-w-0 truncate bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 font-sans"
        />

        {/* Action Controls */}
        <div className="shrink-0 flex items-center gap-2">
          {loading && (
            <div
              className="shrink-0 h-4 w-4 animate-spin rounded-none border-2 border-black dark:border-white border-t-transparent"
              aria-label="Loading search results"
            />
          )}

          {!query ? (
            <div className="shrink-0 hidden sm:flex items-center justify-center rounded-none border border-gray-300 dark:border-neutral-800 bg-gray-200 dark:bg-neutral-900 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 dark:text-neutral-500">
              /
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 rounded-none p-1 text-gray-400 hover:text-black dark:text-neutral-400 dark:hover:text-white cursor-pointer"
              aria-label="Clear search query"
            >
              ✕
            </button>
          )}

          {/* FIND Button (Shrink Protected with Stark SpaceX Theme) */}
          <button
            type="submit"
            className="shrink-0 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors px-5 py-1.5 text-xs font-bold uppercase tracking-widest rounded-none cursor-pointer"
          >
            Find
          </button>
        </div>
      </form>

      {/* Floating Autocomplete Suggestions */}
      {isOpen && !loading && results.length > 0 && (
        <div
          ref={listboxRef}
          id={`${searchId}-listbox`}
          role="listbox"
          aria-label="Cadastral parcel search suggestions"
          className="absolute left-0 top-full z-[1500] mt-1 max-h-80 w-full overflow-y-auto rounded-none border border-gray-300 dark:border-neutral-800 bg-white dark:bg-[#050505] p-1 shadow-2xl transition"
        >
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
            <span>Matching Records ({results.length})</span>
            <span className="text-[10px] font-mono text-gray-400 dark:text-neutral-600">↑↓ to navigate • Enter to select</span>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-neutral-800/60">
            {results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <li
                  key={item.ulpin}
                  id={`${searchId}-item-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSuggestionClick(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex cursor-pointer items-center justify-between rounded-none px-3 py-2.5 transition-colors ${
                    isSelected
                      ? "bg-gray-100 dark:bg-neutral-900 border-l-2 border-black dark:border-white text-black dark:text-white"
                      : "hover:bg-gray-50 dark:hover:bg-neutral-900/60 text-gray-800 dark:text-neutral-300 border-l-2 border-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-bold sm:text-sm text-black dark:text-white">
                        {item.ownerName}
                      </span>
                      {item.khasraNumber && item.khasraNumber !== "-" && (
                        <span className="rounded-none border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 px-1.5 py-0.5 text-[10px] font-mono text-gray-600 dark:text-neutral-400">
                          Khasra {item.khasraNumber}
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-gray-900 dark:text-neutral-200">
                        {item.ulpin}
                      </span>
                      {item.zoneType && (
                        <span className="text-[10px] text-gray-500 dark:text-neutral-500 font-mono">
                          • {item.zoneType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-3 flex shrink-0 items-center text-gray-400 dark:text-neutral-500 group-hover:text-black dark:group-hover:text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Non-intrusive Floating Error Toast */}
      {toastMessage && (
        <div
          role="alert"
          className="absolute top-full left-0 right-0 mt-2 z-[1300] flex items-center justify-between rounded-xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/90 p-3 shadow-lg text-xs font-semibold text-red-800 dark:text-red-200 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
              !
            </span>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
