import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { DemandPricingPanel } from "@/components/demand-pricing-panel";
import { DemoBanner, RequireUser, Shell, errMsg, inr, useMe } from "@/components/canteen-ui";
import { createItem, getMenu, grantRole, listDirectory, listStaff, setItemAvailability, updateItem } from "@/lib/canteen/api";
import { canOperateCanteen, type Availability } from "@/lib/canteen/domain";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  return <RequireUser><AdminBody /></RequireUser>;
}

function AdminBody() {
  const { me } = useMe();
  const directory = useQuery({ queryKey: ["directory"], queryFn: () => listDirectory() });
  const canteens = (directory.data ?? []).filter((row) =>
    me ? canOperateCanteen({ userId: me.userId, memberships: me.memberships }, row.canteenId, row.institutionId, "admin") : false,
  );
  const [canteenId, setCanteenId] = useState("");
  const activeId = canteenId || canteens[0]?.canteenId || "";
  const menu = useQuery({
    queryKey: ["menu", activeId, "admin"],
    queryFn: () => getMenu({ data: { canteenId: activeId } }),
    enabled: Boolean(activeId),
  });
  const staff = useQuery({
    queryKey: ["staff", activeId],
    queryFn: () => listStaff({ data: { canteenId: activeId } }),
    enabled: Boolean(activeId),
  });
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("40");
  const [email, setEmail] = useState("");

  async function saved(task: Promise<unknown>, message: string) {
    try {
      await task;
      toast.success(message);
      await queryClient.invalidateQueries({ queryKey: ["menu", activeId] });
      await queryClient.invalidateQueries({ queryKey: ["staff", activeId] });
    } catch (error) {
      toast.error(errMsg(error));
    }
  }

  return (
    <Shell title="Canteen admin">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-semibold">Menu & counter</h1>
        <select aria-label="Canteen" value={activeId} onChange={(e) => setCanteenId(e.target.value)} className="rounded-full border border-line bg-foam px-4 py-3">
          {canteens.map((row) => <option key={row.canteenId} value={row.canteenId}>{row.canteenName}</option>)}
        </select>
      </div>
      <div className="mt-4"><DemoBanner /></div>
      {canteens.length === 0 ? <p className="mt-6">Canteen admin tools are not on this account.</p> : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {(menu.data?.items ?? []).map((item) => (
              <ItemRow key={`${item.id}-${item.listPricePaise ?? "unset"}`} item={item} onSave={(patch) => saved(updateItem({ data: { itemId: item.id, ...patch } }), "Saved")} onToggle={(availability) => saved(setItemAvailability({ data: { itemId: item.id, availability } }), "Availability updated")} />
            ))}
            <form
              className="rounded-3xl border border-dashed border-line p-4"
              onSubmit={(event) => {
                event.preventDefault();
                const categoryId = menu.data?.categories[0]?.id;
                if (!categoryId) return;
                void saved(createItem({
                  data: {
                    canteenId: activeId,
                    categoryId,
                    name,
                    basePricePaise: Math.round(Number(price) * 100),
                    prepMinutes: 8,
                    diet: "veg",
                  },
                }), "Item added").then(() => setName(""));
              }}
            >
              <p className="font-semibold">Add an item</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-2xl border border-line px-3 py-3" required />
                <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" aria-label="Price in rupees" className="w-28 rounded-2xl border border-line px-3 py-3" />
                <button type="submit" className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-foam">Add</button>
              </div>
            </form>
          </div>
          <div className="space-y-4">
            {activeId ? <AnalyticsPanel canteenId={activeId} /> : null}
            {activeId ? <DemandPricingPanel key={`pricing-${activeId}`} canteenId={activeId} /> : null}
            {activeId ? <a href={`/analytics?canteenId=${encodeURIComponent(activeId)}`} className="block rounded-2xl border border-line bg-cream p-3 text-sm font-semibold">Open full Canteen Analytics →</a> : null}
            <section className="rounded-3xl border border-line bg-foam p-4">
              <h2 className="font-display text-2xl font-semibold">Staff</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {(staff.data ?? []).map((person) => <li key={person.id}>{person.name} · {person.role} · {person.email}</li>)}
              </ul>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saved(grantRole({ data: { email, role: "STAFF", canteenId: activeId, institutionId: null } }), "Staff added");
                }}
              >
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email of an existing account" className="w-full rounded-2xl border border-line px-3 py-3" required />
                <button type="submit" className="rounded-full bg-chili px-4 text-sm font-semibold text-foam">Invite</button>
              </form>
            </section>
          </div>
        </div>
      )}
    </Shell>
  );
}

function ItemRow({
  item,
  onSave,
  onToggle,
}: {
  item: { id: string; name: string; description: string; listPricePaise: number | null; basePricePaise: number | null; discountPaise: number; prepMinutes: number; availability: string };
  onSave: (patch: { name: string; description: string; basePricePaise: number; discountPaise: number; prepMinutes: number }) => void;
  onToggle: (availability: Availability) => void;
}) {
  const [price, setPrice] = useState(item.listPricePaise == null ? "" : String(item.listPricePaise / 100));
  const [discount, setDiscount] = useState(String(item.discountPaise / 100));
  const [prep, setPrep] = useState(String(item.prepMinutes));
  return (
    <form
      className="rounded-3xl border border-line bg-foam p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          name: item.name,
          description: item.description,
          basePricePaise: Math.round(Number(price) * 100),
          discountPaise: Math.round(Number(discount || 0) * 100),
          prepMinutes: Number(prep),
        });
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{item.name}</p>
          {item.basePricePaise == null ? <p className="text-sm text-chili">MRP — set a selling price before sale</p> : <p className="text-sm text-muted">{inr(item.basePricePaise - item.discountPaise)}</p>}
        </div>
        <select aria-label={`${item.name} availability`} value={item.availability} onChange={(e) => onToggle(e.target.value as Availability)} className="rounded-full border border-line bg-cream px-3 py-2 text-sm">
          <option value="AVAILABLE">Available</option>
          <option value="UNAVAILABLE">Unavailable</option>
          <option value="SOLD_OUT">Sold out</option>
          <option value="HIDDEN">Hidden</option>
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="text-xs text-muted">Price ₹
          <input value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-24 rounded-xl border border-line px-2 py-2 text-sm text-ink" />
        </label>
        <label className="text-xs text-muted">Off ₹
          <input value={discount} onChange={(e) => setDiscount(e.target.value)} className="mt-1 block w-24 rounded-xl border border-line px-2 py-2 text-sm text-ink" />
        </label>
        <label className="text-xs text-muted">Prep
          <input value={prep} onChange={(e) => setPrep(e.target.value)} className="mt-1 block w-20 rounded-xl border border-line px-2 py-2 text-sm text-ink" />
        </label>
        <button type="submit" className="self-end rounded-full bg-ink px-4 py-2 text-sm font-semibold text-foam">Save</button>
      </div>
    </form>
  );
}
