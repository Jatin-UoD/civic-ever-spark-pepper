import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/recommendations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { listHandler } = await import("@/lib/canteen/analytics/handlers.server");
        return listHandler(request);
      },
      POST: async ({ request }) => {
        const { generateHandler } = await import("@/lib/canteen/analytics/handlers.server");
        return generateHandler(request);
      },
    },
  },
});
