import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fail, methodNotAllowed, ok } from "../_shared/response.ts";

serve(async (request) => {
  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  try {
    console.info("dunning-run stub invoked");

    return ok({
      message: "Dunning reminders scheduled.",
      attempted: 0,
      retriable: 0,
    });
  } catch (error) {
    console.error("dunning-run stub failed", error);
    return fail("Unable to run dunning cycle.");
  }
});
