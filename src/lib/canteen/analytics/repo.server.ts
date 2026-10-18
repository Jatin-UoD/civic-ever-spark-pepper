import type { Sql } from "../sql.ts";
import { NotFoundError } from "./access.js";

type Row = Record<string, unknown>;

function text(value: unknown): string {
  return value == null ? "" : String(value);
}

function number(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error("Unexpected analytics value in the database.");
  return parsed;
}

export async function getCanteenScope(sql: Sql, canteenId: string) {
  const rows = await sql.query<Row>(
    "select id, institution_id from canteens where id = $1",
    [canteenId],
  );
  const row = rows[0];
  return row ? { id: text(row.id), institutionId: text(row.institution_id) } : null;
}

export async function getSelectedCanteen(sql: Sql, userId: string) {
  const rows = await sql.query<Row>(
    "select canteen_id from analytics_user_context where user_id = $1",
    [userId],
  );
  return rows[0] ? text(rows[0].canteen_id) : null;
}

export async function setSelectedCanteen(sql: Sql, userId: string, canteenId: string) {
  await sql.query(
    `insert into analytics_user_context (user_id, canteen_id)
     values ($1, $2)
     on conflict (user_id) do update set canteen_id = excluded.canteen_id, updated_at = now()`,
    [userId, canteenId],
  );
}

export async function loadSnapshot(sql: Sql, canteenId: string) {
  const [lineRows, menuRows] = await Promise.all([
    sql.query<Row>(
      `select o.id as order_id, o.customer_user_id, o.placed_at::text as placed_at,
              o.payment_status, o.status as order_status, oi.item_id,
              coalesce(i.name, oi.name) as item_name, oi.qty, oi.unit_paise,
              c.id as category_id, coalesce(c.name, 'Others') as category_name
       from orders o
       join order_items oi on oi.order_id = o.id
       left join items i on i.id = oi.item_id and i.canteen_id = o.canteen_id
       left join categories c on c.id = i.category_id and c.canteen_id = o.canteen_id
       where o.canteen_id = $1
         and o.payment_status = 'PAID'
         and o.status not in ('CANCELLED', 'REJECTED')
         and o.placed_at >= now() - interval '28 days'
       order by o.placed_at`,
      [canteenId],
    ),
    sql.query<Row>(
      `select i.id, i.name, i.availability, c.id as category_id,
              coalesce(c.name, 'Others') as category_name
       from items i
       left join categories c on c.id = i.category_id and c.canteen_id = i.canteen_id
       where i.canteen_id = $1
       order by i.name`,
      [canteenId],
    ),
  ]);

  return {
    lines: lineRows.map((row) => ({
      orderId: text(row.order_id),
      customerId: text(row.customer_user_id),
      placedAt: text(row.placed_at),
      itemId: row.item_id == null ? null : text(row.item_id),
      itemName: text(row.item_name),
      categoryName: text(row.category_name),
      categoryId: row.category_id == null ? null : text(row.category_id),
      quantity: number(row.qty),
      unitPricePaise: number(row.unit_paise),
      paymentStatus: text(row.payment_status),
      orderStatus: text(row.order_status),
    })),
    menu: menuRows.map((row) => ({
      id: text(row.id),
      name: text(row.name),
      availability: text(row.availability),
      categoryName: text(row.category_name),
      categoryId: row.category_id == null ? null : text(row.category_id),
    })),
  };
}

export async function listRecommendations(sql: Sql, canteenId: string) {
  const rows = await sql.query<Row>(
    `select id, kind, title, body, item_ids, metrics, status,
            created_at::text as created_at, decided_at::text as decided_at
     from analytics_recommendations
     where canteen_id = $1
     order by created_at desc
     limit 100`,
    [canteenId],
  );
  return rows.map((row) => ({
    id: text(row.id),
    kind: text(row.kind),
    title: text(row.title),
    body: text(row.body),
    itemIds: parseJsonArray(row.item_ids),
    metrics: parseJsonObject(row.metrics),
    status: text(row.status),
    createdAt: text(row.created_at),
    decidedAt: row.decided_at == null ? null : text(row.decided_at),
  }));
}

export async function insertPendingRecommendations(sql: Sql, canteenId: string, recommendations: {
  id: string;
  kind: string;
  title: string;
  body: string;
  itemIds: string[];
  metrics: Record<string, unknown>;
  fingerprint: string;
}[]) {
  let inserted = 0;
  for (const recommendation of recommendations) {
    const rows = await sql.query<Row>(
      `insert into analytics_recommendations
         (id, canteen_id, kind, title, body, item_ids, metrics, fingerprint, status)
       values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,'pending')
       on conflict (canteen_id, fingerprint) where status = 'pending' do nothing
       returning id`,
      [
        recommendation.id,
        canteenId,
        recommendation.kind,
        recommendation.title,
        recommendation.body,
        JSON.stringify(recommendation.itemIds),
        JSON.stringify(recommendation.metrics),
        recommendation.fingerprint,
      ],
    );
    if (rows.length) inserted += 1;
  }
  return inserted;
}

export async function decidePendingRecommendation(
  sql: Sql,
  canteenId: string,
  id: string,
  decision: "approved" | "dismissed",
  userId: string,
) {
  const rows = await sql.query<Row>(
    `update analytics_recommendations
     set status = $3, decided_at = now(), decided_by = $4
     where id = $1 and canteen_id = $2 and status = 'pending'
     returning id, status, decided_at::text as decided_at`,
    [id, canteenId, decision, userId],
  );
  if (!rows[0]) throw new NotFoundError();
  return {
    id: text(rows[0].id),
    status: text(rows[0].status),
    decidedAt: text(rows[0].decided_at),
  };
}

function parseJsonArray(value: unknown): string[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
}
