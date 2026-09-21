import React, { useState, useEffect } from "react";
import LandingPageDark from "./LandingPageDark";
import LandingPageLight from "./LandingPageLight";

export default function LandingPage({ onNavigate }) {
  // 1. Initialize state from localStorage, defaulting to 'light'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  // 2. Update HTML class and localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 3. Toggle Function to pass down as a prop
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // 4. Conditionally render the exact file based on state
  if (theme === 'dark') {
    return <LandingPageDark onNavigate={onNavigate} toggleTheme={toggleTheme} />;
  }

  return <LandingPageLight onNavigate={onNavigate} toggleTheme={toggleTheme} />;
}
