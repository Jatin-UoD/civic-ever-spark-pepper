import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { RequireUser, Shell, StatusPill, errMsg, inr } from "@/components/canteen-ui";
import { addReview, cancelOrder, getOrder, settleDemoPayment } from "@/lib/canteen/api";
import { STATUS_LABEL } from "@/lib/canteen/domain";

export const Route = createFileRoute("/track/$orderId")({ component: TrackPage });

function TrackPage() {
  const { orderId } = Route.useParams();
  return <RequireUser><TrackBody orderId={orderId} /></RequireUser>;
}

function TrackBody({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const order = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder({ data: { orderId } }),
    refetchInterval: 2000,
  });
  const data = order.data;

  async function settle(outcome: "PAID" | "FAILED") {
    try {
      await settleDemoPayment({ data: { orderId, outcome } });
      toast.success(outcome === "PAID" ? "Demo payment confirmed." : "Demo payment failed. Nothing was captured.");
      await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    } catch (error) {
      toast.error(errMsg(error));
      await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    }
  }

  return (
    <Shell title="Live order" back={{ href: "/history", label: "All orders" }}>
      {!data ? <p className="text-muted">Loading token…</p> : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">{data.institutionName} · {data.canteenName}</p>
            <h1 className="font-display text-5xl font-semibold tabular-nums">#{data.token}</h1>
            <p className="mt-2 text-lg">
              {STATUS_LABEL[data.status] ?? data.status}
              {data.status !== "CANCELLED" && data.status !== "PICKED_UP" ? ` · ${data.ordersAhead} ahead · ~${data.etaMinutes} min` : ""}
              {data.counterName ? ` · ${data.counterName}` : ""}
            </p>
            <p className="text-sm text-muted">Wait is approximate and updates with the queue.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill value={data.status} />
              <StatusPill value={data.paymentStatus} />
            </div>
            {data.status === "PLACED" ? (
              <div className="mt-4 rounded-3xl border border-line bg-foam p-4">
                <p className="font-semibold">Demo payment</p>
                <p className="mt-1 text-sm text-muted">No card data is collected. A real Razorpay webhook would confirm this instead.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="rounded-full bg-chili px-4 py-3 text-sm font-semibold text-foam" onClick={() => void settle("PAID")}>Pay {inr(data.totalPaise)}</button>
                  <button type="button" className="rounded-full border border-line px-4 py-3 text-sm font-semibold" onClick={() => void settle("FAILED")}>Simulate failure</button>
                </div>
              </div>
            ) : null}
            {data.customer && ["PLACED", "PAYMENT_CONFIRMED", "ACCEPTED"].includes(data.status) ? (
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-chili"
                onClick={() => {
                  void cancelOrder({ data: { orderId, reason: "Cancelled by customer" } })
                    .then(() => queryClient.invalidateQueries({ queryKey: ["order", orderId] }))
                    .catch((error) => toast.error(errMsg(error)));
                }}
              >
                Cancel order
              </button>
            ) : null}
            {data.cancelReason ? <p className="mt-3 text-sm text-chili">{data.cancelReason}</p> : null}
            <ol className="mt-6 space-y-2">
              {data.history.map((entry, index) => (
                <li key={`${entry.to}-${index}`} className="text-sm text-muted">
                  {STATUS_LABEL[entry.to] ?? entry.to}{entry.note ? ` · ${entry.note}` : ""}
                </li>
              ))}
            </ol>
            {data.status === "PICKED_UP" && data.customer && !data.review ? (
              <form
                className="mt-6 rounded-3xl border border-line bg-foam p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void addReview({ data: { orderId, rating, comment } })
                    .then(() => queryClient.invalidateQueries({ queryKey: ["order", orderId] }))
                    .catch((error) => toast.error(errMsg(error)));
                }}
              >
                <p className="font-semibold">Rate the order</p>
                <div className="mt-2 flex gap-1" role="group" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      aria-pressed={rating === value}
                      onClick={() => setRating(value)}
                      className="grid size-11 place-items-center rounded-full"
                    >
                      <Star className={`size-6 ${value <= rating ? "fill-chili text-chili" : "text-line"}`} />
                    </button>
                  ))}
                </div>
                <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the counter?" className="mt-2 w-full rounded-2xl border border-line px-3 py-2" />
                <button type="submit" className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam">Save review</button>
              </form>
            ) : null}
          </section>
          <section className="receipt rounded-3xl border border-line bg-foam p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold">Receipt</h2>
                <p className="text-sm text-muted">{data.institutionName}</p>
                <p className="text-sm text-muted">{data.campusName} · {data.canteenName}</p>
              </div>
              <div className="no-print flex gap-2">
                <button type="button" className="rounded-full border border-line px-3 py-2 text-sm" onClick={() => window.print()}>Print</button>
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-2 text-sm"
                  onClick={() => {
                    const blob = new Blob([
                      [
                        data.institutionName,
                        `${data.campusName} · ${data.canteenName}`,
                        `Order ${data.id}`,
                        `Token ${data.token}`,
                        data.placedAt,
                        ...data.items.map((item) => `${item.qty} x ${item.name}  ${inr(item.linePaise)}`),
                        `Packing ${inr(data.chargesPaise)}`,
                        `Discount ${inr(data.discountPaise)}`,
                        `Total ${inr(data.totalPaise)}`,
                        `Payment ${data.paymentStatus}`,
                        `Counter ${data.counterName ?? ""}`,
                      ].join("\n"),
                    ], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${data.token}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm">Order {data.id} · Token {data.token}</p>
            <p className="text-sm text-muted">{new Date(data.placedAt).toLocaleString("en-IN")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {data.items.map((item) => (
                <li key={item.name} className="flex justify-between gap-3">
                  <span>{item.qty} × {item.name}</span>
                  <span className="tabular-nums">{inr(item.linePaise)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Items</dt><dd className="tabular-nums">{inr(data.subtotalPaise)}</dd></div>
              <div className="flex justify-between"><dt>Packing</dt><dd className="tabular-nums">{inr(data.chargesPaise)}</dd></div>
              <div className="flex justify-between"><dt>Discount</dt><dd className="tabular-nums">−{inr(data.discountPaise)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="tabular-nums">{inr(data.totalPaise)}</dd></div>
              <div className="flex justify-between"><dt>Payment</dt><dd>{data.paymentStatus}</dd></div>
            </dl>
            <div className="mt-4" dangerouslySetInnerHTML={{ __html: data.qrSvg }} />
            <p className="text-xs text-muted">Show this QR at {data.counterName ?? "the counter"}.</p>
          </section>
        </div>
      )}
    </Shell>
  );
}

