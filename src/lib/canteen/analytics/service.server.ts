import { randomUUID } from "node:crypto";
import type { Actor } from "../domain.ts";
import type { Sql } from "../sql.ts";
import { analyticsRoleForMembership, canViewAnalytics, ForbiddenError, NotFoundError } from "./access.js";
import { computeOverview } from "./metrics.js";
import { ruleInsights } from "./insights.js";
import * as repo from "./repo.server.ts";

function sessionRoles(actor: Actor) {
  return actor.memberships
    .filter((membership) => membership.active)
    .map((membership) => ({
      role: analyticsRoleForMembership(membership.role),
      canteenId: membership.canteenId,
      institutionId: membership.institutionId,
    }))
    .filter((membership) => membership.role != null);
}

export function assertAnalyticsRole(actor: Actor, userId: string) {
  if (!userId || userId !== actor.userId) throw new ForbiddenError();
  const memberships = sessionRoles(actor);
  if (!memberships.some((membership) => canViewAnalytics(membership.role))) throw new ForbiddenError();
  return memberships;
}

export async function assertAccess(sql: Sql, actor: Actor, userId: string, canteenId: string) {
  const memberships = assertAnalyticsRole(actor, userId);
  if (typeof canteenId !== "string" || !canteenId.trim() || canteenId.length > 80) throw new ForbiddenError();

  const superAdmin = memberships.some((membership) => membership.role === "super_admin");
  const canteenAdmin = memberships.some(
    (membership) => membership.role === "canteen_admin" && membership.canteenId === canteenId,
  );
  if (superAdmin || canteenAdmin) {
    const scope = await repo.getCanteenScope(sql, canteenId);
    if (!scope) throw new NotFoundError();
    return { userId, canteenId, institutionId: scope.institutionId };
  }

  const institutionMemberships = memberships.filter((membership) => membership.role === "institution_admin");
  if (!institutionMemberships.length) throw new ForbiddenError();
  const scope = await repo.getCanteenScope(sql, canteenId);
  if (!scope) throw new NotFoundError();
  if (!institutionMemberships.some((membership) => membership.institutionId === scope.institutionId)) {
    throw new ForbiddenError();
  }
  return { userId, canteenId, institutionId: scope.institutionId };
}

export async function getSelectedCanteen(sql: Sql, actor: Actor, userId: string) {
  assertAnalyticsRole(actor, userId);
  const canteenId = await repo.getSelectedCanteen(sql, userId);
  if (!canteenId) throw new ForbiddenError();
  await assertAccess(sql, actor, userId, canteenId);
  return canteenId;
}

export async function setSelectedCanteen(sql: Sql, actor: Actor, userId: string, canteenId: string) {
  await assertAccess(sql, actor, userId, canteenId);
  await repo.setSelectedCanteen(sql, userId, canteenId);
  return { ok: true };
}

export async function getOverview(sql: Sql, actor: Actor, userId: string, canteenId: string, now = new Date()) {
  const access = await assertAccess(sql, actor, userId, canteenId);
  const snapshot = await repo.loadSnapshot(sql, access.canteenId);
  return computeOverview({ ...snapshot, now });
}

export async function getRecommendations(sql: Sql, actor: Actor, userId: string, canteenId: string) {
  const access = await assertAccess(sql, actor, userId, canteenId);
  return repo.listRecommendations(sql, access.canteenId);
}

export async function generateInsights(sql: Sql, actor: Actor, userId: string, canteenId: string, now = new Date()) {
  const access = await assertAccess(sql, actor, userId, canteenId);
  const overview = computeOverview({ ...(await repo.loadSnapshot(sql, access.canteenId)), now });
  const insights = ruleInsights(overview).map((insight) => ({
    id: randomUUID(),
    ...insight,
    fingerprint: JSON.stringify([insight.kind, insight.title, [...insight.itemIds].sort()]),
  }));
  const inserted = await repo.insertPendingRecommendations(sql, access.canteenId, insights);
  return {
    generated: inserted,
    recommendations: await repo.listRecommendations(sql, access.canteenId),
  };
}

export async function decideRecommendation(
  sql: Sql,
  actor: Actor,
  userId: string,
  canteenId: string,
  id: string,
  decision: "approved" | "dismissed",
) {
  const access = await assertAccess(sql, actor, userId, canteenId);
  return repo.decidePendingRecommendation(sql, access.canteenId, id, decision, userId);
}
