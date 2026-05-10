"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle({ variant = "sidebar" }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-brand-sidebarmuted hover:bg-brand-sidebarhover hover:text-brand-sidebarfg transition-all"
      >
        <span className="material-symbols-outlined text-[20px] leading-none">
          {isDark ? "light_mode" : "dark_mode"}
        </span>
        <span className="flex-1 text-left">{isDark ? "Light mode" : "Dark mode"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="size-9 rounded-xl bg-brand-elevated hover:bg-brand-hover text-brand-text flex items-center justify-center transition-all"
    >
      <span className="material-symbols-outlined text-[18px] leading-none">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
