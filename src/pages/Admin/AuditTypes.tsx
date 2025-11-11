import { FormEvent, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuditTypes } from "../../hooks/useAuditTypes";
import { AuditTypeVersion } from "../../types/models";

interface DraftVersion {
  audit_type_id: string;
  version: string;
  price_aud: number;
  reminder_days: number;
}

const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900";

export default function AuditTypesPage() {
  const { data, refetch } = useAuditTypes();
  const [localVersions, setLocalVersions] = useState<AuditTypeVersion[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftVersion>({
    audit_type_id: "",
    version: "",
    price_aud: 0,
    reminder_days: 30,
  });

  const auditTypes = data?.types ?? [];
  const versions = useMemo(() => {
    const base = data?.versions ?? [];
    return [...base, ...localVersions];
  }, [data?.versions, localVersions]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.audit_type_id || !draft.version) {
      setFeedback("Please choose an audit type and version number.");
      return;
    }

    const newVersion: AuditTypeVersion = {
      id: `local-${Date.now()}`,
      audit_type_id: draft.audit_type_id,
      version: draft.version,
      criteria_md: "",
      form_schema: {},
      analysis_prompt_template: "",
      price_aud: draft.price_aud,
      reminder_days: draft.reminder_days,
      linked_docx_template_ids: [],
      created_by: null,
      created_at: new Date().toISOString(),
    };

    setLocalVersions((prev) => [...prev, newVersion]);
    setDraft({ audit_type_id: "", version: "", price_aud: 0, reminder_days: 30 });
    setFeedback("Draft version created locally. Sync to Supabase via deployment pipeline.");
  };

  const versionsByType = useMemo(() => {
    return auditTypes.map((type) => ({
      type,
      versions: versions.filter((version) => version.audit_type_id === type.id),
    }));
  }, [auditTypes, versions]);

  return (
    <>
      <PageMeta title="Audit types" description="Manage audit configuration and versions" />
      <div className="space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Audit type manager</h1>
            <p className="text-sm text-gray-500 dark:text-white/60">
              Create and iterate audit type versions. All changes should be published via Supabase migrations.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-white/10"
          >
            Refresh data
          </button>
        </header>

        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create draft version</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
            Use this form to capture metadata before writing the final Supabase migration.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
              Audit type
              <select
                value={draft.audit_type_id}
                onChange={(event) => setDraft((prev) => ({ ...prev, audit_type_id: event.target.value }))}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Select type</option>
                {auditTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
              Version label
              <input
                value={draft.version}
                onChange={(event) => setDraft((prev) => ({ ...prev, version: event.target.value }))}
                placeholder="e.g. 2025.1"
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
              Price (AUD)
              <input
                type="number"
                value={draft.price_aud}
                onChange={(event) => setDraft((prev) => ({ ...prev, price_aud: Number(event.target.value) }))}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
              Reminder days
              <input
                type="number"
                value={draft.reminder_days}
                onChange={(event) => setDraft((prev) => ({ ...prev, reminder_days: Number(event.target.value) }))}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
              >
                Add draft version
              </button>
            </div>
          </form>
          {feedback ? (
            <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-800/60 dark:bg-brand-900/30 dark:text-brand-200">
              {feedback}
            </div>
          ) : null}
        </section>

        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Audit types</h2>
          <div className="mt-4 space-y-6">
            {versionsByType.map(({ type, versions: typeVersions }) => (
              <div key={type.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{type.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-white/60">{type.description ?? "No description"}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-white/60">{typeVersions.length} versions</span>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/40">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-white/60">
                          Version
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-white/60">
                          Price (AUD)
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-white/60">
                          Reminder days
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-white/60">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {typeVersions.length === 0 ? (
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-white/60" colSpan={4}>
                            No versions found. Create a draft above and commit via Supabase migration.
                          </td>
                        </tr>
                      ) : (
                        typeVersions.map((version) => (
                          <tr key={version.id} className="bg-white transition hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-white/5">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{version.version}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-white/70">
                              ${version.price_aud.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-white/70">{version.reminder_days} days</td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-white/60">
                              {new Date(version.created_at).toLocaleDateString("en-AU")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
