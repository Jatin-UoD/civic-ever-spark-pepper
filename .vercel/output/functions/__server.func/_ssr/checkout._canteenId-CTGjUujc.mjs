import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { S as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as placeOrder, d as getCart, g as inr, i as Shell, l as errMsg, m as getPulse, r as RequireUser, t as DemoBanner, w as saveCart } from "./canteen-ui-Bt8wlct1.mjs";
import { i as Route$4 } from "./router-CcejAGh6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/checkout._canteenId-CTGjUujc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CheckoutPage() {
	const { canteenId } = Route$4.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireUser, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckoutBody, { canteenId }) });
}
function CheckoutBody({ canteenId }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [coupon, setCoupon] = (0, import_react.useState)("");
	const [instructions, setInstructions] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	const idempotencyKey = (0, import_react.useMemo)(() => crypto.randomUUID(), []);
	const pulse = useQuery({
		queryKey: ["pulse", canteenId],
		queryFn: () => getPulse({ data: { canteenId } }),
		refetchInterval: 2e3
	});
	const cart = useQuery({
		queryKey: [
			"cart",
			canteenId,
			coupon,
			pulse.data?.catalogVersion
		],
		queryFn: () => getCart({ data: {
			canteenId,
			couponCode: coupon || null
		} })
	});
	const data = cart.data;
	async function rewrite(next) {
		try {
			await saveCart({ data: {
				canteenId,
				lines: next
			} });
			await queryClient.invalidateQueries({ queryKey: ["cart", canteenId] });
		} catch (error) {
			toast.error(errMsg(error));
		}
	}
	function asLines() {
		return (data?.lines ?? []).map((line) => ({
			itemId: line.itemId ?? void 0,
			comboId: line.comboId ?? void 0,
			variantId: line.variantId,
			addonIds: line.addonIds,
			qty: line.qty,
			instructions: line.instructions
		}));
	}
	async function pay() {
		if (!cart.data) return;
		setPending(true);
		try {
			const order = await placeOrder({ data: {
				canteenId,
				idempotencyKey,
				expectedTotalPaise: cart.data.totalPaise,
				couponCode: coupon || null,
				instructions,
				lines: cart.data.lines.map((line) => ({
					itemId: line.itemId ?? void 0,
					comboId: line.comboId ?? void 0,
					variantId: line.variantId,
					addonIds: line.addonIds,
					qty: line.qty,
					instructions: line.instructions,
					clientUnitPaise: line.unitPaise
				}))
			} });
			toast.success("demo" in order && order.demo ? "Order placed. Demo payment is next." : "Order placed.");
			await navigate({
				to: "/track/$orderId",
				params: { orderId: order.id }
			});
		} catch (error) {
			toast.error(errMsg(error));
			cart.refetch();
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		title: "Checkout",
		back: {
			href: `/menu/${canteenId}`,
			label: "Menu"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-semibold",
				children: "Checkout"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoBanner, {})
			}),
			!data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-muted",
				children: "Loading cart…"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						data.lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Your cart is empty." }) : null,
						data.lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
							className: "rounded-3xl border border-line bg-foam p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
										className: "font-semibold",
										children: [line.name, line.variantName ? ` · ${line.variantName}` : ""]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-muted",
										children: [
											line.qty,
											" × ",
											inr(line.unitPaise)
										]
									}),
									line.addons.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: line.addons.map((a) => a.name).join(", ")
									}) : null,
									line.problems.map((problem) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium text-chili",
										children: problem
									}, problem)),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex items-center gap-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "size-11 rounded-full border border-line text-lg",
												"aria-label": `Decrease ${line.name}`,
												onClick: () => {
													rewrite(asLines().flatMap((entry, index) => {
														if (data.lines[index]?.key !== line.key) return [entry];
														return entry.qty > 1 ? [{
															...entry,
															qty: entry.qty - 1
														}] : [];
													}));
												},
												children: "−"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold tabular-nums",
												children: line.qty
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: line.qty >= 10,
												className: "size-11 rounded-full bg-ink text-lg text-foam disabled:opacity-40",
												"aria-label": `Increase ${line.name}`,
												onClick: () => {
													rewrite(asLines().map((entry, index) => data.lines[index]?.key === line.key && entry.qty < 10 ? {
														...entry,
														qty: entry.qty + 1
													} : entry));
												},
												children: "+"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "text-sm font-semibold text-chili",
												onClick: () => void rewrite(asLines().filter((_, index) => data.lines[index]?.key !== line.key)),
												children: "Remove"
											})
										]
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "tabular-nums font-semibold",
									children: inr(line.linePaise)
								})]
							})
						}, line.key)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-medium",
							children: ["Note for the kitchen", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: instructions,
								onChange: (e) => setInstructions(e.target.value),
								maxLength: 140,
								className: "mt-1 w-full rounded-2xl border border-line bg-foam px-3 py-3"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "h-fit rounded-3xl border border-line bg-foam p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-medium",
							children: ["Coupon", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: coupon,
								onChange: (e) => setCoupon(e.target.value.toUpperCase()),
								placeholder: "WELCOME10",
								className: "mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3 uppercase"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-4 space-y-2 text-sm",
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
									className: "flex justify-between text-base font-semibold",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "tabular-nums",
										children: inr(data.totalPaise)
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted",
							children: [
								"~",
								data.etaMinutes,
								" min · ",
								data.ordersAhead,
								" orders ahead · approximate"
							]
						}),
						data.problems.map((problem) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm font-medium text-chili",
							children: problem
						}, problem)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: pending || data.blocked || data.lines.length === 0,
							onClick: () => void pay(),
							className: "mt-4 w-full rounded-full bg-chili py-3 font-semibold text-foam disabled:cursor-not-allowed disabled:bg-line disabled:text-muted",
							children: pending ? "Checking the kitchen…" : "Place order"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-muted",
							children: "The server rechecks availability, canteen status and price before the token is issued."
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { CheckoutPage as component };
