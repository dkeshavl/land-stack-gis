/**
 * StatusPill Component for Land Stack GIS
 * Smart India Hackathon PS 26014 — Ministry of Rural Development
 *
 * Provides WCAG AAA compliant status visualization with dual-sensory cues:
 * Never relies on color alone. Combines curated HSL colors with geometric icons
 * and clear semantic text for complete colorblind accessibility.
 *
 * Props:
 * - status: string (e.g. "Approved", "Paid", "Pending", "Disputed", "Clear Title", "Mortgaged")
 * - size: "sm" | "md" (default "sm")
 * - className: string (optional additional classes)
 */
export default function StatusPill({ status, size = "sm", className = "" }) {
  const norm = (status || "").toLowerCase().trim();

  // Determine classification category
  let type = "neutral";
  if (
    norm.includes("approved") ||
    norm.includes("paid") ||
    norm.includes("clear") ||
    norm.includes("freehold") ||
    norm.includes("verified") ||
    norm.includes("success")
  ) {
    type = "positive";
  } else if (
    norm.includes("pending") ||
    norm.includes("progress") ||
    norm.includes("review") ||
    norm.includes("mortgage") ||
    norm.includes("lien") ||
    norm.includes("warning")
  ) {
    type = "warning";
  } else if (
    norm.includes("reject") ||
    norm.includes("dispute") ||
    norm.includes("litigat") ||
    norm.includes("overdue") ||
    norm.includes("hazard") ||
    norm.includes("danger")
  ) {
    type = "danger";
  }

  // Visual tokens per category
  const configs = {
    positive: {
      container:
        "bg-emerald-500/10 text-emerald-800 border border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/40 font-mono uppercase tracking-wider text-[10px]",
      iconBg: "bg-emerald-600 dark:bg-emerald-400 text-white dark:text-black",
      symbol: (
        // Circular checkmark
        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="2.5 6 4.5 8.5 9.5 3.5" />
        </svg>
      ),
      shape: "rounded-none"
    },
    warning: {
      container:
        "bg-amber-500/10 text-amber-800 border border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/40 font-mono uppercase tracking-wider text-[10px]",
      iconBg: "bg-amber-500 dark:bg-amber-400 text-black",
      symbol: (
        // Alert triangle / diamond exclamation
        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 1.5L11 10.5H1L6 1.5Z" />
          <line x1="6" y1="5" x2="6" y2="7.5" />
          <circle cx="6" cy="9.2" r="0.6" fill="currentColor" />
        </svg>
      ),
      shape: "rounded-none"
    },
    danger: {
      container:
        "bg-red-500/10 text-red-800 border border-red-500/40 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/40 font-mono uppercase tracking-wider text-[10px]",
      iconBg: "bg-red-600 dark:bg-red-400 text-white dark:text-black",
      symbol: (
        // Hexagonal / cross mark
        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="3" x2="9" y2="9" />
          <line x1="9" y1="3" x2="3" y2="9" />
        </svg>
      ),
      shape: "rounded-none"
    },
    neutral: {
      container:
        "bg-gray-100 text-gray-800 border border-gray-300 dark:bg-[#111] dark:text-neutral-300 dark:border-neutral-800 font-mono uppercase tracking-wider text-[10px]",
      iconBg: "bg-gray-500 dark:bg-neutral-500 text-white dark:text-black",
      symbol: (
        // Info circle
        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" />
          <line x1="6" y1="5.5" x2="6" y2="8.5" />
          <circle cx="6" cy="3.5" r="0.5" fill="currentColor" />
        </svg>
      ),
      shape: "rounded-none"
    }
  };

  const current = configs[type];
  const sizeClasses =
    size === "md"
      ? "px-3 py-1 text-xs gap-1.5"
      : "px-2 py-0.5 text-[11px] gap-1";

  return (
    <span
      role="status"
      className={`inline-flex items-center font-bold tracking-tight shadow-sm transition-all select-none ${current.shape} ${current.container} ${sizeClasses} ${className}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full p-0.5 ${current.iconBg}`}
        aria-hidden="true"
      >
        {current.symbol}
      </span>
      <span>{status || "Unknown"}</span>
    </span>
  );
}
