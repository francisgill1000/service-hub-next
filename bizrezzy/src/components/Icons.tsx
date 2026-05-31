type P = { size?: number };
const base = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
};

export const Icons = {
  Home: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
  ),
  Calendar: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
  ),
  Heart: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M12 21s-7-4.5-9.5-9A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>
  ),
  HeartFilled: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></svg>
  ),
  MapPin: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M12 22s-7-7.6-7-13a7 7 0 0 1 14 0c0 5.4-7 13-7 13z" /><circle cx="12" cy="9" r="2.5" /></svg>
  ),
  User: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
  ),
  Search: ({ size = 18 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
  ),
  Locate: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
  ),
  Chevron: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M9 6l6 6-6 6" /></svg>
  ),
  ChevronLeft: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M15 6l-6 6 6 6" /></svg>
  ),
  Clock: ({ size = 14 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  Check: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>
  ),
  Logout: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
  ),
  WhatsApp: ({ size = 20 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.3-.9-2.8-1.2-4.5-4-4.7-4.2-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6c-.2.2-.3.4-.1.6.2.4.9 1.4 1.9 2.2 1.2 1.1 2.1 1.4 2.4 1.5.2.1.4.1.5-.1l.7-.9c.2-.2.4-.2.6-.1l1.9.9c.3.1.5.2.5.4.1.2.1.8-.1 1.4z" /></svg>
  ),
  Store: ({ size = 28 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></svg>
  ),
  Bell: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
  ),
  Grid: ({ size = 22 }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
  ),
};
