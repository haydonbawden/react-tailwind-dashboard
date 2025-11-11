import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { fail, methodNotAllowed, ok } from "../_shared/response.ts";

type IssueCertificatePayload = {
  auditId: string;
  templateId?: string;
};

serve(async (request) => {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as Partial<IssueCertificatePayload>;
    console.info("issue-certificate stub invoked", payload);

    return ok({
      message: "Certificate generation queued.",
      certificateNumber: "CASTOR-2025-001",
      verificationToken: "stub-token",
    });
  } catch (error) {
    console.error("issue-certificate stub failed", error);
    return fail("Unable to queue certificate issuance.");
  }
});
