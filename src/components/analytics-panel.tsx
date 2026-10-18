import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAnalytics } from "@/lib/canteen/api";
import { inr } from "@/components/canteen-ui";

export function AnalyticsPanel({ canteenId, institutionId }: { canteenId?: string; institutionId?: string }) {
  const query = useQuery({
    queryKey: ["analytics", canteenId ?? null, institutionId ?? null],
    queryFn: () => getAnalytics({ data: { canteenId: canteenId ?? null, institutionId: institutionId ?? null } }),
  });
  const data = query.data;
  if (!data) return <p className="text-sm text-muted">Loading demo metrics…</p>;
  return (
    <section className="rounded-3xl border border-line bg-foam p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">Demo metrics · last 14 days</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Revenue" value={inr(data.revenuePaise)} />
        <Stat label="Orders" value={String(data.orders)} />
        <Stat label="Cancelled" value={`${data.cancellationRate}%`} />
        <Stat label="Avg prep" value={data.avgPrepMinutes == null ? "—" : `${data.avgPrepMinutes} min`} />
      </div>
      <p className="mt-2 text-sm text-muted">Average rating {data.avgRating ?? "—"}</p>
      {data.hours.some((hour) => hour.orders > 0) ? (
        <p className="mt-1 text-sm text-muted">
          Busiest hours{" "}
          {data.hours
            .filter((hour) => hour.orders > 0)
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 3)
            .map((hour) => `${hour.hour} · ${hour.orders}`)
            .join("  ")}
        </p>
      ) : null}
      <div className="mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.days}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="orders" fill="var(--color-chili)" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 space-y-1 text-sm">
        {data.popular.map((item) => (
          <li key={item.name} className="flex justify-between"><span>{item.name}</span><span className="tabular-nums">{item.qty}</span></li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
