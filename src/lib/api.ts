import { supabase } from "./supabaseClient";

export interface ApiError {
  code?: string;
  message: string;
  status?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

const toApiError = (error: unknown): ApiError => {
  if (!error) {
    return { message: "Unknown error" };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  if (typeof error === "object") {
    const maybe = error as { message?: string; code?: string; status?: number };
    return {
      message: maybe.message ?? "Request failed",
      code: maybe.code,
      status: maybe.status,
    };
  }
  return { message: "Request failed" };
};

async function invoke<T>(
  name: string,
  options?: { method?: string; body?: Record<string, unknown> | FormData }
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> | undefined =
    options?.body instanceof FormData ? undefined : { "Content-Type": "application/json" };

  const { data, error } = await supabase.functions.invoke<T>(name, {
    method: options?.method ?? "POST",
    body: options?.body instanceof FormData ? undefined : options?.body,
    headers,
  });

  if (error) {
    return { data: null, error: toApiError(error) };
  }

  return { data: data ?? null, error: null };
}

export const api = {
  processUpload: (input: Record<string, unknown>) => invoke("process-upload", { body: input }),
  pdfSplit: (input: Record<string, unknown>) => invoke("pdf-split", { body: input }),
  analysisRun: (input: Record<string, unknown>) => invoke("analysis-run", { body: input }),
  issueCertificate: (input: Record<string, unknown>) => invoke("issue-certificate", { body: input }),
  importSeed: (input: Record<string, unknown>) => invoke("import-seed", { body: input }),
  graphSend: (input: Record<string, unknown>) => invoke("graph-send", { body: input }),
  stripeWebhook: (input: Record<string, unknown>) => invoke("stripe-webhook", { body: input }),
  renewalsRun: () => invoke("renewals-run", { method: "GET" }),
  dunningRun: () => invoke("dunning-run", { method: "GET" }),
};
