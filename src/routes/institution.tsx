import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { DemoBanner, RequireUser, Shell, StatusPill, errMsg, useMe } from "@/components/canteen-ui";
import { listDirectory, setCanteenStatus } from "@/lib/canteen/api";

export const Route = createFileRoute("/institution")({ component: InstitutionPage });

function InstitutionPage() {
  return <RequireUser><InstitutionBody /></RequireUser>;
}

function InstitutionBody() {
  const { me } = useMe();
  const institutionId = me?.memberships.find((m) => m.role === "INSTITUTION_ADMIN")?.institutionId
    ?? me?.memberships.find((m) => m.role === "SUPER_ADMIN")?.institutionId
    ?? null;
  const directory = useQuery({ queryKey: ["directory"], queryFn: () => listDirectory() });
  const rows = (directory.data ?? []).filter((row) => !institutionId || row.institutionId === institutionId || me?.memberships.some((m) => m.role === "SUPER_ADMIN"));
  const scoped = me?.memberships.some((m) => m.role === "SUPER_ADMIN") ? rows : rows.filter((row) => row.institutionId === institutionId);
  const queryClient = useQueryClient();
  const focus = institutionId ?? scoped[0]?.institutionId;

  return (
    <Shell title="Institution">
      <h1 className="font-display text-4xl font-semibold">Campuses & canteens</h1>
      <div className="mt-4"><DemoBanner /></div>
      {!focus && !me?.memberships.some((m) => m.role === "SUPER_ADMIN") ? <p className="mt-6">Institution tools are not on this account.</p> : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {scoped.map((row) => (
              <article key={row.canteenId} className="rounded-3xl border border-line bg-foam p-4">
                <p className="text-xs uppercase tracking-widest text-muted">{row.institutionName} · {row.campusName}{row.canteenDemo ? " · Demo" : ""}</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <h2 className="font-display text-3xl font-semibold">{row.canteenName}</h2>
                  <StatusPill value={row.status} />
                </div>
                <label className="mt-3 block text-sm">
                  Service status
                  <select
                    aria-label={`${row.canteenName} status`}
                    value={row.status}
                    className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3"
                    onChange={(event) => {
                      const status = event.target.value as "OPEN" | "CLOSED" | "PAUSED";
                      void setCanteenStatus({ data: { canteenId: row.canteenId, status } })
                        .then(() => {
                          toast.success(`${row.canteenName} is ${status.toLowerCase()}.`);
                          return queryClient.invalidateQueries({ queryKey: ["directory"] });
                        })
                        .catch((error) => toast.error(errMsg(error)));
                    }}
                  >
                    <option value="OPEN">Open</option>
                    <option value="PAUSED">Paused</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </label>
              </article>
            ))}
          </div>
          {focus ? <AnalyticsPanel institutionId={me?.memberships.some((m) => m.role === "SUPER_ADMIN") ? undefined : focus} /> : null}
        </div>
      )}
    </Shell>
  );
}
