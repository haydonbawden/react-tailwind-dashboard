import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fail, methodNotAllowed, ok } from "../_shared/response.ts";

type ProcessUploadPayload = {
  auditId: string;
  filename: string;
  sizeBytes: number;
};

serve(async (request) => {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as Partial<ProcessUploadPayload>;
    console.info("process-upload stub invoked", payload);

    return ok({
      message: "Upload accepted and queued for processing.",
      artifactId: "stub-artifact",
      pipeline: ["av-scan", "ocr", "pdf-split"],
    });
  } catch (error) {
    console.error("process-upload stub failed", error);
    return fail("Unable to queue upload processing.");
  }
});
