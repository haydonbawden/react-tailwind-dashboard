import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fail, methodNotAllowed, ok } from "../_shared/response.ts";

type ImportSeedPayload = {
  rows: Array<Record<string, unknown>>;
};

serve(async (request) => {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as Partial<ImportSeedPayload>;
    console.info("import-seed stub invoked", payload?.rows?.length ?? 0);

    return ok({
      message: "Import received and validated in stub mode.",
      processed: payload.rows?.length ?? 0,
      rejected: 0,
    });
  } catch (error) {
    console.error("import-seed stub failed", error);
    return fail("Unable to process import payload.");
  }
});
