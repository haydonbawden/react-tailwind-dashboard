import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fail, methodNotAllowed, ok } from "../_shared/response.ts";

type GraphSendPayload = {
  to: string;
  templateKey?: string;
  variables?: Record<string, unknown>;
};

serve(async (request) => {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as Partial<GraphSendPayload>;
    console.info("graph-send stub invoked", payload);

    return ok({
      message: "Email queued for delivery via Microsoft Graph.",
      envelope: payload,
    });
  } catch (error) {
    console.error("graph-send stub failed", error);
    return fail("Unable to queue email send.");
  }
});
