import { supabase } from "../lib/supabaseClient";
import { Finding } from "../types/models";
import { useSupabaseQuery } from "./useSupabaseQuery";

export function useFindings(auditId?: string) {
  return useSupabaseQuery<Finding[]>(
    async () => {
      if (!auditId) {
        return { data: [], error: null };
      }

      const result = await supabase
        .from<Finding>("findings")
        .eq("audit_id", auditId)
        .order("created_at", { ascending: false })
        .select();

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ?? [], error: null };
    },
    [auditId],
  );
}
