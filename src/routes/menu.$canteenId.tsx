import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DemoBanner, DietMark, RequireUser, Shell, StatusPill, errMsg, inr } from "@/components/canteen-ui";
import { getCart, getMenu, getPulse, saveCart, askCounter } from "@/lib/canteen/api";
import { lineKey, type CartLine } from "@/lib/canteen/domain";

export const Route = createFileRoute("/menu/$canteenId")({ component: MenuPage });

type MenuItem = Awaited<ReturnType<typeof getMenu>>["items"][number];

function MenuPage() {
  const { canteenId } = Route.useParams();
  return (
    <RequireUser>
      <MenuBody canteenId={canteenId} />
    </RequireUser>
  );
}

function MenuBody({ canteenId }: { canteenId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [ask, setAsk] = useState("Something hot and veg under ₹80");
  const [advice, setAdvice] = useState("");
  const [askedModel, setAskedModel] = useState("");
  const [asking, setAsking] = useState(false);
  const [picked, setPicked] = useState<Record<string, { variantId?: string; addonIds: string[] }>>({});
  const pulse = useQuery({
    queryKey: ["pulse", canteenId],
    queryFn: () => getPulse({ data: { canteenId } }),
    refetchInterval: 2000,
  });
  const menu = useQuery({
    queryKey: ["menu", canteenId, pulse.data?.catalogVersion],
    queryFn: () => getMenu({ data: { canteenId } }),
    enabled: pulse.data != null,
  });
  const cart = useQuery({
    queryKey: ["cart", canteenId, pulse.data?.catalogVersion],
    queryFn: () => getCart({ data: { canteenId, couponCode: null } }),
    enabled: pulse.data != null,
  });

  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (menu.data?.items ?? []).filter((item) => {
      if (category !== "all" && item.categoryId !== category) return false;
      if (vegOnly && item.diet !== "veg") return false;
      if (!needle) return true;
      return `${item.name} ${item.description}`.toLowerCase().includes(needle);
    });
  }, [menu.data, search, category, vegOnly]);

  async function write(lines: CartLine[]) {
    try {
      await saveCart({ data: { canteenId, lines } });
      await queryClient.invalidateQueries({ queryKey: ["cart", canteenId] });
    } catch (error) {
      toast.error(errMsg(error));
    }
  }

  function currentLines(): CartLine[] {
    return (cart.data?.lines ?? []).map((line) => ({
      itemId: line.itemId ?? undefined,
      comboId: line.comboId ?? undefined,
      variantId: line.variantId,
      addonIds: line.addonIds,
      qty: line.qty,
      instructions: line.instructions,
    }));
  }

  function selection(item: MenuItem) {
    const current = picked[item.id];
    const variantId = current?.variantId ?? item.variants.find((v) => v.available)?.id;
    const addonIds = current?.addonIds ?? [];
    return { variantId, addonIds };
  }

  function unitOf(item: MenuItem) {
    if (item.basePricePaise == null) return null;
    const sel = selection(item);
    const variant = item.variants.find((v) => v.id === sel.variantId);
    const addons = item.addons.filter((a) => sel.addonIds.includes(a.id) && a.available);
    return Math.max(0, item.basePricePaise - item.discountPaise + (variant?.priceDeltaPaise ?? 0) + addons.reduce((s, a) => s + a.pricePaise, 0));
  }

  const closed = menu.data && menu.data.canteen.status !== "OPEN";

  return (
    <Shell title={menu.data?.canteen.name} back={{ href: "/browse", label: "All canteens" }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {menu.data?.canteen.institutionName} · {menu.data?.canteen.campusName}
            {menu.data?.canteen.isDemo ? " · Demo" : ""}
          </p>
          <h1 className="font-display text-4xl font-semibold">{menu.data?.canteen.name ?? "Menu"}</h1>
        </div>
        {menu.data ? <StatusPill value={menu.data.canteen.status} /> : null}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted">{menu.data?.canteen.description}</p>
      {closed ? (
        <p className="mt-4 rounded-2xl bg-chili/10 px-4 py-3 text-sm font-medium text-chili" role="status">
          {menu.data?.canteen.status === "PAUSED"
            ? "This canteen is paused. New orders are not accepted."
            : "This canteen is closed. New orders are not accepted."}
        </p>
      ) : null}
      <div className="mt-4"><DemoBanner /></div>
      <form
        className="mt-4 rounded-3xl border border-line bg-foam p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setAsking(true);
          void askCounter({ data: { canteenId, question: ask } })
            .then((result) => {
              setAdvice(result.answer);
              setAskedModel(`${result.model} · ${result.provider}`);
            })
            .catch((error) => {
              setAdvice("");
              setAskedModel("");
              toast.error(errMsg(error));
            })
            .finally(() => setAsking(false));
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">NVIDIA Nemotron · Nebius Token Factory</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">Ask the counter</h2>
        <p className="mt-1 text-sm text-muted">It only suggests dishes that are on this menu right now.</p>
        <textarea value={ask} onChange={(e) => setAsk(e.target.value)} maxLength={240} className="mt-3 w-full rounded-2xl border border-line bg-cream px-3 py-3" />
        <button type="submit" disabled={asking || closed} className="mt-3 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-foam disabled:opacity-50">
          {asking ? "Asking Nemotron…" : "Ask"}
        </button>
        {advice ? <p className="mt-3 text-sm">{advice}</p> : null}
        {askedModel ? <p className="mt-1 text-xs text-muted">{askedModel}</p> : null}
      </form>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the menu" className="w-full rounded-full border border-line bg-foam px-4 py-3" />
        <button type="button" aria-pressed={vegOnly} onClick={() => setVegOnly((v) => !v)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-3 text-sm font-semibold ${vegOnly ? "bg-leaf text-foam" : "border border-line bg-foam"}`}>
          Veg only
        </button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={() => setCategory("all")} className={`shrink-0 rounded-full px-3 py-2 text-sm ${category === "all" ? "bg-ink text-foam" : "bg-foam"}`}>All</button>
        {(menu.data?.categories ?? []).map((cat) => (
          <button key={cat.id} type="button" onClick={() => setCategory(cat.id)} className={`shrink-0 rounded-full px-3 py-2 text-sm ${category === cat.id ? "bg-ink text-foam" : "bg-foam"}`}>
            {cat.name}
          </button>
        ))}
      </div>
      {(menu.data?.combos.length ?? 0) > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {menu.data?.combos.map((combo) => {
            const off = combo.availability !== "AVAILABLE" || closed;
            return (
              <article key={combo.id} className="flex gap-3 rounded-3xl border border-line bg-foam p-3">
                <img src={combo.imageUrl ?? "/menu/kulcha.jpg"} alt="" className="size-24 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><DietMark diet="veg" /><h2 className="font-semibold">{combo.name}</h2><span className="text-xs text-muted">Demo combo</span></div>
                  <p className="text-sm text-muted">{combo.description}</p>
                  <p className="mt-1 text-sm tabular-nums">{inr(combo.pricePaise)} · {combo.prepMinutes} min</p>
                  {off ? <StatusPill value={combo.availability === "AVAILABLE" ? "UNAVAILABLE" : combo.availability} /> : (
                    <button
                      type="button"
                      className="mt-2 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-foam"
                      onClick={() => void write([...currentLines(), { comboId: combo.id, qty: 1, addonIds: [] }])}
                    >
                      Add combo
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const sel = selection(item);
          const price = unitOf(item);
          const off = item.availability !== "AVAILABLE" || price == null || closed;
          const cartLine = cart.data?.lines.find((line) => line.itemId === item.id && line.variantId === (sel.variantId ?? null) && [...line.addonIds].sort().join() === [...sel.addonIds].sort().join());
          return (
            <article key={item.id} className="overflow-hidden rounded-3xl border border-line bg-foam">
              <img src={item.imageUrl ?? "/menu/fries.jpg"} alt={item.name} className="h-40 w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-start gap-2">
                  <DietMark diet={item.diet} />
                  <h2 className="font-semibold leading-tight">{item.name}</h2>
                </div>
                <p className="text-sm text-muted">{item.description}</p>
                <p className="text-sm tabular-nums">
                  {price == null ? "Price not set" : (
                    <>
                      {item.discountPaise > 0 ? <span className="mr-2 text-muted line-through">{inr((item.basePricePaise ?? 0) + (item.variants.find((v) => v.id === sel.variantId)?.priceDeltaPaise ?? 0))}</span> : null}
                      {inr(price)}
                    </>
                  )}
                  <span className="text-muted"> · {item.prepMinutes} min</span>
                  {item.isDemo ? <span className="text-muted"> · Demo</span> : null}
                </p>
                {item.availability !== "AVAILABLE" ? <StatusPill value={item.availability} /> : null}
                {item.variants.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={!variant.available}
                        onClick={() => setPicked((prev) => ({ ...prev, [item.id]: { variantId: variant.id, addonIds: sel.addonIds } }))}
                        className={`rounded-full px-3 py-1 text-sm ${sel.variantId === variant.id ? "bg-ink text-foam" : "border border-line"} disabled:opacity-40`}
                      >
                        {variant.name} {variant.priceDeltaPaise ? `+${inr(variant.priceDeltaPaise)}` : ""}
                      </button>
                    ))}
                  </div>
                ) : null}
                {item.addons.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.addons.map((addon) => {
                      const on = sel.addonIds.includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          disabled={!addon.available || off}
                          aria-pressed={on}
                          onClick={() => {
                            const addonIds = on ? sel.addonIds.filter((id) => id !== addon.id) : [...sel.addonIds, addon.id];
                            setPicked((prev) => ({ ...prev, [item.id]: { variantId: sel.variantId, addonIds } }));
                          }}
                          className={`rounded-full px-3 py-1 text-sm ${on ? "bg-chili text-foam" : "border border-line"} disabled:opacity-40`}
                        >
                          {addon.name} +{inr(addon.pricePaise)}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {cartLine && !off ? (
                  <div className="flex items-center gap-3">
                    <button type="button" className="size-11 rounded-full border border-line text-lg" aria-label={`Decrease ${item.name}`} onClick={() => {
                      const lines = currentLines().flatMap((line) => {
                        if (lineKey(line) !== cartLine.key) return [line];
                        return line.qty > 1 ? [{ ...line, qty: line.qty - 1 }] : [];
                      });
                      void write(lines);
                    }}>−</button>
                    <span className="tabular-nums font-semibold">{cartLine.qty}</span>
                    <button type="button" className="size-11 rounded-full bg-ink text-lg text-foam" aria-label={`Increase ${item.name}`} onClick={() => {
                      const lines = currentLines().map((line) => lineKey(line) === cartLine.key ? { ...line, qty: line.qty + 1 } : line);
                      void write(lines);
                    }}>+</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={Boolean(off)}
                    className="w-full rounded-full bg-chili py-3 text-sm font-semibold text-foam disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
                    onClick={() => void write([...currentLines(), { itemId: item.id, variantId: sel.variantId ?? null, addonIds: sel.addonIds, qty: 1 }])}
                  >
                    {price == null ? "Not for sale" : off ? "Unavailable" : "Add"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {menu.data && items.length === 0 ? (
        <p className="mt-8 text-muted">Nothing on this menu matches that filter.</p>
      ) : null}
      {cart.data && cart.data.lines.length > 0 ? (
        <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-foam p-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tabular-nums">{cart.data.lines.reduce((s, l) => s + l.qty, 0)} items · {inr(cart.data.totalPaise)}</p>
              <p className="text-xs text-muted">~{cart.data.etaMinutes} min · {cart.data.ordersAhead} ahead · approximate</p>
              {cart.data.blocked ? <p className="text-xs font-medium text-chili">{cart.data.problems[0]}</p> : null}
            </div>
            <Link to="/checkout/$canteenId" params={{ canteenId }} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-foam">
              View cart
            </Link>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
