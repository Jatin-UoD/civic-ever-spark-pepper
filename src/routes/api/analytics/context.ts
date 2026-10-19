import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/context")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { contextHandler } = await import("@/lib/canteen/analytics/handlers.server");
        return contextHandler(request);
      },
    },
  },
});
