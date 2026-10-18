import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { errMsg, inr } from "@/components/canteen-ui";
import { analyticsFetch, analyticsRequest } from "./analytics-client";

type Overview = {
  kpis: Record<string, { value: number; previous: number; changePct: number | null }>;
  dailyTrend: { date: string; revenuePaise: number; orders: number }[];
  itemPerformance: {
    itemId: string;
    name: string;
    categoryName: string;
    quantity: number;
    revenuePaise: number;
    lastOrderAt: string | null;
    rank: number | null;
  }[];
  lowSales: { itemId: string; name: string; quantity: number; reason: string }[];
  combos: {
    firstItemId: string;
    secondItemId: string;
    firstName: string;
    secondName: string;
    ordersTogether: number;
    orderSharePct: number;
  }[];
  categories: { name: string; revenuePaise: number; sharePct: number }[];
  peakHours: { hour: number; orders: number }[];
  peakDays: { day: string; orders: number }[];
  totalPaidOrders: number;
};

type Recommendation = {
  id: string;
  kind: string;
  title: string;
  body: string;
  itemIds: string[];
  status: "pending" | "approved" | "dismissed";
};

const CATEGORY_COLORS = ["#c2410c", "#1f6b4a", "#d69e2e", "#6750a4", "#3977a8", "#8f5c3f"];

export function AnalyticsDashboard({ canteenId }: { canteenId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["canteen-analytics", canteenId];
  const csvExport = useMutation({
    mutationFn: () => downloadCsv(),
  });
  const overview = useQuery({
    queryKey,
    queryFn: () => analyticsRequest<Overview>("/api/analytics/overview"),
  });
  const recommendations = useQuery({
    queryKey: [...queryKey, "recommendations"],
    queryFn: () => analyticsRequest<Recommendation[]>("/api/analytics/recommendations"),
  });
  const generate = useMutation({
    mutationFn: () => analyticsRequest<{ generated: number }>(
      "/api/analytics/recommendations",
      { method: "POST" },
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...queryKey, "recommendations"] });
    },
  });
  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "dismissed" }) =>
      analyticsRequest("/api/analytics/recommendations/decide", {
        method: "POST",
        body: JSON.stringify({ id, decision }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...queryKey, "recommendations"] });
    },
  });

  if (overview.isLoading) return <DashboardLoading />;
  if (overview.error || recommendations.error) {
    const error = overview.error ?? recommendations.error;
    return (
      <section className="rounded-3xl border border-chili/30 bg-foam p-6" role="alert">
        <h2 className="font-display text-2xl font-semibold">Analytics couldn’t load</h2>
        <p className="mt-2 text-sm text-muted">{errMsg(error)}</p>
        <button type="button" className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam" onClick={() => {
          void overview.refetch();
          void recommendations.refetch();
        }}>Try again</button>
      </section>
    );
  }
  const data = overview.data;
  if (!data) return null;
  const recs = recommendations.data ?? [];
  const pending = recs.filter((recommendation) => recommendation.status === "pending");
  const currentValues = [
    ["Paid orders", data.kpis.orders, "number"],
    ["Revenue", data.kpis.revenuePaise, "money"],
    ["Average order", data.kpis.averageOrderValuePaise, "money"],
    ["Unique customers", data.kpis.uniqueCustomers, "number"],
  ] as const;

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-chili">Canteen intelligence · last 14 days</p>
          <h1 className="mt-1 font-display text-4xl font-semibold">Sales, made clear.</h1>
          <p className="mt-2 text-sm text-muted">Paid orders only · India Standard Time · insights are generated from sales rules, not AI.</p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button type="button" className="rounded-full border border-line bg-foam px-4 py-2 text-sm font-semibold" onClick={() => window.print()}>Print report</button>
          <button type="button" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam disabled:opacity-50" disabled={csvExport.isPending} onClick={() => csvExport.mutate()}>
            {csvExport.isPending ? "Preparing…" : "Download CSV"}
          </button>
        </div>
      </section>
      {csvExport.error ? <p role="alert" className="rounded-2xl bg-foam p-3 text-sm text-chili">{errMsg(csvExport.error)}</p> : null}

      {data.totalPaidOrders === 0 ? (
        <section className="rounded-3xl border border-line bg-foam p-5">
          <h2 className="font-display text-2xl font-semibold">No paid orders yet</h2>
          <p className="mt-1 text-sm text-muted">Analytics and recommendations will appear once this canteen has paid orders in the selected period.</p>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {currentValues.map(([label, metric, format]) => (
          <article key={label} className="rounded-3xl border border-line bg-foam p-4 shadow-sm">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
              {format === "money" ? inr(metric.value) : metric.value.toLocaleString("en-IN")}
            </p>
            <Growth metric={metric} />
          </article>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-line bg-foam p-4">
          <SectionTitle title="Sales trend" detail="Daily revenue and paid orders" />
          <div className="mt-4 h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6dccb" />
                <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={18} />
                <YAxis yAxisId="revenue" tickFormatter={(value: number) => `₹${Math.round(value / 100)}`} width={58} />
                <YAxis yAxisId="orders" orientation="right" allowDecimals={false} width={32} />
                <Tooltip labelFormatter={(value) => dateLabel(String(value))} formatter={(value, name) =>
                  name === "Revenue" ? [inr(Number(value)), name] : [value, name]
                } />
                <Legend />
                <Area yAxisId="revenue" type="monotone" dataKey="revenuePaise" name="Revenue" stroke="#c2410c" fill="#c2410c" fillOpacity={0.12} />
                <Line yAxisId="orders" type="monotone" dataKey="orders" name="Orders" stroke="#1f6b4a" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-foam p-4">
          <SectionTitle title="Category performance" detail="Share of item revenue" />
          {data.categories.length ? (
            <div className="grid items-center gap-2 sm:grid-cols-[minmax(140px,0.8fr)_1fr]">
              <div className="h-52 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.categories} dataKey="revenuePaise" nameKey="name" innerRadius="56%" outerRadius="88%" paddingAngle={2}>
                      {data.categories.map((entry, index) => <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => inr(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2">
                {data.categories.map((category, index) => (
                  <li key={category.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} /><span className="truncate">{category.name}</span></span>
                    <span className="shrink-0 text-right tabular-nums text-muted">{category.sharePct}% · {inr(category.revenuePaise)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : <EmptyState />}
        </section>
      </div>

      <section className="rounded-3xl border border-line bg-foam p-4">
        <SectionTitle title="Item performance" detail="Ranked by quantity, then revenue, then name" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-2 py-3">Rank</th><th className="px-2 py-3">Item</th><th className="px-2 py-3">Qty</th><th className="px-2 py-3">Revenue</th><th className="px-2 py-3">Last ordered</th>
            </tr></thead>
            <tbody>{data.itemPerformance.map((item) => (
              <tr key={item.itemId} className="border-b border-line/70 last:border-0">
                <td className="px-2 py-3 tabular-nums">{item.rank ?? "—"}</td>
                <td className="px-2 py-3"><span className="font-medium">{item.name}</span><span className="ml-2 text-xs text-muted">{item.categoryName}</span></td>
                <td className="px-2 py-3 tabular-nums">{item.quantity}</td>
                <td className="px-2 py-3 tabular-nums">{inr(item.revenuePaise)}</td>
                <td className="px-2 py-3 text-muted">{item.lastOrderAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(item.lastOrderAt)) : "Never"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-line bg-foam p-4">
          <SectionTitle title="Peak hours & days" detail="Distinct paid orders by India Standard Time" />
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div><p className="mb-2 text-sm font-semibold">Hours</p><div className="h-40 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.peakHours.filter((entry) => entry.hour >= 7 && entry.hour <= 22)}>
                  <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} tick={{ fontSize: 10 }} interval={2} />
                  <YAxis hide allowDecimals={false} /><Tooltip labelFormatter={(hour) => `${hour}:00`} />
                  <Bar dataKey="orders" name="Orders" fill="#c2410c" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div></div>
            <div><p className="mb-2 text-sm font-semibold">Days</p><div className="h-40 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.peakDays}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis hide allowDecimals={false} /><Tooltip />
                  <Bar dataKey="orders" name="Orders" fill="#1f6b4a" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div></div>
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-foam p-4">
          <SectionTitle title="Low / no-sales review" detail="Available items only · suggestions never change menu settings" />
          {data.lowSales.length ? <ul className="mt-3 divide-y divide-line">
            {data.lowSales.map((item) => <li key={item.itemId} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span className="font-medium">{item.name}</span>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-muted">{item.reason === "no_sales" ? "No paid sales" : "Low sales"} · {item.quantity} sold</span>
            </li>)}
          </ul> : <EmptyState text="No available items meet the low-sales review rule." />}
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-line bg-foam p-4">
          <SectionTitle title="Frequently bought together" detail="Pairs seen in at least 3 paid orders" />
          {data.combos.length ? <ul className="mt-3 space-y-2">
            {data.combos.map((pair) => <li key={`${pair.firstItemId}:${pair.secondItemId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream p-3">
              <span className="font-medium">{pair.firstName} + {pair.secondName}</span>
              <span className="text-sm tabular-nums text-muted">{pair.ordersTogether} orders · {pair.orderSharePct}%</span>
            </li>)}
          </ul> : <EmptyState text="There are not yet enough co-purchases to suggest a pairing." />}
        </section>

        <section className="rounded-3xl border border-line bg-foam p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionTitle title="Insights & recommendations" detail="Rule-based suggestions; you remain in control" />
            <button type="button" disabled={generate.isPending || !data.totalPaidOrders} onClick={() => generate.mutate()} className="no-print rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam disabled:opacity-50">
              {generate.isPending ? "Generating…" : "Generate suggestions"}
            </button>
          </div>
          {generate.error ? <p role="alert" className="mt-3 rounded-xl bg-cream p-3 text-sm text-chili">{errMsg(generate.error)}</p> : null}
          {decide.error ? <p role="alert" className="mt-3 rounded-xl bg-cream p-3 text-sm text-chili">{errMsg(decide.error)}</p> : null}
          {recommendations.isLoading ? <p className="mt-3 text-sm text-muted">Loading recommendations…</p> : pending.length ? (
            <ul className="mt-3 space-y-2">
              {pending.map((recommendation) => <li key={recommendation.id} className="rounded-2xl border border-line bg-cream p-3">
                <p className="font-semibold">{recommendation.title}</p>
                <p className="mt-1 text-sm text-muted">{recommendation.body}</p>
                <div className="no-print mt-3 flex gap-2">
                  <button type="button" disabled={decide.isPending} onClick={() => decide.mutate({ id: recommendation.id, decision: "approved" })} className="rounded-full bg-leaf px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Approve</button>
                  <button type="button" disabled={decide.isPending} onClick={() => decide.mutate({ id: recommendation.id, decision: "dismissed" })} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Dismiss</button>
                </div>
              </li>)}
            </ul>
          ) : <EmptyState text={data.totalPaidOrders ? "No pending suggestions. Generate a fresh set from the latest sales." : "Recommendations appear after paid sales."} />}
          {recs.some((recommendation) => recommendation.status !== "pending") ? (
            <details className="mt-4 border-t border-line pt-3">
              <summary className="cursor-pointer text-sm font-semibold">Past decisions</summary>
              <ul className="mt-2 space-y-2">{recs.filter((recommendation) => recommendation.status !== "pending").map((recommendation) => (
                <li key={recommendation.id} className="rounded-xl bg-cream px-3 py-2 text-sm">
                  <span className="font-medium">{recommendation.title}</span><span className="ml-2 text-xs capitalize text-muted">{recommendation.status}</span>
                </li>
              ))}</ul>
            </details>
          ) : null}
        </section>
      </div>
      <p className="pb-2 text-xs text-muted">Revenue is calculated from paid order-line quantity × the unit price recorded at order time. Recommendations are advisory; approvals do not alter menu items or prices.</p>
    </div>
  );
}

async function downloadCsv() {
  const response = await analyticsFetch("/api/analytics/export.csv");
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `CSV export failed (${response.status}).`);
  }
  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = "canteen-analytics.csv";
  link.click();
  URL.revokeObjectURL(href);
}

function Growth({ metric }: { metric: { changePct: number | null } }) {
  const value = metric.changePct;
  return <p className="mt-2 text-xs text-muted">
    {value == null ? <span className="font-semibold text-chili">New · no prior baseline</span> : (
      <><span className={`font-semibold ${value > 0 ? "text-leaf" : value < 0 ? "text-chili" : "text-muted"}`}>{value > 0 ? "↑ " : value < 0 ? "↓ " : ""}{Math.abs(value)}%</span><span className="ml-2">vs. previous 14 days</span></>
    )}
  </p>;
}

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return <div><h2 className="font-display text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted">{detail}</p></div>;
}

function EmptyState({ text = "No sales data for this period." }: { text?: string }) {
  return <p className="mt-4 rounded-2xl bg-cream px-4 py-5 text-sm text-muted">{text}</p>;
}

function DashboardLoading() {
  return <div className="space-y-5" aria-label="Loading analytics">
    <div className="h-24 animate-pulse rounded-3xl bg-foam" />
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-foam" />)}</div>
    <div className="h-72 animate-pulse rounded-3xl bg-foam" />
  </div>;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(`${value}T12:00:00+05:30`));
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(`${value}T12:00:00+05:30`));
}
