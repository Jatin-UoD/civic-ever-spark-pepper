import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock3, QrCode, ShieldCheck, UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

const shots = [
  ["/menu/sandwich.jpg", "Sandwich Mania"],
  ["/menu/parantha.jpg", "Tandoor paranthas"],
  ["/menu/momos.jpg", "Momos"],
  ["/menu/noodles.jpg", "Wok plates"],
  ["/menu/chai.jpg", "Chai and cold coffee"],
  ["/menu/samosa.jpg", "Chaat"],
];

function Home() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <p className="font-display text-2xl font-semibold">Canteen<span className="text-chili">X</span></p>
        <div className="flex items-center gap-2">
          <a href="#faq" className="hidden rounded-full px-3 py-2 text-sm font-medium sm:inline">FAQ</a>
          <Link to="/login" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam">Sign in</Link>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-chili">Campus kitchens</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none sm:text-6xl">
            Skip the Queue. Order Ahead. Eat Faster.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Order from your campus canteen, pay online and collect when ready.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/browse" className="rounded-full bg-chili px-5 py-3 text-base font-semibold text-foam">
              Order Now
            </Link>
            <Link to="/partner" className="rounded-full border border-line bg-foam px-5 py-3 text-base font-semibold">
              Partner Your Canteen
            </Link>
          </div>
        </div>
        <aside className="ticket rounded-3xl px-6 py-7 shadow-sm" aria-label="Example pickup token">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Example token</p>
          <p className="mt-2 font-display text-5xl font-semibold tabular-nums">#C1024</p>
          <p className="mt-3 text-lg">Preparing · 3 ahead · ~12 min · Counter 2</p>
          <p className="mt-2 text-sm text-muted">Approximate. Live orders recompute from the queue, prep times and counter capacity.</p>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-2xl bg-cream px-2 py-3"><p className="font-semibold">Paid</p><p className="text-muted">UPI</p></div>
            <div className="rounded-2xl bg-cream px-2 py-3"><p className="font-semibold">Main</p><p className="text-muted">Counter</p></div>
            <div className="rounded-2xl bg-cream px-2 py-3"><p className="font-semibold">QR</p><p className="text-muted">Pickup</p></div>
          </div>
        </aside>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {shots.map(([src, label]) => (
            <figure key={label} className="w-44 shrink-0">
              <img src={src} alt={label} className="h-32 w-full rounded-2xl object-cover" />
              <figcaption className="mt-2 text-sm font-medium">{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [UtensilsCrossed, "Live menu", "Staff turn a dish off and every screen stops selling it."],
          [Clock3, "A real queue", "Tokens show orders ahead and an approximate wait."],
          [QrCode, "Pickup that sticks", "One scan, one handover. A second scan is refused."],
          [ShieldCheck, "Prices from the server", "The browser cannot talk the kitchen into a cheaper total."],
        ].map(([Icon, title, copy]) => (
          <article key={String(title)} className="rounded-3xl border border-line bg-foam p-5">
            <Icon className="size-5 text-chili" aria-hidden="true" />
            <h2 className="mt-3 font-display text-2xl font-semibold">{title as string}</h2>
            <p className="mt-2 text-sm text-muted">{copy as string}</p>
          </article>
        ))}
      </section>
      <section id="faq" className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="font-display text-4xl font-semibold">Questions from the corridor</h2>
        <div className="mt-6 divide-y divide-line rounded-3xl border border-line bg-foam">
          {[
            ["What if a dish sells out while it is in my cart?", "Staff availability is stored immediately. Your cart shows unavailable, the add button locks, and checkout is rejected on the server even if the page is stale."],
            ["Can I pay with UPI?", "The payment flow is built for Razorpay — UPI, cards, netbanking and wallets. Without gateway keys this preview settles a labelled demo payment. Card numbers are never stored."],
            ["How do I collect the order?", "You get an order id, a token and a QR. Staff scan or type it. The server checks the canteen, payment, ready status, and that it was not already collected."],
            ["Is this only for one college?", "No. Institutions, campuses and canteens are separate tenants. Staff only see the counters they are assigned to."],
          ].map(([q, a]) => (
            <details key={q} className="px-5 py-4">
              <summary className="cursor-pointer text-base font-semibold">{q}</summary>
              <p className="mt-2 text-sm text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
