import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { activateAnalyticsCanteen } from "@/components/analytics/analytics-client";
import { Shell, useMe } from "@/components/canteen-ui";
import { listDirectory } from "@/lib/canteen/api";
import { canOperateCanteen } from "@/lib/canteen/domain";
import { analyticsRoleForMembership, canViewAnalytics } from "@/lib/canteen/analytics/access.js";

export const Route = createFileRoute("/analytics")({
  validateSearch: (search: Record<string, unknown>) => ({
    canteenId: typeof search.canteenId === "string" ? search.canteenId : undefined,
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { canteenId } = Route.useSearch();
  const { me, loadingMe } = useMe();
  const analyticsRole = me?.memberships
    .map((membership) => analyticsRoleForMembership(membership.role))
    .find((role) => canViewAnalytics(role));
  const allowed = canViewAnalytics(analyticsRole);

  if (loadingMe) {
    return <Shell title="Canteen analytics"><div className="h-48 animate-pulse rounded-3xl bg-foam" /></Shell>;
  }
  if (!allowed || !me) {
    return <Shell title="Canteen analytics"><p className="rounded-3xl border border-line bg-foam p-6">Not available for this account.</p></Shell>;
  }
  return <Shell title="Canteen analytics"><AnalyticsContent me={me} requestedCanteenId={canteenId} /></Shell>;
}

function AnalyticsContent({
  me,
  requestedCanteenId,
}: {
  me: NonNullable<ReturnType<typeof useMe>["me"]>;
  requestedCanteenId?: string;
}) {
  const directory = useQuery({ queryKey: ["analytics-directory", me.userId], queryFn: () => listDirectory() });
  const memberships = { userId: me.userId, memberships: me.memberships };
  const canteens = (directory.data ?? []).filter((row) =>
    canOperateCanteen(memberships, row.canteenId, row.institutionId, "admin"),
  );
  const [selectedId, setSelectedId] = useState(requestedCanteenId ?? "");
  const canteenId = canteens.some((row) => row.canteenId === selectedId)
    ? selectedId
    : canteens[0]?.canteenId ?? "";
  const context = useQuery({
    queryKey: ["analytics-session-context", me.userId, canteenId],
    queryFn: () => activateAnalyticsCanteen(canteenId),
    enabled: Boolean(canteenId),
    staleTime: 60_000,
  });
  return (
    <main className="space-y-5">
      {directory.isLoading ? <div className="h-12 animate-pulse rounded-full bg-foam" /> : null}
      {canteens.length > 1 ? (
        <label className="no-print flex flex-wrap items-center gap-3 text-sm font-semibold">
          Canteen
          <select value={canteenId} onChange={(event) => setSelectedId(event.target.value)} className="rounded-full border border-line bg-foam px-4 py-2">
            {canteens.map((canteen) => <option key={canteen.canteenId} value={canteen.canteenId}>{canteen.canteenName} · {canteen.campusName}</option>)}
          </select>
        </label>
      ) : null}
      {directory.error ? <p role="alert" className="rounded-2xl bg-foam p-4 text-sm text-chili">Could not load your canteen list. Refresh and retry.</p> : null}
      {context.error ? <p role="alert" className="rounded-2xl bg-foam p-4 text-sm text-chili">Could not select this canteen for analytics. Choose an authorized canteen and retry.</p> : null}
      {!directory.isLoading && canteens.length === 0 ? <p className="rounded-3xl border border-line bg-foam p-6">No canteens are available to this account.</p> : null}
      {context.isLoading && canteenId ? <div className="h-14 animate-pulse rounded-2xl bg-foam" /> : null}
      {context.isSuccess && canteenId ? <AnalyticsDashboard key={canteenId} canteenId={canteenId} /> : null}
    </main>
  );
}
