import { o as __toESM } from "../_runtime.mjs";
import { a as require_react, i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { S as useNavigate, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn, t as authClient } from "./client-IWHfIGH2.mjs";
import { t as GROK_PROVIDERS } from "./server-B_AhUwWr.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-Cax0gOA7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Real email/password accounts seeded into the database. Password is shared. */
var DEMO_PASSWORD = "SkipTheQueue1";
var DEMO_ACCOUNTS = [
	{
		role: "Customer",
		email: "customer@canteenx.dev",
		blurb: "Order and track"
	},
	{
		role: "Staff",
		email: "staff@canteenx.dev",
		blurb: "Queue and live menu"
	},
	{
		role: "Canteen admin",
		email: "canteen@canteenx.dev",
		blurb: "Prices, staff, analytics"
	},
	{
		role: "Institution admin",
		email: "institution@canteenx.dev",
		blurb: "Campuses and canteens"
	},
	{
		role: "Super admin",
		email: "super@canteenx.dev",
		blurb: "Tenants and payments"
	},
	{
		role: "Night mess staff",
		email: "night@canteenx.dev",
		blurb: "Other tenant only"
	}
];
function Login() {
	const navigate = useNavigate();
	const [mode, setMode] = (0, import_react.useState)("in");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("customer@canteenx.dev");
	const [password, setPassword] = (0, import_react.useState)(DEMO_PASSWORD);
	const [pending, setPending] = (0, import_react.useState)(false);
	async function submit(nextEmail = email, nextPassword = password) {
		setPending(true);
		try {
			const result = mode === "up" ? await authClient.signUp.email({
				email: nextEmail,
				password: nextPassword,
				name: name || "New guest"
			}) : await authClient.signIn.email({
				email: nextEmail,
				password: nextPassword
			});
			if (result.error) {
				toast.error(result.error.message ?? "Sign-in failed");
				return;
			}
			await navigate({ to: "/browse" });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Sign-in failed");
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "font-display text-2xl font-semibold",
				children: ["Canteen", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-chili",
					children: "X"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-6 font-display text-4xl font-semibold",
				children: "Sign in to order ahead."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: "Google, X, or email. Demo kitchens already have staff and admin accounts."
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-3xl border border-line bg-foam p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-2 rounded-full bg-cream p-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `rounded-full py-2 text-sm font-semibold ${mode === "in" ? "bg-ink text-foam" : ""}`,
						onClick: () => setMode("in"),
						children: "Sign in"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `rounded-full py-2 text-sm font-semibold ${mode === "up" ? "bg-ink text-foam" : ""}`,
						onClick: () => setMode("up"),
						children: "Create account"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-4 space-y-3",
					onSubmit: (event) => {
						event.preventDefault();
						submit();
					},
					children: [
						mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-medium",
							children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3",
								value: name,
								onChange: (e) => setName(e.target.value),
								required: true
							})]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-medium",
							children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								className: "mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3",
								value: email,
								onChange: (e) => setEmail(e.target.value),
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-medium",
							children: ["Password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								className: "mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3",
								value: password,
								onChange: (e) => setPassword(e.target.value),
								minLength: 8,
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: pending,
							className: "w-full rounded-full bg-chili py-3 font-semibold text-foam disabled:opacity-60",
							children: pending ? "Please wait…" : mode === "up" ? "Create account" : "Continue"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "my-4 text-center text-xs uppercase tracking-widest text-muted",
					children: "or"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: GROK_PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "w-full rounded-full border border-line py-3 text-sm font-semibold",
						onClick: () => signIn(provider.providerId, { callbackURL: "/browse" }),
						children: ["Continue with ", provider.label]
					}, provider.providerId))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: "Demo accounts"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: ["Password for all of them: ", DEMO_PASSWORD]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 grid gap-2 sm:grid-cols-2",
							children: DEMO_ACCOUNTS.map((account) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "rounded-2xl border border-line px-3 py-2 text-left",
								onClick: () => {
									setMode("in");
									setEmail(account.email);
									setPassword(DEMO_PASSWORD);
									submit(account.email, DEMO_PASSWORD);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-sm font-semibold",
									children: account.role
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-xs text-muted",
									children: account.blurb
								})]
							}, account.email))
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { Login as component };
