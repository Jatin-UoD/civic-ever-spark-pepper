import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { M as useMe, T as setCanteenStatus, _ as listDirectory, a as StatusPill, i as Shell, l as errMsg, r as RequireUser, t as DemoBanner } from "./canteen-ui-Bt8wlct1.mjs";
import { t as AnalyticsPanel } from "./analytics-panel-Dn_grJlL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/institution-CkUv8FQA.js
var import_jsx_runtime = require_jsx_runtime();
function InstitutionPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireUser, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstitutionBody, {}) });
}
function InstitutionBody() {
	const { me } = useMe();
	const institutionId = me?.memberships.find((m) => m.role === "INSTITUTION_ADMIN")?.institutionId ?? me?.memberships.find((m) => m.role === "SUPER_ADMIN")?.institutionId ?? null;
	const rows = (useQuery({
		queryKey: ["directory"],
		queryFn: () => listDirectory()
	}).data ?? []).filter((row) => !institutionId || row.institutionId === institutionId || me?.memberships.some((m) => m.role === "SUPER_ADMIN"));
	const scoped = me?.memberships.some((m) => m.role === "SUPER_ADMIN") ? rows : rows.filter((row) => row.institutionId === institutionId);
	const queryClient = useQueryClient();
	const focus = institutionId ?? scoped[0]?.institutionId;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		title: "Institution",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-semibold",
				children: "Campuses & canteens"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoBanner, {})
			}),
			!focus && !me?.memberships.some((m) => m.role === "SUPER_ADMIN") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6",
				children: "Institution tools are not on this account."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: scoped.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-3xl border border-line bg-foam p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs uppercase tracking-widest text-muted",
								children: [
									row.institutionName,
									" · ",
									row.campusName,
									row.canteenDemo ? " · Demo" : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-3xl font-semibold",
									children: row.canteenName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { value: row.status })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-3 block text-sm",
								children: ["Service status", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									"aria-label": `${row.canteenName} status`,
									value: row.status,
									className: "mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3",
									onChange: (event) => {
										const status = event.target.value;
										setCanteenStatus({ data: {
											canteenId: row.canteenId,
											status
										} }).then(() => {
											toast.success(`${row.canteenName} is ${status.toLowerCase()}.`);
											return queryClient.invalidateQueries({ queryKey: ["directory"] });
										}).catch((error) => toast.error(errMsg(error)));
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "OPEN",
											children: "Open"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "PAUSED",
											children: "Paused"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "CLOSED",
											children: "Closed"
										})
									]
								})]
							})
						]
					}, row.canteenId))
				}), focus ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsPanel, { institutionId: me?.memberships.some((m) => m.role === "SUPER_ADMIN") ? void 0 : focus }) : null]
			})
		]
	});
}
//#endregion
export { InstitutionPage as component };
