import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Activate Day Mode" : "Activate Night Mode"}
      className={`relative inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-none border border-gray-300 dark:border-neutral-800 bg-gray-50 dark:bg-[#111] p-1.5 sm:p-2 text-black dark:text-white transition-colors hover:bg-gray-200 dark:hover:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white cursor-pointer ${className}`}
    >
      {/* Sun Icon (Rotates and scales out in Dark Mode) */}
      <svg
        className={`h-4 w-4 transition-all duration-500 ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100 text-amber-500"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* Moon Icon (Rotates and scales in when Dark Mode is active) */}
      <svg
        className={`absolute h-4 w-4 transition-all duration-500 ${
          isDark
            ? "rotate-0 scale-100 opacity-100 text-sky-400"
            : "-rotate-90 scale-0 opacity-0"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
