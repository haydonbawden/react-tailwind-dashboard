import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fail, methodNotAllowed, ok } from "../_shared/response.ts";

type PdfSplitPayload = {
  artifactId: string;
};

serve(async (request) => {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as Partial<PdfSplitPayload>;
    console.info("pdf-split stub invoked", payload);

    return ok({
      message: "Split plan generated.",
      suggestedParts: [
        { id: "part-1", pageRange: [1, 3] },
        { id: "part-2", pageRange: [4, 6] },
      ],
    });
  } catch (error) {
    console.error("pdf-split stub failed", error);
    return fail("Unable to create split plan.");
  }
});
