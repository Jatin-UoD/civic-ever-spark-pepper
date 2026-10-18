import { o as __toESM } from "../_runtime.mjs";
import { n as STATUS_LABEL, s as friendlyError } from "./domain-BGTDNqbo.mjs";
import { a as require_react, i as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link, x as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { A as boolean, D as _enum, F as object, P as number, R as string, k as array } from "../_libs/@better-auth/core+[...].mjs";
import { i as signOut, t as authClient } from "./client-IWHfIGH2.mjs";
import { a as hasGateSessionMarker } from "./server-B_AhUwWr.mjs";
import { t as authMiddleware } from "./middleware-BLns2vGS.mjs";
import { c as Bell, s as ChevronLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/canteen-ui-Bt8wlct1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var id = string().trim().min(1).max(80);
var lineSchema = object({
	itemId: string().trim().max(80).optional(),
	comboId: string().trim().max(80).optional(),
	variantId: string().trim().max(80).nullable().optional(),
	addonIds: array(string().trim().max(80)).max(8).optional(),
	qty: number().int().min(1).max(10),
	instructions: string().max(140).optional()
});
var getMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("6821dfd7395c7690bd0ff14ecf317384127d5fb2450395341f3e7c023fb1cc77"));
var listDirectory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f58d791cf95054597a729d12678fbf5d5155578f2f97ad9cdb970935f801fe6d"));
var getMenu = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ canteenId: id }).parse(input)).handler(createSsrRpc("922253ea9753eae946acc8b79de5709ac3fcfa6ac708a53e206ccc42b2722bd2"));
var getPulse = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ canteenId: id }).parse(input)).handler(createSsrRpc("86711091449070606f90326111daf80c9cc868c93c5ed647a152673fe1280960"));
var getCart = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	couponCode: string().max(40).nullable().optional()
}).parse(input)).handler(createSsrRpc("d093d0ef328f77fad4c1086c6fbc3e4ae97a4ca550f90ecdd52aec3c14e3d102"));
var saveCart = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	lines: array(lineSchema).max(30)
}).parse(input)).handler(createSsrRpc("3b2375ebd8311e8f585c7996bb04e11849e64a30386d2f1ed966436b8aa0d920"));
var placeOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	idempotencyKey: string().trim().min(8).max(80),
	expectedTotalPaise: number().int().nonnegative().max(2e6),
	couponCode: string().max(40).nullable().optional(),
	instructions: string().max(140).nullable().optional(),
	lines: array(lineSchema.extend({ clientUnitPaise: number().int().nonnegative() })).min(1).max(30)
}).parse(input)).handler(createSsrRpc("3047d8a9b7ba093cb821dd51bad02da0dcf5639d3d9a485e0ed0131fbcdf5eda"));
var settleDemoPayment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	orderId: id,
	outcome: _enum(["PAID", "FAILED"])
}).parse(input)).handler(createSsrRpc("6910286b069321ec8cd08768bcd3176d41348b4dd473b23e92eddbc9a21628c6"));
var cancelOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	orderId: id,
	reason: string().max(180)
}).parse(input)).handler(createSsrRpc("c0e8aab8015967cad9ceca601f244a0f44494e6453a25bf043586c86589ce1c6"));
var getOrder = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ orderId: id }).parse(input)).handler(createSsrRpc("853613cff77acba58f36a8b9929c14bad0eaf060fb812dfaedc40290d9304140"));
var listMyOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("963410daa05a0834b6d1179a48cbe9d18d123c7b09e3723caffd950e0aeaf3c1"));
var listQueue = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ canteenId: id }).parse(input)).handler(createSsrRpc("cb1dc17449266cf2ab23a6b88171bacf996c66bfefc90b0164403ec2b9ab05e8"));
var transitionOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	orderId: id,
	to: _enum([
		"ACCEPTED",
		"PREPARING",
		"READY_FOR_PICKUP"
	])
}).parse(input)).handler(createSsrRpc("aba0cd7da0f1733090212886efa55e1995ea47fb68a505d984874e823a001ae9"));
var pickupOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	code: string().trim().min(2).max(120)
}).parse(input)).handler(createSsrRpc("3c631a35ad9ba311e21fa914edc8d0bb8f474f40770e8e5ac029dfc59117b2b9"));
var availability = _enum([
	"AVAILABLE",
	"UNAVAILABLE",
	"SOLD_OUT",
	"HIDDEN"
]);
var setItemAvailability = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	itemId: id,
	availability
}).parse(input)).handler(createSsrRpc("ebbe60068c3ba1c7164ba60bf722b4ebc7b4c0273898429b92401c0b53faec23"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	comboId: id,
	availability
}).parse(input)).handler(createSsrRpc("2d4ce5f3a3c680ff9f5d80365240525c0793c52a2592ac4844af574f12c8531b"));
var setCanteenStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	status: _enum([
		"OPEN",
		"CLOSED",
		"PAUSED"
	])
}).parse(input)).handler(createSsrRpc("3fc8d7ba23113007549d620de4042196ec31f55d970fefe07dfcc5cd3c2e1b4c"));
var setCounterActive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	counterId: id,
	active: boolean()
}).parse(input)).handler(createSsrRpc("495bec9c471c8530b85ead0bb7c0a5a626889cd9bd1f827a9b801fa9ed743108"));
var updateItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	itemId: id,
	name: string().max(80).optional(),
	description: string().max(240).optional(),
	basePricePaise: number().int().nonnegative().nullable().optional(),
	discountPaise: number().int().nonnegative().optional(),
	prepMinutes: number().int().min(1).max(180).optional(),
	diet: _enum([
		"veg",
		"egg",
		"nonveg"
	]).optional(),
	availability: availability.optional()
}).parse(input)).handler(createSsrRpc("87d3c80c20c5edbc54de7ca8d91e593b4802b934d48a0ec79b7dc25c07b3eee5"));
var createItem = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	categoryId: id,
	name: string().trim().min(1).max(80),
	basePricePaise: number().int().nonnegative(),
	prepMinutes: number().int().min(1).max(180),
	diet: _enum([
		"veg",
		"egg",
		"nonveg"
	])
}).parse(input)).handler(createSsrRpc("e2499f36e54a70d17b9609b3e99980ab70fb9c5e8ca1697d04594f45ecd86c9b"));
var grantRole = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	email: string().email().max(160),
	role: _enum([
		"CUSTOMER",
		"STAFF",
		"CANTEEN_ADMIN",
		"INSTITUTION_ADMIN",
		"SUPER_ADMIN"
	]),
	canteenId: id.nullable().optional(),
	institutionId: id.nullable().optional()
}).parse(input)).handler(createSsrRpc("127b3a5060e7ec47cbc313a623d4d5937e163cecc61cd219fdc64f22b1ab1ff8"));
var listStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ canteenId: id }).parse(input)).handler(createSsrRpc("fde2ca5dc682a2a828d9914bc97ff49d12061fbfeefce5aad11b359fc63c2962"));
var getAnalytics = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id.nullable().optional(),
	institutionId: id.nullable().optional()
}).parse(input)).handler(createSsrRpc("79e2ecbeb0790670929f398897b3aa718de0ef967a1a1891117aa64936338278"));
var listNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("85a307242ac64487c7cc64dbca0d79589436e0a5c70cc3af29139ea716e843b2"));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("51dae97c4abf5d1d1cab0fa1118f2180ab0178eccb123e10aa6202f17ac85a8b"));
var addReview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	orderId: id,
	rating: number().int().min(1).max(5),
	comment: string().max(280)
}).parse(input)).handler(createSsrRpc("d12ba2b9ea67231d05da271c0c37fca6ef3146f49bb0e1a2418ef6433c16c640"));
var submitPartner = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	orgName: string().trim().min(2).max(120),
	campusName: string().trim().max(120),
	note: string().max(500)
}).parse(input)).handler(createSsrRpc("b788326eab1732216e527054eab2faa89353fb46c940792de7e7a31a82c57d51"));
var platformOverview = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("0129d6955d3d428e440180787885cfcb0c3dd320a016ea73d5740286374348d5"));
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	return useSessionUserState();
}
function useSessionUserState() {
	const { data, isPending } = authClient.useSession();
	const id = data?.user.id;
	const displayName = data?.user.name ?? null;
	const primaryEmail = data?.user.email ?? null;
	const profileImageUrl = data?.user.image ?? null;
	const user = (0, import_react.useMemo)(() => id ? {
		id,
		displayName,
		primaryEmail,
		profileImageUrl,
		isDevFallback: false
	} : null, [
		id,
		displayName,
		primaryEmail,
		profileImageUrl
	]);
	return (0, import_react.useMemo)(() => ({
		user,
		isPending
	}), [user, isPending]);
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": label,
			"aria-expanded": open,
			onClick: () => setOpen((value) => !value),
			className: "grid size-11 place-items-center rounded-full",
			children: user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "size-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			})
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute right-0 top-12 z-40 w-56 rounded-3xl border border-line bg-foam p-3 shadow-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-sm font-medium",
				children: label
			}), !gateSession ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: busy,
				className: "mt-2 w-full rounded-full bg-ink px-3 py-2 text-sm font-semibold text-foam disabled:opacity-60",
				onClick: () => {
					setBusy(true);
					signOut().catch(() => setBusy(false));
				},
				children: busy ? "Signing out…" : "Sign out"
			}) : null]
		}) : null]
	});
}
function inr(paise) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: paise % 100 === 0 ? 0 : 2
	}).format(paise / 100);
}
function errMsg(error) {
	if (error instanceof Error) return friendlyError(error.message);
	if (typeof error === "object" && error && "message" in error && typeof error.message === "string") return friendlyError(error.message);
	return "Something went wrong. Try again.";
}
function DietMark({ diet }) {
	const veg = diet === "veg";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex size-4 shrink-0 items-center justify-center rounded-sm border-2 ${veg ? "border-leaf" : "border-chili"}`,
		title: veg ? "Vegetarian" : diet === "egg" ? "Contains egg" : "Non-vegetarian",
		"aria-label": veg ? "Vegetarian" : diet === "egg" ? "Contains egg" : "Non-vegetarian",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-1.5 rounded-full ${veg ? "bg-leaf" : "bg-chili"}` })
	});
}
function StatusPill({ value }) {
	const label = STATUS_LABEL[value] ?? value;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${value === "AVAILABLE" || value === "OPEN" || value === "PAID" || value === "PICKED_UP" || value === "READY_FOR_PICKUP" ? "bg-leaf/10 text-leaf" : value === "CLOSED" || value === "SOLD_OUT" || value === "FAILED" || value === "CANCELLED" || value === "UNAVAILABLE" ? "bg-chili/10 text-chili" : "bg-line text-ink"}`,
		children: label
	});
}
function RequireUser({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg px-5 py-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-40 animate-pulse rounded-full bg-line" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6 h-28 animate-pulse rounded-3xl bg-foam" })]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return children;
}
function useMe() {
	const { user, isPending } = useCurrentUserState();
	const query = useQuery({
		queryKey: ["me", user?.id],
		queryFn: () => getMe(),
		enabled: Boolean(user)
	});
	return {
		user,
		isPending,
		me: query.data ?? null,
		loadingMe: query.isLoading
	};
}
function Shell({ title, back, children }) {
	const { user, isPending, me } = useMe();
	const [notesOpen, setNotesOpen] = (0, import_react.useState)(false);
	const roles = new Set(me?.memberships.map((m) => m.role) ?? []);
	const notes = useQuery({
		queryKey: ["notes", user?.id],
		queryFn: () => listNotifications(),
		enabled: Boolean(user),
		refetchInterval: 4e3
	});
	const seen = (0, import_react.useRef)("");
	(0, import_react.useEffect)(() => {
		const unread = (notes.data ?? []).filter((n) => !n.read);
		const sig = unread.map((n) => n.id).join(",");
		if (sig && sig !== seen.current) {
			const fresh = unread[0];
			if (fresh && seen.current !== "") toast(fresh.title, { description: fresh.body });
			if (typeof Notification !== "undefined" && Notification.permission === "granted" && fresh && seen.current !== "") new Notification(fresh.title, { body: fresh.body });
		}
		seen.current = sig;
	}, [notes.data]);
	const links = [
		{
			to: "/browse",
			label: "Order"
		},
		{
			to: "/history",
			label: "Orders"
		},
		...roles.has("STAFF") || roles.has("CANTEEN_ADMIN") || roles.has("SUPER_ADMIN") || roles.has("INSTITUTION_ADMIN") ? [{
			to: "/staff",
			label: "Staff"
		}] : [],
		...roles.has("CANTEEN_ADMIN") || roles.has("SUPER_ADMIN") ? [{
			to: "/admin",
			label: "Menu admin"
		}] : [],
		...roles.has("INSTITUTION_ADMIN") || roles.has("SUPER_ADMIN") ? [{
			to: "/institution",
			label: "Campus"
		}] : [],
		...roles.has("SUPER_ADMIN") ? [{
			to: "/platform",
			label: "Platform"
		}] : []
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "no-print sticky top-0 z-20 border-b border-line bg-cream/90 backdrop-blur",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "font-display text-xl font-semibold tracking-tight",
							children: ["Canteen", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-chili",
								children: "X"
							})]
						}),
						title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hidden truncate text-sm text-muted sm:block",
							children: title
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "ml-auto flex min-w-0 items-center gap-1",
							children: [
								user ? links.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: link.to,
									className: "shrink-0 rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-foam",
									children: link.label
								}, link.to)) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "relative grid size-11 place-items-center rounded-full hover:bg-foam",
										"aria-label": "Notifications",
										"aria-expanded": notesOpen,
										onClick: () => {
											setNotesOpen((open) => !open);
											if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
											markNotificationsRead().then(() => notes.refetch());
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-5" }), (notes.data ?? []).some((n) => !n.read) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-2 top-2 size-2 rounded-full bg-chili" }) : null]
									}), notesOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "absolute right-0 top-12 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-line bg-foam p-3 shadow-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "px-2 text-sm font-semibold",
											children: "Updates"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
											className: "mt-2 max-h-80 space-y-1 overflow-y-auto",
											children: (notes.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
												className: "px-2 py-3 text-sm text-muted",
												children: "No updates yet. Order status lands here."
											}) : (notes.data ?? []).map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: note.orderId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/track/$orderId",
												params: { orderId: note.orderId },
												className: "block rounded-2xl px-2 py-2 hover:bg-cream",
												onClick: () => setNotesOpen(false),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-semibold",
													children: note.title
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted",
													children: note.body
												})]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "px-2 py-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-semibold",
													children: note.title
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted",
													children: note.body
												})]
											}) }, note.id))
										})]
									}) : null]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex shrink-0 items-center",
									children: isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-8 animate-pulse rounded-full bg-line" }) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/login",
										className: "rounded-full bg-ink px-3 py-2 text-sm font-semibold text-foam",
										children: "Sign in"
									})
								})
							]
						})
					]
				})
			}),
			back ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "no-print mx-auto max-w-6xl px-4 pt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: back.href,
					className: "inline-flex items-center gap-1 text-sm font-medium text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }),
						" ",
						back.label
					]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-6xl px-4 py-5",
				children
			})
		]
	});
}
function DemoBanner() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "rounded-2xl border border-line bg-foam px-4 py-3 text-sm text-muted",
		children: "Demo data. Payments run in demo mode unless Razorpay keys are configured — no card details are stored."
	});
}
//#endregion
export { transitionOrder as A, platformOverview as C, setItemAvailability as D, setCounterActive as E, useMe as M, settleDemoPayment as O, placeOrder as S, setCanteenStatus as T, listDirectory as _, StatusPill as a, listStaff as b, createItem as c, getCart as d, getMenu as f, inr as g, grantRole as h, Shell as i, updateItem as j, submitPartner as k, errMsg as l, getPulse as m, DietMark as n, addReview as o, getOrder as p, RequireUser as r, cancelOrder as s, DemoBanner as t, getAnalytics as u, listMyOrders as v, saveCart as w, pickupOrder as x, listQueue as y };
