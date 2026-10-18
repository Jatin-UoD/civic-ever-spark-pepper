import { i as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as QrCode, i as ShieldCheck, o as Clock3, t as UtensilsCrossed } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B8fYpBUn.js
var import_jsx_runtime = require_jsx_runtime();
var shots = [
	["/menu/sandwich.jpg", "Sandwich Mania"],
	["/menu/parantha.jpg", "Tandoor paranthas"],
	["/menu/momos.jpg", "Momos"],
	["/menu/noodles.jpg", "Wok plates"],
	["/menu/chai.jpg", "Chai and cold coffee"],
	["/menu/samosa.jpg", "Chaat"]
];
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mx-auto flex max-w-6xl items-center justify-between px-4 py-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-display text-2xl font-semibold",
				children: ["Canteen", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-chili",
					children: "X"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#faq",
					className: "hidden rounded-full px-3 py-2 text-sm font-medium sm:inline",
					children: "FAQ"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					className: "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam",
					children: "Sign in"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-6 lg:grid-cols-[1.1fr_0.9fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold uppercase tracking-widest text-chili",
					children: "Campus kitchens"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-5xl font-semibold leading-none sm:text-6xl",
					children: "Skip the Queue. Order Ahead. Eat Faster."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 max-w-xl text-lg text-muted",
					children: "Order from your campus canteen, pay online and collect when ready."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-7 flex flex-wrap gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/browse",
						className: "rounded-full bg-chili px-5 py-3 text-base font-semibold text-foam",
						children: "Order Now"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/partner",
						className: "rounded-full border border-line bg-foam px-5 py-3 text-base font-semibold",
						children: "Partner Your Canteen"
					})]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "ticket rounded-3xl px-6 py-7 shadow-sm",
				"aria-label": "Example pickup token",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-widest text-muted",
						children: "Example token"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-5xl font-semibold tabular-nums",
						children: "#C1024"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-lg",
						children: "Preparing · 3 ahead · ~12 min · Counter 2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Approximate. Live orders recompute from the queue, prep times and counter capacity."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid grid-cols-3 gap-2 text-center text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-cream px-2 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold",
									children: "Paid"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted",
									children: "UPI"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-cream px-2 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold",
									children: "Main"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted",
									children: "Counter"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-cream px-2 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold",
									children: "QR"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted",
									children: "Pickup"
								})]
							})
						]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mx-auto max-w-6xl px-4 pb-12",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-3 overflow-x-auto pb-2",
				children: shots.map(([src, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "w-44 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src,
						alt: label,
						className: "h-32 w-full rounded-2xl object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
						className: "mt-2 text-sm font-medium",
						children: label
					})]
				}, label))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mx-auto grid max-w-6xl gap-4 px-4 pb-14 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				[
					UtensilsCrossed,
					"Live menu",
					"Staff turn a dish off and every screen stops selling it."
				],
				[
					Clock3,
					"A real queue",
					"Tokens show orders ahead and an approximate wait."
				],
				[
					QrCode,
					"Pickup that sticks",
					"One scan, one handover. A second scan is refused."
				],
				[
					ShieldCheck,
					"Prices from the server",
					"The browser cannot talk the kitchen into a cheaper total."
				]
			].map(([Icon, title, copy]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-3xl border border-line bg-foam p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "size-5 text-chili",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 font-display text-2xl font-semibold",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: copy
					})
				]
			}, String(title)))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			id: "faq",
			className: "mx-auto max-w-3xl px-4 pb-20",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-4xl font-semibold",
				children: "Questions from the corridor"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 divide-y divide-line rounded-3xl border border-line bg-foam",
				children: [
					["What if a dish sells out while it is in my cart?", "Staff availability is stored immediately. Your cart shows unavailable, the add button locks, and checkout is rejected on the server even if the page is stale."],
					["Can I pay with UPI?", "The payment flow is built for Razorpay — UPI, cards, netbanking and wallets. Without gateway keys this preview settles a labelled demo payment. Card numbers are never stored."],
					["How do I collect the order?", "You get an order id, a token and a QR. Staff scan or type it. The server checks the canteen, payment, ready status, and that it was not already collected."],
					["Is this only for one college?", "No. Institutions, campuses and canteens are separate tenants. Staff only see the counters they are assigned to."]
				].map(([q, a]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					className: "px-5 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "cursor-pointer text-base font-semibold",
						children: q
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: a
					})]
				}, q))
			})]
		})
	] });
}
//#endregion
export { Home as component };
