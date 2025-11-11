import { supabase } from "../lib/supabaseClient";
import { Payment } from "../types/models";
import { useSupabaseQuery } from "./useSupabaseQuery";

export function usePayments(orgId?: string | null) {
  return useSupabaseQuery<Payment[]>(
    async () => {
      let query = supabase.from<Payment>("payments").order("created_at", { ascending: false });
      if (orgId) {
        query = query.eq("org_id", orgId);
      }

      const result = await query.select();
      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ?? [], error: null };
    },
    [orgId],
  );
}
