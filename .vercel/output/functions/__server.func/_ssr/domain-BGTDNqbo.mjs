import { r as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/domain-BGTDNqbo.js
var domain_BGTDNqbo_exports = /* @__PURE__ */ __exportAll({
	a: () => domain_exports,
	c: () => isSuper,
	d: () => requestHash,
	f: () => unitPaise,
	i: () => couponDiscount,
	l: () => lineKey,
	n: () => STATUS_LABEL,
	o: () => estimateWait,
	r: () => canOperateCanteen,
	s: () => friendlyError,
	t: () => CanteenError,
	u: () => rateLimit
});
var domain_exports = /* @__PURE__ */ __exportAll$1({
	CanteenError: () => CanteenError,
	PACKING_PAISE: () => 500,
	STATUS_LABEL: () => STATUS_LABEL,
	canOperateCanteen: () => canOperateCanteen,
	couponDiscount: () => couponDiscount,
	estimateWait: () => estimateWait,
	friendlyError: () => friendlyError,
	isSuper: () => isSuper,
	lineKey: () => lineKey,
	rateLimit: () => rateLimit,
	requestHash: () => requestHash,
	unitPaise: () => unitPaise,
	verifyHmacSha256: () => verifyHmacSha256
});
var CanteenError = class extends Error {
	code;
	constructor(code, message) {
		super(`[${code}] ${message}`);
		this.code = code;
		this.name = "CanteenError";
	}
};
function friendlyError(message) {
	return message.replace(/^\[[A-Z0-9_]+\]\s*/, "");
}
function lineKey(line) {
	const addons = [...line.addonIds ?? []].sort().join(",");
	return [
		line.comboId ?? "",
		line.itemId ?? "",
		line.variantId ?? "",
		addons,
		(line.instructions ?? "").trim()
	].join("|");
}
function requestHash(canteenId, lines, coupon) {
	const norm = lines.map((line) => ({
		itemId: line.itemId ?? null,
		comboId: line.comboId ?? null,
		variantId: line.variantId ?? null,
		addonIds: [...line.addonIds ?? []].sort(),
		qty: line.qty,
		instructions: (line.instructions ?? "").trim()
	})).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
	return JSON.stringify({
		canteenId,
		coupon: coupon ? coupon.toUpperCase() : null,
		norm
	});
}
function unitPaise(base, discount, variantDelta, addonSum) {
	return Math.max(0, base - discount + variantDelta + addonSum);
}
function couponDiscount(subtotal, coupon) {
	if (!coupon || subtotal < coupon.minPaise) return 0;
	if (coupon.kind === "PERCENT") return Math.min(subtotal, Math.floor(subtotal * coupon.value / 100));
	return Math.min(subtotal, coupon.value);
}
/** Approximate wait from orders ahead, this ticket's prep, and kitchen capacity. */
function estimateWait(ordersAhead, prepMinutes, capacity) {
	const queue = Math.ceil(Math.max(0, ordersAhead) / Math.max(1, capacity)) * 4;
	return Math.max(prepMinutes, queue + prepMinutes);
}
function isSuper(actor) {
	return actor.memberships.some((m) => m.active && m.role === "SUPER_ADMIN");
}
function canOperateCanteen(actor, canteenId, institutionId, level) {
	if (isSuper(actor)) return true;
	if (actor.memberships.some((m) => m.active && m.role === "INSTITUTION_ADMIN" && m.institutionId === institutionId)) return true;
	const roles = level === "admin" ? ["CANTEEN_ADMIN"] : ["CANTEEN_ADMIN", "STAFF"];
	return actor.memberships.some((m) => m.active && roles.includes(m.role) && m.canteenId === canteenId);
}
var buckets = /* @__PURE__ */ new Map();
function rateLimit(key, limit, windowMs) {
	const now = Date.now();
	const bucket = buckets.get(key);
	if (!bucket || now - bucket.t > windowMs) {
		buckets.set(key, {
			n: 1,
			t: now
		});
		return;
	}
	if (bucket.n >= limit) throw new CanteenError("RATE_LIMIT", "Too many requests. Wait a moment and try again.");
	bucket.n += 1;
}
async function verifyHmacSha256(secret, raw, signature) {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey("raw", enc.encode(secret), {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["sign"]);
	const mac = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
	const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
	if (hex.length !== signature.length) return false;
	let diff = 0;
	for (let i = 0; i < hex.length; i += 1) diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
	return diff === 0;
}
var STATUS_LABEL = {
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
	HIDDEN: "Hidden"
};
//#endregion
export { domain_BGTDNqbo_exports as a, isSuper as c, requestHash as d, unitPaise as f, couponDiscount as i, lineKey as l, STATUS_LABEL as n, estimateWait as o, canOperateCanteen as r, friendlyError as s, CanteenError as t, rateLimit as u };
