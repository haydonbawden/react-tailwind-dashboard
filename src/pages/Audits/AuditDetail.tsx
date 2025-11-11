import { useMemo, useState } from "react";
import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { api } from "../../lib/api";
import { useAudit } from "../../hooks/useAudits";
import { useEvidence } from "../../hooks/useEvidence";
import { useFindings } from "../../hooks/useFindings";
import { useAuditTrail } from "../../hooks/useAuditTrail";

const containerClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900";

export default function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const auditQuery = useAudit(id);
  const evidenceQuery = useEvidence(id);
  const findingsQuery = useFindings(id);
  const trailQuery = useAuditTrail(id);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const audit = auditQuery.data;
  const submissions = evidenceQuery.data?.submissions ?? [];
  const artifacts = evidenceQuery.data?.artifacts ?? [];
  const findings = findingsQuery.data ?? [];
  const trail = trailQuery.data ?? [];

  const evidenceBySubmission = useMemo(() => {
    return submissions.map((submission) => ({
      submission,
      files: artifacts.filter((artifact) => artifact.submission_id === submission.id),
    }));
  }, [submissions, artifacts]);

  const handleAction = async (action: "analysis" | "issue" | "upload") => {
    if (!id) return;
    setIsProcessing(true);
    setFeedback(null);
    setError(null);

    try {
      if (action === "analysis") {
        const { error: apiError } = await api.analysisRun({ auditId: id });
        if (apiError) throw new Error(apiError.message);
        setFeedback("Automated analysis queued successfully.");
      }
      if (action === "issue") {
        const { error: apiError } = await api.issueCertificate({ auditId: id });
        if (apiError) throw new Error(apiError.message);
        setFeedback("Certificate issuance workflow triggered.");
      }
      if (action === "upload") {
        const { error: apiError } = await api.processUpload({ auditId: id });
        if (apiError) throw new Error(apiError.message);
        setFeedback("Upload pipeline started – monitor status in evidence panel.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <PageMeta title={`Audit ${id ?? "detail"}`} description="Audit review workspace" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{audit?.audit_type?.name ?? "Audit"}</h1>
            <p className="text-sm text-gray-500 dark:text-white/60">
              {audit?.organisation?.legal_name ?? "Unassigned organisation"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-white/50">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200">
                Status: {audit?.status ?? "Unknown"}
              </span>
              <span>
                Due date: {audit?.due_date ? new Date(audit.due_date).toLocaleDateString("en-AU") : "TBC"}
              </span>
              <span>Reviewer: {audit?.reviewer?.given_name ?? "Unassigned"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAction("analysis")}
              disabled={isProcessing}
              className="inline-flex items-center justify-center rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-500/10 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Queue analysis
            </button>
            <button
              onClick={() => handleAction("upload")}
              disabled={isProcessing}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-white dark:hover:bg-white/10"
            >
              Request upload check
            </button>
            <button
              onClick={() => handleAction("issue")}
              disabled={isProcessing}
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Issue certificate
            </button>
          </div>
        </div>

        {feedback ? (
          <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-800 dark:border-success-800/60 dark:bg-success-900/30 dark:text-success-200">
            {feedback}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-900/30 dark:text-error-200">
            {error}
          </div>
        ) : null}

        <section className={containerClass}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overview</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-white/50">Organisation</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {audit?.organisation?.legal_name ?? "Not linked"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-white/50">Audit type</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {audit?.audit_type?.name ?? "Unknown"} (v{audit?.version?.version ?? "n/a"})
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-white/50">Open date</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {audit?.open_date ? new Date(audit.open_date).toLocaleDateString("en-AU") : "Pending"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-white/50">Expiry date</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {audit?.expiry_date ? new Date(audit.expiry_date).toLocaleDateString("en-AU") : "Not issued"}
              </dd>
            </div>
          </dl>
        </section>

        <section className={containerClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Evidence submissions</h2>
            <span className="text-xs text-gray-500 dark:text-white/50">{submissions.length} submissions</span>
          </div>
          <div className="mt-4 space-y-4">
            {evidenceBySubmission.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-white/60">No evidence uploaded yet.</p>
            ) : (
              evidenceBySubmission.map(({ submission, files }) => (
                <div key={submission.id} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Submitted {new Date(submission.submitted_at).toLocaleString("en-AU")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/60">{submission.notes ?? "No notes provided"}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-white/60">{files.length} files</span>
                  </div>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {files.map((file) => (
                      <li key={file.id} className="rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:text-white/70">
                        <p className="font-medium text-gray-900 dark:text-white">{file.storage_path}</p>
                        <p>{(file.size_bytes / 1024 / 1024).toFixed(1)} MB • {file.kind}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={containerClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Findings</h2>
            <span className="text-xs text-gray-500 dark:text-white/50">{findings.length} items</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/40">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Criterion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Rationale
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Citations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {findings.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500 dark:text-white/60" colSpan={4}>
                      No findings recorded yet.
                    </td>
                  </tr>
                ) : (
                  findings.map((finding) => (
                    <tr key={finding.id} className="bg-white transition hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-white/5">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{finding.criterion_key}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-white/70">{finding.level}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-white/70">
                        {finding.rationale}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-white/60">
                        {finding.citations.length > 0
                          ? finding.citations.map((citation) => `${citation.artifactId} · p${citation.page}`).join(", ")
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={containerClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Decision log</h2>
            <span className="text-xs text-gray-500 dark:text-white/50">{trail.length} events</span>
          </div>
          <ul className="mt-4 space-y-4">
            {trail.length === 0 ? (
              <li className="text-sm text-gray-500 dark:text-white/60">No recorded events.</li>
            ) : (
              trail.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-gray-100 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-white/70">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-gray-900 dark:text-white">{entry.action}</span>
                    <span className="text-xs text-gray-500 dark:text-white/50">
                      {new Date(entry.created_at).toLocaleString("en-AU")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
                    Actor: {entry.actor_user_id ?? "System"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
