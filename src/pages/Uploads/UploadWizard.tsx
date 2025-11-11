import { FormEvent, useState } from "react";
import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { api } from "../../lib/api";
import { useAudit } from "../../hooks/useAudits";
import { useEvidence } from "../../hooks/useEvidence";

export default function UploadWizard() {
  const { auditId } = useParams<{ auditId: string }>();
  const auditQuery = useAudit(auditId);
  const evidenceQuery = useEvidence(auditId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auditId) return;
    if (!selectedFile) {
      setError("Please choose a file to upload.");
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    setError(null);

    try {
      const payload = {
        auditId,
        filename: selectedFile.name,
        sizeBytes: selectedFile.size,
        notes,
      };
      const { error: apiError } = await api.processUpload(payload);
      if (apiError) {
        throw new Error(apiError.message);
      }
      setStatus("Upload request submitted – processing pipeline queued.");
      setSelectedFile(null);
      setNotes("");
      await evidenceQuery.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process upload");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submissions = evidenceQuery.data?.submissions ?? [];

  return (
    <>
      <PageMeta title="Evidence upload" description="Submit evidence for the selected audit" />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Upload evidence</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-white/60">
            Upload files up to 2 GB each. Supported types: PDF, DOCX, ZIP. All files are scanned for malware and processed with OCR.
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-white/50">Audit</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{auditQuery.data?.audit_type?.name ?? auditId}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-white/50">Organisation</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {auditQuery.data?.organisation?.legal_name ?? "Unlinked"}
              </dd>
            </div>
          </dl>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
                Evidence file
                <input
                  type="file"
                  className="block w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-700 focus:border-brand-400 focus:outline-hidden focus:ring-2 focus:ring-brand-400/40 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
                <span className="text-xs font-normal text-gray-500 dark:text-white/50">
                  Choose a file or drag & drop into this area.
                </span>
              </label>
            </div>
            <div>
              <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
                Notes for reviewer
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  placeholder="Add context about the evidence, e.g. the time period or system"
                />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Submit for processing
              </button>
              {selectedFile ? (
                <span className="text-xs text-gray-500 dark:text-white/50">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              ) : null}
            </div>
          </form>
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
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Previous submissions</h2>
            <span className="text-xs text-gray-500 dark:text-white/50">{submissions.length} records</span>
          </div>
          <ul className="mt-4 space-y-4">
            {submissions.length === 0 ? (
              <li className="text-sm text-gray-500 dark:text-white/60">No submissions yet.</li>
            ) : (
              submissions.map((submission) => (
                <li key={submission.id} className="rounded-lg border border-gray-100 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-white/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(submission.submitted_at).toLocaleString("en-AU")}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-white/60">{submission.notes ?? "No notes"}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
