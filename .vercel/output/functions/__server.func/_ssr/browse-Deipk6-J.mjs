import { o as __toESM } from "../_runtime.mjs";
import { r as canOperateCanteen } from "./domain-BGTDNqbo.mjs";
import { a as require_react, i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { M as useMe, _ as listDirectory, a as StatusPill, i as Shell, r as RequireUser, t as DemoBanner } from "./canteen-ui-Bt8wlct1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/browse-Deipk6-J.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Browse() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireUser, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrowseBody, {}) });
}
function BrowseBody() {
	const { me } = useMe();
	const [q, setQ] = (0, import_react.useState)("");
	const directory = useQuery({
		queryKey: ["directory"],
		queryFn: () => listDirectory()
	});
	const rows = (0, import_react.useMemo)(() => {
		const needle = q.trim().toLowerCase();
		return (directory.data ?? []).filter((row) => !needle || `${row.institutionName} ${row.campusName} ${row.canteenName} ${row.city}`.toLowerCase().includes(needle));
	}, [directory.data, q]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		title: "Choose a canteen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-semibold",
				children: "Where are you eating?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-muted",
				children: "Pick an institution, campus and canteen. Demo University is fully stocked. Harbour House is a second tenant."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoBanner, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-5 block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: "Search canteens"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search institution, campus or canteen",
					className: "w-full rounded-full border border-line bg-foam px-4 py-3"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid gap-4 md:grid-cols-2",
				children: [directory.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted",
					children: "Loading canteens…"
				}) : null, rows.map((row) => {
					const actor = {
						userId: me?.userId ?? "",
						memberships: me?.memberships ?? []
					};
					const manage = me ? canOperateCanteen(actor, row.canteenId, row.institutionId, "staff") : false;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-3xl border border-line bg-foam p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs font-semibold uppercase tracking-widest text-muted",
										children: [
											row.institutionName,
											" · ",
											row.campusName,
											row.canteenDemo ? " · Demo" : ""
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "mt-1 font-display text-3xl font-semibold",
										children: row.canteenName
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted",
										children: row.description
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { value: row.status })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-sm text-muted",
								children: [
									row.city,
									" · ",
									row.kind
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/menu/$canteenId",
									params: { canteenId: row.canteenId },
									className: "rounded-full bg-chili px-4 py-2 text-sm font-semibold text-foam",
									children: "View menu"
								}), manage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/staff",
									className: "rounded-full border border-line px-4 py-2 text-sm font-semibold",
									children: "Staff desk"
								}) : null]
							})
						]
					}, row.canteenId);
				})]
			})
		]
	});
}
//#endregion
export { Browse as component };
