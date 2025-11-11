import { supabase } from "../lib/supabaseClient";
import { DocxTemplate, EmailTemplate } from "../types/models";
import { useSupabaseQuery } from "./useSupabaseQuery";

export function useTemplates() {
  return useSupabaseQuery<{ emails: EmailTemplate[]; documents: DocxTemplate[] }>(async () => {
    const emailResult = await supabase.from<EmailTemplate>("email_templates").select();
    if (emailResult.error) {
      return { data: null, error: emailResult.error };
    }

    const docResult = await supabase.from<DocxTemplate>("docx_templates").select();
    if (docResult.error) {
      return { data: null, error: docResult.error };
    }

    return {
      data: {
        emails: emailResult.data ?? [],
        documents: docResult.data ?? [],
      },
      error: null,
    };
  });
}
