import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fail, methodNotAllowed, ok } from "../_shared/response.ts";

type StripeEvent = {
  id: string;
  type: string;
};

serve(async (request) => {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const event = (await request.json().catch(() => ({}))) as Partial<StripeEvent>;
    console.info("stripe-webhook stub invoked", event?.type ?? "unknown");

    return ok({
      message: "Webhook received.",
      eventType: event.type ?? "unknown",
      acknowledgedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("stripe-webhook stub failed", error);
    return fail("Unable to process webhook event.");
  }
});
