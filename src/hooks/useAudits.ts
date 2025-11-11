import { useMemo } from "react";
import { useSupabaseQuery } from "./useSupabaseQuery";
import { supabase } from "../lib/supabaseClient";
import { AuditStatus, AuditSummary } from "../types/models";

export type UseAuditsOptions = {
  status?: AuditStatus[];
  orgId?: string | null;
  reviewerId?: string | null;
};

const serializeOptions = (options: UseAuditsOptions | undefined) =>
  JSON.stringify({
    status: options?.status ?? null,
    orgId: options?.orgId ?? null,
    reviewerId: options?.reviewerId ?? null,
  });

export function useAudits(options?: UseAuditsOptions) {
  const dependencies = useMemo(() => [serializeOptions(options)], [options]);

  return useSupabaseQuery<AuditSummary[]>(
    async () => {
      let query = supabase.from<AuditSummary>("audits");
      if (options?.status?.length) {
        query = query.in("status", options.status);
      }
      if (options?.orgId) {
        query = query.eq("org_id", options.orgId);
      }
      if (options?.reviewerId) {
        query = query.eq("reviewer_id", options.reviewerId);
      }

      const result = await query.select();
      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ?? [], error: null };
    },
    dependencies,
  );
}

export function useAudit(auditId?: string) {
  return useSupabaseQuery<AuditSummary>(
    async () => {
      if (!auditId) {
        return { data: null, error: null };
      }

      const result = await supabase
        .from<AuditSummary>("audits")
        .eq("id", auditId)
        .maybeSingle();

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: result.data ?? null, error: null };
    },
    [auditId],
  );
}
