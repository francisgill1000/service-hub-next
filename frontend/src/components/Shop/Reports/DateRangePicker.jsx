"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function toISO(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const fromISO = (s) => (s ? new Date(`${s}T00:00:00`) : null);

function presetRange(key) {
  const today = new Date();
  switch (key) {
    case "7d": {
      const from = new Date();
      from.setDate(today.getDate() - 6);
      return { from: toISO(from), to: toISO(today) };
    }
    case "30d": {
      const from = new Date();
      from.setDate(today.getDate() - 29);
      return { from: toISO(from), to: toISO(today) };
    }
    case "thisMonth": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toISO(from), to: toISO(today) };
    }
    case "lastMonth": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toISO(from), to: toISO(to) };
    }
    case "thisYear": {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from: toISO(from), to: toISO(today) };
    }
    default:
      return null;
  }
}

const PRESETS = [
  { key: "7d", label: "Last 7 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "30d", label: "Last 30 days" },
  { key: "thisYear", label: "This year" },
];

// Detect if a {from, to} matches a preset (so the active chip stays in sync)
function detectPreset(value) {
  if (!value || !value.from || !value.to) return null;
  for (const p of PRESETS) {
    const r = presetRange(p.key);
    if (r && r.from === value.from && r.to === value.to) return p.key;
  }
  return null;
}

export default function DateRangePicker({ value, onChange }) {
  const [activePreset, setActivePreset] = useState("thisMonth");

  useEffect(() => {
    if (!value) {
      onChange(presetRange("thisMonth"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the chip in sync if value changes from outside or via the picker
  useEffect(() => {
    setActivePreset(detectPreset(value));
  }, [value]);

  const choosePreset = (key) => {
    setActivePreset(key);
    onChange(presetRange(key));
  };

  return (
    <div className="bg-[#151c25] rounded-xl p-4 border border-[#414755]/20 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => choosePreset(p.key)}
            className={`h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activePreset === p.key
                ? "bg-[#4b8eff] text-white"
                : "bg-[#080f17] border border-[#414755]/40 text-[#8b90a0] hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}

        <div className="relative booking-range-picker w-full md:w-72 mt-2 md:mt-0 md:ml-auto">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none z-10">date_range</span>
          <DatePicker
            selectsRange
            startDate={fromISO(value?.from)}
            endDate={fromISO(value?.to)}
            onChange={([start, end]) => {
              onChange({ from: toISO(start), to: toISO(end) });
            }}
            isClearable
            placeholderText="Custom range"
            dateFormat="yyyy-MM-dd"
            calendarClassName="booking-range-cal"
            popperPlacement="bottom-end"
            monthsShown={2}
          />
        </div>
      </div>
    </div>
  );
}
