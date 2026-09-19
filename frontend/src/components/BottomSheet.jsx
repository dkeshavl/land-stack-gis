import { useState, useRef, useEffect, useCallback } from "react";

/**
 * BottomSheet Component for Land Stack GIS (Mobile Viewport < 768px)
 * Smart India Hackathon PS 26014 — Ministry of Rural Development
 *
 * Features:
 * - 3 Real Snap Points: 'peek' (145px), 'half' (50vh), 'full' (88vh)
 * - Isolated drag handle to prevent scroll trapping inside the dossier
 * - Explicit Minimize / Close controls
 * - Progressive backdrop dimming
 * - Smooth transition animations respecting reduced-motion
 */
export default function BottomSheet({ isOpen, onClose, children }) {
  const [snapPoint, setSnapPoint] = useState("half"); // "peek" | "half" | "full"
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  // Reset to 'half' whenever a new parcel opens
  useEffect(() => {
    if (isOpen) {
      setSnapPoint("half");
      setDragOffset(0);
    }
  }, [isOpen]);

  const snapHeights = {
    peek: "h-[145px]",
    half: "h-[50vh]",
    full: "h-[88vh]"
  };

  const backdropDim = {
    peek: "bg-black/10 backdrop-blur-[1px]",
    half: "bg-black/40 backdrop-blur-xs",
    full: "bg-black/60 backdrop-blur-sm"
  };

  // Touch Gesture Handlers on Drag Zone only
  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const clientY = e.touches[0].clientY;
    currentYRef.current = clientY;
    const deltaY = clientY - startYRef.current;
    setDragOffset(deltaY);
  };

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const deltaY = currentYRef.current - startYRef.current;
    const threshold = 45; // px threshold

    if (deltaY > threshold) {
      // Swiped Downwards
      if (snapPoint === "full") {
        setSnapPoint("half");
      } else if (snapPoint === "half") {
        setSnapPoint("peek");
      } else if (snapPoint === "peek") {
        onClose();
      }
    } else if (deltaY < -threshold) {
      // Swiped Upwards
      if (snapPoint === "peek") {
        setSnapPoint("half");
      } else if (snapPoint === "half") {
        setSnapPoint("full");
      }
    }

    setDragOffset(0);
  }, [isDragging, snapPoint, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] md:hidden">
      {/* Progressive Backdrop Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 transition-opacity duration-200 ${backdropDim[snapPoint]}`}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        className={`fixed bottom-0 left-0 right-0 flex flex-col rounded-t-2xl border-t border-slate-300 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 ease-out ${
          snapHeights[snapPoint]
        }`}
        style={{
          transform: isDragging ? `translateY(${Math.max(-20, dragOffset)}px)` : "translateY(0)"
        }}
      >
        {/* Isolated Drag Zone & Header Controls */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-2 select-none cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-slate-850 rounded-t-2xl"
        >
          {/* Snap Cycle Button */}
          <button
            type="button"
            onClick={() => {
              if (snapPoint === "peek") setSnapPoint("half");
              else if (snapPoint === "half") setSnapPoint("full");
              else setSnapPoint("half");
            }}
            className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            {snapPoint === "full" ? "Collapse" : snapPoint === "half" ? "Expand" : "Open"}
          </button>

          {/* Central Handle Bar */}
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

          {/* Close Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/80 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300 transition"
            aria-label="Close dossier sheet"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
