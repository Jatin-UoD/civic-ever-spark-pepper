import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RequireUser, Shell, StatusPill, inr } from "@/components/canteen-ui";
import { listMyOrders } from "@/lib/canteen/api";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  return <RequireUser><HistoryBody /></RequireUser>;
}

function HistoryBody() {
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => listMyOrders(), refetchInterval: 5000 });
  return (
    <Shell title="Your orders">
      <h1 className="font-display text-4xl font-semibold">Orders</h1>
      <div className="mt-5 space-y-3">
        {(orders.data ?? []).map((order) => (
          <Link key={order.id} to="/track/$orderId" params={{ orderId: order.id }} className="block rounded-3xl border border-line bg-foam p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-3xl font-semibold tabular-nums">#{order.token}</p>
                <p className="text-sm text-muted">{order.canteenName}{order.counterName ? ` · ${order.counterName}` : ""}</p>
              </div>
              <StatusPill value={order.status} />
            </div>
            <p className="mt-2 text-sm tabular-nums">{inr(order.totalPaise)} · {order.paymentStatus}</p>
          </Link>
        ))}
        {orders.data && orders.data.length === 0 ? <p className="text-muted">No orders yet.</p> : null}
      </div>
    </Shell>
  );
}
