import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as Shell, k as submitPartner, l as errMsg, r as RequireUser } from "./canteen-ui-Bt8wlct1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/partner-Dh2J0H_W.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PartnerPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireUser, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartnerBody, {}) });
}
function PartnerBody() {
	const [orgName, setOrg] = (0, import_react.useState)("");
	const [campusName, setCampus] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [done, setDone] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, {
		title: "Partner",
		back: {
			href: "/",
			label: "Home"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl font-semibold",
				children: "Partner your canteen"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-muted",
				children: "Tell us the campus. A platform admin can open the tenant, counters and menu after review."
			}),
			done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 rounded-3xl bg-foam p-4",
				children: "Request saved. We will use the email on your account."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-6 max-w-xl space-y-3",
				onSubmit: (event) => {
					event.preventDefault();
					submitPartner({ data: {
						orgName,
						campusName,
						note
					} }).then(() => setDone(true)).catch((error) => toast.error(errMsg(error)));
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: orgName,
						onChange: (e) => setOrg(e.target.value),
						placeholder: "Institution",
						className: "w-full rounded-2xl border border-line bg-foam px-3 py-3",
						required: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: campusName,
						onChange: (e) => setCampus(e.target.value),
						placeholder: "Campus or hostel",
						className: "w-full rounded-2xl border border-line bg-foam px-3 py-3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: note,
						onChange: (e) => setNote(e.target.value),
						placeholder: "Counters, peak hours, anything we should know",
						className: "w-full rounded-2xl border border-line bg-foam px-3 py-3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "rounded-full bg-chili px-5 py-3 font-semibold text-foam",
						children: "Send request"
					})
				]
			})
		]
	});
}
//#endregion
export { PartnerPage as component };
