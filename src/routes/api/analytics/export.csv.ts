import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/export/csv")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { csvHandler } = await import("@/lib/canteen/analytics/handlers.server");
        return csvHandler(request);
      },
    },
  },
});
