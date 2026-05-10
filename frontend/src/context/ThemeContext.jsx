"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Available light-mode presets. Keep in sync with .theme-* CSS in globals.css.
export const PALETTES = [
  { id: "charcoal", label: "Charcoal", swatch: ["#1F2937", "#EFE9DD", "#FFFFFF"], description: "Clean & neutral" },
  { id: "cream",    label: "Cream",    swatch: ["#B8915E", "#FFFFFF", "#FBF7F0"], description: "Warm & minimal" },
  { id: "blue",     label: "Blue",     swatch: ["#2563EB", "#1E40AF", "#FFFFFF"], description: "Cool clinical" },
  { id: "sage",     label: "Sage",     swatch: ["#4D7C5A", "#2D4A3A", "#FFFFFF"], description: "Organic spa" },
  { id: "rose",     label: "Rose",     swatch: ["#B47B8A", "#5A2A35", "#FFFFFF"], description: "Warm salon" },
  { id: "slate",    label: "Slate",    swatch: ["#475569", "#FFFFFF", "#F8FAFC"], description: "Minimal pro" },
];

const VALID_PALETTES = PALETTES.map((p) => p.id);
const DEFAULT_PALETTE = "charcoal";

const ThemeContext = createContext({
  theme: "dark",
  palette: DEFAULT_PALETTE,
  toggle: () => {},
  setPalette: () => {},
});

function applyPaletteClass(palette) {
  const root = document.documentElement;
  // Remove any existing theme-* class, then add the chosen one.
  root.classList.forEach((cls) => {
    if (cls.startsWith("theme-")) root.classList.remove(cls);
  });
  root.classList.add(`theme-${palette}`);
}

export function ThemeProvider({ children }) {
  // Defaults match the pre-paint script.
  const [theme, setTheme] = useState("dark");
  const [palette, setPaletteState] = useState(DEFAULT_PALETTE);

  // Sync from the html classes set by the pre-paint script.
  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.classList.contains("dark") ? "dark" : "light");
    const found = Array.from(root.classList).find((c) => c.startsWith("theme-"));
    if (found) {
      const id = found.slice("theme-".length);
      if (VALID_PALETTES.includes(id)) setPaletteState(id);
    }
  }, []);

  // Apply theme class + persist whenever theme changes.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("rezzy.theme", theme);
    } catch {}
  }, [theme]);

  // Apply palette class + persist whenever palette changes.
  useEffect(() => {
    applyPaletteClass(palette);
    try {
      localStorage.setItem("rezzy.palette", palette);
    } catch {}
  }, [palette]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const setPalette = (id) => {
    if (VALID_PALETTES.includes(id)) setPaletteState(id);
  };

  return (
    <ThemeContext.Provider value={{ theme, palette, toggle, setPalette, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
