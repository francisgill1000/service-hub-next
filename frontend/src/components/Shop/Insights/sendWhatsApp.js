// frontend/src/components/Shop/Insights/sendWhatsApp.js
//
// Single source of truth for sending WhatsApp reminders to shop customers.
// Token resolution, popup-block detection, bulk-send stagger, and
// "contacted today" persistence all live here.

export const DEFAULT_TEMPLATE =
  "Hi {name}, it's been a while since your last visit at {shop_name}. " +
  "We'd love to see you again — book your slot here: {shop_url}";

const templateKey  = (shopId) => `rezzy.insights.reminderTemplate.${shopId}`;
const contactedKey = (shopId) => `rezzy.insights.contactedToday.${shopId}`;

export function loadTemplate(shopId) {
  if (!shopId) return DEFAULT_TEMPLATE;
  try {
    return localStorage.getItem(templateKey(shopId)) || DEFAULT_TEMPLATE;
  } catch {
    return DEFAULT_TEMPLATE;
  }
}

export function saveTemplate(shopId, template) {
  if (!shopId) return;
  try {
    localStorage.setItem(templateKey(shopId), String(template ?? DEFAULT_TEMPLATE));
  } catch {}
}

// Returns a {id: iso} map of customers contacted today (auto-clears entries >24h old).
export function loadContactedToday(shopId) {
  if (!shopId) return {};
  try {
    const raw = localStorage.getItem(contactedKey(shopId));
    if (!raw) return {};
    const obj = JSON.parse(raw);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const cleaned = {};
    for (const [id, iso] of Object.entries(obj)) {
      if (new Date(iso).getTime() >= cutoff) cleaned[id] = iso;
    }
    return cleaned;
  } catch {
    return {};
  }
}

function markContacted(shopId, customerId) {
  if (!shopId || !customerId) return;
  try {
    const map = loadContactedToday(shopId);
    map[customerId] = new Date().toISOString();
    localStorage.setItem(contactedKey(shopId), JSON.stringify(map));
  } catch {}
}

// Replace {name}, {shop_name}, {shop_url}, {last_visit}, {total_visits}
export function resolveTemplate(template, { customer, shop }) {
  const tokens = {
    "{name}":          customer?.name || "there",
    "{shop_name}":     shop?.name || "us",
    "{shop_url}":      shop?.slug
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/detail/${shop.slug}`
      : (typeof window !== "undefined" ? window.location.origin : ""),
    "{last_visit}":    customer?.last_visit_date || "—",
    "{total_visits}":  String(customer?.bookings_count ?? 0),
  };
  let out = String(template || DEFAULT_TEMPLATE);
  for (const [k, v] of Object.entries(tokens)) {
    out = out.split(k).join(v);
  }
  return out;
}

function digitsOnly(s) {
  return String(s || "").replace(/\D/g, "");
}

// Build the wa.me URL for a customer (returns null if no phone digits).
export function waUrlFor(customer, message) {
  const num = digitsOnly(customer?.whatsapp_normalized || customer?.whatsapp);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

// Open WA for one customer. Returns { ok, reason }.
// reason ∈ "no_phone" | "popup_blocked" | "ok"
export function sendOne({ customer, template, shop }) {
  const message = resolveTemplate(template, { customer, shop });
  const url = waUrlFor(customer, message);
  if (!url) return { ok: false, reason: "no_phone" };
  const win = window.open(url, "_blank");
  if (!win) return { ok: false, reason: "popup_blocked" };
  markContacted(shop?.id, customer.id);
  return { ok: true, reason: "ok" };
}

// Bulk send with 400ms stagger so the browser doesn't treat us as popup spam.
// Returns a Promise<{ sent, skipped_no_phone, blocked }>.
export async function sendBulk({ customers, template, shop, staggerMs = 400 }) {
  const result = { sent: 0, skipped_no_phone: 0, blocked: 0 };
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const r = sendOne({ customer, template, shop });
    if (r.ok) result.sent += 1;
    else if (r.reason === "no_phone") result.skipped_no_phone += 1;
    else if (r.reason === "popup_blocked") result.blocked += 1;
    if (i < customers.length - 1) {
      await new Promise((res) => setTimeout(res, staggerMs));
    }
    // If the very first open was blocked, stop early — user needs to allow popups.
    if (i === 0 && r.reason === "popup_blocked") break;
  }
  return result;
}
