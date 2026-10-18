import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DemoBanner, RequireUser, Shell, StatusPill, errMsg, inr, useMe } from "@/components/canteen-ui";
import { getMenu, getPulse, listDirectory, listQueue, pickupOrder, setCounterActive, setItemAvailability, transitionOrder, cancelOrder } from "@/lib/canteen/api";
import { canOperateCanteen } from "@/lib/canteen/domain";

export const Route = createFileRoute("/staff")({ component: StaffPage });

function StaffPage() {
  return <RequireUser><StaffBody /></RequireUser>;
}

function StaffBody() {
  const { me } = useMe();
  const directory = useQuery({ queryKey: ["directory"], queryFn: () => listDirectory() });
  const canteens = (directory.data ?? []).filter((row) =>
    me ? canOperateCanteen({ userId: me.userId, memberships: me.memberships }, row.canteenId, row.institutionId, "staff") : false,
  );
  const [canteenId, setCanteenId] = useState("");
  const activeId = canteenId || canteens[0]?.canteenId || "";
  const [tab, setTab] = useState<"orders" | "menu" | "counters">("orders");
  const [code, setCode] = useState("");
  const queryClient = useQueryClient();
  const pulse = useQuery({
    queryKey: ["pulse", activeId],
    queryFn: () => getPulse({ data: { canteenId: activeId } }),
    enabled: Boolean(activeId),
    refetchInterval: 2000,
  });
  const queue = useQuery({
    queryKey: ["queue", activeId, pulse.data?.queueStamp],
    queryFn: () => listQueue({ data: { canteenId: activeId } }),
    enabled: Boolean(activeId) && pulse.data != null,
  });
  const menu = useQuery({
    queryKey: ["menu", activeId, pulse.data?.catalogVersion, "staff"],
    queryFn: () => getMenu({ data: { canteenId: activeId } }),
    enabled: Boolean(activeId) && tab !== "orders",
  });

  async function run(task: Promise<unknown>, ok: string) {
    try {
      await task;
      toast.success(ok);
      await queryClient.invalidateQueries({ queryKey: ["queue", activeId] });
      await queryClient.invalidateQueries({ queryKey: ["pulse", activeId] });
      await queryClient.invalidateQueries({ queryKey: ["menu", activeId] });
    } catch (error) {
      toast.error(errMsg(error));
    }
  }

  return (
    <Shell title="Staff desk">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-semibold">Service desk</h1>
        <select value={activeId} onChange={(e) => setCanteenId(e.target.value)} className="rounded-full border border-line bg-foam px-4 py-3" aria-label="Canteen">
          {canteens.map((row) => <option key={row.canteenId} value={row.canteenId}>{row.canteenName}</option>)}
        </select>
      </div>
      <div className="mt-4"><DemoBanner /></div>
      {canteens.length === 0 ? <p className="mt-6">This account is not assigned to a canteen desk.</p> : (
        <>
          <div className="mt-4 flex gap-2">
            {(["orders", "menu", "counters"] as const).map((name) => (
              <button key={name} type="button" onClick={() => setTab(name)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${tab === name ? "bg-ink text-foam" : "bg-foam"}`}>{name === "menu" ? "Live menu" : name}</button>
            ))}
          </div>
          {tab === "orders" ? (
            <div className="mt-4 space-y-3">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(pickupOrder({ data: { canteenId: activeId, code } }), "Pickup verified").then(() => setCode(""));
                }}
              >
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Scan or type token" className="w-full rounded-full border border-line bg-foam px-4 py-3" aria-label="Pickup token" />
                <button type="submit" className="rounded-full bg-chili px-4 py-3 text-sm font-semibold text-foam">Verify</button>
              </form>
              {(queue.data ?? []).map((order) => (
                <article key={order.id} className="rounded-3xl border border-line bg-foam p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-4xl font-semibold tabular-nums">#{order.token}</p>
                      <p className="text-sm text-muted">{order.customerName} · {order.counterName} · {order.paymentStatus}</p>
                    </div>
                    <StatusPill value={order.status} />
                  </div>
                  <ul className="mt-2 text-sm">
                    {(order.items as { name: string; qty: number }[]).map((item) => (
                      <li key={item.name}>{item.qty} × {item.name}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-muted">{order.ordersAhead} ahead · ~{order.etaMinutes} min · approximate · {inr(order.totalPaise)}</p>
                  {order.instructions ? <p className="text-sm">Note: {order.instructions}</p> : null}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {order.status === "PAYMENT_CONFIRMED" ? <Big onClick={() => void run(transitionOrder({ data: { orderId: order.id, to: "ACCEPTED" } }), "Accepted")}>Accept</Big> : null}
                    {order.status === "ACCEPTED" ? <Big onClick={() => void run(transitionOrder({ data: { orderId: order.id, to: "PREPARING" } }), "Preparing")}>Start preparing</Big> : null}
                    {order.status === "PREPARING" ? <Big onClick={() => void run(transitionOrder({ data: { orderId: order.id, to: "READY_FOR_PICKUP" } }), "Ready")}>Mark ready</Big> : null}
                    {order.status === "READY_FOR_PICKUP" ? <Big onClick={() => void run(pickupOrder({ data: { canteenId: activeId, code: order.token } }), "Picked up")}>Picked up</Big> : null}
                    {order.status === "PAYMENT_CONFIRMED" || order.status === "ACCEPTED" ? (
                      <button type="button" className="min-h-12 rounded-2xl border border-line px-4 py-3 text-sm font-semibold text-chili" onClick={() => void run(cancelOrder({ data: { orderId: order.id, reason: "Cancelled by the kitchen" } }), "Cancelled. Paid orders are refunded.")}>Cancel</button>
                    ) : null}
                  </div>
                </article>
              ))}
              {queue.data && queue.data.length === 0 ? <p className="text-muted">No paid orders in the queue.</p> : null}
            </div>
          ) : null}
          {tab === "menu" && menu.data ? (
            <div className="mt-4 space-y-2">
              {menu.data.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-foam px-3 py-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">{item.availability}</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={item.availability === "AVAILABLE"}
                    className={`min-h-12 min-w-28 rounded-full px-4 text-sm font-semibold ${item.availability === "AVAILABLE" ? "bg-leaf text-foam" : "bg-chili text-foam"}`}
                    onClick={() => void run(
                      setItemAvailability({
                        data: { itemId: item.id, availability: item.availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE" },
                      }),
                      item.availability === "AVAILABLE" ? "Turned off" : "Back on",
                    )}
                  >
                    {item.availability === "AVAILABLE" ? "On" : "Off"}
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {tab === "counters" && menu.data ? (
            <div className="mt-4 space-y-2">
              {menu.data.counters.map((counter) => (
                <div key={counter.id} className="flex items-center justify-between rounded-2xl border border-line bg-foam px-3 py-3">
                  <div>
                    <p className="font-semibold">{counter.name}</p>
                    <p className="text-xs text-muted">{counter.lane}</p>
                  </div>
                  <button
                    type="button"
                    className={`min-h-12 rounded-full px-4 text-sm font-semibold ${counter.active ? "bg-leaf text-foam" : "bg-line"}`}
                    onClick={() => void run(setCounterActive({ data: { counterId: counter.id, active: !counter.active } }), counter.active ? "Counter paused" : "Counter open")}
                  >
                    {counter.active ? "Active" : "Paused"}
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </Shell>
  );
}

function Big({ children, onClick }: { children: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-12 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-foam">{children}</button>;
}
