import { rateLimit } from "../domain.ts";
import { actorFrom } from "../logic.ts";
import { getSql } from "@/lib/db";
import { requireUserId } from "@/lib/auth/verify.server";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { toCsv } from "./csv.js";
import {
  decideRecommendation,
  assertAnalyticsRole,
  generateInsights,
  getOverview,
  getRecommendations,
  getSelectedCanteen,
  setSelectedCanteen,
} from "./service.server.ts";
import { parseContextBody, parseDecisionBody } from "./validation.js";

type SessionContext = {
  userId: string;
  sql: Awaited<ReturnType<typeof getSql>>;
  actor: Awaited<ReturnType<typeof actorFrom>>;
};

async function sessionContext(): Promise<SessionContext> {
  assertSameSiteRequest();
  const userId = await requireUserId();
  const sql = await getSql();
  const actor = await actorFrom(sql, userId);
  return { userId, sql, actor };
}

function responseError(error: unknown) {
  const status = error && typeof error === "object" && "status" in error
    ? Number(error.status)
    : error instanceof Error && error.message === "Unauthorized"
      ? 401
      : 500;
  if (status === 401) return Response.json({ error: "Unauthorized" }, { status });
  if (status === 403) return Response.json({ error: "Forbidden" }, { status });
  if (status === 404) return Response.json({ error: "Not found" }, { status });
  if (status === 400) return Response.json({ error: "Invalid request" }, { status });
  console.error("[canteen analytics] Request failed", error);
  return Response.json({ error: "Analytics request failed." }, { status: 500 });
}

async function selectedSessionContext(_request: Request) {
  const context = await sessionContext();
  const canteenId = await getSelectedCanteen(context.sql, context.actor, context.userId);
  return { ...context, canteenId };
}

async function execute(request: Request, run: (context: SessionContext & { canteenId: string }) => Promise<unknown>) {
  try {
    return Response.json(await run(await selectedSessionContext(request)));
  } catch (error) {
    return responseError(error);
  }
}

export function overviewHandler(request: Request) {
  return execute(request, ({ sql, actor, userId, canteenId }) =>
    getOverview(sql, actor, userId, canteenId),
  );
}

export function listHandler(request: Request) {
  return execute(request, ({ sql, actor, userId, canteenId }) =>
    getRecommendations(sql, actor, userId, canteenId),
  );
}

export async function generateHandler(request: Request) {
  try {
    const context = await selectedSessionContext(request);
    const { canteenId } = context;
    rateLimit(`analytics-generate:${context.userId}:${canteenId}`, 6, 60_000);
    return Response.json(await generateInsights(context.sql, context.actor, context.userId, canteenId));
  } catch (error) {
    return responseError(error);
  }
}

export async function decideHandler(request: Request) {
  let context: SessionContext & { canteenId: string };
  try {
    context = await selectedSessionContext(request);
  } catch (error) {
    return responseError(error);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsedBody = parseDecisionBody(body);
  if (!parsedBody) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    return Response.json(await decideRecommendation(
      context.sql,
      context.actor,
      context.userId,
      context.canteenId,
      parsedBody.id,
      parsedBody.decision,
    ));
  } catch (error) {
    return responseError(error);
  }
}

export async function contextHandler(request: Request) {
  let context: SessionContext;
  try {
    context = await sessionContext();
    assertAnalyticsRole(context.actor, context.userId);
  } catch (error) {
    return responseError(error);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsedBody = parseContextBody(body);
  if (!parsedBody) return Response.json({ error: "Invalid request" }, { status: 400 });
  try {
    return Response.json(
      await setSelectedCanteen(context.sql, context.actor, context.userId, parsedBody.canteenId),
    );
  } catch (error) {
    return responseError(error);
  }
}

export async function csvHandler(request: Request) {
  try {
    const { sql, actor, userId, canteenId } = await selectedSessionContext(request);
    const csv = toCsv(await getOverview(sql, actor, userId, canteenId));
    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="canteen-analytics.csv"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return responseError(error);
  }
}
