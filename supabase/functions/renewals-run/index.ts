import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fail, methodNotAllowed, ok } from "../_shared/response.ts";

serve(async (request) => {
  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  try {
    console.info("renewals-run stub invoked");

    return ok({
      message: "Renewal reminders dispatched.",
      renewalsCreated: 0,
    });
  } catch (error) {
    console.error("renewals-run stub failed", error);
    return fail("Unable to run renewal scheduler.");
  }
});
