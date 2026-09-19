/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        gov: {
          navy: {
            50: "#f0f4f9",
            100: "#d9e2ef",
            200: "#b5c7e0",
            300: "#86a4cc",
            400: "#5780b3",
            500: "#366199",
            600: "#274c7d",
            700: "#1e3c63",
            800: "#162e4c",
            900: "#0f2137",
            950: "#0a1524"
          },
          emerald: {
            50: "#ecfdf5",
            100: "#d1fae5",
            200: "#a7f3d0",
            500: "#10b981",
            600: "#059669",
            700: "#047857",
            800: "#065f46",
            950: "#022c22"
          },
          amber: {
            50: "#fffbeb",
            100: "#fef3c7",
            200: "#fde68a",
            500: "#f59e0b",
            600: "#d97706",
            700: "#b45309",
            800: "#92400e",
            950: "#451a03"
          },
          crimson: {
            50: "#fef2f2",
            100: "#fee2e2",
            200: "#fecaca",
            500: "#ef4444",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
            950: "#450a0a"
          }
        },
        surface: {
          base: "var(--surface-base)",
          raised: "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
          card: "var(--surface-card)"
        },
        border: {
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)"
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)"
        }
      },
      boxShadow: {
        "gov-sm": "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        "gov-card": "0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)",
        "gov-hover": "0 4px 12px -2px rgba(15, 23, 42, 0.12), 0 2px 6px -2px rgba(15, 23, 42, 0.08)",
        "gov-modal": "0 20px 25px -5px rgba(15, 23, 42, 0.2), 0 8px 10px -6px rgba(15, 23, 42, 0.1)"
      }
    }
  },
  plugins: []
};