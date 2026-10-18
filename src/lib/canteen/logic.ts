import { randomBytes } from "node:crypto";
import { demandGrowthPercent, demandPriceIncreasePercent, rankSalesItems } from "../../../canteen-analytics.js";

import {
  CanteenError,
  PACKING_PAISE,
  canOperateCanteen,
  couponDiscount,
  estimateWait,
  isSuper,
  lineKey,
  requestHash,
  unitPaise,
  type Actor,
  type Availability,
  type CartLine,
  type Role,
} from "./domain.ts";
import type { Sql } from "./sql.ts";

type Row = Record<string, unknown>;

export type CheckoutLine = CartLine & { clientUnitPaise: number };

export type SalesSnapshotItem = {
  id: string;
  name: string;
  categoryName: string;
  availability: Availability;
  quantitySold: number;
  revenuePaise: number;
  lastOrderedAt: string | null;
  rank: number | null;
};

export type SalesSnapshot = {
  periodDays: 14;
  items: SalesSnapshotItem[];
  pairs: { firstItemId: string; secondItemId: string; ordersTogether: number }[];
};

export type DemandPricingSettings = {
  moderateDemandPercent: number;
  moderatePricePercent: number;
  highDemandPercent: number;
  highPricePercent: number;
};

const DEMAND_PRICING_INTERVAL_MS = 60_000;
const DEMAND_PRICING_REVIEW_MS = 10 * 60_000;

const ACTIVE = ["PAYMENT_CONFIRMED", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP"];
const NEXT: Record<string, string[]> = {
  PAYMENT_CONFIRMED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: [],
};

function nid(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}
function int(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new CanteenError("DATA", "Unexpected number from the database.");
  return Math.trunc(n);
}
function intOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  return int(v);
}
function bool(v: unknown): boolean {
  return v === true || v === "t" || v === "true" || v === 1;
}
function isUnique(e: unknown): boolean {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  const msg = e instanceof Error ? e.message : String(e);
  return code === "23505" || /duplicate key|unique constraint/i.test(msg);
}

async function one(sql: Sql, text: string, params: unknown[] = []): Promise<Row | null> {
  const rows = await sql.query<Row>(text, params);
  return rows[0] ?? null;
}

export async function actorFrom(sql: Sql, userId: string): Promise<Actor> {
  const rows = await sql.query<Row>(
    "select role, institution_id, canteen_id, active from memberships where user_id = $1 and active = true",
    [userId],
  );
  return {
    userId,
    memberships: rows.map((r) => ({
      role: str(r.role) as Role,
      institutionId: r.institution_id == null ? null : str(r.institution_id),
      canteenId: r.canteen_id == null ? null : str(r.canteen_id),
      active: bool(r.active),
    })),
  };
}

export async function loadMe(sql: Sql, userId: string) {
  const actor = await actorFrom(sql, userId);
  const user = await one(sql, 'select name, email from "user" where id = $1', [userId]);
  return {
    userId,
    name: user ? str(user.name) : "Guest",
    email: user ? str(user.email) : "",
    memberships: actor.memberships,
    gateway: gatewayMode(),
  };
}

export function gatewayMode(): "DEMO" | "RAZORPAY" {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return "RAZORPAY";
  return "DEMO";
}

function assertOperate(actor: Actor, canteenId: string, institutionId: string, level: "staff" | "admin") {
  if (!canOperateCanteen(actor, canteenId, institutionId, level)) {
    throw new CanteenError("FORBIDDEN", "You do not have access to that canteen.");
  }
}

async function audit(
  sql: Sql,
  actorId: string,
  institutionId: string | null,
  action: string,
  entity: string,
  entityId: string,
  detail: Record<string, unknown>,
) {
  await sql.query(
    "insert into audit_logs (id, actor_user_id, institution_id, action, entity, entity_id, detail) values ($1,$2,$3,$4,$5,$6,$7::jsonb)",
    [nid("aud"), actorId, institutionId, action, entity, entityId, JSON.stringify(detail)],
  );
}

async function notify(
  sql: Sql,
  userId: string,
  orderId: string | null,
  kind: string,
  title: string,
  body: string,
  dedupe: string,
) {
  await sql.query(
    `insert into notifications (id, user_id, order_id, kind, title, body, dedupe_key)
     values ($1,$2,$3,$4,$5,$6,$7) on conflict (dedupe_key) do nothing`,
    [nid("nt"), userId, orderId, kind, title, body, dedupe],
  );
}

async function notifyStaff(sql: Sql, canteenId: string, orderId: string, title: string, body: string, dedupe: string) {
  const staff = await sql.query<Row>(
    `select user_id from memberships
     where active = true and canteen_id = $1 and role in ('STAFF','CANTEEN_ADMIN')`,
    [canteenId],
  );
  for (const s of staff) {
    await notify(sql, str(s.user_id), orderId, "QUEUE", title, body, `${dedupe}:${str(s.user_id)}`);
  }
}

async function ensureDemandPricingSettings(sql: Sql, canteenId: string) {
  await sql.query("insert into demand_pricing_settings (canteen_id) values ($1) on conflict (canteen_id) do nothing", [
    canteenId,
  ]);
}

function demandSettings(row: Row): DemandPricingSettings {
  return {
    moderateDemandPercent: int(row.moderate_demand_percent),
    moderatePricePercent: int(row.moderate_price_percent),
    highDemandPercent: int(row.high_demand_percent),
    highPricePercent: int(row.high_price_percent),
  };
}

export async function demandPricingDue(sql: Sql, canteenId: string): Promise<boolean> {
  const row = await one(sql, "select last_evaluated_at from demand_pricing_settings where canteen_id = $1", [canteenId]);
  if (!row || row.last_evaluated_at == null) return true;
  const lastEvaluatedAt = new Date(str(row.last_evaluated_at)).getTime();
  return !Number.isFinite(lastEvaluatedAt) || Date.now() - lastEvaluatedAt >= DEMAND_PRICING_INTERVAL_MS;
}

export async function runDemandPricing(sql: Sql, canteenId: string) {
  await ensureDemandPricingSettings(sql, canteenId);
  const lease = await one(
    sql,
    `update demand_pricing_settings set last_evaluated_at = now()
     where canteen_id = $1
       and (last_evaluated_at is null or last_evaluated_at < now() - interval '1 minute')
     returning *`,
    [canteenId],
  );
  if (!lease) return;
  const settings = demandSettings(lease);
  const rows = await sql.query<Row>(
    `with comparison_hours as (
       select generate_series(
         (now() at time zone 'Asia/Kolkata') - interval '28 days',
         (now() at time zone 'Asia/Kolkata') - interval '7 days',
         interval '7 days'
       ) as start_at
     ),
     baseline as (
       select i.id as item_id,
              coalesce(avg(coalesce(prior.quantity, 0)), 0)::numeric as average_quantity
       from items i
       cross join comparison_hours h
       left join lateral (
         select sum(oi.qty)::numeric as quantity
         from order_items oi
         join orders o on o.id = oi.order_id
         where oi.item_id = i.id
           and o.canteen_id = i.canteen_id
           and o.payment_status = 'PAID'
           and (o.placed_at at time zone 'Asia/Kolkata') >= h.start_at
           and (o.placed_at at time zone 'Asia/Kolkata') < h.start_at + interval '1 hour'
       ) prior on true
       where i.canteen_id = $1
       group by i.id
     ),
     recent as (
       select oi.item_id, sum(oi.qty)::int as quantity
       from order_items oi
       join orders o on o.id = oi.order_id
       where o.canteen_id = $1
         and o.payment_status = 'PAID'
         and o.placed_at >= now() - interval '1 hour'
       group by oi.item_id
     )
     select i.id, i.name, i.availability, i.base_price_paise, b.average_quantity,
            coalesce(r.quantity, 0)::int as recent_quantity
     from items i
     join baseline b on b.item_id = i.id
     left join recent r on r.item_id = i.id
     where i.canteen_id = $1 and i.base_price_paise is not null`,
    [canteenId],
  );
  const canteen = await loadCanteen(sql, canteenId, false);
  const institutionId = str(canteen.institution_id);
  for (const row of rows) {
    const priorState = await one(sql, "select * from item_demand_prices where item_id = $1 for update", [row.id]);
    const averageQuantity = Number(row.average_quantity);
    if (!Number.isFinite(averageQuantity)) throw new CanteenError("DATA", "Invalid demand baseline in the database.");
    const growth = demandGrowthPercent(int(row.recent_quantity), averageQuantity);
    const target = str(row.availability) === "AVAILABLE" ? demandPriceIncreasePercent(growth, settings) : 0;
    const applied = priorState ? int(priorState.applied_price_increase_percent) : 0;
    const pending = intOrNull(priorState?.pending_price_increase_percent);
    const pendingAt = priorState?.pending_since == null ? null : new Date(str(priorState.pending_since)).getTime();

    if (priorState && bool(priorState.admin_override) && target > 0) {
      await sql.query("update item_demand_prices set demand_growth_percent=$2, updated_at=now() where item_id=$1", [
        row.id,
        growth,
      ]);
      continue;
    }

    if (target > applied) {
      if (pending !== target || pendingAt == null) {
        await sql.query(
          `insert into item_demand_prices
             (item_id, canteen_id, demand_growth_percent, applied_price_increase_percent, pending_price_increase_percent, pending_since)
           values ($1,$2,$3,$4,$5,now())
           on conflict (item_id) do update set
             demand_growth_percent = excluded.demand_growth_percent,
             pending_price_increase_percent = excluded.pending_price_increase_percent,
             pending_since = now(),
             updated_at = now()`,
          [row.id, canteenId, growth, applied, target],
        );
        const recipients = await sql.query<Row>(
          `select user_id from memberships
           where active = true and (
             (role = 'CANTEEN_ADMIN' and canteen_id = $1) or
             (role = 'INSTITUTION_ADMIN' and institution_id = $2) or
             role = 'SUPER_ADMIN'
           )`,
          [canteenId, institutionId],
        );
        const dedupe = `demand:${str(row.id)}:${target}:${Math.floor(Date.now() / DEMAND_PRICING_INTERVAL_MS)}`;
        for (const recipient of recipients) {
          await notify(
            sql,
            str(recipient.user_id),
            null,
            "DEMAND_PRICING",
            `Peak demand: ${str(row.name)}`,
            `Paid sales are ${growth}% above the average for this hour across the previous four weeks. The price will rise ${target}% in 10 minutes unless you manually change this item's price.`,
            `${dedupe}:${str(recipient.user_id)}`,
          );
        }
        continue;
      }
      if (pendingAt != null && Date.now() - pendingAt < DEMAND_PRICING_REVIEW_MS) {
        await sql.query("update item_demand_prices set demand_growth_percent=$2, updated_at=now() where item_id=$1", [
          row.id,
          growth,
        ]);
        continue;
      }
      await sql.query(
        `update item_demand_prices
         set demand_growth_percent=$2, applied_price_increase_percent=$3,
             pending_price_increase_percent=null, pending_since=null, updated_at=now()
         where item_id=$1`,
        [row.id, growth, target],
      );
      await bump(sql, canteenId);
      await audit(sql, "demand-pricing", institutionId, "DEMAND_PRICE_AUTO", "item", str(row.id), {
        growthPercent: growth,
        increasePercent: target,
        oldIncreasePercent: applied,
      });
      continue;
    }

    const changed = target !== applied;
    await sql.query(
      `insert into item_demand_prices
         (item_id, canteen_id, demand_growth_percent, applied_price_increase_percent)
       values ($1,$2,$3,$4)
       on conflict (item_id) do update set
         demand_growth_percent = excluded.demand_growth_percent,
         applied_price_increase_percent = excluded.applied_price_increase_percent,
         pending_price_increase_percent = null, pending_since = null,
         admin_override = false, updated_at = now()`,
      [row.id, canteenId, growth, target],
    );
    if (changed) {
      await bump(sql, canteenId);
      await audit(sql, "demand-pricing", institutionId, "DEMAND_PRICE_AUTO", "item", str(row.id), {
        growthPercent: growth,
        increasePercent: target,
        oldIncreasePercent: applied,
      });
    }
  }
}

async function history(sql: Sql, orderId: string, from: string | null, to: string, actorId: string, note: string | null) {
  await sql.query(
    "insert into status_history (id, order_id, from_status, to_status, actor_user_id, note) values ($1,$2,$3,$4,$5,$6)",
    [nid("sh"), orderId, from, to, actorId, note],
  );
}

type Problem = { code: string; message: string; hard: boolean };

export type PricedLine = {
  key: string;
  itemId: string | null;
  comboId: string | null;
  variantId: string | null;
  variantName: string | null;
  name: string;
  qty: number;
  unitPaise: number;
  linePaise: number;
  prepMinutes: number;
  lane: "SNACKS" | "MAIN" | "BEVERAGES";
  instructions: string;
  addons: { id: string; name: string; pricePaise: number }[];
  problems: Problem[];
  imageUrl: string | null;
  diet: string;
  availability: string;
};

function cleanLines(lines: CartLine[]): CartLine[] {
  return lines.map((line) => ({
    itemId: line.itemId || undefined,
    comboId: line.comboId || undefined,
    variantId: line.variantId ?? null,
    addonIds: [...new Set(line.addonIds ?? [])].slice(0, 8),
    qty: line.qty,
    instructions: (line.instructions ?? "").trim().slice(0, 140),
  }));
}

async function priceLine(sql: Sql, canteenId: string, line: CheckoutLine, lock: boolean): Promise<PricedLine> {
  const key = lineKey(line);
  const base = {
    key,
    itemId: line.itemId ?? null,
    comboId: line.comboId ?? null,
    variantId: line.variantId ?? null,
    variantName: null as string | null,
    name: "Item",
    qty: line.qty,
    unitPaise: 0,
    linePaise: 0,
    prepMinutes: 8,
    lane: "MAIN" as PricedLine["lane"],
    instructions: (line.instructions ?? "").trim(),
    addons: [] as PricedLine["addons"],
    problems: [] as Problem[],
    imageUrl: null as string | null,
    diet: "veg",
    availability: "AVAILABLE",
  };
  if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > 10) {
    base.problems.push({ code: "BAD_QTY", message: "Quantity must be between 1 and 10.", hard: true });
    return base;
  }
  const lockSql = lock ? " for update" : "";
  if (line.comboId && line.itemId) {
    base.problems.push({ code: "BAD_LINE", message: "A line cannot be both a combo and an item.", hard: true });
    return base;
  }
  if (!line.comboId && !line.itemId) {
    base.problems.push({ code: "BAD_LINE", message: "Choose an item.", hard: true });
    return base;
  }

  if (line.comboId) {
    const combo = await one(
      sql,
      `select * from combos where id = $1 and canteen_id = $2${lockSql}`,
      [line.comboId, canteenId],
    );
    if (!combo) {
      base.problems.push({ code: "NOT_FOUND", message: "That combo is not on this canteen's menu.", hard: true });
      return base;
    }
    base.name = str(combo.name);
    base.imageUrl = combo.image_url == null ? null : str(combo.image_url);
    base.prepMinutes = int(combo.prep_minutes);
    base.availability = str(combo.availability);
    const parts = await sql.query<Row>(
      `select i.id, i.name, i.availability, i.base_price_paise, c.lane
       from combo_items ci
       join items i on i.id = ci.item_id
       join categories c on c.id = i.category_id
       where ci.combo_id = $1`,
      [line.comboId],
    );
    if (lock) {
      for (const part of parts) await sql.query("select id from items where id = $1 for update", [part.id]);
    }
    if (parts[0]) base.lane = str(parts[0].lane) as PricedLine["lane"];
    if (str(combo.availability) !== "AVAILABLE") {
      base.problems.push({
        code: "ITEM_UNAVAILABLE",
        message: `${str(combo.name)} is ${str(combo.availability) === "SOLD_OUT" ? "sold out" : "unavailable"}.`,
        hard: false,
      });
    }
    for (const part of parts) {
      if (str(part.availability) !== "AVAILABLE" || part.base_price_paise == null) {
        base.problems.push({
          code: "ITEM_UNAVAILABLE",
          message: `${str(combo.name)} includes ${str(part.name)}, which cannot be sold right now.`,
          hard: false,
        });
      }
    }
    const unit = int(combo.price_paise);
    if (line.clientUnitPaise !== unit) {
      base.problems.push({
        code: "PRICE_MISMATCH",
        message: `The price of ${str(combo.name)} changed. Refresh and try again.`,
        hard: false,
      });
    }
    base.unitPaise = unit;
    base.linePaise = unit * line.qty;
    return base;
  }

  const item = await one(
    sql,
    `select i.*, c.lane from items i join categories c on c.id = i.category_id where i.id = $1 and i.canteen_id = $2${lockSql}`,
    [line.itemId, canteenId],
  );
  if (!item) {
    base.problems.push({ code: "NOT_FOUND", message: "That item is not on this canteen's menu.", hard: true });
    return base;
  }
  base.name = str(item.name);
  base.imageUrl = item.image_url == null ? null : str(item.image_url);
  base.prepMinutes = int(item.prep_minutes);
  base.lane = str(item.lane) as PricedLine["lane"];
  base.diet = str(item.diet);
  base.availability = str(item.availability);
  base.itemId = str(item.id);
  const demandPrice = await one(
    sql,
    `select applied_price_increase_percent from item_demand_prices where item_id = $1${lock ? " for update" : ""}`,
    [item.id],
  );

  const variants = await sql.query<Row>("select * from variants where item_id = $1 order by sort, name", [item.id]);
  let delta = 0;
  if (variants.length) {
    const chosen = variants.find((v) => str(v.id) === (line.variantId ?? ""));
    if (!chosen) {
      base.problems.push({ code: "VARIANT", message: `Choose a size for ${str(item.name)}.`, hard: true });
    } else if (!bool(chosen.available)) {
      base.problems.push({
        code: "ITEM_UNAVAILABLE",
        message: `${str(item.name)} (${str(chosen.name)}) is unavailable.`,
        hard: false,
      });
    } else {
      delta = int(chosen.price_delta_paise);
      base.variantName = str(chosen.name);
      base.variantId = str(chosen.id);
      if (lock) await sql.query("select id from variants where id = $1 for update", [chosen.id]);
    }
  }

  const addonIds = line.addonIds ?? [];
  let addonSum = 0;
  if (addonIds.length) {
    const addons = await sql.query<Row>(
      `select a.* from addons a
       join item_addons ia on ia.addon_id = a.id
       where ia.item_id = $1 and a.id = any($2::text[])`,
      [item.id, addonIds],
    );
    if (lock) {
      for (const addon of addons) await sql.query("select id from addons where id = $1 for update", [addon.id]);
    }
    if (addons.length !== addonIds.length) {
      base.problems.push({ code: "ADDON", message: "An add-on is not offered on this item.", hard: true });
    }
    for (const addon of addons) {
      if (!bool(addon.available)) {
        base.problems.push({
          code: "ITEM_UNAVAILABLE",
          message: `${str(addon.name)} is unavailable.`,
          hard: false,
        });
      } else {
        const price = int(addon.price_paise);
        addonSum += price;
        base.addons.push({ id: str(addon.id), name: str(addon.name), pricePaise: price });
      }
    }
  }

  if (str(item.availability) !== "AVAILABLE") {
    const word = str(item.availability) === "SOLD_OUT" ? "sold out" : "unavailable";
    base.problems.push({
      code: "ITEM_UNAVAILABLE",
      message: `${str(item.name)} is ${word} and cannot be ordered.`,
      hard: false,
    });
  }
  const basePrice = intOrNull(item.base_price_paise);
  if (basePrice == null) {
    base.problems.push({
      code: "PRICE_UNSET",
      message: `${str(item.name)} has no selling price yet.`,
      hard: false,
    });
  }
  const increasePercent = demandPrice ? int(demandPrice.applied_price_increase_percent) : 0;
  const effectiveBasePrice = basePrice == null ? null : Math.round((basePrice * (100 + increasePercent)) / 100);
  const unit = effectiveBasePrice == null ? 0 : unitPaise(effectiveBasePrice, int(item.discount_paise), delta, addonSum);
  if (basePrice != null && line.clientUnitPaise !== unit) {
    base.problems.push({
      code: "PRICE_MISMATCH",
      message: `The price of ${str(item.name)} changed. Refresh and try again.`,
      hard: false,
    });
  }
  base.unitPaise = unit;
  base.linePaise = unit * line.qty;
  return base;
}

async function loadCanteen(sql: Sql, canteenId: string, lock: boolean): Promise<Row> {
  const row = await one(sql, `select * from canteens where id = $1${lock ? " for update" : ""}`, [canteenId]);
  if (!row) throw new CanteenError("NOT_FOUND", "That canteen was not found.");
  return row;
}

export async function quoteCart(
  sql: Sql,
  canteenId: string,
  lines: CheckoutLine[],
  couponCode: string | null,
  lock: boolean,
) {
  const canteen = await loadCanteen(sql, canteenId, lock);
  const priced = [];
  for (const line of lines) priced.push(await priceLine(sql, canteenId, line, lock));
  const problems: Problem[] = priced.flatMap((line) => line.problems);
  const status = str(canteen.status);
  if (status !== "OPEN") {
    problems.unshift({
      code: "CANTEEN_CLOSED",
      message:
        status === "PAUSED"
          ? `${str(canteen.name)} is paused. New orders are not accepted.`
          : `${str(canteen.name)} is closed. New orders are not accepted.`,
      hard: false,
    });
  }
  const subtotal = priced.reduce((sum, line) => sum + (line.problems.some((p) => p.code !== "PRICE_MISMATCH") ? line.linePaise : line.linePaise), 0);
  const sellable = priced.every((line) => line.problems.length === 0);
  const subtotalPaise = priced.reduce((sum, line) => sum + line.linePaise, 0);
  const chargesPaise = lines.length ? PACKING_PAISE : 0;
  let discountPaise = 0;
  let applied: string | null = null;
  if (couponCode && couponCode.trim()) {
    const coupon = await one(
      sql,
      "select * from coupons where institution_id = $1 and upper(code) = upper($2) and active = true",
      [canteen.institution_id, couponCode.trim()],
    );
    if (!coupon) {
      problems.push({ code: "COUPON", message: "That coupon is not valid here.", hard: false });
    } else {
      discountPaise = couponDiscount(subtotalPaise, {
        kind: str(coupon.kind) as "PERCENT" | "FLAT",
        value: int(coupon.value),
        minPaise: int(coupon.min_paise),
      });
      if (discountPaise === 0) {
        problems.push({
          code: "COUPON",
          message: "That coupon does not apply to this total yet.",
          hard: false,
        });
      } else applied = str(coupon.code);
    }
  }
  const aheadRow = await one(
    sql,
    `select count(*)::int as n from orders where canteen_id = $1 and status = any($2::text[])`,
    [canteenId, ACTIVE],
  );
  const ordersAhead = aheadRow ? int(aheadRow.n) : 0;
  const prep = priced.reduce((max, line) => Math.max(max, line.prepMinutes), 0);
  const etaMinutes = estimateWait(ordersAhead, prep || 5, int(canteen.prep_capacity));
  const totalPaise = Math.max(0, subtotalPaise + chargesPaise - discountPaise);
  return {
    canteen,
    priced,
    problems,
    sellable: sellable && status === "OPEN" && problems.length === 0,
    subtotalPaise,
    chargesPaise,
    discountPaise,
    totalPaise,
    couponCode: applied,
    ordersAhead,
    etaMinutes,
    subtotalUnused: subtotal,
  };
}

function summaryFromQuote(q: Awaited<ReturnType<typeof quoteCart>>, lines: CartLine[]) {
  return {
    lines: q.priced.map((line) => ({
      key: line.key,
      itemId: line.itemId,
      comboId: line.comboId,
      variantId: line.variantId,
      variantName: line.variantName,
      name: line.name,
      qty: line.qty,
      unitPaise: line.unitPaise,
      linePaise: line.linePaise,
      prepMinutes: line.prepMinutes,
      instructions: line.instructions,
      addons: line.addons,
      problems: line.problems.map((p) => p.message),
      imageUrl: line.imageUrl,
      diet: line.diet,
      availability: line.availability,
      addonIds: lines.find((l) => lineKey(l) === line.key)?.addonIds ?? [],
    })),
    problems: [...new Set(q.problems.map((p) => p.message))],
    blocked: !q.sellable,
    subtotalPaise: q.subtotalPaise,
    chargesPaise: q.chargesPaise,
    discountPaise: q.discountPaise,
    totalPaise: q.totalPaise,
    couponCode: q.couponCode,
    ordersAhead: q.ordersAhead,
    etaMinutes: q.etaMinutes,
    approximate: true,
    canteenStatus: str(q.canteen.status),
    canteenName: str(q.canteen.name),
    catalogVersion: int(q.canteen.catalog_version),
  };
}

async function storedLines(sql: Sql, userId: string, canteenId: string): Promise<CartLine[]> {
  const row = await one(sql, "select lines from carts where user_id = $1 and canteen_id = $2", [userId, canteenId]);
  if (!row) return [];
  const raw = typeof row.lines === "string" ? JSON.parse(row.lines) : row.lines;
  if (!Array.isArray(raw)) return [];
  return cleanLines(raw as CartLine[]);
}

export async function getCart(sql: Sql, userId: string, canteenId: string, couponCode: string | null) {
  const lines = await storedLines(sql, userId, canteenId);
  const pricedLines: CheckoutLine[] = [];
  for (const line of lines) {
    const probe = await priceLine(sql, canteenId, { ...line, clientUnitPaise: -1 }, false);
    pricedLines.push({ ...line, clientUnitPaise: probe.unitPaise });
  }
  const quote = await quoteCart(sql, canteenId, pricedLines, couponCode, false);
  return summaryFromQuote(quote, lines);
}

export async function saveCart(sql: Sql, userId: string, canteenId: string, incoming: CartLine[]) {
  await loadCanteen(sql, canteenId, false);
  const next = cleanLines(incoming);
  const prev = await storedLines(sql, userId, canteenId);
  const prevQty = new Map(prev.map((line) => [lineKey(line), line.qty]));
  for (const line of next) {
    const probe = await priceLine(sql, canteenId, { ...line, clientUnitPaise: 0 }, true);
    const hard = probe.problems.find((p) => p.hard);
    if (hard) throw new CanteenError(hard.code, hard.message);
    const blocking = probe.problems.find((p) => p.code === "ITEM_UNAVAILABLE" || p.code === "PRICE_UNSET");
    const old = prevQty.get(lineKey(line)) ?? 0;
    if (blocking && line.qty > old) throw new CanteenError(blocking.code, blocking.message);
  }
  await sql.query(
    `insert into carts (user_id, canteen_id, lines, updated_at) values ($1,$2,$3::jsonb, now())
     on conflict (user_id, canteen_id) do update set lines = excluded.lines, updated_at = now()`,
    [userId, canteenId, JSON.stringify(next)],
  );
  return getCart(sql, userId, canteenId, null);
}

async function bump(sql: Sql, canteenId: string) {
  await sql.query("update canteens set catalog_version = catalog_version + 1 where id = $1", [canteenId]);
}

export async function setItemAvailability(sql: Sql, actor: Actor, itemId: string, availability: Availability) {
  const item = await one(sql, "select * from items where id = $1 for update", [itemId]);
  if (!item) throw new CanteenError("NOT_FOUND", "Item not found.");
  const canteen = await loadCanteen(sql, str(item.canteen_id), false);
  assertOperate(actor, str(canteen.id), str(canteen.institution_id), "staff");
  if (!["AVAILABLE", "UNAVAILABLE", "SOLD_OUT", "HIDDEN"].includes(availability)) {
    throw new CanteenError("BAD_STATUS", "Unknown availability.");
  }
  await sql.query("update items set availability = $2, updated_at = now() where id = $1", [itemId, availability]);
  await bump(sql, str(canteen.id));
  await audit(sql, actor.userId, str(canteen.institution_id), "AVAILABILITY", "item", itemId, {
    from: str(item.availability),
    to: availability,
    name: str(item.name),
  });
  return { itemId, availability, catalogVersion: int(canteen.catalog_version) + 1 };
}

export async function setComboAvailability(sql: Sql, actor: Actor, comboId: string, availability: Availability) {
  const combo = await one(sql, "select * from combos where id = $1 for update", [comboId]);
  if (!combo) throw new CanteenError("NOT_FOUND", "Combo not found.");
  const canteen = await loadCanteen(sql, str(combo.canteen_id), false);
  assertOperate(actor, str(canteen.id), str(canteen.institution_id), "staff");
  await sql.query("update combos set availability = $2 where id = $1", [comboId, availability]);
  await bump(sql, str(canteen.id));
  await audit(sql, actor.userId, str(canteen.institution_id), "AVAILABILITY", "combo", comboId, {
    to: availability,
  });
  return { comboId, availability };
}

export async function setCanteenStatus(sql: Sql, actor: Actor, canteenId: string, status: "OPEN" | "CLOSED" | "PAUSED") {
  const canteen = await loadCanteen(sql, canteenId, true);
  assertOperate(actor, canteenId, str(canteen.institution_id), "admin");
  await sql.query("update canteens set status = $2, catalog_version = catalog_version + 1 where id = $1", [
    canteenId,
    status,
  ]);
  await audit(sql, actor.userId, str(canteen.institution_id), "CANTEEN_STATUS", "canteen", canteenId, {
    to: status,
  });
  return { canteenId, status };
}

export async function setCounterActive(sql: Sql, actor: Actor, counterId: string, active: boolean) {
  const counter = await one(sql, "select * from counters where id = $1 for update", [counterId]);
  if (!counter) throw new CanteenError("NOT_FOUND", "Counter not found.");
  const canteen = await loadCanteen(sql, str(counter.canteen_id), false);
  assertOperate(actor, str(canteen.id), str(canteen.institution_id), "staff");
  await sql.query("update counters set active = $2 where id = $1", [counterId, active]);
  await audit(sql, actor.userId, str(canteen.institution_id), "COUNTER", "counter", counterId, { active });
  return { counterId, active };
}

async function pickCounter(sql: Sql, canteenId: string, lanes: string[]): Promise<Row> {
  const counters = await sql.query<Row>(
    "select * from counters where canteen_id = $1 order by sort",
    [canteenId],
  );
  const active = counters.filter((c) => bool(c.active));
  if (!active.length) throw new CanteenError("NO_COUNTER", "No pickup counter is open at this canteen.");
  const preferred = [...lanes].reverse();
  for (const lane of preferred) {
    const hit = active.find((c) => str(c.lane) === lane);
    if (hit) return hit;
  }
  return active[0]!;
}

export async function placeOrder(
  sql: Sql,
  actor: Actor,
  input: {
    canteenId: string;
    lines: CheckoutLine[];
    couponCode: string | null;
    instructions: string | null;
    expectedTotalPaise: number;
    idempotencyKey: string;
  },
) {
  const existing = await one(
    sql,
    "select * from orders where customer_user_id = $1 and idempotency_key = $2 for update",
    [actor.userId, input.idempotencyKey],
  );
  const hash = requestHash(input.canteenId, input.lines, input.couponCode);
  if (existing) {
    if (str(existing.request_hash) !== hash) {
      throw new CanteenError("DUPLICATE", "This checkout was already submitted with a different cart.");
    }
    return publicOrder(existing);
  }
  const quote = await quoteCart(sql, input.canteenId, input.lines, input.couponCode, true);
  if (!quote.sellable) {
    const first = quote.problems[0];
    throw new CanteenError(first?.code ?? "UNAVAILABLE", first?.message ?? "This order cannot be placed.");
  }
  if (quote.totalPaise !== input.expectedTotalPaise) {
    throw new CanteenError("PRICE_MISMATCH", "The total changed. Refresh the cart and try again.");
  }
  const lanes = quote.priced.map((line) => line.lane);
  const slowest = [...quote.priced].sort((a, b) => b.prepMinutes - a.prepMinutes)[0];
  const counter = await pickCounter(sql, input.canteenId, slowest ? [slowest.lane, ...lanes] : lanes);
  const seq = await one(
    sql,
    "update token_seq set next_n = next_n + 1 where canteen_id = $1 returning next_n",
    [input.canteenId],
  );
  if (!seq) throw new CanteenError("DATA", "This canteen has no token sequence.");
  const token = `C${int(seq.next_n)}`;
  const id = `CX${randomBytes(4).toString("hex").toUpperCase()}`;
  const pickup = `CX|${id}|${token}`;
  const campus = await one(sql, "select name from campuses where id = $1", [quote.canteen.campus_id]);
  const inst = await one(sql, "select name from institutions where id = $1", [quote.canteen.institution_id]);
  const provider = gatewayMode();
  try {
    await sql.query(
      `insert into orders (
        id, token, institution_id, campus_id, canteen_id, institution_name, campus_name, canteen_name,
        customer_user_id, counter_id, counter_name, status, payment_status, subtotal_paise, charges_paise,
        discount_paise, total_paise, coupon_code, instructions, eta_minutes, orders_ahead, idempotency_key,
        request_hash, pickup_code
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PLACED','PENDING',$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
      )`,
      [
        id,
        token,
        quote.canteen.institution_id,
        quote.canteen.campus_id,
        input.canteenId,
        inst ? str(inst.name) : "",
        campus ? str(campus.name) : "",
        str(quote.canteen.name),
        actor.userId,
        counter.id,
        str(counter.name),
        quote.subtotalPaise,
        quote.chargesPaise,
        quote.discountPaise,
        quote.totalPaise,
        quote.couponCode,
        (input.instructions ?? "").trim().slice(0, 140) || null,
        quote.etaMinutes,
        quote.ordersAhead,
        input.idempotencyKey,
        hash,
        pickup,
      ],
    );
  } catch (error) {
    if (!isUnique(error)) throw error;
    const again = await one(
      sql,
      "select * from orders where customer_user_id = $1 and idempotency_key = $2",
      [actor.userId, input.idempotencyKey],
    );
    if (again && str(again.request_hash) === hash) return publicOrder(again);
    throw new CanteenError("DUPLICATE", "This checkout was already submitted.");
  }
  for (const line of quote.priced) {
    await sql.query(
      `insert into order_items (id, order_id, item_id, combo_id, name, variant_name, qty, unit_paise, addons_json, line_paise, prep_minutes, instructions)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12)`,
      [
        nid("oi"),
        id,
        line.itemId,
        line.comboId,
        line.variantName ? `${line.name} (${line.variantName})` : line.name,
        line.variantName,
        line.qty,
        line.unitPaise,
        JSON.stringify(line.addons),
        line.linePaise,
        line.prepMinutes,
        line.instructions || null,
      ],
    );
  }
  const paymentId = nid("pay");
  await sql.query(
    `insert into payments (id, order_id, provider, status, amount_paise, idempotency_key)
     values ($1,$2,$3,'PENDING',$4,$5)`,
    [paymentId, id, provider, quote.totalPaise, `pay_${id}`],
  );
  await history(sql, id, null, "PLACED", actor.userId, null);
  await audit(sql, actor.userId, str(quote.canteen.institution_id), "ORDER_PLACED", "order", id, { token });
  await sql.query("delete from carts where user_id = $1 and canteen_id = $2", [actor.userId, input.canteenId]);
  let gatewayOrderId: string | null = null;
  if (provider === "RAZORPAY") {
    gatewayOrderId = await createRazorpayOrder(quote.totalPaise, id);
    if (gatewayOrderId) {
      await sql.query("update payments set gateway_order_id = $2, updated_at = now() where id = $1", [
        paymentId,
        gatewayOrderId,
      ]);
    }
  }
  return {
    ...publicOrder({
      id,
      token,
      status: "PLACED",
      payment_status: "PENDING",
      total_paise: quote.totalPaise,
      canteen_id: input.canteenId,
      pickup_code: pickup,
    }),
    provider,
    gatewayOrderId,
    keyId: provider === "RAZORPAY" ? (process.env.RAZORPAY_KEY_ID ?? null) : null,
    demo: provider === "DEMO",
  };
}

async function createRazorpayOrder(amountPaise: number, orderId: string): Promise<string | null> {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) return null;
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: orderId,
      notes: { canteenx_order_id: orderId },
    }),
  });
  if (!res.ok) throw new CanteenError("GATEWAY", "The payment gateway did not accept this order.");
  const body = (await res.json()) as { id?: string };
  return body.id ?? null;
}

function publicOrder(row: Row) {
  return {
    id: str(row.id),
    token: str(row.token),
    status: str(row.status),
    paymentStatus: str(row.payment_status),
    totalPaise: int(row.total_paise),
    canteenId: str(row.canteen_id),
    pickupCode: str(row.pickup_code),
  };
}

async function orderBlockedReason(sql: Sql, orderId: string): Promise<string | null> {
  const order = await one(sql, "select * from orders where id = $1 for update", [orderId]);
  if (!order) return "Order not found.";
  const canteen = await loadCanteen(sql, str(order.canteen_id), true);
  if (str(canteen.status) !== "OPEN") {
    return `${str(canteen.name)} is ${str(canteen.status) === "PAUSED" ? "paused" : "closed"}.`;
  }
  const items = await sql.query<Row>("select * from order_items where order_id = $1", [orderId]);
  for (const line of items) {
    if (line.item_id) {
      const item = await one(sql, "select * from items where id = $1 for update", [line.item_id]);
      if (!item || str(item.availability) !== "AVAILABLE" || item.base_price_paise == null) {
        return `${str(line.name)} is no longer available.`;
      }
    }
    if (line.combo_id) {
      const combo = await one(sql, "select * from combos where id = $1 for update", [line.combo_id]);
      if (!combo || str(combo.availability) !== "AVAILABLE") return `${str(line.name)} is no longer available.`;
      const parts = await sql.query<Row>(
        `select i.availability, i.base_price_paise, i.name from combo_items ci join items i on i.id = ci.item_id where ci.combo_id = $1`,
        [line.combo_id],
      );
      for (const part of parts) {
        if (str(part.availability) !== "AVAILABLE" || part.base_price_paise == null) {
          return `${str(combo.name)} includes ${str(part.name)}, which is no longer available.`;
        }
      }
    }
  }
  return null;
}

async function cancelForStock(sql: Sql, order: Row, reason: string, refund: boolean, actorId: string) {
  const payment = await one(sql, "select * from payments where order_id = $1 order by created_at desc limit 1 for update", [
    order.id,
  ]);
  if (payment && refund) {
    await sql.query("update payments set status = 'REFUNDED', updated_at = now() where id = $1", [payment.id]);
  } else if (payment && ["PENDING", "PROCESSING", "FAILED"].includes(str(payment.status))) {
    await sql.query("update payments set status = 'FAILED', updated_at = now() where id = $1", [payment.id]);
  }
  await sql.query(
    "update orders set status = 'CANCELLED', payment_status = $2, cancel_reason = $3, updated_at = now() where id = $1",
    [order.id, refund ? "REFUNDED" : "FAILED", reason],
  );
  await history(sql, str(order.id), str(order.status), "CANCELLED", actorId, reason);
  await notify(
    sql,
    str(order.customer_user_id),
    str(order.id),
    "REFUND",
    `Order ${str(order.token)} was cancelled`,
    reason,
    `${str(order.id)}:stock-cancel`,
  );
}

export async function settlePayment(
  sql: Sql,
  actor: Actor | null,
  orderId: string,
  outcome: "PAID" | "FAILED",
  source: "DEMO" | "WEBHOOK",
  eventId: string,
  providerRef: string | null,
) {
  const seen = await one(sql, "select id from payment_events where id = $1", [eventId]);
  const order = await one(sql, "select * from orders where id = $1 for update", [orderId]);
  if (!order) throw new CanteenError("NOT_FOUND", "Order not found.");
  if (actor && str(order.customer_user_id) !== actor.userId && !isSuper(actor)) {
    throw new CanteenError("FORBIDDEN", "That order belongs to someone else.");
  }
  if (seen) return { ...publicOrder(order), idempotent: true, blocked: false as const };
  if (str(order.status) === "CANCELLED") {
    throw new CanteenError("CANCELLED", "This order was cancelled.");
  }
  const payment = await one(
    sql,
    "select * from payments where order_id = $1 order by created_at desc limit 1 for update",
    [orderId],
  );
  if (!payment) throw new CanteenError("NOT_FOUND", "Payment not found.");
  if (source === "DEMO" && str(payment.provider) !== "DEMO") {
    throw new CanteenError("NOT_DEMO", "This payment has to be confirmed by the gateway.");
  }
  if (str(payment.status) === "PAID" && outcome === "PAID") {
    await sql.query("insert into payment_events (id, payment_id, status) values ($1,$2,$3) on conflict (id) do nothing", [
      eventId,
      payment.id,
      outcome,
    ]);
    return { ...publicOrder(order), idempotent: true, blocked: false as const };
  }
  if (str(payment.status) === "PAID" && outcome === "FAILED") {
    throw new CanteenError("PAYMENT_STATE", "This payment is already complete.");
  }
  if (outcome === "FAILED") {
    await sql.query("update payments set status = 'FAILED', updated_at = now() where id = $1 and status in ('PENDING','PROCESSING','FAILED')", [
      payment.id,
    ]);
    await sql.query("update orders set payment_status = 'FAILED', updated_at = now() where id = $1 and status = 'PLACED'", [orderId]);
    await sql.query("insert into payment_events (id, payment_id, status) values ($1,$2,'FAILED')", [eventId, payment.id]);
    await notify(sql, str(order.customer_user_id), orderId, "PAYMENT", `Payment failed for ${str(order.token)}`, "No money was captured in demo mode. You can try again.", `${orderId}:pay-fail:${eventId}`);
    const fresh = await one(sql, "select * from orders where id = $1", [orderId]);
    return { ...publicOrder(fresh!), idempotent: false, blocked: false as const };
  }
  const blocked = await orderBlockedReason(sql, orderId);
  if (blocked) {
    const refund = source === "WEBHOOK";
    await cancelForStock(sql, order, blocked, refund, actor?.userId ?? "gateway");
    await sql.query("insert into payment_events (id, payment_id, status) values ($1,$2,$3)", [
      eventId,
      payment.id,
      refund ? "REFUNDED" : "FAILED",
    ]);
    return { ...publicOrder({ ...order, status: "CANCELLED", payment_status: refund ? "REFUNDED" : "FAILED" }), idempotent: false, blocked: true as const, message: blocked };
  }
  await sql.query(
    "update payments set status = 'PAID', gateway_payment_id = coalesce($2, gateway_payment_id), updated_at = now() where id = $1",
    [payment.id, providerRef],
  );
  await sql.query(
    "update orders set status = 'PAYMENT_CONFIRMED', payment_status = 'PAID', updated_at = now() where id = $1 and status = 'PLACED'",
    [orderId],
  );
  await sql.query("insert into payment_events (id, payment_id, status) values ($1,$2,'PAID')", [eventId, payment.id]);
  await history(sql, orderId, "PLACED", "PAYMENT_CONFIRMED", actor?.userId ?? "gateway", source);
  await notify(
    sql,
    str(order.customer_user_id),
    orderId,
    "PAYMENT",
    `Payment received for ${str(order.token)}`,
    "The kitchen can accept your order now.",
    `${orderId}:paid`,
  );
  await notifyStaff(sql, str(order.canteen_id), orderId, `New paid order ${str(order.token)}`, "Accept it when the counter is free.", `${orderId}:new`);
  await runDemandPricing(sql, str(order.canteen_id));
  const fresh = await one(sql, "select * from orders where id = $1", [orderId]);
  return { ...publicOrder(fresh!), idempotent: false, blocked: false as const };
}

export async function transitionOrder(sql: Sql, actor: Actor, orderId: string, to: string) {
  const order = await one(sql, "select * from orders where id = $1 for update", [orderId]);
  if (!order) throw new CanteenError("NOT_FOUND", "Order not found.");
  assertOperate(actor, str(order.canteen_id), str(order.institution_id), "staff");
  const from = str(order.status);
  if (!(NEXT[from] ?? []).includes(to)) {
    throw new CanteenError("BAD_STATUS", `Cannot move ${from} to ${to}.`);
  }
  if (to === "ACCEPTED") {
    const blocked = await orderBlockedReason(sql, orderId);
    if (blocked) {
      await cancelForStock(sql, order, `${blocked} Payment was refunded.`, true, actor.userId);
      throw new CanteenError("ITEM_UNAVAILABLE", `${blocked} The order was cancelled and the payment refunded.`);
    }
  }
  let prepSeconds: number | null = null;
  if (to === "READY_FOR_PICKUP") {
    const accepted = await one(
      sql,
      "select created_at from status_history where order_id = $1 and to_status = 'ACCEPTED' order by created_at limit 1",
      [orderId],
    );
    if (accepted?.created_at) {
      const started = new Date(str(accepted.created_at)).getTime();
      if (Number.isFinite(started)) prepSeconds = Math.max(0, Math.round((Date.now() - started) / 1000));
    }
  }
  await sql.query(
    "update orders set status = $2, prep_seconds = coalesce($3, prep_seconds), updated_at = now(), picked_up_at = case when $2 = 'PICKED_UP' then now() else picked_up_at end where id = $1",
    [orderId, to, prepSeconds],
  );
  await history(sql, orderId, from, to, actor.userId, null);
  await notify(
    sql,
    str(order.customer_user_id),
    orderId,
    "STATUS",
    `${str(order.token)} · ${to === "READY_FOR_PICKUP" ? "Ready for pickup" : to === "PREPARING" ? "Preparing" : to === "ACCEPTED" ? "Accepted" : to}`,
    to === "READY_FOR_PICKUP"
      ? `Collect it at ${str(order.counter_name) || "the counter"}.`
      : "Your order moved forward.",
    `${orderId}:${to}`,
  );
  return { id: orderId, status: to };
}

export async function cancelOrder(sql: Sql, actor: Actor, orderId: string, reason: string) {
  const order = await one(sql, "select * from orders where id = $1 for update", [orderId]);
  if (!order) throw new CanteenError("NOT_FOUND", "Order not found.");
  const owner = str(order.customer_user_id) === actor.userId;
  const staff = canOperateCanteen(actor, str(order.canteen_id), str(order.institution_id), "staff");
  if (!owner && !staff) throw new CanteenError("FORBIDDEN", "You cannot cancel this order.");
  if (!["PLACED", "PAYMENT_CONFIRMED", "ACCEPTED"].includes(str(order.status))) {
    throw new CanteenError("POLICY", "The kitchen has already started. Ask the counter if you still need to cancel.");
  }
  const paid = str(order.payment_status) === "PAID";
  await cancelForStock(sql, order, reason.trim().slice(0, 180) || "Cancelled", paid, actor.userId);
  if (paid) {
    await sql.query(
      "insert into payment_events (id, payment_id, status) select $1, id, 'REFUNDED' from payments where order_id = $2 and status = 'REFUNDED' limit 1 on conflict (id) do nothing",
      [`refund_${orderId}`, orderId],
    );
  }
  await audit(sql, actor.userId, str(order.institution_id), "CANCEL", "order", orderId, { reason, paid });
  return { id: orderId, status: "CANCELLED", refunded: paid };
}

export async function pickupOrder(sql: Sql, actor: Actor, canteenId: string, code: string) {
  const canteen = await loadCanteen(sql, canteenId, false);
  assertOperate(actor, canteenId, str(canteen.institution_id), "staff");
  const needle = code.trim();
  const rows = await sql.query<Row>(
    "select * from orders where token = $1 or id = $1 or pickup_code = $1 for update",
    [needle],
  );
  const mine = rows.filter((row) => str(row.canteen_id) === canteenId);
  const order = mine[0] ?? null;
  if (!order) {
    if (rows.length) throw new CanteenError("WRONG_CANTEEN", "That token belongs to a different canteen.");
    throw new CanteenError("NOT_FOUND", "No order matches that token.");
  }
  if (str(order.status) === "PICKED_UP" || order.picked_up_at) {
    throw new CanteenError("ALREADY_COLLECTED", "This order was already collected.");
  }
  if (str(order.payment_status) !== "PAID") {
    throw new CanteenError("UNPAID", "Payment is not complete, so this order cannot be handed over.");
  }
  if (str(order.status) !== "READY_FOR_PICKUP") {
    throw new CanteenError("NOT_READY", "This order is not ready for pickup yet.");
  }
  const updated = await sql.query<Row>(
    `update orders set status = 'PICKED_UP', picked_up_at = now(), updated_at = now()
     where id = $1 and status = 'READY_FOR_PICKUP' and payment_status = 'PAID' and picked_up_at is null
     returning id`,
    [order.id],
  );
  if (!updated.length) throw new CanteenError("ALREADY_COLLECTED", "This order was already collected.");
  await history(sql, str(order.id), "READY_FOR_PICKUP", "PICKED_UP", actor.userId, "Pickup verified");
  await notify(
    sql,
    str(order.customer_user_id),
    str(order.id),
    "STATUS",
    `${str(order.token)} picked up`,
    "Enjoy your meal.",
    `${str(order.id)}:PICKED_UP`,
  );
  await audit(sql, actor.userId, str(canteen.institution_id), "PICKUP", "order", str(order.id), { token: str(order.token) });
  return { id: str(order.id), token: str(order.token), status: "PICKED_UP" };
}

export async function getMenu(sql: Sql, actor: Actor, canteenId: string) {
  const canteen = await loadCanteen(sql, canteenId, false);
  const staff = canOperateCanteen(actor, canteenId, str(canteen.institution_id), "staff");
  const campus = await one(sql, "select name from campuses where id = $1", [canteen.campus_id]);
  const inst = await one(sql, "select id, name, is_demo from institutions where id = $1", [canteen.institution_id]);
  const categories = await sql.query<Row>(
    "select * from categories where canteen_id = $1 order by sort, name",
    [canteenId],
  );
  const items = await sql.query<Row>(
    "select * from items where canteen_id = $1 order by name",
    [canteenId],
  );
  const demandPrices = await sql.query<Row>(
    "select item_id, demand_growth_percent, applied_price_increase_percent from item_demand_prices where canteen_id = $1",
    [canteenId],
  );
  const demandPriceByItem = new Map(demandPrices.map((price) => [str(price.item_id), price]));
  const variants = await sql.query<Row>(
    `select v.* from variants v join items i on i.id = v.item_id where i.canteen_id = $1 order by v.sort`,
    [canteenId],
  );
  const addons = await sql.query<Row>(
    `select a.*, ia.item_id from addons a join item_addons ia on ia.addon_id = a.id
     where a.canteen_id = $1`,
    [canteenId],
  );
  const combos = await sql.query<Row>("select * from combos where canteen_id = $1 order by name", [canteenId]);
  const comboParts = await sql.query<Row>(
    `select ci.combo_id, i.name, i.availability from combo_items ci join items i on i.id = ci.item_id
     join combos co on co.id = ci.combo_id where co.canteen_id = $1`,
    [canteenId],
  );
  const counters = await sql.query<Row>("select * from counters where canteen_id = $1 order by sort", [canteenId]);
  const visibleItems = items.filter((item) => staff || str(item.availability) !== "HIDDEN");
  return {
    canteen: {
      id: str(canteen.id),
      name: str(canteen.name),
      status: str(canteen.status),
      description: str(canteen.description),
      campusName: campus ? str(campus.name) : "",
      institutionId: inst ? str(inst.id) : "",
      institutionName: inst ? str(inst.name) : "",
      isDemo: bool(canteen.is_demo),
      catalogVersion: int(canteen.catalog_version),
      prepCapacity: int(canteen.prep_capacity),
    },
    manageable: staff,
    categories: categories.map((c) => ({
      id: str(c.id),
      name: str(c.name),
      lane: str(c.lane),
      imageUrl: c.image_url == null ? null : str(c.image_url),
    })),
    items: visibleItems.map((item) => ({
      id: str(item.id),
      categoryId: str(item.category_id),
      name: str(item.name),
      description: str(item.description),
      imageUrl: item.image_url == null ? null : str(item.image_url),
      listPricePaise: intOrNull(item.base_price_paise),
      basePricePaise: intOrNull(item.base_price_paise) == null
        ? null
        : Math.round(
            (int(item.base_price_paise) *
              (100 + int(demandPriceByItem.get(str(item.id))?.applied_price_increase_percent ?? 0))) /
              100,
          ),
      discountPaise: int(item.discount_paise),
      demandGrowthPercent: int(demandPriceByItem.get(str(item.id))?.demand_growth_percent ?? 0),
      dynamicPriceIncreasePercent: int(demandPriceByItem.get(str(item.id))?.applied_price_increase_percent ?? 0),
      diet: str(item.diet),
      prepMinutes: int(item.prep_minutes),
      availability: str(item.availability),
      isDemo: bool(item.is_demo),
      variants: variants
        .filter((v) => str(v.item_id) === str(item.id))
        .map((v) => ({
          id: str(v.id),
          name: str(v.name),
          priceDeltaPaise: int(v.price_delta_paise),
          available: bool(v.available),
        })),
      addons: addons
        .filter((a) => str(a.item_id) === str(item.id))
        .map((a) => ({
          id: str(a.id),
          name: str(a.name),
          pricePaise: int(a.price_paise),
          available: bool(a.available),
        })),
    })),
    combos: combos
      .filter((c) => staff || str(c.availability) !== "HIDDEN")
      .map((c) => ({
        id: str(c.id),
        name: str(c.name),
        description: str(c.description),
        imageUrl: c.image_url == null ? null : str(c.image_url),
        pricePaise: int(c.price_paise),
        prepMinutes: int(c.prep_minutes),
        availability: str(c.availability),
        isDemo: bool(c.is_demo),
        parts: comboParts.filter((p) => str(p.combo_id) === str(c.id)).map((p) => str(p.name)),
      })),
    counters: counters.map((c) => ({
      id: str(c.id),
      name: str(c.name),
      lane: str(c.lane),
      active: bool(c.active),
    })),
  };
}

export async function listDirectory(sql: Sql) {
  const rows = await sql.query<Row>(
    `select i.id as institution_id, i.name as institution_name, i.kind, i.city, i.is_demo as inst_demo,
            c.id as campus_id, c.name as campus_name,
            k.id as canteen_id, k.name as canteen_name, k.status, k.description, k.is_demo as canteen_demo
     from institutions i
     join campuses c on c.institution_id = i.id
     join canteens k on k.campus_id = c.id
     order by i.name, c.name, k.name`,
  );
  return rows.map((r) => ({
    institutionId: str(r.institution_id),
    institutionName: str(r.institution_name),
    kind: str(r.kind),
    city: str(r.city),
    institutionDemo: bool(r.inst_demo),
    campusId: str(r.campus_id),
    campusName: str(r.campus_name),
    canteenId: str(r.canteen_id),
    canteenName: str(r.canteen_name),
    status: str(r.status),
    description: str(r.description),
    canteenDemo: bool(r.canteen_demo),
  }));
}

export async function getPulse(sql: Sql, canteenId: string) {
  const canteen = await loadCanteen(sql, canteenId, false);
  const queue = await one(
    sql,
    `select coalesce(max(updated_at)::text, '') as stamp, count(*)::int as n
     from orders where canteen_id = $1 and status = any($2::text[])`,
    [canteenId, ACTIVE],
  );
  return {
    catalogVersion: int(canteen.catalog_version),
    status: str(canteen.status),
    queueStamp: queue ? str(queue.stamp) : "",
    activeOrders: queue ? int(queue.n) : 0,
  };
}

export async function getDemandPricing(sql: Sql, actor: Actor, canteenId: string) {
  const canteen = await loadCanteen(sql, canteenId, false);
  assertOperate(actor, canteenId, str(canteen.institution_id), "admin");
  await ensureDemandPricingSettings(sql, canteenId);
  const settings = await one(sql, "select * from demand_pricing_settings where canteen_id = $1", [canteenId]);
  if (!settings) throw new CanteenError("DATA", "Demand-pricing settings were not created.");
  const items = await sql.query<Row>(
    `select i.id, i.name, i.base_price_paise, p.demand_growth_percent, p.applied_price_increase_percent,
            p.admin_override, p.pending_price_increase_percent, p.pending_since::text as pending_since
     from item_demand_prices p join items i on i.id = p.item_id
     where p.canteen_id = $1
       and (p.demand_growth_percent > 0 or p.applied_price_increase_percent > 0 or p.pending_price_increase_percent is not null)
     order by p.pending_price_increase_percent desc nulls last, p.demand_growth_percent desc
     limit 8`,
    [canteenId],
  );
  return {
    settings: demandSettings(settings),
    items: items.map((item) => ({
      id: str(item.id),
      name: str(item.name),
      basePricePaise: intOrNull(item.base_price_paise),
      demandGrowthPercent: int(item.demand_growth_percent),
      appliedPriceIncreasePercent: int(item.applied_price_increase_percent),
      adminOverride: bool(item.admin_override),
      pendingPriceIncreasePercent: intOrNull(item.pending_price_increase_percent),
      pendingSince: item.pending_since == null ? null : str(item.pending_since),
    })),
    reviewWindowMinutes: DEMAND_PRICING_REVIEW_MS / 60_000,
    maximumIncreasePercent: 20,
  };
}

export async function saveDemandPricing(
  sql: Sql,
  actor: Actor,
  canteenId: string,
  settings: DemandPricingSettings,
) {
  const canteen = await loadCanteen(sql, canteenId, false);
  assertOperate(actor, canteenId, str(canteen.institution_id), "admin");
  const values = Object.values(settings);
  if (
    values.some((value) => !Number.isInteger(value)) ||
    settings.moderateDemandPercent < 1 ||
    settings.moderateDemandPercent > 1000 ||
    settings.highDemandPercent <= settings.moderateDemandPercent ||
    settings.highDemandPercent > 1000 ||
    settings.moderatePricePercent < 0 ||
    settings.moderatePricePercent > 20 ||
    settings.highPricePercent < settings.moderatePricePercent ||
    settings.highPricePercent > 20
  ) {
    throw new CanteenError("BAD_INPUT", "Use increasing demand tiers and price increases from 0% to 20%.");
  }
  await sql.query(
    `insert into demand_pricing_settings
       (canteen_id, moderate_demand_percent, moderate_price_percent, high_demand_percent, high_price_percent, updated_at)
     values ($1,$2,$3,$4,$5,now())
     on conflict (canteen_id) do update set
       moderate_demand_percent=excluded.moderate_demand_percent,
       moderate_price_percent=excluded.moderate_price_percent,
       high_demand_percent=excluded.high_demand_percent,
       high_price_percent=excluded.high_price_percent,
       updated_at=now()`,
    [
      canteenId,
      settings.moderateDemandPercent,
      settings.moderatePricePercent,
      settings.highDemandPercent,
      settings.highPricePercent,
    ],
  );
  await audit(sql, actor.userId, str(canteen.institution_id), "DEMAND_PRICING_SETTINGS", "canteen", canteenId, settings);
  return getDemandPricing(sql, actor, canteenId);
}

function canView(actor: Actor, order: Row): boolean {
  if (str(order.customer_user_id) === actor.userId) return true;
  return canOperateCanteen(actor, str(order.canteen_id), str(order.institution_id), "staff");
}

async function liveEta(sql: Sql, order: Row) {
  const ahead = await one(
    sql,
    `select count(*)::int as n from orders
     where canteen_id = $1 and status = any($2::text[]) and placed_at < $3 and id <> $4`,
    [order.canteen_id, ACTIVE, order.placed_at, order.id],
  );
  const prep = await one(sql, "select coalesce(max(prep_minutes), 5)::int as p from order_items where order_id = $1", [
    order.id,
  ]);
  const canteen = await one(sql, "select prep_capacity from canteens where id = $1", [order.canteen_id]);
  const ordersAhead = ahead ? int(ahead.n) : 0;
  const eta = estimateWait(ordersAhead, prep ? int(prep.p) : 5, canteen ? int(canteen.prep_capacity) : 4);
  return { ordersAhead, etaMinutes: eta, approximate: true };
}

export async function getOrder(sql: Sql, actor: Actor, orderId: string) {
  const order = await one(sql, "select * from orders where id = $1", [orderId]);
  if (!order) throw new CanteenError("NOT_FOUND", "Order not found.");
  if (!canView(actor, order)) throw new CanteenError("FORBIDDEN", "You cannot view that order.");
  const items = await sql.query<Row>("select * from order_items where order_id = $1", [orderId]);
  const hist = await sql.query<Row>(
    "select from_status, to_status, note, created_at::text as created_at from status_history where order_id = $1 order by created_at",
    [orderId],
  );
  const eta = await liveEta(sql, order);
  const review = await one(sql, "select rating, comment from reviews where order_id = $1", [orderId]);
  return {
    id: str(order.id),
    token: str(order.token),
    status: str(order.status),
    paymentStatus: str(order.payment_status),
    institutionName: str(order.institution_name),
    campusName: str(order.campus_name),
    canteenName: str(order.canteen_name),
    canteenId: str(order.canteen_id),
    counterName: order.counter_name == null ? null : str(order.counter_name),
    subtotalPaise: int(order.subtotal_paise),
    chargesPaise: int(order.charges_paise),
    discountPaise: int(order.discount_paise),
    totalPaise: int(order.total_paise),
    couponCode: order.coupon_code == null ? null : str(order.coupon_code),
    instructions: order.instructions == null ? null : str(order.instructions),
    pickupCode: str(order.pickup_code),
    placedAt: str(order.placed_at),
    pickedUpAt: order.picked_up_at == null ? null : str(order.picked_up_at),
    cancelReason: order.cancel_reason == null ? null : str(order.cancel_reason),
    customer: str(order.customer_user_id) === actor.userId,
    ...eta,
    items: items.map((item) => ({
      name: str(item.name),
      qty: int(item.qty),
      unitPaise: int(item.unit_paise),
      linePaise: int(item.line_paise),
      addons: Array.isArray(item.addons_json) ? item.addons_json : [],
      instructions: item.instructions == null ? null : str(item.instructions),
    })),
    history: hist.map((h) => ({
      from: h.from_status == null ? null : str(h.from_status),
      to: str(h.to_status),
      note: h.note == null ? null : str(h.note),
      at: str(h.created_at),
    })),
    review: review ? { rating: int(review.rating), comment: str(review.comment) } : null,
  };
}

export async function listMyOrders(sql: Sql, userId: string) {
  const rows = await sql.query<Row>(
    `select id, token, status, payment_status, total_paise, canteen_name, placed_at::text as placed_at, counter_name
     from orders where customer_user_id = $1 order by placed_at desc limit 40`,
    [userId],
  );
  return rows.map((r) => ({
    id: str(r.id),
    token: str(r.token),
    status: str(r.status),
    paymentStatus: str(r.payment_status),
    totalPaise: int(r.total_paise),
    canteenName: str(r.canteen_name),
    placedAt: str(r.placed_at),
    counterName: r.counter_name == null ? null : str(r.counter_name),
  }));
}

export async function listQueue(sql: Sql, actor: Actor, canteenId: string) {
  const canteen = await loadCanteen(sql, canteenId, false);
  assertOperate(actor, canteenId, str(canteen.institution_id), "staff");
  const rows = await sql.query<Row>(
    `select o.id, o.token, o.status, o.payment_status, o.total_paise, o.placed_at::text as placed_at,
            o.counter_name, o.instructions, o.eta_minutes, u.name as customer_name,
            (select json_agg(json_build_object('name', oi.name, 'qty', oi.qty))
             from order_items oi where oi.order_id = o.id) as items
     from orders o
     join "user" u on u.id = o.customer_user_id
     where o.canteen_id = $1 and o.status = any($2::text[])
     order by o.placed_at`,
    [canteenId, ["PAYMENT_CONFIRMED", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP"]],
  );
  return rows.map((r, index) => ({
    id: str(r.id),
    token: str(r.token),
    status: str(r.status),
    paymentStatus: str(r.payment_status),
    totalPaise: int(r.total_paise),
    placedAt: str(r.placed_at),
    counterName: r.counter_name == null ? null : str(r.counter_name),
    instructions: r.instructions == null ? null : str(r.instructions),
    customerName: str(r.customer_name),
    ordersAhead: index,
    etaMinutes: estimateWait(index, int(r.eta_minutes) || 8, int(canteen.prep_capacity)),
    approximate: true,
    items: Array.isArray(r.items) ? r.items : typeof r.items === "string" ? JSON.parse(str(r.items)) : [],
  }));
}

export async function updateItem(
  sql: Sql,
  actor: Actor,
  itemId: string,
  patch: {
    name?: string;
    description?: string;
    basePricePaise?: number | null;
    discountPaise?: number;
    prepMinutes?: number;
    diet?: "veg" | "egg" | "nonveg";
    availability?: Availability;
  },
) {
  const item = await one(sql, "select * from items where id = $1 for update", [itemId]);
  if (!item) throw new CanteenError("NOT_FOUND", "Item not found.");
  const canteen = await loadCanteen(sql, str(item.canteen_id), false);
  assertOperate(actor, str(canteen.id), str(canteen.institution_id), "admin");
  const name = (patch.name ?? str(item.name)).trim().slice(0, 80);
  const description = (patch.description ?? str(item.description)).trim().slice(0, 240);
  const price = patch.basePricePaise === undefined ? intOrNull(item.base_price_paise) : patch.basePricePaise;
  const manualPriceChange = patch.basePricePaise !== undefined && patch.basePricePaise !== intOrNull(item.base_price_paise);
  const discount = patch.discountPaise ?? int(item.discount_paise);
  const prep = patch.prepMinutes ?? int(item.prep_minutes);
  const diet = patch.diet ?? (str(item.diet) as "veg" | "egg" | "nonveg");
  const availability = patch.availability ?? (str(item.availability) as Availability);
  if (!name) throw new CanteenError("BAD_INPUT", "Name is required.");
  if (price != null && (!Number.isInteger(price) || price < 0 || price > 1000000)) {
    throw new CanteenError("BAD_INPUT", "Price looks wrong.");
  }
  if (discount < 0 || (price != null && discount > price)) throw new CanteenError("BAD_INPUT", "Discount is too high.");
  if (prep < 1 || prep > 180) throw new CanteenError("BAD_INPUT", "Prep time must be 1–180 minutes.");
  await sql.query(
    `update items set name=$2, description=$3, base_price_paise=$4, discount_paise=$5, prep_minutes=$6,
     diet=$7, is_veg=$8, availability=$9, updated_at=now() where id=$1`,
    [itemId, name, description, price, discount, prep, diet, diet === "veg", availability],
  );
  if (manualPriceChange) {
    await sql.query(
     `update item_demand_prices
      set applied_price_increase_percent=0, admin_override=true,
          pending_price_increase_percent=null, pending_since=null, updated_at=now()
      where item_id=$1`,
     [itemId],
    );
  }
  await bump(sql, str(canteen.id));
  await audit(sql, actor.userId, str(canteen.institution_id), "ITEM_UPDATE", "item", itemId, {
    price,
    availability,
    manualPriceChange,
  });
  return { itemId, basePricePaise: price };
}

export async function createItem(
  sql: Sql,
  actor: Actor,
  input: {
    canteenId: string;
    categoryId: string;
    name: string;
    basePricePaise: number;
    prepMinutes: number;
    diet: "veg" | "egg" | "nonveg";
  },
) {
  const canteen = await loadCanteen(sql, input.canteenId, false);
  assertOperate(actor, input.canteenId, str(canteen.institution_id), "admin");
  const cat = await one(sql, "select id from categories where id = $1 and canteen_id = $2", [
    input.categoryId,
    input.canteenId,
  ]);
  if (!cat) throw new CanteenError("NOT_FOUND", "Category not found.");
  if (!input.name.trim()) throw new CanteenError("BAD_INPUT", "Name is required.");
  const id = nid("itm");
  await sql.query(
    `insert into items (id, canteen_id, category_id, name, description, image_url, base_price_paise, discount_paise, is_veg, diet, prep_minutes, availability, is_demo)
     values ($1,$2,$3,$4,'Added by the canteen admin.', '/menu/fries.jpg', $5, 0, $6, $7, $8, 'AVAILABLE', true)`,
    [
      id,
      input.canteenId,
      input.categoryId,
      input.name.trim().slice(0, 80),
      input.basePricePaise,
      input.diet === "veg",
      input.diet,
      input.prepMinutes,
    ],
  );
  await bump(sql, input.canteenId);
  await audit(sql, actor.userId, str(canteen.institution_id), "ITEM_CREATE", "item", id, { name: input.name });
  return { itemId: id };
}

export async function grantRole(
  sql: Sql,
  actor: Actor,
  input: { email: string; role: Role; canteenId: string | null; institutionId: string | null },
) {
  if (input.role === "SUPER_ADMIN" && !isSuper(actor)) {
    throw new CanteenError("FORBIDDEN", "Only a platform admin can grant that role.");
  }
  if (input.role === "CANTEEN_ADMIN" || input.role === "STAFF") {
    if (!input.canteenId) throw new CanteenError("BAD_INPUT", "Pick a canteen.");
    const canteen = await loadCanteen(sql, input.canteenId, false);
    const level = input.role === "STAFF" ? "staff" : "admin";
    assertOperate(actor, input.canteenId, str(canteen.institution_id), level === "staff" && !isSuper(actor) ? "admin" : "admin");
    if (!isSuper(actor)) {
      const instAdmin = actor.memberships.some(
        (m) => m.active && m.role === "INSTITUTION_ADMIN" && m.institutionId === str(canteen.institution_id),
      );
      const canteenAdmin = actor.memberships.some(
        (m) => m.active && m.role === "CANTEEN_ADMIN" && m.canteenId === input.canteenId,
      );
      if (input.role === "CANTEEN_ADMIN" && !instAdmin) {
        throw new CanteenError("FORBIDDEN", "Only an institution admin can appoint a canteen admin.");
      }
      if (input.role === "STAFF" && !instAdmin && !canteenAdmin) {
        throw new CanteenError("FORBIDDEN", "You cannot add staff there.");
      }
    }
    input.institutionId = str(canteen.institution_id);
  }
  if (input.role === "INSTITUTION_ADMIN") {
    if (!input.institutionId) throw new CanteenError("BAD_INPUT", "Pick an institution.");
    if (!isSuper(actor) && !actor.memberships.some((m) => m.active && m.role === "INSTITUTION_ADMIN" && m.institutionId === input.institutionId)) {
      throw new CanteenError("FORBIDDEN", "You cannot grant that role.");
    }
  }
  const user = await one(sql, 'select id from "user" where lower(email) = lower($1)', [input.email.trim()]);
  if (!user) throw new CanteenError("NOT_FOUND", "No account with that email yet. Ask them to sign up first.");
  const id = nid("mem");
  await sql.query(
    `insert into memberships (id, user_id, role, institution_id, canteen_id, active) values ($1,$2,$3,$4,$5,true)`,
    [id, user.id, input.role, input.institutionId, input.canteenId],
  );
  await audit(sql, actor.userId, input.institutionId, "GRANT_ROLE", "membership", id, { role: input.role, email: input.email });
  return { id };
}

export async function listStaff(sql: Sql, actor: Actor, canteenId: string) {
  const canteen = await loadCanteen(sql, canteenId, false);
  assertOperate(actor, canteenId, str(canteen.institution_id), "admin");
  const rows = await sql.query<Row>(
    `select m.id, m.role, u.name, u.email from memberships m
     join "user" u on u.id = m.user_id
     where m.active = true and (m.canteen_id = $1 or (m.role = 'INSTITUTION_ADMIN' and m.institution_id = $2))
     order by m.role, u.name`,
    [canteenId, canteen.institution_id],
  );
  return rows.map((r) => ({ id: str(r.id), role: str(r.role), name: str(r.name), email: str(r.email) }));
}

export async function analytics(sql: Sql, actor: Actor, canteenId: string | null, institutionId: string | null) {
  let canteenIds: string[] = [];
  if (canteenId) {
    const canteen = await loadCanteen(sql, canteenId, false);
    assertOperate(actor, canteenId, str(canteen.institution_id), "admin");
    canteenIds = [canteenId];
  } else if (institutionId) {
    if (!isSuper(actor) && !actor.memberships.some((m) => m.active && m.role === "INSTITUTION_ADMIN" && m.institutionId === institutionId)) {
      throw new CanteenError("FORBIDDEN", "You cannot view that institution.");
    }
    const rows = await sql.query<Row>("select id from canteens where institution_id = $1", [institutionId]);
    canteenIds = rows.map((r) => str(r.id));
  } else if (isSuper(actor)) {
    const rows = await sql.query<Row>("select id from canteens");
    canteenIds = rows.map((r) => str(r.id));
  } else {
    throw new CanteenError("FORBIDDEN", "Pick a canteen.");
  }
  if (!canteenIds.length) {
    return { days: [], popular: [], hours: [], avgPrepMinutes: null, cancellationRate: 0, avgRating: null, orders: 0, revenuePaise: 0, demo: true };
  }
  const days = await sql.query<Row>(
    `select to_char(placed_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD') as day,
            count(*)::int as orders,
            coalesce(sum(total_paise) filter (where payment_status = 'PAID'), 0)::int as revenue
     from orders
     where canteen_id = any($1::text[]) and placed_at > now() - interval '14 days'
     group by 1 order by 1`,
    [canteenIds],
  );
  const popular = await sql.query<Row>(
    `select oi.name, sum(oi.qty)::int as qty
     from order_items oi join orders o on o.id = oi.order_id
     where o.canteen_id = any($1::text[]) and o.payment_status = 'PAID'
     group by oi.name order by qty desc limit 6`,
    [canteenIds],
  );
  const hours = await sql.query<Row>(
    `select extract(hour from placed_at at time zone 'Asia/Kolkata')::int as hour, count(*)::int as orders
     from orders where canteen_id = any($1::text[]) and placed_at > now() - interval '14 days'
     group by 1 order by 1`,
    [canteenIds],
  );
  const totals = await one(
    sql,
    `select count(*)::int as orders,
            coalesce(sum(total_paise) filter (where payment_status = 'PAID'), 0)::int as revenue,
            count(*) filter (where status = 'CANCELLED')::int as cancelled,
            avg(prep_seconds) filter (where prep_seconds is not null) as prep
     from orders where canteen_id = any($1::text[]) and placed_at > now() - interval '14 days'`,
    [canteenIds],
  );
  const rating = await one(
    sql,
    `select avg(rating) as rating from reviews r join orders o on o.id = r.order_id
     where o.canteen_id = any($1::text[])`,
    [canteenIds],
  );
  const orders = totals ? int(totals.orders) : 0;
  const cancelled = totals ? int(totals.cancelled) : 0;
  return {
    demo: true,
    days: days.map((d) => ({ day: str(d.day).slice(5), orders: int(d.orders), revenue: int(d.revenue) / 100 })),
    popular: popular.map((p) => ({ name: str(p.name), qty: int(p.qty) })),
    hours: hours.map((h) => ({ hour: `${int(h.hour)}:00`, orders: int(h.orders) })),
    avgPrepMinutes: totals?.prep == null ? null : Math.round(Number(totals.prep) / 60),
    cancellationRate: orders ? Math.round((cancelled / orders) * 100) : 0,
    avgRating: rating?.rating == null ? null : Math.round(Number(rating.rating) * 10) / 10,
    orders,
    revenuePaise: totals ? int(totals.revenue) : 0,
  };
}

export async function salesSnapshot(sql: Sql, actor: Actor, canteenId: string): Promise<SalesSnapshot> {
  const canteen = await loadCanteen(sql, canteenId, false);
  assertOperate(actor, canteenId, str(canteen.institution_id), "admin");

  const rows = await sql.query<Row>(
    `select i.id, i.name, c.name as category_name, i.availability,
            coalesce(sum(oi.qty) filter (where o.id is not null), 0)::int as quantity_sold,
            coalesce(sum(oi.line_paise) filter (where o.id is not null), 0)::int as revenue_paise,
            max(o.placed_at)::text as last_ordered_at
     from items i
     join categories c on c.id = i.category_id
     left join order_items oi on oi.item_id = i.id
     left join orders o on o.id = oi.order_id
       and o.canteen_id = i.canteen_id
       and o.payment_status = 'PAID'
       and o.placed_at >= now() - interval '14 days'
     where i.canteen_id = $1
     group by i.id, c.name
     order by i.name`,
    [canteenId],
  );
  const items = rankSalesItems(rows.map((row) => ({
    id: str(row.id),
    name: str(row.name),
    categoryName: str(row.category_name),
    availability: str(row.availability) as Availability,
    quantitySold: int(row.quantity_sold),
    revenuePaise: int(row.revenue_paise),
    lastOrderedAt: row.last_ordered_at == null ? null : str(row.last_ordered_at),
  })));

  const pairs = await sql.query<Row>(
    `select first_line.item_id as first_item_id,
            second_line.item_id as second_item_id,
            count(distinct o.id)::int as orders_together
     from order_items first_line
     join order_items second_line
       on second_line.order_id = first_line.order_id
       and second_line.item_id > first_line.item_id
     join orders o on o.id = first_line.order_id
     join items first_item on first_item.id = first_line.item_id and first_item.canteen_id = o.canteen_id
     join items second_item on second_item.id = second_line.item_id and second_item.canteen_id = o.canteen_id
     where o.canteen_id = $1
       and o.payment_status = 'PAID'
       and o.placed_at >= now() - interval '14 days'
     group by first_line.item_id, second_line.item_id
     order by orders_together desc
     limit 50`,
    [canteenId],
  );

  return {
    periodDays: 14,
    items,
    pairs: pairs.map((row) => ({
      firstItemId: str(row.first_item_id),
      secondItemId: str(row.second_item_id),
      ordersTogether: int(row.orders_together),
    })),
  };
}

export async function listNotifications(sql: Sql, userId: string) {
  const rows = await sql.query<Row>(
    `select id, title, body, kind, order_id, read_at::text as read_at, created_at::text as created_at
     from notifications where user_id = $1 order by created_at desc limit 30`,
    [userId],
  );
  return rows.map((r) => ({
    id: str(r.id),
    title: str(r.title),
    body: str(r.body),
    kind: str(r.kind),
    orderId: r.order_id == null ? null : str(r.order_id),
    read: r.read_at != null,
    at: str(r.created_at),
  }));
}

export async function markNotificationsRead(sql: Sql, userId: string) {
  await sql.query("update notifications set read_at = now() where user_id = $1 and read_at is null", [userId]);
  return { ok: true };
}

export async function addReview(sql: Sql, actor: Actor, orderId: string, rating: number, comment: string) {
  const order = await one(sql, "select * from orders where id = $1", [orderId]);
  if (!order) throw new CanteenError("NOT_FOUND", "Order not found.");
  if (str(order.customer_user_id) !== actor.userId) throw new CanteenError("FORBIDDEN", "You can only review your own order.");
  if (str(order.status) !== "PICKED_UP") throw new CanteenError("POLICY", "Review the order after pickup.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new CanteenError("BAD_INPUT", "Rating must be 1–5.");
  try {
    await sql.query(
      "insert into reviews (id, order_id, user_id, canteen_id, rating, comment) values ($1,$2,$3,$4,$5,$6)",
      [nid("rev"), orderId, actor.userId, order.canteen_id, rating, comment.trim().slice(0, 280)],
    );
  } catch (error) {
    if (isUnique(error)) throw new CanteenError("DUPLICATE", "You already reviewed this order.");
    throw error;
  }
  return { ok: true };
}

export async function submitPartner(sql: Sql, userId: string, orgName: string, campusName: string, note: string) {
  if (orgName.trim().length < 2) throw new CanteenError("BAD_INPUT", "Tell us the institution name.");
  await sql.query(
    "insert into partner_leads (id, user_id, org_name, campus_name, note) values ($1,$2,$3,$4,$5)",
    [nid("lead"), userId, orgName.trim().slice(0, 120), campusName.trim().slice(0, 120), note.trim().slice(0, 500)],
  );
  return { ok: true };
}

export async function platformOverview(sql: Sql, actor: Actor) {
  if (!isSuper(actor)) throw new CanteenError("FORBIDDEN", "Platform tools are for the super admin.");
  const institutions = await sql.query<Row>(
    `select i.id, i.name, i.kind, i.city, i.is_demo, s.plan, s.status as sub_status,
            (select count(*)::int from canteens k where k.institution_id = i.id) as canteens
     from institutions i left join subscriptions s on s.institution_id = i.id
     order by i.name`,
  );
  const payments = await one(
    sql,
    `select count(*)::int as n, coalesce(sum(amount_paise) filter (where status = 'PAID'),0)::int as paid,
            coalesce(sum(amount_paise) filter (where status = 'REFUNDED'),0)::int as refunded
     from payments`,
  );
  const audits = await sql.query<Row>(
    `select id, action, entity, entity_id, created_at::text as created_at, institution_id
     from audit_logs order by created_at desc limit 20`,
  );
  const accounts = await one(sql, 'select count(*)::int as n from "user"');
  const leads = await sql.query<Row>(
    `select l.id, l.org_name, l.campus_name, l.note, l.created_at::text as created_at, u.name, u.email
     from partner_leads l join "user" u on u.id = l.user_id
     order by l.created_at desc limit 12`,
  );
  return {
    demo: true,
    accounts: accounts ? int(accounts.n) : 0,
    paidPaise: payments ? int(payments.paid) : 0,
    refundedPaise: payments ? int(payments.refunded) : 0,
    paymentCount: payments ? int(payments.n) : 0,
    institutions: institutions.map((i) => ({
      id: str(i.id),
      name: str(i.name),
      kind: str(i.kind),
      city: str(i.city),
      demo: bool(i.is_demo),
      plan: i.plan == null ? "—" : str(i.plan),
      subscription: i.sub_status == null ? "—" : str(i.sub_status),
      canteens: int(i.canteens),
    })),
    audits: audits.map((a) => ({
      id: str(a.id),
      action: str(a.action),
      entity: str(a.entity),
      entityId: a.entity_id == null ? null : str(a.entity_id),
      at: str(a.created_at),
      institutionId: a.institution_id == null ? null : str(a.institution_id),
    })),
    leads: leads.map((lead) => ({
      id: str(lead.id),
      orgName: str(lead.org_name),
      campusName: str(lead.campus_name),
      note: str(lead.note),
      name: lead.name == null ? "" : str(lead.name),
      email: lead.email == null ? "" : str(lead.email),
      at: str(lead.created_at),
    })),
  };
}

export async function applyWebhookEvent(
  sql: Sql,
  body: { id?: string; event?: string; payload?: { payment?: { entity?: { id?: string; notes?: { canteenx_order_id?: string } } } } },
) {
  const orderId = body.payload?.payment?.entity?.notes?.canteenx_order_id;
  const eventId = body.id;
  if (!orderId || !eventId) throw new CanteenError("BAD_INPUT", "Webhook payload is missing the order id.");
  const outcome = body.event === "payment.failed" ? "FAILED" : body.event === "payment.captured" ? "PAID" : null;
  if (!outcome) return { ignored: true };
  return settlePayment(sql, null, orderId, outcome, "WEBHOOK", eventId, body.payload?.payment?.entity?.id ?? null);
}
