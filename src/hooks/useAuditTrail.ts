import { supabase } from "../lib/supabaseClient";
import { AuditTrailEntry } from "../types/models";
import { useSupabaseQuery } from "./useSupabaseQuery";

export function useAuditTrail(entityId?: string) {
  return useSupabaseQuery<AuditTrailEntry[]>(
    async () => {
      if (!entityId) {
        return { data: [], error: null };
      }

      const result = await supabase
        .from<AuditTrailEntry>("audit_trail")
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false })
        .select();

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ?? [], error: null };
    },
    [entityId],
  );
}
