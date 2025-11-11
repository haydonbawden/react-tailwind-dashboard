import { supabase } from "../lib/supabaseClient";
import { Artifact, EvidenceSubmission } from "../types/models";
import { useSupabaseQuery } from "./useSupabaseQuery";

export function useEvidence(auditId?: string) {
  return useSupabaseQuery<{ submissions: EvidenceSubmission[]; artifacts: Artifact[] }>(
    async () => {
      if (!auditId) {
        return { data: { submissions: [], artifacts: [] }, error: null };
      }

      const submissionsResult = await supabase
        .from<EvidenceSubmission>("evidence_submissions")
        .eq("audit_id", auditId)
        .select();

      if (submissionsResult.error) {
        return { data: null, error: submissionsResult.error };
      }

      const artifactsResult = await supabase
        .from<Artifact>("artifacts")
        .eq("audit_id", auditId)
        .select();

      if (artifactsResult.error) {
        return { data: null, error: artifactsResult.error };
      }

      return {
        data: {
          submissions: submissionsResult.data ?? [],
          artifacts: artifactsResult.data ?? [],
        },
        error: null,
      };
    },
    [auditId],
  );
}
