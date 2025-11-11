import { supabase } from "../lib/supabaseClient";
import { AuditType, AuditTypeVersion } from "../types/models";
import { useSupabaseQuery } from "./useSupabaseQuery";

export function useAuditTypes() {
  return useSupabaseQuery<{ types: AuditType[]; versions: AuditTypeVersion[] }>(async () => {
    const typeResult = await supabase.from<AuditType>("audit_types").select();
    if (typeResult.error) {
      return { data: null, error: typeResult.error };
    }

    const versionResult = await supabase.from<AuditTypeVersion>("audit_type_versions").select();
    if (versionResult.error) {
      return { data: null, error: versionResult.error };
    }

    return {
      data: {
        types: typeResult.data ?? [],
        versions: versionResult.data ?? [],
      },
      error: null,
    };
  });
}
