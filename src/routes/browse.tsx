import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DemoBanner, RequireUser, Shell, StatusPill, useMe } from "@/components/canteen-ui";
import { listDirectory } from "@/lib/canteen/api";
import { canOperateCanteen } from "@/lib/canteen/domain";

export const Route = createFileRoute("/browse")({ component: Browse });

function Browse() {
  return (
    <RequireUser>
      <BrowseBody />
    </RequireUser>
  );
}

function BrowseBody() {
  const { me } = useMe();
  const [q, setQ] = useState("");
  const directory = useQuery({ queryKey: ["directory"], queryFn: () => listDirectory() });
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (directory.data ?? []).filter((row) =>
      !needle || `${row.institutionName} ${row.campusName} ${row.canteenName} ${row.city}`.toLowerCase().includes(needle),
    );
  }, [directory.data, q]);

  return (
    <Shell title="Choose a canteen">
      <h1 className="font-display text-4xl font-semibold">Where are you eating?</h1>
      <p className="mt-2 max-w-xl text-muted">Pick an institution, campus and canteen. Demo University is fully stocked. Harbour House is a second tenant.</p>
      <div className="mt-5"><DemoBanner /></div>
      <label className="mt-5 block">
        <span className="sr-only">Search canteens</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search institution, campus or canteen"
          className="w-full rounded-full border border-line bg-foam px-4 py-3"
        />
      </label>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {directory.isLoading ? <p className="text-muted">Loading canteens…</p> : null}
        {rows.map((row) => {
          const actor = { userId: me?.userId ?? "", memberships: me?.memberships ?? [] };
          const manage = me ? canOperateCanteen(actor, row.canteenId, row.institutionId, "staff") : false;
          return (
            <article key={row.canteenId} className="rounded-3xl border border-line bg-foam p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {row.institutionName} · {row.campusName}
                    {row.canteenDemo ? " · Demo" : ""}
                  </p>
                  <h2 className="mt-1 font-display text-3xl font-semibold">{row.canteenName}</h2>
                  <p className="mt-2 text-sm text-muted">{row.description}</p>
                </div>
                <StatusPill value={row.status} />
              </div>
              <p className="mt-3 text-sm text-muted">{row.city} · {row.kind}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/menu/$canteenId" params={{ canteenId: row.canteenId }} className="rounded-full bg-chili px-4 py-2 text-sm font-semibold text-foam">
                  View menu
                </Link>
                {manage ? (
                  <Link to="/staff" className="rounded-full border border-line px-4 py-2 text-sm font-semibold">Staff desk</Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}
