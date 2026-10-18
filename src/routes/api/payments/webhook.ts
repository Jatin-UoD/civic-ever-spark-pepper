import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyHmacSha256, friendlyError } = await import("@/lib/canteen/domain");
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
          return Response.json(
            {
              ok: false,
              demo: true,
              error: "Demo gateway: webhooks stay off until RAZORPAY_WEBHOOK_SECRET is set. In-app demo payment is settled on the server.",
            },
            { status: 401 },
          );
        }
        const raw = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const ok = await verifyHmacSha256(secret, raw, signature);
        if (!ok) return Response.json({ ok: false, error: "Invalid signature" }, { status: 400 });
        try {
          const body = JSON.parse(raw) as {
            id?: string;
            event?: string;
            payload?: { payment?: { entity?: { id?: string; notes?: { canteenx_order_id?: string } } } };
          };
          const { withTransaction } = await import("@/lib/canteen/tx.server");
          const { applyWebhookEvent } = await import("@/lib/canteen/logic");
          const result = await withTransaction((sql) => applyWebhookEvent(sql, body));
          return Response.json({ ok: true, result });
        } catch (error) {
          const message = error instanceof Error ? friendlyError(error.message) : "Webhook failed";
          return Response.json({ ok: false, error: message }, { status: 400 });
        }
      },
    },
  },
});
