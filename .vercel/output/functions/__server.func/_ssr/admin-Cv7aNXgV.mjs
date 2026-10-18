import { o as __toESM } from "../_runtime.mjs";
import { r as canOperateCanteen } from "./domain-BGTDNqbo.mjs";
import { a as require_react, i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as setItemAvailability, M as useMe, _ as listDirectory, b as listStaff, c as createItem, f as getMenu, g as inr, h as grantRole, i as Shell, j as updateItem, l as errMsg, r as RequireUser, t as DemoBanner } from "./canteen-ui-Bt8wlct1.mjs";
import { t as AnalyticsPanel } from "./analytics-panel-Dn_grJlL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-Cv7aNXgV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireUser, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminBody, {}) });
}
function AdminBody() {
	const { me } = useMe();
	const canteens = (useQuery({
		queryKey: ["directory"],
		queryFn: () => listDirectory()
	}).data ?? []).filter((row) => me ? canOperateCanteen({
		userId: me.userId,
		memberships: me.memberships
	}, row.canteenId, row.institutionId, "admin") : false);
	const [canteenId, setCanteenId] = (0, import_react.useState)("");
	const activeId = canteenId || canteens[0]?.canteenId || "";
	const menu = useQuery({
		queryKey: [
			"menu",
			activeId,
			"admin"
		],
		queryFn: () => getMenu({ data: { canteenId: activeId } }),
		enabled: Boolean(activeId)
	});
	const staff = useQuery({
		queryKey: ["staff", activeId],
		queryFn: () => listStaff({ data: { canteenId: activeId } }),
		enabled: Boolean(activeId)
	});
	const queryClient = useQueryClient();
	const [name, setName] = (0, import_react.useState)("");
	const [price, setPrice] = (0, import_react.useState)("40");
	const [email, setEmail] = (0, import_react.useState)("");
	async function saved(task, message) {
		try {
			await task;
			toast.success(message);
			await queryClient.invalidateQueries({ queryKey: ["menu", activeId] });
			await queryClient.invalidateQueries({ queryKey: ["staff", activeId] });
		} catch (error) {
			toast.error(errMsg(error));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		title: "Canteen admin",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl font-semibold",
					children: "Menu & counter"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					"aria-label": "Canteen",
					value: activeId,
					onChange: (e) => setCanteenId(e.target.value),
					className: "rounded-full border border-line bg-foam px-4 py-3",
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
				children: "Canteen admin tools are not on this account."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [(menu.data?.items ?? []).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemRow, {
						item,
						onSave: (patch) => saved(updateItem({ data: {
							itemId: item.id,
							...patch
						} }), "Saved"),
						onToggle: (availability) => saved(setItemAvailability({ data: {
							itemId: item.id,
							availability
						} }), "Availability updated")
					}, item.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "rounded-3xl border border-dashed border-line p-4",
						onSubmit: (event) => {
							event.preventDefault();
							const categoryId = menu.data?.categories[0]?.id;
							if (!categoryId) return;
							saved(createItem({ data: {
								canteenId: activeId,
								categoryId,
								name,
								basePricePaise: Math.round(Number(price) * 100),
								prepMinutes: 8,
								diet: "veg"
							} }), "Item added").then(() => setName(""));
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: "Add an item"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "Name",
									className: "rounded-2xl border border-line px-3 py-3",
									required: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: price,
									onChange: (e) => setPrice(e.target.value),
									inputMode: "decimal",
									"aria-label": "Price in rupees",
									className: "w-28 rounded-2xl border border-line px-3 py-3"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "rounded-full bg-ink px-4 py-3 text-sm font-semibold text-foam",
									children: "Add"
								})
							]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [activeId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsPanel, { canteenId: activeId }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-3xl border border-line bg-foam p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl font-semibold",
								children: "Staff"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 space-y-1 text-sm",
								children: (staff.data ?? []).map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									person.name,
									" · ",
									person.role,
									" · ",
									person.email
								] }, person.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "mt-3 flex gap-2",
								onSubmit: (event) => {
									event.preventDefault();
									saved(grantRole({ data: {
										email,
										role: "STAFF",
										canteenId: activeId,
										institutionId: null
									} }), "Staff added");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "email",
									value: email,
									onChange: (e) => setEmail(e.target.value),
									placeholder: "Email of an existing account",
									className: "w-full rounded-2xl border border-line px-3 py-3",
									required: true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "rounded-full bg-chili px-4 text-sm font-semibold text-foam",
									children: "Invite"
								})]
							})
						]
					})]
				})]
			})
		]
	});
}
function ItemRow({ item, onSave, onToggle }) {
	const [price, setPrice] = (0, import_react.useState)(item.basePricePaise == null ? "" : String(item.basePricePaise / 100));
	const [discount, setDiscount] = (0, import_react.useState)(String(item.discountPaise / 100));
	const [prep, setPrep] = (0, import_react.useState)(String(item.prepMinutes));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "rounded-3xl border border-line bg-foam p-4",
		onSubmit: (event) => {
			event.preventDefault();
			onSave({
				name: item.name,
				description: item.description,
				basePricePaise: Math.round(Number(price) * 100),
				discountPaise: Math.round(Number(discount || 0) * 100),
				prepMinutes: Number(prep)
			});
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-semibold",
				children: item.name
			}), item.basePricePaise == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-chili",
				children: "MRP — set a selling price before sale"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: inr(item.basePricePaise - item.discountPaise)
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				"aria-label": `${item.name} availability`,
				value: item.availability,
				onChange: (e) => onToggle(e.target.value),
				className: "rounded-full border border-line bg-cream px-3 py-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "AVAILABLE",
						children: "Available"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "UNAVAILABLE",
						children: "Unavailable"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "SOLD_OUT",
						children: "Sold out"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "HIDDEN",
						children: "Hidden"
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs text-muted",
					children: ["Price ₹", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: price,
						onChange: (e) => setPrice(e.target.value),
						className: "mt-1 block w-24 rounded-xl border border-line px-2 py-2 text-sm text-ink"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs text-muted",
					children: ["Off ₹", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: discount,
						onChange: (e) => setDiscount(e.target.value),
						className: "mt-1 block w-24 rounded-xl border border-line px-2 py-2 text-sm text-ink"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-xs text-muted",
					children: ["Prep", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: prep,
						onChange: (e) => setPrep(e.target.value),
						className: "mt-1 block w-20 rounded-xl border border-line px-2 py-2 text-sm text-ink"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "self-end rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam",
					children: "Save"
				})
			]
		})]
	});
}
//#endregion
export { AdminPage as component };
