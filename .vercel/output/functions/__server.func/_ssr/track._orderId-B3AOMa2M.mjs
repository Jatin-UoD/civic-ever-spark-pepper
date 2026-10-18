import { o as __toESM } from "../_runtime.mjs";
import { n as STATUS_LABEL } from "./domain-BGTDNqbo.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { r as Star } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { O as settleDemoPayment, a as StatusPill, g as inr, i as Shell, l as errMsg, o as addReview, p as getOrder, r as RequireUser, s as cancelOrder } from "./canteen-ui-Bt8wlct1.mjs";
import { n as Route$2 } from "./router-CcejAGh6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/track._orderId-B3AOMa2M.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TrackPage() {
	const { orderId } = Route$2.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireUser, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackBody, { orderId }) });
}
function TrackBody({ orderId }) {
	const queryClient = useQueryClient();
	const [rating, setRating] = (0, import_react.useState)(5);
	const [comment, setComment] = (0, import_react.useState)("");
	const data = useQuery({
		queryKey: ["order", orderId],
		queryFn: () => getOrder({ data: { orderId } }),
		refetchInterval: 2e3
	}).data;
	async function settle(outcome) {
		try {
			await settleDemoPayment({ data: {
				orderId,
				outcome
			} });
			toast.success(outcome === "PAID" ? "Demo payment confirmed." : "Demo payment failed. Nothing was captured.");
			await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
		} catch (error) {
			toast.error(errMsg(error));
			await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
		title: "Live order",
		back: {
			href: "/history",
			label: "All orders"
		},
		children: !data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted",
			children: "Loading token…"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[1.1fr_0.9fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-semibold uppercase tracking-widest text-muted",
						children: [
							data.institutionName,
							" · ",
							data.canteenName
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "font-display text-5xl font-semibold tabular-nums",
						children: ["#", data.token]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-lg",
						children: [
							STATUS_LABEL[data.status] ?? data.status,
							data.status !== "CANCELLED" && data.status !== "PICKED_UP" ? ` · ${data.ordersAhead} ahead · ~${data.etaMinutes} min` : "",
							data.counterName ? ` · ${data.counterName}` : ""
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Wait is approximate and updates with the queue."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { value: data.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { value: data.paymentStatus })]
					}),
					data.status === "PLACED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-3xl border border-line bg-foam p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "Demo payment"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "No card data is collected. A real Razorpay webhook would confirm this instead."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "rounded-full bg-chili px-4 py-3 text-sm font-semibold text-foam",
									onClick: () => void settle("PAID"),
									children: ["Pay ", inr(data.totalPaise)]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "rounded-full border border-line px-4 py-3 text-sm font-semibold",
									onClick: () => void settle("FAILED"),
									children: "Simulate failure"
								})]
							})
						]
					}) : null,
					data.customer && [
						"PLACED",
						"PAYMENT_CONFIRMED",
						"ACCEPTED"
					].includes(data.status) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-3 text-sm font-semibold text-chili",
						onClick: () => {
							cancelOrder({ data: {
								orderId,
								reason: "Cancelled by customer"
							} }).then(() => queryClient.invalidateQueries({ queryKey: ["order", orderId] })).catch((error) => toast.error(errMsg(error)));
						},
						children: "Cancel order"
					}) : null,
					data.cancelReason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-chili",
						children: data.cancelReason
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-6 space-y-2",
						children: data.history.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-sm text-muted",
							children: [STATUS_LABEL[entry.to] ?? entry.to, entry.note ? ` · ${entry.note}` : ""]
						}, `${entry.to}-${index}`))
					}),
					data.status === "PICKED_UP" && data.customer && !data.review ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-6 rounded-3xl border border-line bg-foam p-4",
						onSubmit: (event) => {
							event.preventDefault();
							addReview({ data: {
								orderId,
								rating,
								comment
							} }).then(() => queryClient.invalidateQueries({ queryKey: ["order", orderId] })).catch((error) => toast.error(errMsg(error)));
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "Rate the order"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex gap-1",
								role: "group",
								"aria-label": "Rating",
								children: [
									1,
									2,
									3,
									4,
									5
								].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": `${value} star${value === 1 ? "" : "s"}`,
									"aria-pressed": rating === value,
									onClick: () => setRating(value),
									className: "grid size-11 place-items-center rounded-full",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `size-6 ${value <= rating ? "fill-chili text-chili" : "text-line"}` })
								}, value))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: comment,
								onChange: (e) => setComment(e.target.value),
								placeholder: "How was the counter?",
								className: "mt-2 w-full rounded-2xl border border-line px-3 py-2"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "mt-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam",
								children: "Save review"
							})
						]
					}) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "receipt rounded-3xl border border-line bg-foam p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl font-semibold",
								children: "Receipt"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: data.institutionName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									data.campusName,
									" · ",
									data.canteenName
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "no-print flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "rounded-full border border-line px-3 py-2 text-sm",
								onClick: () => window.print(),
								children: "Print"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "rounded-full border border-line px-3 py-2 text-sm",
								onClick: () => {
									const blob = new Blob([[
										data.institutionName,
										`${data.campusName} · ${data.canteenName}`,
										`Order ${data.id}`,
										`Token ${data.token}`,
										data.placedAt,
										...data.items.map((item) => `${item.qty} x ${item.name}  ${inr(item.linePaise)}`),
										`Packing ${inr(data.chargesPaise)}`,
										`Discount ${inr(data.discountPaise)}`,
										`Total ${inr(data.totalPaise)}`,
										`Payment ${data.paymentStatus}`,
										`Counter ${data.counterName ?? ""}`
									].join("\n")], { type: "text/plain" });
									const url = URL.createObjectURL(blob);
									const a = document.createElement("a");
									a.href = url;
									a.download = `${data.token}.txt`;
									a.click();
									URL.revokeObjectURL(url);
								},
								children: "Download"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm",
						children: [
							"Order ",
							data.id,
							" · Token ",
							data.token
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: new Date(data.placedAt).toLocaleString("en-IN")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-2 text-sm",
						children: data.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								item.qty,
								" × ",
								item.name
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: inr(item.linePaise)
							})]
						}, item.name))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-4 space-y-1 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Items" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "tabular-nums",
									children: inr(data.subtotalPaise)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Packing" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "tabular-nums",
									children: inr(data.chargesPaise)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Discount" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
									className: "tabular-nums",
									children: ["−", inr(data.discountPaise)]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "tabular-nums",
									children: inr(data.totalPaise)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Payment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: data.paymentStatus })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						dangerouslySetInnerHTML: { __html: data.qrSvg }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							"Show this QR at ",
							data.counterName ?? "the counter",
							"."
						]
					})
				]
			})]
		})
	});
}
//#endregion
export { TrackPage as component };
