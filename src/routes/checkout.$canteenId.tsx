import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DemoBanner, RequireUser, Shell, errMsg, inr } from "@/components/canteen-ui";
import { getCart, getPulse, placeOrder, saveCart } from "@/lib/canteen/api";
import type { CartLine } from "@/lib/canteen/domain";

export const Route = createFileRoute("/checkout/$canteenId")({ component: CheckoutPage });

function CheckoutPage() {
  const { canteenId } = Route.useParams();
  return <RequireUser><CheckoutBody canteenId={canteenId} /></RequireUser>;
}

function CheckoutBody({ canteenId }: { canteenId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coupon, setCoupon] = useState("");
  const [instructions, setInstructions] = useState("");
  const [pending, setPending] = useState(false);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const pulse = useQuery({
    queryKey: ["pulse", canteenId],
    queryFn: () => getPulse({ data: { canteenId } }),
    refetchInterval: 2000,
  });
  const cart = useQuery({
    queryKey: ["cart", canteenId, coupon, pulse.data?.catalogVersion],
    queryFn: () => getCart({ data: { canteenId, couponCode: coupon || null } }),
  });
  const data = cart.data;

  async function rewrite(next: CartLine[]) {
    try {
      await saveCart({ data: { canteenId, lines: next } });
      await queryClient.invalidateQueries({ queryKey: ["cart", canteenId] });
    } catch (error) {
      toast.error(errMsg(error));
    }
  }

  function asLines(): CartLine[] {
    return (data?.lines ?? []).map((line) => ({
      itemId: line.itemId ?? undefined,
      comboId: line.comboId ?? undefined,
      variantId: line.variantId,
      addonIds: line.addonIds,
      qty: line.qty,
      instructions: line.instructions,
    }));
  }

  async function pay() {
    if (!cart.data) return;
    setPending(true);
    try {
      const order = await placeOrder({
        data: {
          canteenId,
          idempotencyKey,
          expectedTotalPaise: cart.data.totalPaise,
          couponCode: coupon || null,
          instructions,
          lines: cart.data.lines.map((line) => ({
            itemId: line.itemId ?? undefined,
            comboId: line.comboId ?? undefined,
            variantId: line.variantId,
            addonIds: line.addonIds,
            qty: line.qty,
            instructions: line.instructions,
            clientUnitPaise: line.unitPaise,
          })),
        },
      });
      toast.success("demo" in order && order.demo ? "Order placed. Demo payment is next." : "Order placed.");
      await navigate({ to: "/track/$orderId", params: { orderId: order.id } });
    } catch (error) {
      toast.error(errMsg(error));
      void cart.refetch();
    } finally {
      setPending(false);
    }
  }

  return (
    <Shell title="Checkout" back={{ href: `/menu/${canteenId}`, label: "Menu" }}>
      <h1 className="font-display text-4xl font-semibold">Checkout</h1>
      <div className="mt-4"><DemoBanner /></div>
      {!data ? <p className="mt-6 text-muted">Loading cart…</p> : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-3">
            {data.lines.length === 0 ? <p>Your cart is empty.</p> : null}
            {data.lines.map((line) => (
              <article key={line.key} className="rounded-3xl border border-line bg-foam p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{line.name}{line.variantName ? ` · ${line.variantName}` : ""}</h2>
                    <p className="text-sm text-muted">{line.qty} × {inr(line.unitPaise)}</p>
                    {line.addons.length ? <p className="text-sm text-muted">{line.addons.map((a) => a.name).join(", ")}</p> : null}
                    {line.problems.map((problem) => <p key={problem} className="text-sm font-medium text-chili">{problem}</p>)}
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        className="size-11 rounded-full border border-line text-lg"
                        aria-label={`Decrease ${line.name}`}
                        onClick={() => {
                          const lines = asLines().flatMap((entry, index) => {
                            if (data.lines[index]?.key !== line.key) return [entry];
                            return entry.qty > 1 ? [{ ...entry, qty: entry.qty - 1 }] : [];
                          });
                          void rewrite(lines);
                        }}
                      >
                        −
                      </button>
                      <span className="font-semibold tabular-nums">{line.qty}</span>
                      <button
                        type="button"
                        disabled={line.qty >= 10}
                        className="size-11 rounded-full bg-ink text-lg text-foam disabled:opacity-40"
                        aria-label={`Increase ${line.name}`}
                        onClick={() => {
                          const lines = asLines().map((entry, index) =>
                            data.lines[index]?.key === line.key && entry.qty < 10 ? { ...entry, qty: entry.qty + 1 } : entry,
                          );
                          void rewrite(lines);
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="text-sm font-semibold text-chili"
                        onClick={() => void rewrite(asLines().filter((_, index) => data.lines[index]?.key !== line.key))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="tabular-nums font-semibold">{inr(line.linePaise)}</p>
                </div>
              </article>
            ))}
            <label className="block text-sm font-medium">
              Note for the kitchen
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={140} className="mt-1 w-full rounded-2xl border border-line bg-foam px-3 py-3" />
            </label>
          </div>
          <aside className="h-fit rounded-3xl border border-line bg-foam p-5">
            <label className="block text-sm font-medium">
              Coupon
              <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="WELCOME10" className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3 uppercase" />
            </label>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Items</dt><dd className="tabular-nums">{inr(data.subtotalPaise)}</dd></div>
              <div className="flex justify-between"><dt>Packing</dt><dd className="tabular-nums">{inr(data.chargesPaise)}</dd></div>
              <div className="flex justify-between"><dt>Discount</dt><dd className="tabular-nums">−{inr(data.discountPaise)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{inr(data.totalPaise)}</dd></div>
            </dl>
            <p className="mt-3 text-sm text-muted">~{data.etaMinutes} min · {data.ordersAhead} orders ahead · approximate</p>
            {data.problems.map((problem) => <p key={problem} className="mt-2 text-sm font-medium text-chili">{problem}</p>)}
            <button type="button" disabled={pending || data.blocked || data.lines.length === 0} onClick={() => void pay()} className="mt-4 w-full rounded-full bg-chili py-3 font-semibold text-foam disabled:cursor-not-allowed disabled:bg-line disabled:text-muted">
              {pending ? "Checking the kitchen…" : "Place order"}
            </button>
            <p className="mt-2 text-xs text-muted">The server rechecks availability, canteen status and price before the token is issued.</p>
          </aside>
        </div>
      )}
    </Shell>
  );
}
