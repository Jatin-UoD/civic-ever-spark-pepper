import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { errMsg, inr } from "@/components/canteen-ui";
import { getDemandPricing, getPulse, saveDemandPricing } from "@/lib/canteen/api";
import type { DemandPricingSettings } from "@/lib/canteen/logic";

const DEFAULT_SETTINGS: DemandPricingSettings = {
  moderateDemandPercent: 30,
  moderatePricePercent: 5,
  highDemandPercent: 50,
  highPricePercent: 10,
};

export function DemandPricingPanel({ canteenId }: { canteenId: string }) {
  const queryClient = useQueryClient();
  const pricing = useQuery({
    queryKey: ["demand-pricing", canteenId],
    queryFn: () => getDemandPricing({ data: { canteenId } }),
    refetchInterval: 15_000,
  });
  const pulse = useQuery({
    queryKey: ["pulse", canteenId],
    queryFn: () => getPulse({ data: { canteenId } }),
    refetchInterval: 15_000,
  });
  const [draft, setDraft] = useState<DemandPricingSettings | null>(null);
  const settings = draft ?? pricing.data?.settings ?? DEFAULT_SETTINGS;
  const save = useMutation({
    mutationFn: (next: DemandPricingSettings) => saveDemandPricing({ data: { canteenId, settings: next } }),
    onSuccess: async (result) => {
      setDraft(null);
      queryClient.setQueryData(["demand-pricing", canteenId], result);
      await queryClient.invalidateQueries({ queryKey: ["menu", canteenId] });
      toast.success("Demand-pricing rules saved");
    },
    onError: (error) => toast.error(errMsg(error)),
  });

  function setField(field: keyof DemandPricingSettings, value: string) {
    setDraft((current) => ({
      ...(current ?? settings),
      [field]: value === "" ? 0 : Number(value),
    }));
  }

  return (
    <section className="rounded-3xl border border-line bg-foam p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">Automatic demand pricing</p>
      <h2 className="mt-1 font-display text-2xl font-semibold">Peak-time price rules</h2>
      <p className="mt-2 text-sm text-muted">Paid sales are compared with the same 60-minute period across the previous four weeks. A peak alert appears immediately; if you do not manually change the item price, the configured increase applies after 10 minutes. Automatic increases are capped at 20%.</p>

      {pricing.error ? (
        <p role="alert" className="mt-3 text-sm text-chili">
          {errMsg(pricing.error)}
        </p>
      ) : null}
      {pulse.error ? (
        <p role="alert" className="mt-3 text-sm text-chili">
          Demand monitor: {errMsg(pulse.error)}
        </p>
      ) : null}
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate(settings);
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Demand increase (%)</span>
            <input type="number" min={1} max={1000} step={1} required value={settings.moderateDemandPercent} onChange={(event) => setField("moderateDemandPercent", event.target.value)} className="w-full rounded-2xl border border-line bg-cream px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Price increase (%)</span>
            <input type="number" min={0} max={20} step={1} required value={settings.moderatePricePercent} onChange={(event) => setField("moderatePricePercent", event.target.value)} className="w-full rounded-2xl border border-line bg-cream px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Higher demand increase (%)</span>
            <input type="number" min={settings.moderateDemandPercent + 1} max={1000} step={1} required value={settings.highDemandPercent} onChange={(event) => setField("highDemandPercent", event.target.value)} className="w-full rounded-2xl border border-line bg-cream px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Higher price increase (%)</span>
            <input type="number" min={settings.moderatePricePercent} max={20} step={1} required value={settings.highPricePercent} onChange={(event) => setField("highPricePercent", event.target.value)} className="w-full rounded-2xl border border-line bg-cream px-3 py-2" />
          </label>
        </div>
        <button type="submit" disabled={save.isPending || pricing.isPending} className="min-h-11 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam disabled:opacity-60">
          {save.isPending ? "Saving…" : "Save pricing rules"}
        </button>
        {save.error ? (
          <p role="alert" className="text-sm text-chili">
            {errMsg(save.error)}
          </p>
        ) : null}
      </form>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-sm font-semibold">Demand alerts and active adjustments</h3>
        {pricing.data?.items.length ? (
          <ul className="mt-2 space-y-2">
            {pricing.data.items.map((item) => (
              <li key={item.id} className="rounded-2xl bg-cream p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-muted">Sales +{item.demandGrowthPercent}%</span>
                </div>
                {item.adminOverride ? (
                  <p className="mt-1 text-muted">Admin-set price; automatic changes are paused until demand cools.</p>
                ) : item.pendingPriceIncreasePercent != null ? (
                  <p className="mt-1 text-muted">+{item.pendingPriceIncreasePercent}% scheduled after the 10-minute review window; a manual price edit cancels it and pauses automation until demand cools.</p>
                ) : (
                  <p className="mt-1 text-muted">
                    Current automatic adjustment: +{item.appliedPriceIncreasePercent}%{item.basePricePaise == null ? "" : ` · base ${inr(item.basePricePaise)}`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No peak adjustments are pending or active. A zero historical baseline will not trigger a price increase.</p>
        )}
      </div>
    </section>
  );
}
