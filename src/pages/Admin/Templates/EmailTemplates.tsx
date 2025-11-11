import { useMemo, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import { useTemplates } from "../../../hooks/useTemplates";
import { api } from "../../../lib/api";
import { EmailTemplate } from "../../../types/models";

const containerClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900";

export default function EmailTemplatesPage() {
  const { data, refetch } = useTemplates();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const templates = data?.emails ?? [];

  const selectedTemplate = useMemo<EmailTemplate | null>(() => {
    if (!selectedKey) return templates[0] ?? null;
    return templates.find((template) => template.id === selectedKey) ?? null;
  }, [selectedKey, templates]);

  const handleTestSend = async () => {
    if (!selectedTemplate) return;
    setStatus(null);
    setError(null);
    const { error: apiError } = await api.graphSend({
      templateKey: selectedTemplate.key,
      templateVersion: selectedTemplate.version,
      to: "test@example.com",
    });
    if (apiError) {
      setError(apiError.message);
    } else {
      setStatus("Test email request queued via Edge Function.");
    }
  };

  return (
    <>
      <PageMeta title="Email templates" description="Manage Castor communication templates" />
      <div className="space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Email templates</h1>
            <p className="text-sm text-gray-500 dark:text-white/60">
              Templates are stored in Supabase. Update HTML, variables, and send tests from this console.
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Template list</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              {(templates ?? []).map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedKey(template.id)}
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
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{selectedTemplate.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-white/60">Key: {selectedTemplate.key}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-white/60">Variables</h4>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {selectedTemplate.variables.length === 0 ? (
                        <li className="text-xs text-gray-500 dark:text-white/60">No variables defined.</li>
                      ) : (
                        selectedTemplate.variables.map((variable) => (
                          <li
                            key={variable}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-white/10 dark:text-white/80"
                          >
                            {variable}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-white/60">HTML preview</h4>
                    <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-inner dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      dangerouslySetInnerHTML={{ __html: selectedTemplate.html }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTestSend}
                      className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                    >
                      Send test via Graph
                    </button>
                    <span className="text-xs text-gray-500 dark:text-white/60">
                      Sends to test@example.com using Edge Function mock.
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
