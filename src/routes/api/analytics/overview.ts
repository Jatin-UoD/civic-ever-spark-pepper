import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/overview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { overviewHandler } = await import("@/lib/canteen/analytics/handlers.server");
        return overviewHandler(request);
      },
    },
  },
});
