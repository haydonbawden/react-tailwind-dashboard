import { useMemo } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../hooks/useAuth";
import { useAudits } from "../../hooks/useAudits";
import { AuditStatus } from "../../types/models";

const UPLOADABLE_STATUSES: AuditStatus[] = [
  "AwaitingEvidence",
  "ChangesRequested",
  "InReview",
];

export default function UploadLanding() {
  const { profile } = useAuth();

  const queryOptions = useMemo(() => {
    if (!profile) return undefined;
    if (profile.role === "ClientRep") {
      return { orgId: profile.org_id };
    }
    if (profile.role === "Reviewer") {
      return { reviewerId: profile.id };
    }
    return undefined;
  }, [profile]);

  const auditsQuery = useAudits(queryOptions);
  const audits = auditsQuery.data ?? [];
  const uploadableAudits = audits.filter((audit) =>
    UPLOADABLE_STATUSES.includes(audit.status),
  );

  const showEmptyState = !auditsQuery.isLoading && uploadableAudits.length === 0;

  return (
    <>
      <PageMeta
        title="Select an audit"
        description="Choose an audit to upload evidence against."
      />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Evidence uploads
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
            Pick an audit below to open the upload wizard. Only audits awaiting
            evidence or changes are displayed.
          </p>
        </div>

        {auditsQuery.error ? (
          <div className="rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-900/40 dark:text-error-200">
            {auditsQuery.error.message ?? "Unable to load audits."}
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Available audits
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
            {auditsQuery.isLoading
              ? "Loading audits..."
              : `${uploadableAudits.length} ready for evidence`}
          </p>

          {showEmptyState ? (
            <div className="mt-6 rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-white/60">
              No audits currently require evidence uploads.
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {uploadableAudits.map((audit) => (
                <li
                  key={audit.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 shadow-theme-xs transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:hover:border-brand-500/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {audit.audit_type?.name ?? "Audit"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/60">
                        {audit.organisation?.legal_name ?? "Unassigned organisation"}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                      {audit.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-white/60">
                    <span>
                      Due {audit.due_date ? new Date(audit.due_date).toLocaleDateString("en-AU") : "TBC"}
                    </span>
                    <Link
                      to={`/upload/${audit.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
                    >
                      Open upload wizard
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
