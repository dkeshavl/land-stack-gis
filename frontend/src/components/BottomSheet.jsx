import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * Production BottomSheet Component for Land Stack GIS (Mobile Viewport < 768px)
 * Smart India Hackathon PS 26014 — Ministry of Rural Development
 *
 * Architecture:
 * 1. True Bottom Anchoring: `fixed inset-x-0 bottom-0` rendered via React Portal
 *    directly to `document.body`, eliminating all parent transform/filter traps.
 * 2. Height-driven Drag Model:
 *    - COLLAPSED = 50% viewport height, EXPANDED = 88% viewport height
 *    - Dragging UP grows height smoothly from 50% to 88%. translateY is strictly 0.
 *    - Dragging DOWN from expanded shrinks height to 50%. translateY remains 0.
 *    - Dragging DOWN from collapsed translates downward (positive translateY only) to dismiss.
 *    - Math guard ensures translateY is NEVER negative.
 * 3. 60fps Direct DOM manipulation:
 *    - Pointer Events with `setPointerCapture` and `touch-action: none`.
 *    - Zero React re-renders during active drag. Direct ref style updates.
 * 4. Content-scroll handoff & Leaflet event isolation.
 */
export default function BottomSheet({ isOpen, onClose, onApplyMutation, children }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sheetRef = useRef(null);
  const headerRef = useRef(null);
  const scrollBodyRef = useRef(null);

  // Mutable drag state refs to avoid React re-renders during pointermove
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const currentHeightRef = useRef(0);
  const currentTranslateYRef = useRef(0);
  const pointsHistoryRef = useRef([]); // [{ y, time }] for velocity over last ~100ms
  const hasMovedRef = useRef(false);

  // Content scroll handoff refs
  const bodyStartYRef = useRef(0);
  const isBodyDraggingRef = useRef(false);

  // Computed snap points in px
  const snapPointsRef = useRef({ collapsed: 400, expanded: 700 });

  // Calculate dvh-equivalent snap points
  const updateSnapPoints = useCallback(() => {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const collapsed = Math.round(viewportHeight * 0.50);
    const expanded = Math.round(viewportHeight * 0.88);
    snapPointsRef.current = { collapsed, expanded };
    return { collapsed, expanded };
  }, []);

  // Snap execution helper
  const snapTo = useCallback((target) => {
    const { collapsed, expanded } = snapPointsRef.current;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const transitionStr = prefersReducedMotion
      ? "none"
      : "height 300ms cubic-bezier(0.32, 0.72, 0, 1), transform 300ms cubic-bezier(0.32, 0.72, 0, 1)";

    if (target === "EXPANDED") {
      currentHeightRef.current = expanded;
      currentTranslateYRef.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.transition = transitionStr;
        sheetRef.current.style.height = `${expanded}px`;
        sheetRef.current.style.transform = "translate3d(0, 0px, 0)";
      }
      setIsExpanded(true);
    } else if (target === "COLLAPSED") {
      currentHeightRef.current = collapsed;
      currentTranslateYRef.current = 0;
      if (sheetRef.current) {
        sheetRef.current.style.transition = transitionStr;
        sheetRef.current.style.height = `${collapsed}px`;
        sheetRef.current.style.transform = "translate3d(0, 0px, 0)";
      }
      setIsExpanded(false);
    } else if (target === "CLOSED") {
      currentTranslateYRef.current = collapsed + 100;
      if (sheetRef.current) {
        sheetRef.current.style.transition = transitionStr;
        sheetRef.current.style.transform = `translate3d(0, ${currentHeightRef.current + 80}px, 0)`;
      }
      setTimeout(() => {
        onClose?.();
      }, prefersReducedMotion ? 0 : 300);
    }
  }, [onClose]);

  // Window / visualViewport resize handling
  useEffect(() => {
    const handleResize = () => {
      const { collapsed, expanded } = updateSnapPoints();
      if (sheetRef.current && !isDraggingRef.current) {
        const targetHeight = isExpanded ? expanded : collapsed;
        currentHeightRef.current = targetHeight;
        currentTranslateYRef.current = 0;
        sheetRef.current.style.height = `${targetHeight}px`;
        sheetRef.current.style.transform = "translate3d(0, 0px, 0)";
      }
    };

    updateSnapPoints();
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [isExpanded, updateSnapPoints]);

  // Initialize sheet position when opened
  useEffect(() => {
    if (isOpen) {
      const { collapsed } = updateSnapPoints();
      setIsExpanded(false);
      currentHeightRef.current = collapsed;
      currentTranslateYRef.current = 0;
      isDraggingRef.current = false;

      // Animate entry from below bottom edge
      if (sheetRef.current) {
        sheetRef.current.style.transition = "none";
        sheetRef.current.style.height = `${collapsed}px`;
        sheetRef.current.style.transform = `translate3d(0, ${collapsed + 40}px, 0)`;

        requestAnimationFrame(() => {
          if (sheetRef.current) {
            sheetRef.current.style.transition =
              "transform 300ms cubic-bezier(0.32, 0.72, 0, 1), height 300ms cubic-bezier(0.32, 0.72, 0, 1)";
            sheetRef.current.style.transform = "translate3d(0, 0px, 0)";
          }
        });
      }
    }
  }, [isOpen, updateSnapPoints]);

  // Handle Drag via Pointer Events
  const handlePointerDown = (e) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startYRef.current = e.clientY;
    startHeightRef.current = currentHeightRef.current;
    pointsHistoryRef.current = [{ y: e.clientY, time: Date.now() }];

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();

    const dy = e.clientY - startYRef.current;
    if (Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    // Velocity history maintenance (keep records from last 120ms)
    const now = Date.now();
    pointsHistoryRef.current.push({ y: e.clientY, time: now });
    pointsHistoryRef.current = pointsHistoryRef.current.filter((p) => now - p.time <= 120);

    const { collapsed, expanded } = snapPointsRef.current;
    const rawHeight = startHeightRef.current - dy;
    const height = Math.min(expanded, Math.max(collapsed, rawHeight));
    // Guard: translateY is strictly NON-NEGATIVE (>= 0) at all times
    const translateY = Math.max(0, collapsed - rawHeight);

    currentHeightRef.current = height;
    currentTranslateYRef.current = translateY;

    // Direct 60fps DOM write
    if (sheetRef.current) {
      sheetRef.current.style.height = `${height}px`;
      sheetRef.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
    }
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    e.stopPropagation();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    // Tap without moving -> toggle expansion
    if (!hasMovedRef.current) {
      if (isExpanded) {
        snapTo("COLLAPSED");
      } else {
        snapTo("EXPANDED");
      }
      return;
    }

    // Velocity calculation over last ~100ms
    const history = pointsHistoryRef.current;
    let velocity = 0; // positive = downward, negative = upward
    if (history.length >= 2) {
      const oldest = history[0];
      const newest = history[history.length - 1];
      const dt = Math.max(newest.time - oldest.time, 1);
      velocity = (newest.y - oldest.y) / dt;
    }

    const { collapsed, expanded } = snapPointsRef.current;
    const curY = currentTranslateYRef.current;
    const curH = currentHeightRef.current;

    // 1. Quick Flick Gestures
    if (velocity < -0.5) {
      // Flick UP -> EXPANDED
      snapTo("EXPANDED");
    } else if (velocity > 0.5) {
      // Flick DOWN: from expanded -> collapsed, from collapsed -> closed
      if (startHeightRef.current >= expanded - 30) {
        snapTo("COLLAPSED");
      } else {
        snapTo("CLOSED");
      }
    } else {
      // 2. Position-based Snapping
      if (curY > 0.25 * collapsed) {
        snapTo("CLOSED");
      } else {
        const mid = (collapsed + expanded) / 2;
        if (curH > mid) {
          snapTo("EXPANDED");
        } else {
          snapTo("COLLAPSED");
        }
      }
    }
  };

  const handlePointerCancel = (e) => {
    if (isDraggingRef.current) {
      handlePointerUp(e);
    }
  };

  // Content-scroll handoff (Collapse when dragging down from top in EXPANDED state)
  const handleBodyTouchStart = (e) => {
    bodyStartYRef.current = e.touches[0].clientY;
    isBodyDraggingRef.current = false;
  };

  const handleBodyTouchMove = (e) => {
    if (!scrollBodyRef.current) return;
    const currentY = e.touches[0].clientY;
    const dy = currentY - bodyStartYRef.current;

    // If expanded and at top of scroll body, pulling down collapses the sheet
    if (isExpanded && scrollBodyRef.current.scrollTop <= 0 && dy > 10) {
      isBodyDraggingRef.current = true;
      const { collapsed, expanded } = snapPointsRef.current;
      const rawHeight = expanded - dy;
      const height = Math.min(expanded, Math.max(collapsed, rawHeight));
      const translateY = Math.max(0, collapsed - rawHeight);

      currentHeightRef.current = height;
      currentTranslateYRef.current = translateY;

      if (sheetRef.current) {
        sheetRef.current.style.transition = "none";
        sheetRef.current.style.height = `${height}px`;
        sheetRef.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
      }
    }
  };

  const handleBodyTouchEnd = () => {
    if (isBodyDraggingRef.current) {
      isBodyDraggingRef.current = false;
      const { collapsed, expanded } = snapPointsRef.current;
      const mid = (collapsed + expanded) / 2;
      if (currentHeightRef.current < mid) {
        snapTo("COLLAPSED");
      } else {
        snapTo("EXPANDED");
      }
    }
  };

  const handleApply = () => {
    if (onApplyMutation) {
      onApplyMutation();
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] md:hidden pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Progressive Backdrop Overlay */}
      <div
        onClick={() => snapTo("CLOSED")}
        className={`fixed inset-0 transition-opacity duration-300 ${
          isExpanded ? "bg-black/60 backdrop-blur-sm" : "bg-black/35 backdrop-blur-xs"
        }`}
        aria-hidden="true"
      />

      {/* Sheet Container: Fixed inset-x-0 bottom-0, strictly glued to bottom edge */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 flex flex-col bg-white dark:bg-neutral-900 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)] overflow-hidden"
        style={{
          willChange: "height, transform",
          touchAction: "pan-y",
        }}
      >
        {/* 1. FIXED TOP HEADER (Drag handle / Snap toggle / Close) */}
        <div
          ref={headerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{ touchAction: "none" }}
          className="w-full py-3 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing flex-none bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 select-none z-10 relative"
        >
          {/* Tactile Handle Bar */}
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full mb-1" />

          {/* Contextual Directional Cue */}
          <span className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 uppercase tracking-widest pointer-events-none">
            {isExpanded ? "Swipe down to collapse" : "Swipe up to expand"}
          </span>

          {/* Dismiss Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                snapTo("CLOSED");
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 cursor-pointer"
              aria-label="Close dossier"
            >
              ✕
            </button>
          )}
        </div>

        {/* 2. SCROLLABLE MIDDLE BODY (Only this area scrolls with momentum physics) */}
        <div
          ref={scrollBodyRef}
          onTouchStart={handleBodyTouchStart}
          onTouchMove={handleBodyTouchMove}
          onTouchEnd={handleBodyTouchEnd}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-6 py-4 space-y-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>

        {/* 3. FIXED BOTTOM FOOTER / CTA BUTTON (Glued permanently to the bottom edge) */}
        <div
          className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex-none z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 16px))" }}
        >
          <button
            type="button"
            onClick={handleApply}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-mono text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer text-center"
          >
            Apply for Ownership Transfer (Form 12-A)
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

