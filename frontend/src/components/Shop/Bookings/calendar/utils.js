import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameDay,
  isSameMonth,
} from "date-fns";

const WEEK_STARTS_ON = 0;

export const HOUR_START = 6;
export const HOUR_END   = 23;

export const toISO = (d) => {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const fromISO = (s) => (s ? new Date(`${s}T00:00:00`) : null);

export function buildMonthMatrix(cursorDate) {
  const start = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: WEEK_STARTS_ON });
  const end   = endOfWeek(endOfMonth(cursorDate),   { weekStartsOn: WEEK_STARTS_ON });
  const days = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1));
  return days;
}

export function buildWeekDays(cursorDate) {
  const start = startOfWeek(cursorDate, { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function buildHourRows() {
  return Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
}

export function groupBookingsByDate(bookings) {
  const map = new Map();
  for (const b of bookings) {
    const key = b.date || b.show_date;
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(b);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }
  return map;
}

export function timeToMinutes(t) {
  if (!t) return null;
  const m = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export const DEFAULT_DURATION_MIN = 60;

export function bookingBlockStyle(booking, rowHeightPx) {
  const startMin = timeToMinutes(booking.start_time);
  if (startMin == null) return null;

  const gridStartMin = HOUR_START * 60;
  const top = ((startMin - gridStartMin) / 60) * rowHeightPx;

  const durationMin = (() => {
    if (booking.duration_minutes) return Number(booking.duration_minutes);
    const endMin = timeToMinutes(booking.end_time);
    if (endMin != null && endMin > startMin) return endMin - startMin;
    return DEFAULT_DURATION_MIN;
  })();

  const height = (durationMin / 60) * rowHeightPx;
  return { top, height };
}

export function shiftCursor(cursorDate, subView, direction) {
  const sign = direction === "next" ? 1 : -1;
  if (subView === "month") return addMonths(cursorDate, sign);
  if (subView === "week")  return addWeeks(cursorDate, sign);
  return addDays(cursorDate, sign);
}

export function cursorLabel(cursorDate, subView) {
  if (subView === "month") return format(cursorDate, "MMMM yyyy");
  if (subView === "week") {
    const start = startOfWeek(cursorDate, { weekStartsOn: WEEK_STARTS_ON });
    const end   = addDays(start, 6);
    if (isSameMonth(start, end)) return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return format(cursorDate, "EEEE, MMM d, yyyy");
}

export { startOfDay, isSameDay, isSameMonth, format };
