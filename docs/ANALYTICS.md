# Canteen Analytics

Canteen Analytics is a role-protected, rule-based dashboard for a selected canteen. It uses paid order lines and menu data already stored by CanteenX; it makes no LLM calls and requires no new API key or environment variable.

## Data and calculations

- The dashboard compares the most recent 14 India Standard Time calendar days with the preceding 14 days. The repository fetches a 28-day paid-order snapshot; cancelled and rejected orders are excluded.
- Item revenue is quantity multiplied by the unit price captured on the order line. It does not infer costs, margins, or profit.
- Daily revenue and order counts are zero-filled. Item rank sorts by quantity, then revenue, then item name. Low/no-sales review includes only `AVAILABLE` items; unavailable, sold-out, and hidden items are omitted.
- Co-purchase pairs count distinct paid orders, require at least three orders, and consider at most 15 unique menu items from one order.
- Peak hour and weekday counts use distinct paid orders bucketed in `Asia/Kolkata`.
- Suggestions are generated from the calculated values. They can reference only item IDs present in the selected canteen's menu snapshot. Approving or dismissing changes only the recommendation record; menu availability and prices are never changed.

## Access and endpoints

Every endpoint requires an authenticated session and an active canteen-admin, institution-admin, or super-admin membership. A canteen selection is verified and stored as that user's server-side analytics context; analytics and decision endpoints then derive the canteen only from this authenticated context, not from their URL, query, or body. SQL data queries are scoped to the selected canteen. Unauthorized roles receive a generic 403 response.

- `POST /api/analytics/context` — validate and store `{ "canteenId": "…" }` for the signed-in user's analytics context
- `GET /api/analytics/overview`
- `GET /api/analytics/recommendations`
- `POST /api/analytics/recommendations` — generate deterministic suggestions
- `POST /api/analytics/recommendations/decide` — JSON `{ "id": "…", "decision": "approved" | "dismissed" }`
- `GET /api/analytics/export.csv`

The context-selection identifier is treated only as a requested selection, never as authorization: the server verifies the session's role and canteen/institution membership before storing it. All subsequent endpoints derive the canteen from that server-side selection. CSV cells that begin with spreadsheet formula characters are prefixed to neutralize formula execution. Dynamic UI text is rendered through React text nodes, which HTML-escapes menu names.

## Setup and checks

Migration `0005_canteen_analytics.sql` creates the recommendation store; the project's normal migration process applies it. No additional package is needed.

Run `npm test` for the unit and PGlite-backed tests, `npm run typecheck` for type checking, and `npm run build` for a production build. The UI is available at `/analytics` for authorized roles and is also linked from the canteen-admin screen.
