import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DemoBanner, RequireUser, Shell, inr } from "@/components/canteen-ui";
import { platformOverview } from "@/lib/canteen/api";

export const Route = createFileRoute("/platform")({ component: PlatformPage });

function PlatformPage() {
  return <RequireUser><PlatformBody /></RequireUser>;
}

function PlatformBody() {
  const overview = useQuery({ queryKey: ["platform"], queryFn: () => platformOverview() });
  const data = overview.data;
  return (
    <Shell title="Platform">
      <h1 className="font-display text-4xl font-semibold">Platform</h1>
      <div className="mt-4"><DemoBanner /></div>
      {overview.isError ? <p className="mt-6 text-chili">This desk is only for the super admin.</p> : null}
      {data ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-3xl bg-foam p-4"><p className="text-sm text-muted">Accounts</p><p className="font-display text-3xl">{data.accounts}</p></article>
            <article className="rounded-3xl bg-foam p-4"><p className="text-sm text-muted">Paid</p><p className="font-display text-3xl tabular-nums">{inr(data.paidPaise)}</p></article>
            <article className="rounded-3xl bg-foam p-4"><p className="text-sm text-muted">Refunded</p><p className="font-display text-3xl tabular-nums">{inr(data.refundedPaise)}</p></article>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-line bg-foam">
            <table className="w-full text-left text-sm">
              <thead className="text-muted"><tr><th className="px-4 py-3">Institution</th><th>Kind</th><th>Plan</th><th>Canteens</th></tr></thead>
              <tbody>
                {data.institutions.map((row) => (
                  <tr key={row.id} className="border-t border-line">
                    <td className="px-4 py-3 font-medium">{row.name}{row.demo ? " · Demo" : ""}</td>
                    <td>{row.kind}</td>
                    <td>{row.plan} · {row.subscription}</td>
                    <td className="tabular-nums">{row.canteens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className="rounded-3xl border border-line bg-foam p-4">
            <h2 className="font-display text-2xl font-semibold">Partner requests</h2>
            {data.leads.length === 0 ? <p className="mt-2 text-sm text-muted">No canteen has asked to join yet.</p> : (
              <ul className="mt-3 space-y-3">
                {data.leads.map((lead) => (
                  <li key={lead.id} className="rounded-2xl bg-cream px-3 py-3">
                    <p className="font-semibold">{lead.orgName}{lead.campusName ? ` · ${lead.campusName}` : ""}</p>
                    <p className="text-sm text-muted">{lead.name} · {lead.email}</p>
                    {lead.note ? <p className="mt-1 text-sm">{lead.note}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-3xl border border-line bg-foam p-4">
            <h2 className="font-display text-2xl font-semibold">Audit</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {data.audits.map((row) => <li key={row.id}>{row.action} · {row.entity} · {row.entityId}</li>)}
            </ul>
          </section>
        </div>
      ) : null}
    </Shell>
  );
}
