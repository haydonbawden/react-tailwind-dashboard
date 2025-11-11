import { useEffect, useState } from "react";
import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { supabase, SupabaseError } from "../../lib/supabaseClient";
import { CertificateVerificationResult } from "../../types/models";

const containerClass =
  "mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900";

export default function VerificationPage() {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);
  const [error, setError] = useState<SupabaseError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data, error: rpcError } = await supabase.rpc<CertificateVerificationResult>(
        "get_certificate_by_token",
        { token },
      );
      setResult(data ?? null);
      setError(rpcError);
      setIsLoading(false);
    };
    load();
  }, [token]);

  return (
    <>
      <PageMeta title="Certificate verification" description="Validate Castor-issued certificates" />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16 dark:bg-gray-950">
        <div className={containerClass}>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Certificate verification</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-white/60">
            Entered token: <span className="font-mono">{token}</span>
          </p>
          {isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              Validating certificate...
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="mt-6 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-900/30 dark:text-error-200">
              {error.message ?? "Certificate not found"}
            </div>
          ) : null}

          {!isLoading && result ? (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-white/60">Certificate number</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.number}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-white/60">Status</p>
                  <p className="text-sm text-gray-900 dark:text-white">{result.status}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-white/60">Issued</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(result.issued_at).toLocaleDateString("en-AU")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-white/60">Organisation</p>
                  <p className="text-sm text-gray-900 dark:text-white">{result.organisation_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-white/60">Audit type</p>
                  <p className="text-sm text-gray-900 dark:text-white">{result.audit_type_name}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-white/60">Expiry</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {result.expiry_date ? new Date(result.expiry_date).toLocaleDateString("en-AU") : "No expiry recorded"}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
