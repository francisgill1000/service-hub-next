"use client";

import { useState } from "react";
import { PALETTES, useTheme } from "@/context/ThemeContext";

export default function ThemePicker() {
  const { palette, setPalette, theme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Choose theme palette"
        title="Choose theme palette"
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-brand-sidebarmuted hover:bg-brand-sidebarhover hover:text-brand-sidebarfg transition-all"
      >
        <span className="material-symbols-outlined text-[20px] leading-none">palette</span>
        <span className="flex-1 text-left">Theme</span>
        <span className="flex items-center gap-0.5">
          {(PALETTES.find((p) => p.id === palette)?.swatch || []).slice(0, 3).map((c, i) => (
            <span
              key={i}
              className="block w-2.5 h-2.5 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: c }}
            />
          ))}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-brand-surface rounded-2xl border border-brand-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <div>
                <h3 className="text-base font-black text-brand-text tracking-tight">Theme palette</h3>
                <p className="text-[11px] text-brand-muted font-semibold mt-0.5">
                  {theme === "dark"
                    ? "Switch to light mode to see your choice — dark mode is unchanged."
                    : "Pick a look. Saved per device."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="size-8 rounded-lg bg-brand-elevated hover:bg-brand-hover text-brand-muted hover:text-brand-text flex items-center justify-center transition-all"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 max-h-[70vh] overflow-y-auto">
              {PALETTES.map((p) => {
                const isActive = p.id === palette;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPalette(p.id);
                      setOpen(false);
                    }}
                    className={`relative text-left p-3 rounded-xl border-2 transition-all ${
                      isActive
                        ? "border-brand-primary bg-brand-elevated"
                        : "border-brand-border hover:border-brand-muted bg-brand-surface"
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      {p.swatch.map((c, i) => (
                        <span
                          key={i}
                          className="flex-1 h-10 rounded-md ring-1 ring-black/10"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <p className="text-sm font-black text-brand-text">{p.label}</p>
                    <p className="text-[10px] text-brand-muted font-semibold">{p.description}</p>
                    {isActive && (
                      <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary text-white">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
