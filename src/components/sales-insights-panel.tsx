import { useMutation } from "@tanstack/react-query";
import { Eye, GitMerge, LoaderCircle, Sparkles, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { errMsg, inr } from "@/components/canteen-ui";
import { getSalesInsights } from "@/lib/canteen/api";

export function SalesInsightsPanel({ canteenId }: { canteenId: string }) {
  const insights = useMutation({
    mutationFn: () => getSalesInsights({ data: { canteenId } }),
  });
  const data = insights.data;

  return (
    <section className="rounded-3xl border border-line bg-foam p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">AI insights · last 14 days</p>
          <h2 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold">
            <Sparkles aria-hidden="true" size={20} />
            Sales actions
          </h2>
        </div>
        <button
          type="button"
          onClick={() => insights.mutate()}
          disabled={insights.isPending}
          className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam disabled:cursor-wait disabled:opacity-60"
        >
          {insights.isPending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : <Sparkles aria-hidden="true" size={16} />}
          {insights.isPending ? "Analyzing…" : data ? "Refresh insights" : "Generate insights"}
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">
        Nemotron reviews paid orders and suggests menu actions. Sales figures come from the canteen’s verified order history.
      </p>

      {insights.error ? (
        <p role="alert" className="mt-4 rounded-2xl border border-chili/30 bg-cream p-3 text-sm text-chili">
          {errMsg(insights.error)}
        </p>
      ) : null}

      {data ? (
        <>
          <div className="mt-5 space-y-4">
            <RecommendationGroup icon={<Eye aria-hidden="true" size={17} />} title="Review candidates">
              {data.recommendations.review.length ? data.recommendations.review.map((item) => (
                <div key={item.id} className="rounded-2xl bg-cream p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">{item.quantitySold === 0 ? "No paid orders" : "Low recent sales"} · {inr(item.revenuePaise)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {item.reason === "NO_RECENT_SALES"
                      ? "No paid orders in this period. Review its menu fit; no item is automatically discontinued."
                      : "Limited recent demand. Consider reviewing its placement before making any menu decision."}
                  </p>
                </div>
              )) : <p className="text-sm text-muted">No low-sales items were selected for review.</p>}
            </RecommendationGroup>

            <RecommendationGroup icon={<TrendingUp aria-hidden="true" size={17} />} title="Promote top sellers">
              {data.recommendations.promote.length ? data.recommendations.promote.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream p-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted">Consider featuring this popular item.</p>
                  </div>
                  <p className="text-right text-sm font-medium tabular-nums">
                    {item.rank == null ? "Top seller" : `#${item.rank}`} · {item.quantitySold} sold · {inr(item.revenuePaise)}
                  </p>
                </div>
              )) : <p className="text-sm text-muted">No available items had paid sales in this period.</p>}
            </RecommendationGroup>

            <RecommendationGroup icon={<GitMerge aria-hidden="true" size={17} />} title="Combo ideas">
              {data.recommendations.combos.length ? data.recommendations.combos.map((combo) => (
                <div key={combo.items.map((item) => item.id).sort().join(":")} className="rounded-2xl bg-cream p-3">
                  <p className="font-semibold">{combo.items.map((item) => item.name).join(" + ")}</p>
                  <p className="mt-1 text-sm text-muted">
                    {combo.ordersTogether > 0
                      ? `Purchased together in ${combo.ordersTogether} paid ${combo.ordersTogether === 1 ? "order" : "orders"} during this period.`
                      : "Suggested test pairing; there is no recent co-purchase signal."}
                  </p>
                </div>
              )) : <p className="text-sm text-muted">No combo pairings were selected.</p>}
            </RecommendationGroup>
          </div>

          <details className="mt-5 border-t border-line pt-3">
            <summary className="cursor-pointer text-sm font-semibold">
              View all {data.items.length} menu-item sales records
            </summary>
            <ul className="mt-3 space-y-2">
              {data.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-cream px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-2 text-xs text-muted">{item.categoryName}</span>
                  </div>
                  <span className="text-right tabular-nums text-muted">
                    {item.rank == null ? "Unranked" : `#${item.rank}`} · {item.quantitySold} sold · {inr(item.revenuePaise)} · {item.lastOrderedAt ? `Last ${formatDate(item.lastOrderedAt)}` : "Never ordered"}
                  </span>
                </li>
              ))}
            </ul>
          </details>
          <p className="mt-3 text-xs text-muted">Review flags are suggestions only. No menu items are changed automatically.</p>
        </>
      ) : (
        <p className="mt-4 rounded-2xl bg-cream p-3 text-sm text-muted">
          Generate a fresh snapshot-backed analysis when you’re ready. The AI never changes menu items.
        </p>
      )}
    </section>
  );
}

function RecommendationGroup({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon}{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value));
}
