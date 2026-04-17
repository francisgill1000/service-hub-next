"use client";

import React, { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

// ✅ Helper: format date manually as YYYY-MM-DD
function formatDate(date) {
  if (!(date instanceof Date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ✅ Helper: safely normalize string/Date input to local Date
function normalizeDate(input) {
  if (!input) return null;
  if (input instanceof Date) return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  const parts = input.split("-"); // assume 'YYYY-MM-DD'
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export default function DatePicker({
  value = null,
  onChange = () => {},
  placeholder = "Pick a date",
  className = "",
  disabled = false,
  initialFocus = true,
}) {
  const [open, setOpen] = useState(false);

  // Normalize for Calendar display
  const displayDate = normalizeDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 ${
            !value ? "" : ""
          } ${className}`}
          disabled={disabled}
        >
          {displayDate ? formatDate(displayDate) : <span>{placeholder}</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10" align="start">
        <Calendar
          mode="single"
          selected={displayDate}
          onSelect={(date) => {
            if (date) {
              const formatted = formatDate(date); // send as string
              onChange(formatted);
            }
            setOpen(false);
          }}
          initialFocus={initialFocus}
        />
      </PopoverContent>
    </Popover>
  );
}
