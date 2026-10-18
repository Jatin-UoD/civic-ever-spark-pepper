# CanteenX

Skip the Queue. Order Ahead. Eat Faster.

Multi-tenant canteen ordering for colleges, hostels, offices and food courts. Institutions, campuses and canteens are separate. Staff can turn any item off; customers cannot buy it again until it is on.

## NVIDIA Nemotron on Nebius

The menu has **Ask the counter**. That box calls Nebius Token Factory at `https://api.tokenfactory.nebius.com/v1/chat/completions` with an NVIDIA open model. The key never reaches the browser.

Set these on the server only:

- `NEBIUS_API_KEY` — Token Factory key
- `NEBIUS_MODEL` — optional, default `nvidia/Nemotron-3.5-Lightning`

Without the key the button explains that Nebius is not connected. It does not invent a reply.

## Demo accounts

Password for every seeded account: `SkipTheQueue1`

| Role | Email |
| --- | --- |
| Customer | customer@canteenx.dev |
| Staff (Central Canteen) | staff@canteenx.dev |
| Canteen admin | canteen@canteenx.dev |
| Institution admin | institution@canteenx.dev |
| Super admin | super@canteenx.dev |
| Staff (Night Mess, other tenant) | night@canteenx.dev |

Demo University → Main Campus → Central Canteen is the full menu. Harbour House Hostel → Night Mess is a second tenant used to prove staff cannot cross over. Amul Ice Creams is an MRP item and stays unsellable until a canteen admin sets a price. Coupon `WELCOME10` is 10% off from ₹100.

## Payments

Demo mode is the default: no card data is collected or stored. Pay / Simulate failure on the order screen settles the payment on the server.

Optional gateway (set by the host, never in a committed env file):

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Webhook: `POST /api/payments/webhook` with header `x-razorpay-signature` (HMAC-SHA256 of the raw body). Without the secret the route refuses the call. Notes on the Razorpay order include `canteenx_order_id`. Events are idempotent. If an item is turned off before payment or accept, the order is cancelled and a captured webhook is marked refunded instead of being cooked.

`DATABASE_URL` is injected in production. The preview uses embedded Postgres and reapplies `migrations/`.

## Live updates

Menus, carts, the staff queue and tracking poll a small pulse every 2 seconds (catalog version and queue stamp). Neon’s pooled connections do not keep `LISTEN/NOTIFY`, so the app does not depend on it. Availability, price and canteen status are rechecked inside a transaction at checkout, payment and accept.

## Scripts

- `npm run dev` — app
- `npm test` — unit and database invariant tests (off item, closed canteen, tampered price, duplicate checkout, failed payment, tenant isolation, pickup)
- `npm run build` — production build and migrations
