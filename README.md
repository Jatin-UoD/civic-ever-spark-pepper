# CanteenX

**Skip the Queue. Order Ahead. Eat Faster.**

Multi-tenant canteen ordering platform for colleges, hostels, offices and food courts.  
Built for the **Nebius × NVIDIA Global AI Hackathon**.

---

## Built With (Hackathon Requirements)

| Requirement | Implementation |
|-------------|----------------|
| **Nebius** | Nebius Token Factory (`https://api.tokenfactory.nebius.com/v1/chat/completions`) |
| **NVIDIA Open Model** | `nvidia/Nemotron-3.5-Lightning` (default) |
| **Feature** | **"Ask the counter"** – students ask natural language questions about the live menu. Nemotron only suggests dishes that actually exist and are available right now. |

The API key stays on the server. It never reaches the browser.

### Feedback on Nebius + NVIDIA (required for submission)

- **What I used them for**: Real-time menu Q&A assistant ("Ask the counter") so students get instant, accurate suggestions without scrolling the full menu.
- **What worked well**: Token Factory OpenAI-compatible endpoint made integration very simple. Nemotron follows the strict system prompt well (does not invent items or prices).
- **Onboarding**: From zero to working call was fast once the API key was available. Clear model naming (`nvidia/Nemotron-3.5-Lightning`).
- **Would I build with them again?**: Yes — especially for campus / internal tools where low latency and controlled generation matter.

---

## Features

- Multi-tenant (Institutions → Campuses → Canteens)
- Live menu with availability control (staff can turn items off instantly)
- Cart, coupons, order tracking
- Staff queue + order accept / reject flow
- Role-based access (Customer, Staff, Canteen Admin, Institution Admin, Super Admin)
- **Ask the counter** powered by **NVIDIA Nemotron on Nebius Token Factory**
- **Admin sales insights** for 14-day item demand, top sellers, and combo ideas
- **Demand-based pricing** with admin-configurable sales thresholds, peak alerts, and delayed automatic price adjustments
- Demo mode payments (optional Razorpay support)

---

## Demo Accounts

Password for **all** seeded accounts: `SkipTheQueue1`

| Role | Email |
|------|-------|
| Customer | `customer@canteenx.dev` |
| Staff (Central Canteen) | `staff@canteenx.dev` |
| Canteen Admin | `canteen@canteenx.dev` |
| Institution Admin | `institution@canteenx.dev` |
| Super Admin | `super@canteenx.dev` |
| Staff (Night Mess – other tenant) | `night@canteenx.dev` |

- **Demo University → Main Campus → Central Canteen** has the full menu.
- **Harbour House Hostel → Night Mess** is a second tenant (used to prove isolation).
- Coupon: `WELCOME10` → 10% off on orders ≥ ₹100.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Jatin-UoD/civic-ever-spark-pepper.git
cd civic-ever-spark-pepper

# 2. Install
npm install

# 3. Environment (create .env)
# Required for AI feature:
NEBIUS_API_KEY=your_nebius_token_factory_key
# Optional:
NEBIUS_MODEL=nvidia/Nemotron-3.5-Lightning

# 4. Run
npm run dev
```

App runs at `http://localhost:8080`

### Useful scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm test` | Run unit + database invariant tests |
| `npm run build` | Production build + migrations |
| `npm run typecheck` | TypeScript check |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEBIUS_API_KEY` | For AI feature | Nebius Token Factory API key |
| `NEBIUS_MODEL` | No | Defaults to `nvidia/Nemotron-3.5-Lightning` |
| `DATABASE_URL` | Production | Postgres connection string |
| `RAZORPAY_KEY_ID` | No | Optional payment gateway |
| `RAZORPAY_KEY_SECRET` | No | Optional payment gateway |
| `RAZORPAY_WEBHOOK_SECRET` | No | Optional webhook verification |

> Never commit real keys. `.env` is already in `.gitignore`.

---

## How the AI Feature Works

1. Student opens a canteen menu.
2. Types a question in **"Ask the counter"** (e.g. "What vegetarian snacks are under ₹50?").
3. Server builds a fresh catalogue snapshot (only available items).
4. Calls **Nebius Token Factory** with model **NVIDIA Nemotron**.
5. Strict system prompt forces the model to answer only from the real menu.
6. Reply is shown instantly. If the key is missing, the UI clearly says Nebius is not connected (no hallucinated answers).

Source: `src/lib/canteen/nemotron.server.ts`

### Admin sales insights

Canteen admins can request a 14-day snapshot of paid item sales, including quantity, revenue, last order time, and observed co-purchases. The server verifies canteen access and calculates these figures before Nemotron selects review candidates, top sellers to feature, and combo ideas. The root `canteen-analytics.js` module supplies the shared ranking, candidate-selection, and recommendation-validation logic used by the server. Low-sales items are review candidates only; no menu item is automatically discontinued or changed.

### Demand-based pricing

Canteen admins can set two demand/price tiers (default: 30% more sales → 5% higher price; 50% → 10%). The server compares paid sales over the latest 60 minutes with the same 60-minute period on the previous four weeks. A peak creates an in-app admin notification and a 10-minute review window; manually changing that item's base price cancels the pending adjustment and pauses automation for that item until demand cools. If unchanged, the configured increase is applied automatically, capped at 20%. When demand falls, the automatic increase is reduced or removed. Prices are calculated on the server for both menus and checkout, while existing order totals remain unchanged. A zero historical baseline does not trigger an increase. The feature is demand-based, not cost-based, so it does not guarantee higher profit.

---

## Project Structure (high level)

```
src/
  lib/canteen/          # Domain logic + Nemotron integration
  routes/               # Pages (menu, cart, staff, admin...)
  components/
canteen-analytics.js   # Shared sales ranking and recommendation validation
server/                 # Server middleware
migrations/             # Database migrations + seed data
```

---

## License

MIT License – see [LICENSE](LICENSE)

---

## Hackathon Submission Notes

- **Track suggestion**: Best Apps and Agents
- Public repository: this repo
- Open source license: MIT
- NVIDIA model used: `nvidia/Nemotron-3.5-Lightning`
- Nebius product used: Token Factory
