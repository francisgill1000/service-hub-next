"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function presetRange(key) {
  const today = new Date();
  switch (key) {
    case "7d": {
      const from = new Date();
      from.setDate(today.getDate() - 6);
      return { from: fmt(from), to: fmt(today) };
    }
    case "30d": {
      const from = new Date();
      from.setDate(today.getDate() - 29);
      return { from: fmt(from), to: fmt(today) };
    }
    case "thisMonth": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: fmt(from), to: fmt(today) };
    }
    case "lastMonth": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: fmt(from), to: fmt(to) };
    }
    case "thisYear": {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from: fmt(from), to: fmt(today) };
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
  { key: "custom", label: "Custom" },
];

export default function DateRangePicker({ value, onChange }) {
  const [activePreset, setActivePreset] = useState("thisMonth");

  useEffect(() => {
    if (!value) {
      onChange(presetRange("thisMonth"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choosePreset = (key) => {
    setActivePreset(key);
    if (key !== "custom") {
      onChange(presetRange(key));
    }
  };

  const updateCustom = (which, date) => {
    const next = { ...value };
    next[which] = fmt(date);
    onChange(next);
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
      </div>

      {activePreset === "custom" && value && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">From</span>
          <DatePicker
            selected={value.from ? new Date(value.from + "T00:00:00") : null}
            onChange={(d) => d && updateCustom("from", d)}
            dateFormat="yyyy-MM-dd"
            className="h-9 px-3 bg-[#080f17] border border-[#414755]/40 rounded-lg text-sm font-semibold text-white outline-none [color-scheme:dark]"
          />
          <span className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">To</span>
          <DatePicker
            selected={value.to ? new Date(value.to + "T00:00:00") : null}
            onChange={(d) => d && updateCustom("to", d)}
            dateFormat="yyyy-MM-dd"
            className="h-9 px-3 bg-[#080f17] border border-[#414755]/40 rounded-lg text-sm font-semibold text-white outline-none [color-scheme:dark]"
          />
        </div>
      )}

      {value && (
        <p className="text-[10px] text-[#8b90a0] font-semibold">
          Showing: <span className="text-white">{value.from}</span> → <span className="text-white">{value.to}</span>
        </p>
      )}
    </div>
  );
}
