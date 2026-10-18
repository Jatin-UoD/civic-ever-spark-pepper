import { i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as StatusPill, g as inr, i as Shell, r as RequireUser, v as listMyOrders } from "./canteen-ui-Bt8wlct1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/history-DuKfBgCr.js
var import_jsx_runtime = require_jsx_runtime();
function HistoryPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireUser, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryBody, {}) });
}
function HistoryBody() {
	const orders = useQuery({
		queryKey: ["my-orders"],
		queryFn: () => listMyOrders(),
		refetchInterval: 5e3
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		title: "Your orders",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-4xl font-semibold",
			children: "Orders"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 space-y-3",
			children: [(orders.data ?? []).map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/track/$orderId",
				params: { orderId: order.id },
				className: "block rounded-3xl border border-line bg-foam p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-3xl font-semibold tabular-nums",
						children: ["#", order.token]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [order.canteenName, order.counterName ? ` · ${order.counterName}` : ""]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { value: order.status })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm tabular-nums",
					children: [
						inr(order.totalPaise),
						" · ",
						order.paymentStatus
					]
				})]
			}, order.id)), orders.data && orders.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: "No orders yet."
			}) : null]
		})]
	});
}
//#endregion
export { HistoryPage as component };
