import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  buildSalesCandidatePools,
  buildSalesRecommendations,
  isValidSalesSelection,
  rankSalesItems,
} from "../../../canteen-analytics.js";
import {
  couponDiscount,
  estimateWait,
  friendlyError,
  rateLimit,
  requestHash,
  resetRateLimits,
  unitPaise,
  verifyHmacSha256,
  type Actor,
} from "./domain.ts";
import {
  actorFrom,
  applyWebhookEvent,
  getOrder,
  placeOrder,
  pickupOrder,
  salesSnapshot,
  saveCart,
  setCanteenStatus,
  setItemAvailability,
  settlePayment,
  transitionOrder,
  type CheckoutLine,
} from "./logic.ts";
import { toSql, type Sql } from "./sql.ts";

describe("pricing and access rules", () => {
  it("prices a discounted line in paise and ignores a short coupon", () => {
    assert.equal(unitPaise(6400, 500, 0, 1500), 7400);
    assert.equal(couponDiscount(9000, { kind: "PERCENT", value: 10, minPaise: 10000 }), 0);
    assert.equal(couponDiscount(20000, { kind: "PERCENT", value: 10, minPaise: 10000 }), 2000);
  });

  it("estimates a longer wait when more orders are ahead of a small kitchen", () => {
    assert.equal(estimateWait(0, 8, 4), 8);
    assert.ok(estimateWait(6, 8, 2) > estimateWait(1, 8, 4));
  });

  it("strips error codes and rate-limits a repeated caller", () => {
    assert.equal(friendlyError("[ITEM_UNAVAILABLE] Sold out"), "Sold out");
    resetRateLimits();
    rateLimit("test-bucket", 2, 10_000);
    rateLimit("test-bucket", 2, 10_000);
    assert.throws(() => rateLimit("test-bucket", 2, 10_000), /RATE_LIMIT/);
  });

  it("verifies webhook signatures and rejects a tampered body", async () => {
    const raw = '{"id":"evt_1"}';
    const sig = await sign(raw, "topsecret");
    assert.equal(await verifyHmacSha256("topsecret", raw, sig), true);
    assert.equal(await verifyHmacSha256("topsecret", raw + " ", sig), false);
  });
});

describe("standalone canteen analytics", () => {
  const items = rankSalesItems([
    { id: "tea", name: "Tea", categoryName: "Drinks", availability: "AVAILABLE", quantitySold: 8, revenuePaise: 8000, lastOrderedAt: "2026-10-17" },
    { id: "snack", name: "Snack", categoryName: "Snacks", availability: "AVAILABLE", quantitySold: 3, revenuePaise: 4500, lastOrderedAt: "2026-10-16" },
    { id: "quiet", name: "Quiet item", categoryName: "Snacks", availability: "AVAILABLE", quantitySold: 0, revenuePaise: 0, lastOrderedAt: null },
    { id: "hidden", name: "Hidden item", categoryName: "Snacks", availability: "HIDDEN", quantitySold: 0, revenuePaise: 0, lastOrderedAt: null },
  ]);
  const snapshot = {
    periodDays: 14 as const,
    items,
    pairs: [{ firstItemId: "snack", secondItemId: "tea", ordersTogether: 2 }],
  };

  it("ranks paid sellers and builds recommendations only from eligible sales candidates", () => {
    assert.equal(items.find((item) => item.id === "tea")?.rank, 1);
    assert.equal(items.find((item) => item.id === "snack")?.rank, 2);
    assert.equal(items.find((item) => item.id === "quiet")?.rank, null);

    const candidates = buildSalesCandidatePools(snapshot);
    assert.deepEqual(candidates.reviewCandidates.map((item) => item.id), ["quiet"]);
    assert.deepEqual(candidates.comboCandidates, [{ itemIds: ["snack", "tea"], ordersTogether: 2 }]);
    assert.equal(buildSalesCandidatePools({ ...snapshot, pairs: [] }).comboCandidates.length, 1);

    const selection = {
      reviewItemIds: ["quiet"],
      promoteItemIds: ["tea"],
      comboPairs: [["tea", "snack"] as [string, string]],
    };
    assert.equal(isValidSalesSelection(selection, candidates), true);
    assert.equal(isValidSalesSelection({ ...selection, promoteItemIds: ["hidden"] }, candidates), false);
    assert.equal(isValidSalesSelection({ ...selection, comboPairs: [["tea", "tea"]] }, candidates), false);

    const recommendations = buildSalesRecommendations(snapshot, candidates, selection);
    assert.equal(recommendations.review[0]?.reason, "NO_RECENT_SALES");
    assert.equal(recommendations.promote[0]?.rank, 1);
    assert.equal(recommendations.combos[0]?.ordersTogether, 2);
  });
});

async function sign(raw: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("canteen ordering invariants", () => {
  let pg: PGlite;

  async function tx<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
    return pg.transaction(async (trx) =>
      fn(toSql(async (text, params) => (await trx.query(text, params)).rows)),
    );
  }

  it("boots the demo schema", async () => {
    pg = new PGlite();
    await pg.waitReady;
    for (const name of ["0001_auth.sql", "0002_canteenx.sql", "0003_seed.sql"]) {
      await pg.exec(readFileSync(new URL(`../../../migrations/${name}`, import.meta.url), "utf8"));
    }
    const items = await pg.query<{ n: number }>("select count(*)::int as n from items");
    assert.ok(Number(items.rows[0]?.n) > 40);
  });

  it("builds a 14-day paid-sales snapshot and restricts it to canteen admins", async () => {
    const institutionAdmin = await tx((sql) => actorFrom(sql, "user_demo_institution"));
    const customer = await tx((sql) => actorFrom(sql, "user_demo_customer"));

    await tx((sql) => sql.query(
      "update orders set placed_at = now() - interval '30 days' where id = $1",
      ["ord_hist_1"],
    ));
    try {
      const expired = await tx((sql) => salesSnapshot(sql, institutionAdmin, "canteen_central"));
      const expiredSandwich = expired.items.find((item) => item.id === "itm_veg_sandwich");
      assert.equal(expiredSandwich?.quantitySold, 0);
      assert.equal(expiredSandwich?.revenuePaise, 0);
      assert.equal(expiredSandwich?.lastOrderedAt, null);
    } finally {
      await tx((sql) => sql.query(
        "update orders set placed_at = now() - interval '2 days' where id = $1",
        ["ord_hist_1"],
      ));
    }

    await tx((sql) => sql.query(
      "update orders set payment_status = 'FAILED' where id = $1",
      ["ord_hist_1"],
    ));
    try {
      const unpaid = await tx((sql) => salesSnapshot(sql, institutionAdmin, "canteen_central"));
      const unpaidSandwich = unpaid.items.find((item) => item.id === "itm_veg_sandwich");
      assert.equal(unpaidSandwich?.quantitySold, 0);
      assert.equal(unpaidSandwich?.revenuePaise, 0);
    } finally {
      await tx((sql) => sql.query(
        "update orders set payment_status = 'PAID' where id = $1",
        ["ord_hist_1"],
      ));
    }

    const snapshot = await tx((sql) => salesSnapshot(sql, institutionAdmin, "canteen_central"));
    const sandwichItem = snapshot.items.find((item) => item.id === "itm_veg_sandwich");

    assert.equal(snapshot.periodDays, 14);
    assert.ok(snapshot.items.length > 40);
    assert.equal(sandwichItem?.quantitySold, 2);
    assert.equal(sandwichItem?.revenuePaise, 6000);
    assert.notEqual(sandwichItem?.lastOrderedAt, null);
    assert.ok(sandwichItem?.rank);
    await assert.rejects(
      () => tx((sql) => salesSnapshot(sql, customer, "canteen_central")),
      /FORBIDDEN/,
    );
    await assert.rejects(
      () => tx((sql) => salesSnapshot(sql, institutionAdmin, "canteen_night")),
      /FORBIDDEN/,
    );
  });

  it("rejects an unavailable item from the cart and the order API, then allows it again", async () => {
    const staff = await tx((sql) => actorFrom(sql, "user_demo_staff"));
    const customer = await tx((sql) => actorFrom(sql, "user_demo_customer"));
    await tx((sql) => setItemAvailability(sql, staff, "itm_veg_sandwich", "UNAVAILABLE"));
    await assert.rejects(
      () => tx((sql) => saveCart(sql, customer.userId, "canteen_central", [sandwich(1)])),
      /ITEM_UNAVAILABLE/,
    );
    await assert.rejects(() => tx((sql) => placeOrder(sql, customer, orderOf(3000))), /ITEM_UNAVAILABLE/);
    await tx((sql) => setItemAvailability(sql, staff, "itm_veg_sandwich", "AVAILABLE"));
    const cart = await tx((sql) => saveCart(sql, customer.userId, "canteen_central", [sandwich(1)]));
    assert.equal(cart.blocked, false);
    const placed = await tx((sql) => placeOrder(sql, customer, orderOf(cart.totalPaise, "idem-on-again")));
    assert.equal(placed.status, "PLACED");
    assert.match(placed.token, /^C/);
  });

  it("rejects a closed canteen, a tampered price, and an unset MRP", async () => {
    const admin = await tx((sql) => actorFrom(sql, "user_demo_institution"));
    const customer = await tx((sql) => actorFrom(sql, "user_demo_customer"));
    await tx((sql) => setCanteenStatus(sql, admin, "canteen_central", "CLOSED"));
    await assert.rejects(
      () => tx((sql) => placeOrder(sql, customer, orderOf(3500, "idem-closed"))),
      /CANTEEN_CLOSED/,
    );
    await tx((sql) => setCanteenStatus(sql, admin, "canteen_central", "PAUSED"));
    await assert.rejects(
      () => tx((sql) => placeOrder(sql, customer, orderOf(3500, "idem-paused"))),
      /CANTEEN_CLOSED/,
    );
    await tx((sql) => setCanteenStatus(sql, admin, "canteen_central", "OPEN"));
    await assert.rejects(
      () => tx((sql) => placeOrder(sql, customer, orderOf(3500, "idem-tamper", 1))),
      /PRICE_MISMATCH/,
    );
    await assert.rejects(
      () =>
        tx((sql) =>
          placeOrder(sql, customer, {
            ...orderOf(3500, "idem-total"),
            expectedTotalPaise: 1,
          }),
        ),
      /PRICE_MISMATCH/,
    );
    await assert.rejects(
      () =>
        tx((sql) =>
          placeOrder(sql, customer, {
            canteenId: "canteen_central",
            lines: [{ itemId: "itm_ice", qty: 1, clientUnitPaise: 0 }],
            couponCode: null,
            instructions: null,
            expectedTotalPaise: 500,
            idempotencyKey: "idem-ice",
          }),
        ),
      /PRICE_UNSET/,
    );
  });

  it("keeps duplicate checkouts to one order and does not fulfil a failed or raced payment", async () => {
    const customer = await tx((sql) => actorFrom(sql, "user_demo_customer"));
    const staff = await tx((sql) => actorFrom(sql, "user_demo_staff"));
    const first = await tx((sql) => placeOrder(sql, customer, orderOf(3500, "idem-dup")));
    const second = await tx((sql) => placeOrder(sql, customer, orderOf(3500, "idem-dup")));
    assert.equal(first.id, second.id);
    const count = await pg.query<{ n: number }>("select count(*)::int as n from orders where idempotency_key = 'idem-dup'");
    assert.equal(Number(count.rows[0]?.n), 1);

    const failed = await tx((sql) =>
      settlePayment(sql, customer, first.id, "FAILED", "DEMO", "evt-fail-dup", null),
    );
    assert.equal(failed.paymentStatus, "FAILED");
    assert.equal(failed.status, "PLACED");
    const paid = await tx((sql) =>
      settlePayment(sql, customer, first.id, "PAID", "DEMO", "evt-paid-dup", null),
    );
    assert.equal(paid.status, "PAYMENT_CONFIRMED");

    const raced = await tx((sql) => placeOrder(sql, customer, orderOf(3500, "idem-race")));
    await tx((sql) => setItemAvailability(sql, staff, "itm_veg_sandwich", "SOLD_OUT"));
    const blocked = await tx((sql) =>
      settlePayment(sql, customer, raced.id, "PAID", "DEMO", "evt-race", null),
    );
    assert.equal(blocked.blocked, true);
    const row = await pg.query<{ status: string; payment_status: string }>("select status, payment_status from orders where id = $1", [raced.id]);
    assert.equal(row.rows[0]?.status, "CANCELLED");
    assert.notEqual(row.rows[0]?.payment_status, "PAID");
    await tx((sql) => setItemAvailability(sql, staff, "itm_veg_sandwich", "AVAILABLE"));
  });

  it("isolates tenants and enforces pickup rules", async () => {
    const night = await tx((sql) => actorFrom(sql, "user_demo_night"));
    const staff = await tx((sql) => actorFrom(sql, "user_demo_staff"));
    const customer = await tx((sql) => actorFrom(sql, "user_demo_customer"));
    await assert.rejects(
      () => tx((sql) => setItemAvailability(sql, night, "itm_veg_sandwich", "UNAVAILABLE")),
      /FORBIDDEN/,
    );
    const still = await pg.query<{ availability: string }>("select availability from items where id = 'itm_veg_sandwich'");
    assert.equal(still.rows[0]?.availability, "AVAILABLE");
    await assert.rejects(
      () => tx((sql) => getOrder(sql, night, "ord_live_1")),
      /FORBIDDEN/,
    );

    const placed = await tx((sql) => placeOrder(sql, customer, orderOf(3500, "idem-pickup")));
    await tx((sql) => settlePayment(sql, customer, placed.id, "PAID", "DEMO", "evt-pickup-pay", null));
    await assert.rejects(
      () => tx((sql) => pickupOrder(sql, staff, "canteen_central", placed.token)),
      /NOT_READY/,
    );
    await assert.rejects(
      () => tx((sql) => pickupOrder(sql, night, "canteen_central", placed.token)),
      /FORBIDDEN/,
    );
    await assert.rejects(
      () => tx((sql) => transitionOrder(sql, customer, placed.id, "ACCEPTED")),
      /FORBIDDEN/,
    );
    await tx((sql) => transitionOrder(sql, staff, placed.id, "ACCEPTED"));
    await tx((sql) => transitionOrder(sql, staff, placed.id, "PREPARING"));
    await tx((sql) => transitionOrder(sql, staff, placed.id, "READY_FOR_PICKUP"));
    await assert.rejects(
      () => tx((sql) => pickupOrder(sql, night, "canteen_night", placed.token)),
      /WRONG_CANTEEN/,
    );
    const got = await tx((sql) => pickupOrder(sql, staff, "canteen_central", `CX|${placed.id}|${placed.token}`));
    assert.equal(got.status, "PICKED_UP");
    await assert.rejects(
      () => tx((sql) => pickupOrder(sql, staff, "canteen_central", placed.token)),
      /ALREADY_COLLECTED/,
    );
    await assert.rejects(
      () => tx((sql) => pickupOrder(sql, staff, "canteen_central", "NOT-A-TOKEN")),
      /NOT_FOUND/,
    );
  });

  it("applies a signed webhook once and ignores a second delivery", async () => {
    const customer = await tx((sql) => actorFrom(sql, "user_demo_customer"));
    const placed = await tx((sql) => placeOrder(sql, customer, orderOf(3500, "idem-hook")));
    const body = {
      id: "evt_hook_1",
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_hook", notes: { canteenx_order_id: placed.id } } } },
    };
    const first = await tx((sql) => applyWebhookEvent(sql, body));
    assert.equal("blocked" in first && first.blocked, false);
    const again = await tx((sql) => applyWebhookEvent(sql, body));
    assert.equal("idempotent" in again && again.idempotent, true);
    const rows = await pg.query<{ n: number }>("select count(*)::int as n from payment_events where id = 'evt_hook_1'");
    assert.equal(Number(rows.rows[0]?.n), 1);
  });
});

function sandwich(qty: number): CheckoutLine {
  return { itemId: "itm_veg_sandwich", qty, addonIds: [], clientUnitPaise: 3000 };
}

function orderOf(expected: number, key = "idem-default", unit = 3000) {
  return {
    canteenId: "canteen_central",
    lines: [{ itemId: "itm_veg_sandwich", qty: 1, addonIds: [] as string[], clientUnitPaise: unit }],
    couponCode: null,
    instructions: "Less butter",
    expectedTotalPaise: expected,
    idempotencyKey: key,
  };
}

void (0 as unknown as Actor);
