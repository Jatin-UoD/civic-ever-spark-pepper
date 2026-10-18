import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/recommendations/decide")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { decideHandler } = await import("@/lib/canteen/analytics/handlers.server");
        return decideHandler(request);
      },
    },
  },
});
