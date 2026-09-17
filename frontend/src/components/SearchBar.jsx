import { useState, useEffect, useRef } from "react";

/**
 * SearchBar Component for Land Stack GIS
 * Allows searching by 14-character ULPIN or Owner's Name.
 *
 * Props:
 * - onSelectParcel: (ulpin: string) => void (Required)
 * - availableParcels: Array (Optional GeoJSON features or parcel objects)
 * - placeholder: string (Optional)
 */
const DEFAULT_EMPTY_PARCELS = [];

function SearchBar({ onSelectParcel, availableParcels = DEFAULT_EMPTY_PARCELS, placeholder = "Search by 14-digit ULPIN or Owner Name..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const skipNextSearchRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch search matches with debounce and abort control
  useEffect(() => {
    // If query was updated by selecting an item, do not re-trigger search
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setErrorMessage("");
      setLoading(false);
      return;
    }

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        // 1. Primary: Search via backend API endpoint
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        });
        if (response.ok) {
          const data = await response.json();
          const matches = data.results || [];
          setResults(matches);
          setIsOpen(matches.length > 0);
          setSelectedIndex(-1);
          return;
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Backend search API fallback:", err);
        }
      }

      // 2. Client-side fallback if availableParcels provided
      if (Array.isArray(availableParcels) && availableParcels.length > 0) {
        const lowerQ = trimmed.toLowerCase();
        const clientMatches = availableParcels
          .map((item) => {
            const props = item.properties || item;
            return {
              ulpin: props.ulpin || item.ulpin,
              ownerName: props.ownerName || props.owner || item.ownerName || "Registered Owner",
              khasraNumber: props.khasraNumber || props.khasra || item.khasraNumber || "-",
              zoneType: props.zoneType || item.zoneType || "Land Parcel"
            };
          })
          .filter((p) => {
            if (!p.ulpin) return false;
            return (
              p.ulpin.toLowerCase().includes(lowerQ) ||
              p.ownerName.toLowerCase().includes(lowerQ) ||
              p.khasraNumber.toLowerCase().includes(lowerQ)
            );
          });

        setResults(clientMatches);
        setIsOpen(clientMatches.length > 0);
        setSelectedIndex(-1);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
      // Ensure loading state is reset when unmounting or re-triggering
      setLoading(false);
    };
  }, [query, availableParcels]);

  // Handle parcel selection
  const handleSelect = (ulpin) => {
    if (!ulpin) return;
    skipNextSearchRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setIsOpen(false);
    setErrorMessage("");
    setQuery(ulpin);
    onSelectParcel(ulpin);
  };

  // Handle direct form submission (Press Enter or Click Find)
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setErrorMessage("");

    // 1. Check if an item in the dropdown is keyboard-highlighted
    if (selectedIndex >= 0 && results[selectedIndex]) {
      handleSelect(results[selectedIndex].ulpin);
      return;
    }

    // 2. Check if current results list contains an exact match
    const exactMatch = results.find(
      (r) =>
        r.ulpin.toLowerCase() === trimmed.toLowerCase() ||
        r.ownerName.toLowerCase() === trimmed.toLowerCase()
    );
    if (exactMatch) {
      handleSelect(exactMatch.ulpin);
      return;
    }

    // 3. If any results exist in current list, select the top match
    if (results.length > 0) {
      handleSelect(results[0].ulpin);
      return;
    }

    // 4. Otherwise, query backend search immediately
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          handleSelect(data.results[0].ulpin);
          return;
        }
      }

      // Check direct ULPIN lookup
      const parcelRes = await fetch(`/api/parcel/${encodeURIComponent(trimmed)}`);
      if (parcelRes.ok) {
        const parcelData = await parcelRes.json();
        if (parcelData.success) {
          handleSelect(trimmed);
          return;
        }
      }

      setErrorMessage(`No parcel found matching "${trimmed}".`);
      setIsOpen(false);
    } catch (err) {
      console.error("Search lookup failed:", err);
      setErrorMessage(`Search failed for "${trimmed}". Please try again.`);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation support
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && results.length > 0) {
        setIsOpen(true);
      } else {
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex].ulpin);
      }
    }
  };

  const handleClear = () => {
    skipNextSearchRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQuery("");
    setResults([]);
    setErrorMessage("");
    setIsOpen(false);
    setLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* Search Icon */}
        <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </div>

        {/* Search Input Field */}
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
          aria-label="Search parcel by ULPIN or Owner Name"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-20 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm"
        />

        {/* Action icons inside input */}
        <div className="absolute right-2 flex items-center space-x-1">
          {/* Loading Spinner */}
          {loading && (
            <div className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          )}

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              title="Clear search"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Quick Submit Button */}
          <button
            type="submit"
            disabled={!query.trim()}
            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Find
          </button>
        </div>
      </form>

      {/* Error Banner */}
      {errorMessage && (
        <div className="absolute left-0 top-full z-50 mt-1.5 flex w-full items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-md">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Autocomplete / Search Suggestions Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl backdrop-blur">
          <div className="border-b border-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Matching Parcels ({results.length})
          </div>
          <ul className="divide-y divide-slate-100">
            {results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <li
                  key={item.ulpin}
                  onClick={() => handleSelect(item.ulpin)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition ${
                    isSelected ? "bg-blue-50 text-blue-900" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="truncate text-xs font-bold text-slate-800 group-hover:text-blue-700 sm:text-sm">
                        {item.ownerName}
                      </span>
                      {item.khasraNumber && item.khasraNumber !== "-" && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          Khasra {item.khasraNumber}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center space-x-2">
                      <span className="font-mono text-[11px] font-semibold text-blue-600">
                        {item.ulpin}
                      </span>
                      {item.zoneType && (
                        <span className="text-[10px] text-slate-400">• {item.zoneType}</span>
                      )}
                    </div>
                  </div>

                  {/* Select indicator icon */}
                  <div className="ml-3 flex shrink-0 items-center text-slate-400 group-hover:text-blue-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
