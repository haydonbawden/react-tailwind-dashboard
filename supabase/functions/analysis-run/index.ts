import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fail, methodNotAllowed, ok } from "../_shared/response.ts";

type AnalysisPayload = {
  auditId: string;
  versionId: string;
};

serve(async (request) => {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Partial<AnalysisPayload>;
    console.info("analysis-run stub invoked", body);

    return ok({
      message: "Automated analysis queued for processing.",
      received: body,
      resultPreview: {
        findings: [],
        rawOutputPath: "analysis/stub-output.json",
      },
    });
  } catch (error) {
    console.error("analysis-run stub failed", error);
    return fail("Unable to queue analysis at this time.");
  }
});
