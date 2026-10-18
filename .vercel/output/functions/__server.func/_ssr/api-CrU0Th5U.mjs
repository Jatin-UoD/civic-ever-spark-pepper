import { o as __toESM } from "../_runtime.mjs";
import { u as rateLimit } from "./domain-BGTDNqbo.mjs";
import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { A as boolean, D as _enum, F as object, P as number, R as string, k as array } from "../_libs/@better-auth/core+[...].mjs";
import { t as authMiddleware } from "./middleware-BLns2vGS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-CrU0Th5U.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
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
async function read(userId, fn) {
	const { getSql } = await import("./db-zNj4X4Ml.mjs").then((n) => n.n).then((n) => n.n);
	const { actorFrom } = await import("./logic-BnfpOiNG.mjs");
	const sql = await getSql();
	return fn(sql, await actorFrom(sql, userId));
}
async function write(userId, fn) {
	const { withTransaction } = await import("./tx.server-D4HQ4LZv.mjs");
	const { actorFrom } = await import("./logic-BnfpOiNG.mjs");
	return withTransaction(async (sql) => {
		return fn(sql, await actorFrom(sql, userId));
	});
}
var getMe_createServerFn_handler = createServerRpc({
	id: "6821dfd7395c7690bd0ff14ecf317384127d5fb2450395341f3e7c023fb1cc77",
	name: "getMe",
	filename: "src/lib/canteen/api.ts"
}, (opts) => getMe.__executeServer(opts));
var getMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMe_createServerFn_handler, async ({ context }) => {
	const { getSql } = await import("./db-zNj4X4Ml.mjs").then((n) => n.n).then((n) => n.n);
	const { loadMe } = await import("./logic-BnfpOiNG.mjs");
	return loadMe(await getSql(), context.userId);
});
var listDirectory_createServerFn_handler = createServerRpc({
	id: "f58d791cf95054597a729d12678fbf5d5155578f2f97ad9cdb970935f801fe6d",
	name: "listDirectory",
	filename: "src/lib/canteen/api.ts"
}, (opts) => listDirectory.__executeServer(opts));
var listDirectory = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listDirectory_createServerFn_handler, async ({ context }) => read(context.userId, async (sql) => {
	const { listDirectory: list } = await import("./logic-BnfpOiNG.mjs");
	return list(sql);
}));
var getMenu_createServerFn_handler = createServerRpc({
	id: "922253ea9753eae946acc8b79de5709ac3fcfa6ac708a53e206ccc42b2722bd2",
	name: "getMenu",
	filename: "src/lib/canteen/api.ts"
}, (opts) => getMenu.__executeServer(opts));
var getMenu = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ canteenId: id }).parse(input)).handler(getMenu_createServerFn_handler, async ({ data, context }) => read(context.userId, async (sql, actor) => {
	const { getMenu: menu } = await import("./logic-BnfpOiNG.mjs");
	return menu(sql, actor, data.canteenId);
}));
var getPulse_createServerFn_handler = createServerRpc({
	id: "86711091449070606f90326111daf80c9cc868c93c5ed647a152673fe1280960",
	name: "getPulse",
	filename: "src/lib/canteen/api.ts"
}, (opts) => getPulse.__executeServer(opts));
var getPulse = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ canteenId: id }).parse(input)).handler(getPulse_createServerFn_handler, async ({ data, context }) => read(context.userId, async (sql) => {
	const { getPulse: pulse } = await import("./logic-BnfpOiNG.mjs");
	return pulse(sql, data.canteenId);
}));
var getCart_createServerFn_handler = createServerRpc({
	id: "d093d0ef328f77fad4c1086c6fbc3e4ae97a4ca550f90ecdd52aec3c14e3d102",
	name: "getCart",
	filename: "src/lib/canteen/api.ts"
}, (opts) => getCart.__executeServer(opts));
var getCart = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	couponCode: string().max(40).nullable().optional()
}).parse(input)).handler(getCart_createServerFn_handler, async ({ data, context }) => read(context.userId, async (sql) => {
	const { getCart: cart } = await import("./logic-BnfpOiNG.mjs");
	return cart(sql, context.userId, data.canteenId, data.couponCode ?? null);
}));
var saveCart_createServerFn_handler = createServerRpc({
	id: "3b2375ebd8311e8f585c7996bb04e11849e64a30386d2f1ed966436b8aa0d920",
	name: "saveCart",
	filename: "src/lib/canteen/api.ts"
}, (opts) => saveCart.__executeServer(opts));
var saveCart = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	lines: array(lineSchema).max(30)
}).parse(input)).handler(saveCart_createServerFn_handler, async ({ data, context }) => {
	rateLimit(`cart:${context.userId}`, 40, 6e4);
	return write(context.userId, async (sql) => {
		const { saveCart: save } = await import("./logic-BnfpOiNG.mjs");
		return save(sql, context.userId, data.canteenId, data.lines);
	});
});
var placeOrder_createServerFn_handler = createServerRpc({
	id: "3047d8a9b7ba093cb821dd51bad02da0dcf5639d3d9a485e0ed0131fbcdf5eda",
	name: "placeOrder",
	filename: "src/lib/canteen/api.ts"
}, (opts) => placeOrder.__executeServer(opts));
var placeOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	idempotencyKey: string().trim().min(8).max(80),
	expectedTotalPaise: number().int().nonnegative().max(2e6),
	couponCode: string().max(40).nullable().optional(),
	instructions: string().max(140).nullable().optional(),
	lines: array(lineSchema.extend({ clientUnitPaise: number().int().nonnegative() })).min(1).max(30)
}).parse(input)).handler(placeOrder_createServerFn_handler, async ({ data, context }) => {
	rateLimit(`checkout:${context.userId}`, 8, 6e4);
	return write(context.userId, async (sql, actor) => {
		const { placeOrder: place } = await import("./logic-BnfpOiNG.mjs");
		return place(sql, actor, {
			canteenId: data.canteenId,
			lines: data.lines,
			couponCode: data.couponCode ?? null,
			instructions: data.instructions ?? null,
			expectedTotalPaise: data.expectedTotalPaise,
			idempotencyKey: data.idempotencyKey
		});
	});
});
var settleDemoPayment_createServerFn_handler = createServerRpc({
	id: "6910286b069321ec8cd08768bcd3176d41348b4dd473b23e92eddbc9a21628c6",
	name: "settleDemoPayment",
	filename: "src/lib/canteen/api.ts"
}, (opts) => settleDemoPayment.__executeServer(opts));
var settleDemoPayment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	orderId: id,
	outcome: _enum(["PAID", "FAILED"])
}).parse(input)).handler(settleDemoPayment_createServerFn_handler, async ({ data, context }) => {
	rateLimit(`pay:${context.userId}`, 12, 6e4);
	return write(context.userId, async (sql, actor) => {
		const { settlePayment } = await import("./logic-BnfpOiNG.mjs");
		const result = await settlePayment(sql, actor, data.orderId, data.outcome, "DEMO", `demo:${data.orderId}:${data.outcome}:${Date.now()}`, null);
		if (result.blocked) {
			const { CanteenError } = await import("./domain-BGTDNqbo.mjs").then((n) => n.a).then((n) => n.a);
			throw new CanteenError("ITEM_UNAVAILABLE", result.message ?? "That item can no longer be sold.");
		}
		return result;
	});
});
var cancelOrder_createServerFn_handler = createServerRpc({
	id: "c0e8aab8015967cad9ceca601f244a0f44494e6453a25bf043586c86589ce1c6",
	name: "cancelOrder",
	filename: "src/lib/canteen/api.ts"
}, (opts) => cancelOrder.__executeServer(opts));
var cancelOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	orderId: id,
	reason: string().max(180)
}).parse(input)).handler(cancelOrder_createServerFn_handler, async ({ data, context }) => write(context.userId, async (sql, actor) => {
	const { cancelOrder: cancel } = await import("./logic-BnfpOiNG.mjs");
	return cancel(sql, actor, data.orderId, data.reason);
}));
var getOrder_createServerFn_handler = createServerRpc({
	id: "853613cff77acba58f36a8b9929c14bad0eaf060fb812dfaedc40290d9304140",
	name: "getOrder",
	filename: "src/lib/canteen/api.ts"
}, (opts) => getOrder.__executeServer(opts));
var getOrder = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ orderId: id }).parse(input)).handler(getOrder_createServerFn_handler, async ({ data, context }) => {
	const order = await read(context.userId, async (sql, actor) => {
		const { getOrder: load } = await import("./logic-BnfpOiNG.mjs");
		return load(sql, actor, data.orderId);
	});
	const qrSvg = await (await import("../_libs/qrcode.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()))).toString(order.pickupCode, {
		type: "svg",
		margin: 1,
		color: {
			dark: "#1a1612",
			light: "#fffdf8"
		}
	});
	return {
		...order,
		qrSvg
	};
});
var listMyOrders_createServerFn_handler = createServerRpc({
	id: "963410daa05a0834b6d1179a48cbe9d18d123c7b09e3723caffd950e0aeaf3c1",
	name: "listMyOrders",
	filename: "src/lib/canteen/api.ts"
}, (opts) => listMyOrders.__executeServer(opts));
var listMyOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyOrders_createServerFn_handler, async ({ context }) => read(context.userId, async (sql) => {
	const { listMyOrders: list } = await import("./logic-BnfpOiNG.mjs");
	return list(sql, context.userId);
}));
var listQueue_createServerFn_handler = createServerRpc({
	id: "cb1dc17449266cf2ab23a6b88171bacf996c66bfefc90b0164403ec2b9ab05e8",
	name: "listQueue",
	filename: "src/lib/canteen/api.ts"
}, (opts) => listQueue.__executeServer(opts));
var listQueue = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ canteenId: id }).parse(input)).handler(listQueue_createServerFn_handler, async ({ data, context }) => read(context.userId, async (sql, actor) => {
	const { listQueue: list } = await import("./logic-BnfpOiNG.mjs");
	return list(sql, actor, data.canteenId);
}));
var transitionOrder_createServerFn_handler = createServerRpc({
	id: "aba0cd7da0f1733090212886efa55e1995ea47fb68a505d984874e823a001ae9",
	name: "transitionOrder",
	filename: "src/lib/canteen/api.ts"
}, (opts) => transitionOrder.__executeServer(opts));
var transitionOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	orderId: id,
	to: _enum([
		"ACCEPTED",
		"PREPARING",
		"READY_FOR_PICKUP"
	])
}).parse(input)).handler(transitionOrder_createServerFn_handler, async ({ data, context }) => write(context.userId, async (sql, actor) => {
	const { transitionOrder: move } = await import("./logic-BnfpOiNG.mjs");
	return move(sql, actor, data.orderId, data.to);
}));
var pickupOrder_createServerFn_handler = createServerRpc({
	id: "3c631a35ad9ba311e21fa914edc8d0bb8f474f40770e8e5ac029dfc59117b2b9",
	name: "pickupOrder",
	filename: "src/lib/canteen/api.ts"
}, (opts) => pickupOrder.__executeServer(opts));
var pickupOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	code: string().trim().min(2).max(120)
}).parse(input)).handler(pickupOrder_createServerFn_handler, async ({ data, context }) => {
	rateLimit(`pickup:${context.userId}`, 30, 6e4);
	return write(context.userId, async (sql, actor) => {
		const { pickupOrder: pickup } = await import("./logic-BnfpOiNG.mjs");
		return pickup(sql, actor, data.canteenId, data.code);
	});
});
var availability = _enum([
	"AVAILABLE",
	"UNAVAILABLE",
	"SOLD_OUT",
	"HIDDEN"
]);
var setItemAvailability_createServerFn_handler = createServerRpc({
	id: "ebbe60068c3ba1c7164ba60bf722b4ebc7b4c0273898429b92401c0b53faec23",
	name: "setItemAvailability",
	filename: "src/lib/canteen/api.ts"
}, (opts) => setItemAvailability.__executeServer(opts));
var setItemAvailability = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	itemId: id,
	availability
}).parse(input)).handler(setItemAvailability_createServerFn_handler, async ({ data, context }) => {
	rateLimit(`avail:${context.userId}`, 60, 6e4);
	return write(context.userId, async (sql, actor) => {
		const { setItemAvailability: set } = await import("./logic-BnfpOiNG.mjs");
		return set(sql, actor, data.itemId, data.availability);
	});
});
var setComboAvailability_createServerFn_handler = createServerRpc({
	id: "2d4ce5f3a3c680ff9f5d80365240525c0793c52a2592ac4844af574f12c8531b",
	name: "setComboAvailability",
	filename: "src/lib/canteen/api.ts"
}, (opts) => setComboAvailability.__executeServer(opts));
var setComboAvailability = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	comboId: id,
	availability
}).parse(input)).handler(setComboAvailability_createServerFn_handler, async ({ data, context }) => write(context.userId, async (sql, actor) => {
	const { setComboAvailability: set } = await import("./logic-BnfpOiNG.mjs");
	return set(sql, actor, data.comboId, data.availability);
}));
var setCanteenStatus_createServerFn_handler = createServerRpc({
	id: "3fc8d7ba23113007549d620de4042196ec31f55d970fefe07dfcc5cd3c2e1b4c",
	name: "setCanteenStatus",
	filename: "src/lib/canteen/api.ts"
}, (opts) => setCanteenStatus.__executeServer(opts));
var setCanteenStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id,
	status: _enum([
		"OPEN",
		"CLOSED",
		"PAUSED"
	])
}).parse(input)).handler(setCanteenStatus_createServerFn_handler, async ({ data, context }) => write(context.userId, async (sql, actor) => {
	const { setCanteenStatus: set } = await import("./logic-BnfpOiNG.mjs");
	return set(sql, actor, data.canteenId, data.status);
}));
var setCounterActive_createServerFn_handler = createServerRpc({
	id: "495bec9c471c8530b85ead0bb7c0a5a626889cd9bd1f827a9b801fa9ed743108",
	name: "setCounterActive",
	filename: "src/lib/canteen/api.ts"
}, (opts) => setCounterActive.__executeServer(opts));
var setCounterActive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	counterId: id,
	active: boolean()
}).parse(input)).handler(setCounterActive_createServerFn_handler, async ({ data, context }) => write(context.userId, async (sql, actor) => {
	const { setCounterActive: set } = await import("./logic-BnfpOiNG.mjs");
	return set(sql, actor, data.counterId, data.active);
}));
var updateItem_createServerFn_handler = createServerRpc({
	id: "87d3c80c20c5edbc54de7ca8d91e593b4802b934d48a0ec79b7dc25c07b3eee5",
	name: "updateItem",
	filename: "src/lib/canteen/api.ts"
}, (opts) => updateItem.__executeServer(opts));
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
}).parse(input)).handler(updateItem_createServerFn_handler, async ({ data, context }) => write(context.userId, async (sql, actor) => {
	const { updateItem: update } = await import("./logic-BnfpOiNG.mjs");
	const { itemId, ...patch } = data;
	return update(sql, actor, itemId, patch);
}));
var createItem_createServerFn_handler = createServerRpc({
	id: "e2499f36e54a70d17b9609b3e99980ab70fb9c5e8ca1697d04594f45ecd86c9b",
	name: "createItem",
	filename: "src/lib/canteen/api.ts"
}, (opts) => createItem.__executeServer(opts));
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
}).parse(input)).handler(createItem_createServerFn_handler, async ({ data, context }) => write(context.userId, async (sql, actor) => {
	const { createItem: create } = await import("./logic-BnfpOiNG.mjs");
	return create(sql, actor, data);
}));
var grantRole_createServerFn_handler = createServerRpc({
	id: "127b3a5060e7ec47cbc313a623d4d5937e163cecc61cd219fdc64f22b1ab1ff8",
	name: "grantRole",
	filename: "src/lib/canteen/api.ts"
}, (opts) => grantRole.__executeServer(opts));
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
}).parse(input)).handler(grantRole_createServerFn_handler, async ({ data, context }) => write(context.userId, async (sql, actor) => {
	const { grantRole: grant } = await import("./logic-BnfpOiNG.mjs");
	return grant(sql, actor, {
		email: data.email,
		role: data.role,
		canteenId: data.canteenId ?? null,
		institutionId: data.institutionId ?? null
	});
}));
var listStaff_createServerFn_handler = createServerRpc({
	id: "fde2ca5dc682a2a828d9914bc97ff49d12061fbfeefce5aad11b359fc63c2962",
	name: "listStaff",
	filename: "src/lib/canteen/api.ts"
}, (opts) => listStaff.__executeServer(opts));
var listStaff = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ canteenId: id }).parse(input)).handler(listStaff_createServerFn_handler, async ({ data, context }) => read(context.userId, async (sql, actor) => {
	const { listStaff: list } = await import("./logic-BnfpOiNG.mjs");
	return list(sql, actor, data.canteenId);
}));
var getAnalytics_createServerFn_handler = createServerRpc({
	id: "79e2ecbeb0790670929f398897b3aa718de0ef967a1a1891117aa64936338278",
	name: "getAnalytics",
	filename: "src/lib/canteen/api.ts"
}, (opts) => getAnalytics.__executeServer(opts));
var getAnalytics = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({
	canteenId: id.nullable().optional(),
	institutionId: id.nullable().optional()
}).parse(input)).handler(getAnalytics_createServerFn_handler, async ({ data, context }) => read(context.userId, async (sql, actor) => {
	const { analytics } = await import("./logic-BnfpOiNG.mjs");
	return analytics(sql, actor, data.canteenId ?? null, data.institutionId ?? null);
}));
var listNotifications_createServerFn_handler = createServerRpc({
	id: "85a307242ac64487c7cc64dbca0d79589436e0a5c70cc3af29139ea716e843b2",
	name: "listNotifications",
	filename: "src/lib/canteen/api.ts"
}, (opts) => listNotifications.__executeServer(opts));
var listNotifications = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listNotifications_createServerFn_handler, async ({ context }) => read(context.userId, async (sql) => {
	const { listNotifications: list } = await import("./logic-BnfpOiNG.mjs");
	return list(sql, context.userId);
}));
var markNotificationsRead_createServerFn_handler = createServerRpc({
	id: "51dae97c4abf5d1d1cab0fa1118f2180ab0178eccb123e10aa6202f17ac85a8b",
	name: "markNotificationsRead",
	filename: "src/lib/canteen/api.ts"
}, (opts) => markNotificationsRead.__executeServer(opts));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(markNotificationsRead_createServerFn_handler, async ({ context }) => write(context.userId, async (sql) => {
	const { markNotificationsRead: mark } = await import("./logic-BnfpOiNG.mjs");
	return mark(sql, context.userId);
}));
var addReview_createServerFn_handler = createServerRpc({
	id: "d12ba2b9ea67231d05da271c0c37fca6ef3146f49bb0e1a2418ef6433c16c640",
	name: "addReview",
	filename: "src/lib/canteen/api.ts"
}, (opts) => addReview.__executeServer(opts));
var addReview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	orderId: id,
	rating: number().int().min(1).max(5),
	comment: string().max(280)
}).parse(input)).handler(addReview_createServerFn_handler, async ({ data, context }) => write(context.userId, async (sql, actor) => {
	const { addReview: review } = await import("./logic-BnfpOiNG.mjs");
	return review(sql, actor, data.orderId, data.rating, data.comment);
}));
var submitPartner_createServerFn_handler = createServerRpc({
	id: "b788326eab1732216e527054eab2faa89353fb46c940792de7e7a31a82c57d51",
	name: "submitPartner",
	filename: "src/lib/canteen/api.ts"
}, (opts) => submitPartner.__executeServer(opts));
var submitPartner = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	orgName: string().trim().min(2).max(120),
	campusName: string().trim().max(120),
	note: string().max(500)
}).parse(input)).handler(submitPartner_createServerFn_handler, async ({ data, context }) => {
	rateLimit(`lead:${context.userId}`, 5, 6e4);
	return write(context.userId, async (sql) => {
		const { submitPartner: submit } = await import("./logic-BnfpOiNG.mjs");
		return submit(sql, context.userId, data.orgName, data.campusName, data.note);
	});
});
var platformOverview_createServerFn_handler = createServerRpc({
	id: "0129d6955d3d428e440180787885cfcb0c3dd320a016ea73d5740286374348d5",
	name: "platformOverview",
	filename: "src/lib/canteen/api.ts"
}, (opts) => platformOverview.__executeServer(opts));
var platformOverview = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(platformOverview_createServerFn_handler, async ({ context }) => read(context.userId, async (sql, actor) => {
	const { platformOverview: overview } = await import("./logic-BnfpOiNG.mjs");
	return overview(sql, actor);
}));
//#endregion
export { addReview_createServerFn_handler, cancelOrder_createServerFn_handler, createItem_createServerFn_handler, getAnalytics_createServerFn_handler, getCart_createServerFn_handler, getMe_createServerFn_handler, getMenu_createServerFn_handler, getOrder_createServerFn_handler, getPulse_createServerFn_handler, grantRole_createServerFn_handler, listDirectory_createServerFn_handler, listMyOrders_createServerFn_handler, listNotifications_createServerFn_handler, listQueue_createServerFn_handler, listStaff_createServerFn_handler, markNotificationsRead_createServerFn_handler, pickupOrder_createServerFn_handler, placeOrder_createServerFn_handler, platformOverview_createServerFn_handler, saveCart_createServerFn_handler, setCanteenStatus_createServerFn_handler, setComboAvailability_createServerFn_handler, setCounterActive_createServerFn_handler, setItemAvailability_createServerFn_handler, settleDemoPayment_createServerFn_handler, submitPartner_createServerFn_handler, transitionOrder_createServerFn_handler, updateItem_createServerFn_handler };
