import { createContext, useContext, useEffect, useState, useMemo } from "react";

const THEME_STORAGE_KEY = "theme";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 1. Check persistent choice in localStorage (defaulting strictly to 'light')
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem("land-stack-theme");
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    }
    return "light";
  });

  // Track storage/theme changes across components and tabs
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTheme = () => {
      const saved = localStorage.getItem("theme") || localStorage.getItem("land-stack-theme");
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
      }
    };

    window.addEventListener("storage", syncTheme);
    window.addEventListener("theme-change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("theme-change", syncTheme);
    };
  }, []);

  // Update DOM and localStorage whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
    try {
      localStorage.setItem("theme", theme);
      localStorage.setItem("land-stack-theme", theme);
    } catch (e) {
      console.warn("Could not save theme preference:", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      resolvedTheme: theme,
      isDark: theme === "dark"
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return context;
}
