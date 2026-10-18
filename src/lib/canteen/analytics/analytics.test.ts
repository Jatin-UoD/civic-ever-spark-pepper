import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PGlite } from "@electric-sql/pglite";
import { canViewAnalytics } from "./access.js";
import { csvCell } from "./csv.js";
import { computeOverview } from "./metrics.js";
import { ruleInsights } from "./insights.js";
import {
  assertAccess,
  decideRecommendation,
  generateInsights,
  getOverview,
  getRecommendations,
  getSelectedCanteen,
  setSelectedCanteen,
} from "./service.server.ts";
import { loadSnapshot } from "./repo.server.ts";
import { actorFrom } from "../logic.ts";
import { toSql, type Sql } from "../sql.ts";
import type { Actor } from "../domain.ts";
import { parseContextBody, parseDecisionBody } from "./validation.js";

const now = new Date("2026-10-19T12:00:00+05:30");
const menu = [
  { id: "tea", name: "Masala Tea", categoryName: "Drinks", categoryId: "drinks", availability: "AVAILABLE" },
  { id: "bun", name: "Bun", categoryName: "Others", categoryId: null, availability: "AVAILABLE" },
  { id: "quiet", name: "<script>alert(1)</script>", categoryName: "Others", categoryId: null, availability: "AVAILABLE" },
  { id: "off", name: "Switched off", categoryName: "Food", categoryId: "food", availability: "UNAVAILABLE" },
];

function line(orderId: string, placedAt: string, itemId: string, quantity: number, unitPricePaise: number, customerId = "cust-1") {
  return {
    orderId,
    customerId,
    placedAt,
    itemId,
    itemName: itemId,
    categoryName: itemId === "tea" ? "Drinks" : "Others",
    categoryId: itemId === "tea" ? "drinks" : null,
    quantity,
    unitPricePaise,
    paymentStatus: "PAID",
    orderStatus: "PICKED_UP",
  };
}

describe("canteen analytics metrics", () => {
  it("computes paid revenue, ranks, growth and zero-filled IST daily sales", () => {
    const lines = [
      line("now-1", "2026-10-19T09:00:00+05:30", "tea", 2, 500, "cust-1"),
      line("now-2", "2026-10-18T15:00:00+05:30", "tea", 1, 600, "cust-2"),
      line("now-2", "2026-10-18T15:00:00+05:30", "bun", 1, 250, "cust-2"),
      line("prev", "2026-10-05T15:00:00+05:30", "tea", 1, 400),
      { ...line("unpaid", "2026-10-19T10:00:00+05:30", "tea", 50, 1000), paymentStatus: "FAILED" },
      { ...line("cancelled", "2026-10-19T10:00:00+05:30", "tea", 50, 1000), orderStatus: "CANCELLED" },
    ];
    const overview = computeOverview({ lines, menu, now });
    assert.equal(overview.kpis.orders.value, 2);
    assert.equal(overview.kpis.orders.previous, 1);
    assert.equal(overview.kpis.orders.changePct, 100);
    assert.equal(overview.kpis.revenuePaise.value, 1850);
    assert.equal(overview.kpis.revenuePaise.previous, 400);
    assert.equal(overview.kpis.uniqueCustomers.value, 2);
    assert.equal(overview.dailyTrend.length, 14);
    assert.equal(overview.dailyTrend[13]?.date, "2026-10-19");
    assert.equal(overview.dailyTrend[0]?.orders, 0);
    assert.deepEqual(
      overview.itemPerformance.slice(0, 2).map(({ itemId, rank }) => [itemId, rank]),
      [["tea", 1], ["bun", 2]],
    );
    assert.equal(overview.itemPerformance.find((item) => item.itemId === "tea")?.revenuePaise, 1600);
    assert.equal(overview.lowSales.find((item) => item.itemId === "quiet")?.reason, "no_sales");
    assert.equal(overview.lowSales.some((item) => item.itemId === "off"), false);
    assert.equal(overview.categories.find((category) => category.name === "Others")?.revenuePaise, 250);
  });

  it("counts co-purchases once per paid order and caps combinations to 15 unique items", () => {
    const lines = [];
    for (let i = 0; i < 3; i += 1) {
      lines.push(
        line(`pair-${i}`, `2026-10-${String(19 - i).padStart(2, "0")}T10:00:00+05:30`, "tea", 2, 500),
        line(`pair-${i}`, `2026-10-${String(19 - i).padStart(2, "0")}T10:00:00+05:30`, "bun", 1, 200),
      );
    }
    const overview = computeOverview({ lines, menu, now });
    assert.deepEqual(overview.combos.map((pair) => [pair.ordersTogether, pair.orderSharePct]), [[3, 100]]);
  });

  it("builds only measured insights and no suggestions with no paid orders", () => {
    const overview = computeOverview({
      lines: [
        line("a", "2026-10-19T09:00:00+05:30", "tea", 1, 500),
        line("b", "2026-10-19T09:30:00+05:30", "bun", 1, 300),
      ],
      menu,
      now,
    });
    const suggestions = ruleInsights(overview);
    assert.ok(suggestions.some((entry) => entry.kind === "top_sellers" && entry.itemIds.includes("tea")));
    const allowedIds = new Set(menu.map((item) => item.id));
    assert.ok(suggestions.flatMap((entry) => entry.itemIds).every((id) => allowedIds.has(id)));
    assert.deepEqual(ruleInsights(computeOverview({ lines: [], menu, now })), []);
  });

  it("escapes formula-leading CSV values and HTML text is rendered as text", () => {
    assert.equal(csvCell("=SUM(A1:A2)"), "\"'=SUM(A1:A2)\"");
    assert.equal(csvCell(" +cmd"), "\"' +cmd\"");
    assert.match(renderToStaticMarkup(createElement("p", null, "<img src=x onerror=alert(1)>")), /&lt;img/);
  });

  it("rejects malformed recommendation decision and generation inputs", () => {
    assert.equal(parseDecisionBody({ id: "rec-1", decision: "approved" })?.id, "rec-1");
    assert.equal(parseDecisionBody({ id: "rec-1", decision: "deleted" }), null);
    assert.equal(parseDecisionBody({ id: "", decision: "dismissed" }), null);
    assert.equal(parseContextBody({ canteenId: "canteen-1" })?.canteenId, "canteen-1");
    assert.equal(parseContextBody({ canteenId: " " }), null);
  });

  it("rejects non-admin roles and makes no analytics query", async () => {
    for (const role of ["customer", "staff", "CANTEEN_ADMIN", "", null]) {
      assert.equal(canViewAnalytics(role), false);
    }
    const calls: string[] = [];
    const sql = Object.assign(
      async () => [],
      {
        query: async <T,>(text: string) => {
          calls.push(text);
          return [] as T[];
        },
      },
    ) as Sql;
    const customer: Actor = { userId: "customer-1", memberships: [{ role: "CUSTOMER", institutionId: null, canteenId: null, active: true }] };
    await assert.rejects(() => assertAccess(sql, customer, customer.userId, "canteen-1"), /access/i);
    assert.equal(calls.length, 0);
  });

  it("scopes every analytics snapshot query to its selected canteen", async () => {
    const statements: string[] = [];
    const sql = Object.assign(
      async () => [],
      {
        query: async <T,>(text: string) => {
          statements.push(text);
          return [] as T[];
        },
      },
    ) as Sql;
    await loadSnapshot(sql, "canteen-one");
    assert.equal(statements.length, 2);
    assert.ok(statements.every((text) => /where\s+(?:o|i)\.canteen_id\s*=\s*\$1/i.test(text)));
  });

  it("runs the migrated, tenant-filtered repository against the PGlite schema", async () => {
    const pg = new PGlite();
    await pg.waitReady;
    for (const file of [
      "0001_auth.sql",
      "0002_canteenx.sql",
      "0003_seed.sql",
      "0004_demand_pricing.sql",
      "0005_canteen_analytics.sql",
    ]) {
      await pg.exec(readFileSync(new URL(`../../../../migrations/${file}`, import.meta.url), "utf8"));
    }
    const sql = toSql(async (text, params) => (await pg.query(text, params)).rows);
    const actor = await actorFrom(sql, "user_demo_institution");
    await sql.query(
      "update orders set placed_at = now(), payment_status = 'PAID', status = 'PICKED_UP' where id = $1",
      ["ord_hist_1"],
    );
    await setSelectedCanteen(sql, actor, actor.userId, "canteen_central");
    assert.equal(await getSelectedCanteen(sql, actor, actor.userId), "canteen_central");
    const overview = await getOverview(sql, actor, actor.userId, "canteen_central", new Date());
    assert.equal(overview.dailyTrend.length, 14);
    assert.ok(overview.itemPerformance.length > 0);
    const generated = await generateInsights(sql, actor, actor.userId, "canteen_central");
    assert.ok(generated.generated > 0);
    const duplicate = await generateInsights(sql, actor, actor.userId, "canteen_central");
    assert.equal(duplicate.generated, 0);
    const pending = await getRecommendations(sql, actor, actor.userId, "canteen_central");
    const decision = await decideRecommendation(sql, actor, actor.userId, "canteen_central", pending[0]!.id, "approved");
    assert.equal(decision.status, "approved");
    await assert.rejects(
      () => decideRecommendation(sql, actor, actor.userId, "canteen_central", pending[0]!.id, "dismissed"),
      /not found/i,
    );
    await pg.close();
  });
});
