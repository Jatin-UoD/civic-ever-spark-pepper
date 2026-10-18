export const PACKING_PAISE = 500;

export type Role =
  | "CUSTOMER"
  | "STAFF"
  | "CANTEEN_ADMIN"
  | "INSTITUTION_ADMIN"
  | "SUPER_ADMIN";

export type Availability = "AVAILABLE" | "UNAVAILABLE" | "SOLD_OUT" | "HIDDEN";

export type Membership = {
  role: Role;
  institutionId: string | null;
  canteenId: string | null;
  active: boolean;
};

export type Actor = { userId: string; memberships: Membership[] };

export type CartLine = {
  itemId?: string;
  comboId?: string;
  variantId?: string | null;
  addonIds?: string[];
  qty: number;
  instructions?: string;
};

export class CanteenError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(`[${code}] ${message}`);
    this.code = code;
    this.name = "CanteenError";
  }
}

export function friendlyError(message: string): string {
  return message.replace(/^\[[A-Z0-9_]+\]\s*/, "");
}

export function lineKey(line: CartLine): string {
  const addons = [...(line.addonIds ?? [])].sort().join(",");
  return [
    line.comboId ?? "",
    line.itemId ?? "",
    line.variantId ?? "",
    addons,
    (line.instructions ?? "").trim(),
  ].join("|");
}

export function requestHash(canteenId: string, lines: CartLine[], coupon: string | null): string {
  const norm = lines
    .map((line) => ({
      itemId: line.itemId ?? null,
      comboId: line.comboId ?? null,
      variantId: line.variantId ?? null,
      addonIds: [...(line.addonIds ?? [])].sort(),
      qty: line.qty,
      instructions: (line.instructions ?? "").trim(),
    }))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return JSON.stringify({ canteenId, coupon: coupon ? coupon.toUpperCase() : null, norm });
}

export function unitPaise(
  base: number,
  discount: number,
  variantDelta: number,
  addonSum: number,
): number {
  return Math.max(0, base - discount + variantDelta + addonSum);
}

export function couponDiscount(
  subtotal: number,
  coupon: { kind: "PERCENT" | "FLAT"; value: number; minPaise: number } | null,
): number {
  if (!coupon || subtotal < coupon.minPaise) return 0;
  if (coupon.kind === "PERCENT") return Math.min(subtotal, Math.floor((subtotal * coupon.value) / 100));
  return Math.min(subtotal, coupon.value);
}

/** Approximate wait from orders ahead, this ticket's prep, and kitchen capacity. */
export function estimateWait(ordersAhead: number, prepMinutes: number, capacity: number): number {
  const cap = Math.max(1, capacity);
  const queue = Math.ceil(Math.max(0, ordersAhead) / cap) * 4;
  return Math.max(prepMinutes, queue + prepMinutes);
}

export function isSuper(actor: Actor): boolean {
  return actor.memberships.some((m) => m.active && m.role === "SUPER_ADMIN");
}

export function canOperateCanteen(
  actor: Actor,
  canteenId: string,
  institutionId: string,
  level: "staff" | "admin",
): boolean {
  if (isSuper(actor)) return true;
  const inst = actor.memberships.some(
    (m) => m.active && m.role === "INSTITUTION_ADMIN" && m.institutionId === institutionId,
  );
  if (inst) return true;
  const roles = level === "admin" ? ["CANTEEN_ADMIN"] : ["CANTEEN_ADMIN", "STAFF"];
  return actor.memberships.some(
    (m) => m.active && roles.includes(m.role) && m.canteenId === canteenId,
  );
}

const buckets = new Map<string, { n: number; t: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.t > windowMs) {
    buckets.set(key, { n: 1, t: now });
    return;
  }
  if (bucket.n >= limit) {
    throw new CanteenError("RATE_LIMIT", "Too many requests. Wait a moment and try again.");
  }
  bucket.n += 1;
}

export function resetRateLimits(): void {
  buckets.clear();
}

export async function verifyHmacSha256(secret: string, raw: string, signature: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i += 1) diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

export const STATUS_LABEL: Record<string, string> = {
  PLACED: "Placed",
  PAYMENT_CONFIRMED: "Paid",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "Picked up",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
  PROCESSING: "Processing",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  OPEN: "Open",
  CLOSED: "Closed",
  PAUSED: "Paused",
  AVAILABLE: "Available",
  UNAVAILABLE: "Unavailable",
  SOLD_OUT: "Sold out",
  HIDDEN: "Hidden",
};

export function availabilityLabel(availability: string): string {
  if (availability === "SOLD_OUT") return "Sold out";
  if (availability === "UNAVAILABLE") return "Unavailable";
  if (availability === "HIDDEN") return "Hidden";
  return "Available";
}
