import { o as __toESM } from "../_runtime.mjs";
import { l as lineKey } from "./domain-BGTDNqbo.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as StatusPill, d as getCart, f as getMenu, g as inr, i as Shell, l as errMsg, m as getPulse, n as DietMark, r as RequireUser, t as DemoBanner, w as saveCart } from "./canteen-ui-Bt8wlct1.mjs";
import { r as Route$3 } from "./router-CcejAGh6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/menu._canteenId-DzEPNhFx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MenuPage() {
	const { canteenId } = Route$3.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireUser, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuBody, { canteenId }) });
}
function MenuBody({ canteenId }) {
	const queryClient = useQueryClient();
	const [search, setSearch] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("all");
	const [vegOnly, setVegOnly] = (0, import_react.useState)(false);
	const [picked, setPicked] = (0, import_react.useState)({});
	const pulse = useQuery({
		queryKey: ["pulse", canteenId],
		queryFn: () => getPulse({ data: { canteenId } }),
		refetchInterval: 2e3
	});
	const menu = useQuery({
		queryKey: [
			"menu",
			canteenId,
			pulse.data?.catalogVersion
		],
		queryFn: () => getMenu({ data: { canteenId } }),
		enabled: pulse.data != null
	});
	const cart = useQuery({
		queryKey: [
			"cart",
			canteenId,
			pulse.data?.catalogVersion
		],
		queryFn: () => getCart({ data: {
			canteenId,
			couponCode: null
		} }),
		enabled: pulse.data != null
	});
	const items = (0, import_react.useMemo)(() => {
		const needle = search.trim().toLowerCase();
		return (menu.data?.items ?? []).filter((item) => {
			if (category !== "all" && item.categoryId !== category) return false;
			if (vegOnly && item.diet !== "veg") return false;
			if (!needle) return true;
			return `${item.name} ${item.description}`.toLowerCase().includes(needle);
		});
	}, [
		menu.data,
		search,
		category,
		vegOnly
	]);
	async function write(lines) {
		try {
			await saveCart({ data: {
				canteenId,
				lines
			} });
			await queryClient.invalidateQueries({ queryKey: ["cart", canteenId] });
		} catch (error) {
			toast.error(errMsg(error));
		}
	}
	function currentLines() {
		return (cart.data?.lines ?? []).map((line) => ({
			itemId: line.itemId ?? void 0,
			comboId: line.comboId ?? void 0,
			variantId: line.variantId,
			addonIds: line.addonIds,
			qty: line.qty,
			instructions: line.instructions
		}));
	}
	function selection(item) {
		const current = picked[item.id];
		return {
			variantId: current?.variantId ?? item.variants.find((v) => v.available)?.id,
			addonIds: current?.addonIds ?? []
		};
	}
	function unitOf(item) {
		if (item.basePricePaise == null) return null;
		const sel = selection(item);
		const variant = item.variants.find((v) => v.id === sel.variantId);
		const addons = item.addons.filter((a) => sel.addonIds.includes(a.id) && a.available);
		return Math.max(0, item.basePricePaise - item.discountPaise + (variant?.priceDeltaPaise ?? 0) + addons.reduce((s, a) => s + a.pricePaise, 0));
	}
	const closed = menu.data && menu.data.canteen.status !== "OPEN";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		title: menu.data?.canteen.name,
		back: {
			href: "/browse",
			label: "All canteens"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-semibold uppercase tracking-widest text-muted",
					children: [
						menu.data?.canteen.institutionName,
						" · ",
						menu.data?.canteen.campusName,
						menu.data?.canteen.isDemo ? " · Demo" : ""
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl font-semibold",
					children: menu.data?.canteen.name ?? "Menu"
				})] }), menu.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { value: menu.data.canteen.status }) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted",
				children: menu.data?.canteen.description
			}),
			closed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 rounded-2xl bg-chili/10 px-4 py-3 text-sm font-medium text-chili",
				role: "status",
				children: menu.data?.canteen.status === "PAUSED" ? "This canteen is paused. New orders are not accepted." : "This canteen is closed. New orders are not accepted."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoBanner, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-3 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: search,
					onChange: (e) => setSearch(e.target.value),
					placeholder: "Search the menu",
					className: "w-full rounded-full border border-line bg-foam px-4 py-3"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": vegOnly,
					onClick: () => setVegOnly((v) => !v),
					className: `shrink-0 whitespace-nowrap rounded-full px-4 py-3 text-sm font-semibold ${vegOnly ? "bg-leaf text-foam" : "border border-line bg-foam"}`,
					children: "Veg only"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-2 overflow-x-auto pb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setCategory("all"),
					className: `shrink-0 rounded-full px-3 py-2 text-sm ${category === "all" ? "bg-ink text-foam" : "bg-foam"}`,
					children: "All"
				}), (menu.data?.categories ?? []).map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setCategory(cat.id),
					className: `shrink-0 rounded-full px-3 py-2 text-sm ${category === cat.id ? "bg-ink text-foam" : "bg-foam"}`,
					children: cat.name
				}, cat.id))]
			}),
			(menu.data?.combos.length ?? 0) > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid gap-3 md:grid-cols-2",
				children: menu.data?.combos.map((combo) => {
					const off = combo.availability !== "AVAILABLE" || closed;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "flex gap-3 rounded-3xl border border-line bg-foam p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: combo.imageUrl ?? "/menu/kulcha.jpg",
							alt: "",
							className: "size-24 rounded-2xl object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DietMark, { diet: "veg" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "font-semibold",
											children: combo.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted",
											children: "Demo combo"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: combo.description
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm tabular-nums",
									children: [
										inr(combo.pricePaise),
										" · ",
										combo.prepMinutes,
										" min"
									]
								}),
								off ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { value: combo.availability === "AVAILABLE" ? "UNAVAILABLE" : combo.availability }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "mt-2 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-foam",
									onClick: () => void write([...currentLines(), {
										comboId: combo.id,
										qty: 1,
										addonIds: []
									}]),
									children: "Add combo"
								})
							]
						})]
					}, combo.id);
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: items.map((item) => {
					const sel = selection(item);
					const price = unitOf(item);
					const off = item.availability !== "AVAILABLE" || price == null || closed;
					const cartLine = cart.data?.lines.find((line) => line.itemId === item.id && line.variantId === (sel.variantId ?? null) && [...line.addonIds].sort().join() === [...sel.addonIds].sort().join());
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "overflow-hidden rounded-3xl border border-line bg-foam",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: item.imageUrl ?? "/menu/fries.jpg",
							alt: item.name,
							className: "h-40 w-full object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DietMark, { diet: item.diet }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-semibold leading-tight",
										children: item.name
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: item.description
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm tabular-nums",
									children: [
										price == null ? "Price not set" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [item.discountPaise > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mr-2 text-muted line-through",
											children: inr((item.basePricePaise ?? 0) + (item.variants.find((v) => v.id === sel.variantId)?.priceDeltaPaise ?? 0))
										}) : null, inr(price)] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted",
											children: [
												" · ",
												item.prepMinutes,
												" min"
											]
										}),
										item.isDemo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted",
											children: " · Demo"
										}) : null
									]
								}),
								item.availability !== "AVAILABLE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { value: item.availability }) : null,
								item.variants.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-2",
									children: item.variants.map((variant) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										disabled: !variant.available,
										onClick: () => setPicked((prev) => ({
											...prev,
											[item.id]: {
												variantId: variant.id,
												addonIds: sel.addonIds
											}
										})),
										className: `rounded-full px-3 py-1 text-sm ${sel.variantId === variant.id ? "bg-ink text-foam" : "border border-line"} disabled:opacity-40`,
										children: [
											variant.name,
											" ",
											variant.priceDeltaPaise ? `+${inr(variant.priceDeltaPaise)}` : ""
										]
									}, variant.id))
								}) : null,
								item.addons.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-2",
									children: item.addons.map((addon) => {
										const on = sel.addonIds.includes(addon.id);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											disabled: !addon.available || off,
											"aria-pressed": on,
											onClick: () => {
												const addonIds = on ? sel.addonIds.filter((id) => id !== addon.id) : [...sel.addonIds, addon.id];
												setPicked((prev) => ({
													...prev,
													[item.id]: {
														variantId: sel.variantId,
														addonIds
													}
												}));
											},
											className: `rounded-full px-3 py-1 text-sm ${on ? "bg-chili text-foam" : "border border-line"} disabled:opacity-40`,
											children: [
												addon.name,
												" +",
												inr(addon.pricePaise)
											]
										}, addon.id);
									})
								}) : null,
								cartLine && !off ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "size-11 rounded-full border border-line text-lg",
											"aria-label": `Decrease ${item.name}`,
											onClick: () => {
												write(currentLines().flatMap((line) => {
													if (lineKey(line) !== cartLine.key) return [line];
													return line.qty > 1 ? [{
														...line,
														qty: line.qty - 1
													}] : [];
												}));
											},
											children: "−"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums font-semibold",
											children: cartLine.qty
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "size-11 rounded-full bg-ink text-lg text-foam",
											"aria-label": `Increase ${item.name}`,
											onClick: () => {
												write(currentLines().map((line) => lineKey(line) === cartLine.key ? {
													...line,
													qty: line.qty + 1
												} : line));
											},
											children: "+"
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: Boolean(off),
									className: "w-full rounded-full bg-chili py-3 text-sm font-semibold text-foam disabled:cursor-not-allowed disabled:bg-line disabled:text-muted",
									onClick: () => void write([...currentLines(), {
										itemId: item.id,
										variantId: sel.variantId ?? null,
										addonIds: sel.addonIds,
										qty: 1
									}]),
									children: price == null ? "Not for sale" : off ? "Unavailable" : "Add"
								})
							]
						})]
					}, item.id);
				})
			}),
			menu.data && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 text-muted",
				children: "Nothing on this menu matches that filter."
			}) : null,
			cart.data && cart.data.lines.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-foam p-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-semibold tabular-nums",
							children: [
								cart.data.lines.reduce((s, l) => s + l.qty, 0),
								" items · ",
								inr(cart.data.totalPaise)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								"~",
								cart.data.etaMinutes,
								" min · ",
								cart.data.ordersAhead,
								" ahead · approximate"
							]
						}),
						cart.data.blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium text-chili",
							children: cart.data.problems[0]
						}) : null
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/checkout/$canteenId",
						params: { canteenId },
						className: "rounded-full bg-ink px-5 py-3 text-sm font-semibold text-foam",
						children: "View cart"
					})]
				})
			}) : null
		]
	});
}
//#endregion
export { MenuPage as component };
