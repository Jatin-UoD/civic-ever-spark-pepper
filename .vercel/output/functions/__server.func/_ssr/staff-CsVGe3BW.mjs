import { o as __toESM } from "../_runtime.mjs";
import { r as canOperateCanteen } from "./domain-BGTDNqbo.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as transitionOrder, D as setItemAvailability, E as setCounterActive, M as useMe, _ as listDirectory, a as StatusPill, f as getMenu, g as inr, i as Shell, l as errMsg, m as getPulse, r as RequireUser, s as cancelOrder, t as DemoBanner, x as pickupOrder, y as listQueue } from "./canteen-ui-Bt8wlct1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/staff-CsVGe3BW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StaffPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireUser, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaffBody, {}) });
}
function StaffBody() {
	const { me } = useMe();
	const canteens = (useQuery({
		queryKey: ["directory"],
		queryFn: () => listDirectory()
	}).data ?? []).filter((row) => me ? canOperateCanteen({
		userId: me.userId,
		memberships: me.memberships
	}, row.canteenId, row.institutionId, "staff") : false);
	const [canteenId, setCanteenId] = (0, import_react.useState)("");
	const activeId = canteenId || canteens[0]?.canteenId || "";
	const [tab, setTab] = (0, import_react.useState)("orders");
	const [code, setCode] = (0, import_react.useState)("");
	const queryClient = useQueryClient();
	const pulse = useQuery({
		queryKey: ["pulse", activeId],
		queryFn: () => getPulse({ data: { canteenId: activeId } }),
		enabled: Boolean(activeId),
		refetchInterval: 2e3
	});
	const queue = useQuery({
		queryKey: [
			"queue",
			activeId,
			pulse.data?.queueStamp
		],
		queryFn: () => listQueue({ data: { canteenId: activeId } }),
		enabled: Boolean(activeId) && pulse.data != null
	});
	const menu = useQuery({
		queryKey: [
			"menu",
			activeId,
			pulse.data?.catalogVersion,
			"staff"
		],
		queryFn: () => getMenu({ data: { canteenId: activeId } }),
		enabled: Boolean(activeId) && tab !== "orders"
	});
	async function run(task, ok) {
		try {
			await task;
			toast.success(ok);
			await queryClient.invalidateQueries({ queryKey: ["queue", activeId] });
			await queryClient.invalidateQueries({ queryKey: ["pulse", activeId] });
			await queryClient.invalidateQueries({ queryKey: ["menu", activeId] });
		} catch (error) {
			toast.error(errMsg(error));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		title: "Staff desk",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl font-semibold",
					children: "Service desk"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: activeId,
					onChange: (e) => setCanteenId(e.target.value),
					className: "rounded-full border border-line bg-foam px-4 py-3",
					"aria-label": "Canteen",
					children: canteens.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: row.canteenId,
						children: row.canteenName
					}, row.canteenId))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoBanner, {})
			}),
			canteens.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6",
				children: "This account is not assigned to a canteen desk."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex gap-2",
					children: [
						"orders",
						"menu",
						"counters"
					].map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setTab(name),
						className: `rounded-full px-4 py-2 text-sm font-semibold capitalize ${tab === name ? "bg-ink text-foam" : "bg-foam"}`,
						children: name === "menu" ? "Live menu" : name
					}, name))
				}),
				tab === "orders" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "flex gap-2",
							onSubmit: (event) => {
								event.preventDefault();
								run(pickupOrder({ data: {
									canteenId: activeId,
									code
								} }), "Pickup verified").then(() => setCode(""));
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: code,
								onChange: (e) => setCode(e.target.value),
								placeholder: "Scan or type token",
								className: "w-full rounded-full border border-line bg-foam px-4 py-3",
								"aria-label": "Pickup token"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "rounded-full bg-chili px-4 py-3 text-sm font-semibold text-foam",
								children: "Verify"
							})]
						}),
						(queue.data ?? []).map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-3xl border border-line bg-foam p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-display text-4xl font-semibold tabular-nums",
										children: ["#", order.token]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-muted",
										children: [
											order.customerName,
											" · ",
											order.counterName,
											" · ",
											order.paymentStatus
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { value: order.status })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-2 text-sm",
									children: order.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
										item.qty,
										" × ",
										item.name
									] }, item.name))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-sm text-muted",
									children: [
										order.ordersAhead,
										" ahead · ~",
										order.etaMinutes,
										" min · approximate · ",
										inr(order.totalPaise)
									]
								}),
								order.instructions ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm",
									children: ["Note: ", order.instructions]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 grid gap-2 sm:grid-cols-2",
									children: [
										order.status === "PAYMENT_CONFIRMED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Big, {
											onClick: () => void run(transitionOrder({ data: {
												orderId: order.id,
												to: "ACCEPTED"
											} }), "Accepted"),
											children: "Accept"
										}) : null,
										order.status === "ACCEPTED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Big, {
											onClick: () => void run(transitionOrder({ data: {
												orderId: order.id,
												to: "PREPARING"
											} }), "Preparing"),
											children: "Start preparing"
										}) : null,
										order.status === "PREPARING" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Big, {
											onClick: () => void run(transitionOrder({ data: {
												orderId: order.id,
												to: "READY_FOR_PICKUP"
											} }), "Ready"),
											children: "Mark ready"
										}) : null,
										order.status === "READY_FOR_PICKUP" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Big, {
											onClick: () => void run(pickupOrder({ data: {
												canteenId: activeId,
												code: order.token
											} }), "Picked up"),
											children: "Picked up"
										}) : null,
										order.status === "PAYMENT_CONFIRMED" || order.status === "ACCEPTED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "min-h-12 rounded-2xl border border-line px-4 py-3 text-sm font-semibold text-chili",
											onClick: () => void run(cancelOrder({ data: {
												orderId: order.id,
												reason: "Cancelled by the kitchen"
											} }), "Cancelled. Paid orders are refunded."),
											children: "Cancel"
										}) : null
									]
								})
							]
						}, order.id)),
						queue.data && queue.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted",
							children: "No paid orders in the queue."
						}) : null
					]
				}) : null,
				tab === "menu" && menu.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-2",
					children: menu.data.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3 rounded-2xl border border-line bg-foam px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: item.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: item.availability
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": item.availability === "AVAILABLE",
							className: `min-h-12 min-w-28 rounded-full px-4 text-sm font-semibold ${item.availability === "AVAILABLE" ? "bg-leaf text-foam" : "bg-chili text-foam"}`,
							onClick: () => void run(setItemAvailability({ data: {
								itemId: item.id,
								availability: item.availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE"
							} }), item.availability === "AVAILABLE" ? "Turned off" : "Back on"),
							children: item.availability === "AVAILABLE" ? "On" : "Off"
						})]
					}, item.id))
				}) : null,
				tab === "counters" && menu.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-2",
					children: menu.data.counters.map((counter) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between rounded-2xl border border-line bg-foam px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: counter.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: counter.lane
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `min-h-12 rounded-full px-4 text-sm font-semibold ${counter.active ? "bg-leaf text-foam" : "bg-line"}`,
							onClick: () => void run(setCounterActive({ data: {
								counterId: counter.id,
								active: !counter.active
							} }), counter.active ? "Counter paused" : "Counter open"),
							children: counter.active ? "Active" : "Paused"
						})]
					}, counter.id))
				}) : null
			] })
		]
	});
}
function Big({ children, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "min-h-12 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-foam",
		children
	});
}
//#endregion
export { StaffPage as component };
