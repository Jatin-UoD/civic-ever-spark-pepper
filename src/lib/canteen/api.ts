import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { rateLimit, type Availability, type CartLine, type Role } from "./domain.ts";

const id = z.string().trim().min(1).max(80);
const lineSchema = z.object({
  itemId: z.string().trim().max(80).optional(),
  comboId: z.string().trim().max(80).optional(),
  variantId: z.string().trim().max(80).nullable().optional(),
  addonIds: z.array(z.string().trim().max(80)).max(8).optional(),
  qty: z.number().int().min(1).max(10),
  instructions: z.string().max(140).optional(),
});

async function read<T>(userId: string, fn: (sql: import("./sql.ts").Sql, actor: import("./domain.ts").Actor) => Promise<T>) {
  const { getSql } = await import("@/lib/db");
  const { actorFrom } = await import("./logic.ts");
  const sql = await getSql();
  const actor = await actorFrom(sql, userId);
  return fn(sql, actor);
}

async function write<T>(userId: string, fn: (sql: import("./sql.ts").Sql, actor: import("./domain.ts").Actor) => Promise<T>) {
  const { withTransaction } = await import("./tx.server.ts");
  const { actorFrom } = await import("./logic.ts");
  return withTransaction(async (sql) => {
    const actor = await actorFrom(sql, userId);
    return fn(sql, actor);
  });
}

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const { loadMe } = await import("./logic.ts");
    return loadMe(await getSql(), context.userId);
  });

export const listDirectory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => read(context.userId, async (sql) => {
    const { listDirectory: list } = await import("./logic.ts");
    return list(sql);
  }));

export const getMenu = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id }).parse(input))
  .handler(async ({ data, context }) => read(context.userId, async (sql, actor) => {
    const { getMenu: menu } = await import("./logic.ts");
    return menu(sql, actor, data.canteenId);
  }));

export const getPulse = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id }).parse(input))
  .handler(async ({ data, context }) => {
    const { demandPricingDue, runDemandPricing } = await import("./logic.ts");
    const due = await read(context.userId, (sql) => demandPricingDue(sql, data.canteenId));
    if (due) await write(context.userId, (sql) => runDemandPricing(sql, data.canteenId));
    return read(context.userId, async (sql) => {
      const { getPulse: pulse } = await import("./logic.ts");
      return pulse(sql, data.canteenId);
    });
  });

export const getCart = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id, couponCode: z.string().max(40).nullable().optional() }).parse(input))
  .handler(async ({ data, context }) => read(context.userId, async (sql) => {
    const { getCart: cart } = await import("./logic.ts");
    return cart(sql, context.userId, data.canteenId, data.couponCode ?? null);
  }));

export const saveCart = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id, lines: z.array(lineSchema).max(30) }).parse(input))
  .handler(async ({ data, context }) => {
    rateLimit(`cart:${context.userId}`, 40, 60_000);
    return write(context.userId, async (sql) => {
      const { saveCart: save } = await import("./logic.ts");
      return save(sql, context.userId, data.canteenId, data.lines as CartLine[]);
    });
  });

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({
      canteenId: id,
      idempotencyKey: z.string().trim().min(8).max(80),
      expectedTotalPaise: z.number().int().nonnegative().max(2_000_000),
      couponCode: z.string().max(40).nullable().optional(),
      instructions: z.string().max(140).nullable().optional(),
      lines: z.array(lineSchema.extend({ clientUnitPaise: z.number().int().nonnegative() })).min(1).max(30),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    rateLimit(`checkout:${context.userId}`, 8, 60_000);
    return write(context.userId, async (sql, actor) => {
      const { placeOrder: place } = await import("./logic.ts");
      return place(sql, actor, {
        canteenId: data.canteenId,
        lines: data.lines,
        couponCode: data.couponCode ?? null,
        instructions: data.instructions ?? null,
        expectedTotalPaise: data.expectedTotalPaise,
        idempotencyKey: data.idempotencyKey,
      });
    });
  });

export const settleDemoPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ orderId: id, outcome: z.enum(["PAID", "FAILED"]) }).parse(input))
  .handler(async ({ data, context }) => {
    rateLimit(`pay:${context.userId}`, 12, 60_000);
    return write(context.userId, async (sql, actor) => {
      const { settlePayment } = await import("./logic.ts");
      const result = await settlePayment(
        sql,
        actor,
        data.orderId,
        data.outcome,
        "DEMO",
        `demo:${data.orderId}:${data.outcome}:${Date.now()}`,
        null,
      );
      if (result.blocked) {
        const { CanteenError } = await import("./domain.ts");
        throw new CanteenError("ITEM_UNAVAILABLE", result.message ?? "That item can no longer be sold.");
      }
      return result;
    });
  });

export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ orderId: id, reason: z.string().max(180) }).parse(input))
  .handler(async ({ data, context }) => write(context.userId, async (sql, actor) => {
    const { cancelOrder: cancel } = await import("./logic.ts");
    return cancel(sql, actor, data.orderId, data.reason);
  }));

export const getOrder = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ orderId: id }).parse(input))
  .handler(async ({ data, context }) => {
    const order = await read(context.userId, async (sql, actor) => {
      const { getOrder: load } = await import("./logic.ts");
      return load(sql, actor, data.orderId);
    });
    const QRCode = await import("qrcode");
    const qrSvg = await QRCode.toString(order.pickupCode, {
      type: "svg",
      margin: 1,
      color: { dark: "#1a1612", light: "#fffdf8" },
    });
    return { ...order, qrSvg };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => read(context.userId, async (sql) => {
    const { listMyOrders: list } = await import("./logic.ts");
    return list(sql, context.userId);
  }));

export const listQueue = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id }).parse(input))
  .handler(async ({ data, context }) => read(context.userId, async (sql, actor) => {
    const { listQueue: list } = await import("./logic.ts");
    return list(sql, actor, data.canteenId);
  }));

export const transitionOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({
    orderId: id,
    to: z.enum(["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"]),
  }).parse(input))
  .handler(async ({ data, context }) => write(context.userId, async (sql, actor) => {
    const { transitionOrder: move } = await import("./logic.ts");
    return move(sql, actor, data.orderId, data.to);
  }));

export const pickupOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id, code: z.string().trim().min(2).max(120) }).parse(input))
  .handler(async ({ data, context }) => {
    rateLimit(`pickup:${context.userId}`, 30, 60_000);
    return write(context.userId, async (sql, actor) => {
      const { pickupOrder: pickup } = await import("./logic.ts");
      return pickup(sql, actor, data.canteenId, data.code);
    });
  });

const availability = z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD_OUT", "HIDDEN"]);

export const setItemAvailability = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ itemId: id, availability }).parse(input))
  .handler(async ({ data, context }) => {
    rateLimit(`avail:${context.userId}`, 60, 60_000);
    return write(context.userId, async (sql, actor) => {
      const { setItemAvailability: set } = await import("./logic.ts");
      return set(sql, actor, data.itemId, data.availability as Availability);
    });
  });

export const setComboAvailability = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ comboId: id, availability }).parse(input))
  .handler(async ({ data, context }) => write(context.userId, async (sql, actor) => {
    const { setComboAvailability: set } = await import("./logic.ts");
    return set(sql, actor, data.comboId, data.availability as Availability);
  }));

export const setCanteenStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id, status: z.enum(["OPEN", "CLOSED", "PAUSED"]) }).parse(input))
  .handler(async ({ data, context }) => write(context.userId, async (sql, actor) => {
    const { setCanteenStatus: set } = await import("./logic.ts");
    return set(sql, actor, data.canteenId, data.status);
  }));

export const setCounterActive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ counterId: id, active: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => write(context.userId, async (sql, actor) => {
    const { setCounterActive: set } = await import("./logic.ts");
    return set(sql, actor, data.counterId, data.active);
  }));

export const updateItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({
    itemId: id,
    name: z.string().max(80).optional(),
    description: z.string().max(240).optional(),
    basePricePaise: z.number().int().nonnegative().nullable().optional(),
    discountPaise: z.number().int().nonnegative().optional(),
    prepMinutes: z.number().int().min(1).max(180).optional(),
    diet: z.enum(["veg", "egg", "nonveg"]).optional(),
    availability: availability.optional(),
  }).parse(input))
  .handler(async ({ data, context }) => write(context.userId, async (sql, actor) => {
    const { updateItem: update } = await import("./logic.ts");
    const { itemId, ...patch } = data;
    return update(sql, actor, itemId, patch);
  }));

export const createItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({
    canteenId: id,
    categoryId: id,
    name: z.string().trim().min(1).max(80),
    basePricePaise: z.number().int().nonnegative(),
    prepMinutes: z.number().int().min(1).max(180),
    diet: z.enum(["veg", "egg", "nonveg"]),
  }).parse(input))
  .handler(async ({ data, context }) => write(context.userId, async (sql, actor) => {
    const { createItem: create } = await import("./logic.ts");
    return create(sql, actor, data);
  }));

export const grantRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({
    email: z.string().email().max(160),
    role: z.enum(["CUSTOMER", "STAFF", "CANTEEN_ADMIN", "INSTITUTION_ADMIN", "SUPER_ADMIN"]),
    canteenId: id.nullable().optional(),
    institutionId: id.nullable().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => write(context.userId, async (sql, actor) => {
    const { grantRole: grant } = await import("./logic.ts");
    return grant(sql, actor, {
      email: data.email,
      role: data.role as Role,
      canteenId: data.canteenId ?? null,
      institutionId: data.institutionId ?? null,
    });
  }));

export const listStaff = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id }).parse(input))
  .handler(async ({ data, context }) => read(context.userId, async (sql, actor) => {
    const { listStaff: list } = await import("./logic.ts");
    return list(sql, actor, data.canteenId);
  }));

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({
    canteenId: id.nullable().optional(),
    institutionId: id.nullable().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => read(context.userId, async (sql, actor) => {
    const { analytics } = await import("./logic.ts");
    return analytics(sql, actor, data.canteenId ?? null, data.institutionId ?? null);
  }));

const demandPricingSettings = z.object({
  moderateDemandPercent: z.number().int().min(1).max(1000),
  moderatePricePercent: z.number().int().min(0).max(20),
  highDemandPercent: z.number().int().min(2).max(1000),
  highPricePercent: z.number().int().min(0).max(20),
});

export const getDemandPricing = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id }).parse(input))
  .handler(async ({ data, context }) => read(context.userId, async (sql, actor) => {
    const { getDemandPricing: getSettings } = await import("./logic.ts");
    return getSettings(sql, actor, data.canteenId);
  }));

export const saveDemandPricing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id, settings: demandPricingSettings }).parse(input))
  .handler(async ({ data, context }) => {
    rateLimit(`demand-pricing:${context.userId}:${data.canteenId}`, 10, 60_000);
    return write(context.userId, async (sql, actor) => {
      const { saveDemandPricing: save } = await import("./logic.ts");
      return save(sql, actor, data.canteenId, data.settings);
    });
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => read(context.userId, async (sql) => {
    const { listNotifications: list } = await import("./logic.ts");
    return list(sql, context.userId);
  }));

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => write(context.userId, async (sql) => {
    const { markNotificationsRead: mark } = await import("./logic.ts");
    return mark(sql, context.userId);
  }));

export const addReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({
    orderId: id,
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(280),
  }).parse(input))
  .handler(async ({ data, context }) => write(context.userId, async (sql, actor) => {
    const { addReview: review } = await import("./logic.ts");
    return review(sql, actor, data.orderId, data.rating, data.comment);
  }));

export const submitPartner = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({
    orgName: z.string().trim().min(2).max(120),
    campusName: z.string().trim().max(120),
    note: z.string().max(500),
  }).parse(input))
  .handler(async ({ data, context }) => {
    rateLimit(`lead:${context.userId}`, 5, 60_000);
    return write(context.userId, async (sql) => {
      const { submitPartner: submit } = await import("./logic.ts");
      return submit(sql, context.userId, data.orgName, data.campusName, data.note);
    });
  });

export const askCounter = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ canteenId: id, question: z.string().trim().min(2).max(240) }).parse(input))
  .handler(async ({ data, context }) => {
    rateLimit(`ask:${context.userId}`, 8, 60_000);
    return read(context.userId, async (sql, actor) => {
      const { getMenu: menu } = await import("./logic.ts");
      const { askNemotron } = await import("./nemotron.server.ts");
      return askNemotron(await menu(sql, actor, data.canteenId), data.question);
    });
  });

export const platformOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => read(context.userId, async (sql, actor) => {
    const { platformOverview: overview } = await import("./logic.ts");
    return overview(sql, actor);
  }));
