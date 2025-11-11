import { useMemo, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import { useTemplates } from "../../../hooks/useTemplates";
import { api } from "../../../lib/api";
import { DocxTemplate } from "../../../types/models";

const containerClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900";

export default function DocxTemplatesPage() {
  const { data, refetch } = useTemplates();
  const templates = data?.documents ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo<DocxTemplate | null>(() => {
    if (!selectedId) return templates[0] ?? null;
    return templates.find((template) => template.id === selectedId) ?? null;
  }, [templates, selectedId]);

  const handleValidate = async () => {
    if (!selectedTemplate) return;
    setStatus(null);
    setError(null);
    const { error: apiError } = await api.issueCertificate({
      templateId: selectedTemplate.id,
      validateOnly: true,
    });
    if (apiError) {
      setError(apiError.message);
    } else {
      setStatus("Template validation queued.");
    }
  };

  return (
    <>
      <PageMeta title="DOCX templates" description="Manage certificate templates" />
      <div className="space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">DOCX templates</h1>
            <p className="text-sm text-gray-500 dark:text-white/60">
              Certificate templates stored in Supabase Storage. Validate placeholder coverage before issuing.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-white/10"
          >
            Refresh
          </button>
        </header>

        <section className={containerClass}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Template catalogue</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              {(templates ?? []).map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedTemplate?.id === template.id
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-500/20 dark:text-brand-200"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-white/10"
                  }`}
                >
                  <span className="block font-semibold">{template.name}</span>
                  <span className="block text-xs text-gray-500 dark:text-white/60">v{template.version}</span>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {selectedTemplate ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{selectedTemplate.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-white/60">
                      Path: {selectedTemplate.storage_path}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-500 dark:text-white/60">Version</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTemplate.version}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-500 dark:text-white/60">Status</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTemplate.status}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium uppercase text-gray-500 dark:text-white/60">Summary</p>
                      <p className="text-sm text-gray-700 dark:text-white/70">
                        {selectedTemplate.placeholder_summary}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleValidate}
                      className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                    >
                      Validate placeholders
                    </button>
                    <span className="text-xs text-gray-500 dark:text-white/60">
                      Runs Edge Function validation (mocked in local dev).
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-white/60">Select a template to view details.</p>
              )}
            </div>
          </div>
          {status ? (
            <div className="mt-4 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-800/60 dark:bg-success-900/30 dark:text-success-200">
              {status}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-900/30 dark:text-error-200">
              {error}
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
