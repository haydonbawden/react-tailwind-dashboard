import { useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../hooks/useAuth";
import { useAudits } from "../../hooks/useAudits";
import { usePayments } from "../../hooks/usePayments";
import { AuditSummary, AuditStatus } from "../../types/models";

const statusLabels: Record<AuditStatus, string> = {
  Draft: "Draft",
  AwaitingEvidence: "Awaiting evidence",
  InReview: "In review",
  ChangesRequested: "Changes requested",
  Approved: "Approved",
  Failed: "Failed",
  Issued: "Issued",
  Expired: "Expired",
};

const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900";

function MetricCard({ title, value, helper }: { title: string; value: string; helper?: string }) {
  return (
    <div className={cardClass}>
      <p className="text-sm font-medium text-gray-500 dark:text-white/60">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-gray-500 dark:text-white/50">{helper}</p> : null}
    </div>
  );
}

function AuditList({ heading, audits }: { heading: string; audits: AuditSummary[] }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{heading}</h3>
        <span className="text-xs text-gray-500 dark:text-white/50">{audits.length} items</span>
      </div>
      <ul className="mt-4 space-y-4">
        {audits.length === 0 ? (
          <li className="text-sm text-gray-500 dark:text-white/60">No records available.</li>
        ) : (
          audits.slice(0, 5).map((audit) => (
            <li key={audit.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm font-medium text-gray-900 dark:text-white">
                <span>{audit.organisation?.trading_name ?? audit.organisation?.legal_name ?? audit.id}</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                  {statusLabels[audit.status]}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-white/60">
                {audit.audit_type?.name ?? "Unknown type"} • Due {audit.due_date ? new Date(audit.due_date).toLocaleDateString("en-AU") : "TBC"}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function ActivityFeed({ audits }: { audits: AuditSummary[] }) {
  return (
    <div className={cardClass}>
      <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent activity</h3>
      </div>
      <ul className="mt-4 space-y-4">
        {audits.length === 0 ? (
          <li className="text-sm text-gray-500 dark:text-white/60">No recent updates logged.</li>
        ) : (
          audits.slice(0, 6).map((audit) => (
            <li key={`${audit.id}-${audit.status}`} className="text-sm text-gray-600 dark:text-white/70">
              <span className="font-medium text-gray-900 dark:text-white">{audit.organisation?.trading_name ?? audit.organisation?.legal_name}</span>
              {" "}moved to <span className="font-semibold text-brand-600 dark:text-brand-300">{statusLabels[audit.status]}</span>{" "}
              on {audit.created_at ? new Date(audit.created_at).toLocaleDateString("en-AU") : "TBC"}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function PaymentsPanel({
  payments,
  isClient,
}: {
  payments: ReturnType<typeof usePayments>["data"];
  isClient: boolean;
}) {
  const items = payments ?? [];
  return (
    <div className={cardClass}>
      <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {isClient ? "Recent invoices" : "Payment events"}
        </h3>
      </div>
      <ul className="mt-4 space-y-4">
        {items.length === 0 ? (
          <li className="text-sm text-gray-500 dark:text-white/60">No payment records available.</li>
        ) : (
          items.slice(0, 6).map((payment) => (
            <li key={payment.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">${payment.amount_aud.toFixed(2)} AUD</p>
                <p className="text-xs text-gray-500 dark:text-white/60">
                  {new Date(payment.created_at).toLocaleString("en-AU")}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                  payment.status === "Succeeded"
                    ? "bg-success-50 text-success-600 dark:bg-success-500/20 dark:text-success-300"
                    : "bg-warning-50 text-warning-600 dark:bg-warning-500/20 dark:text-warning-200"
                }`}
              >
                {payment.status}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function Home() {
  const { profile } = useAuth();
  const isClient = profile?.role === "ClientRep";
  const isReviewer = profile?.role === "Reviewer";
  const isAdmin = profile?.role === "Admin";

  const auditsQuery = useAudits({
    orgId: isClient ? profile?.org_id ?? undefined : undefined,
    reviewerId: isReviewer ? profile?.id ?? undefined : undefined,
  });

  const paymentsQuery = usePayments(isClient ? profile?.org_id ?? null : undefined);

  const metrics = useMemo(() => {
    const audits = auditsQuery.data ?? [];
    const totalOpen = audits.filter((audit) => audit.status !== "Issued" && audit.status !== "Expired").length;
    const dueSoon = audits.filter((audit) => {
      if (!audit.due_date) return false;
      const due = new Date(audit.due_date).getTime();
      const diffDays = (due - Date.now()) / (1000 * 60 * 60 * 24);
      return diffDays <= 14 && diffDays >= 0;
    }).length;
    const issued = audits.filter((audit) => audit.status === "Issued").length;
    const awaitingEvidence = audits.filter((audit) => audit.status === "AwaitingEvidence").length;

    return {
      totalOpen,
      dueSoon,
      issued,
      awaitingEvidence,
    };
  }, [auditsQuery.data]);

  const priorityAudits = useMemo(() => {
    const audits = auditsQuery.data ?? [];
    return audits
      .filter((audit) => audit.status === "InReview" || audit.status === "AwaitingEvidence")
      .sort((a, b) => {
        const dueA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dueB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return dueA - dueB;
      });
  }, [auditsQuery.data]);

  const issuedAudits = useMemo(() => {
    const audits = auditsQuery.data ?? [];
    return audits.filter((audit) => audit.status === "Issued");
  }, [auditsQuery.data]);

  const outstandingAudits = useMemo(() => {
    const audits = auditsQuery.data ?? [];
    return audits.filter((audit) => audit.status !== "Issued" && audit.status !== "Expired");
  }, [auditsQuery.data]);

  return (
    <>
      <PageMeta title="Castor Audit Console" description="Operational dashboard for Castor remote audits." />
      <div className="space-y-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome back{profile ? `, ${profile.given_name}` : ""}</h1>
            <p className="text-sm text-gray-500 dark:text-white/60">
              {isAdmin && "Monitor renewals, approvals, and platform health."}
              {isReviewer && "Review assigned audits, manage findings, and issue certificates."}
              {isClient && "Track your organisation's audits, outstanding actions, and invoices."}
            </p>
          </div>
          {profile?.role === "ClientRep" && profile.status === "Pending" ? (
            <span className="rounded-full bg-warning-50 px-4 py-2 text-xs font-medium text-warning-700 dark:bg-warning-500/20 dark:text-warning-200">
              Awaiting Castor approval
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Open audits" value={String(metrics.totalOpen)} />
          <MetricCard title="Due in 14 days" value={String(metrics.dueSoon)} helper="Includes drafts and in-review" />
          <MetricCard title="Issued certificates" value={String(metrics.issued)} helper="Last 12 months" />
          <MetricCard
            title="Awaiting evidence"
            value={String(metrics.awaitingEvidence)}
            helper="Client uploads pending"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <AuditList
              heading={isClient ? "Your active audits" : "Priority audits"}
              audits={isClient ? outstandingAudits : priorityAudits}
            />
            {isAdmin || isReviewer ? <ActivityFeed audits={auditsQuery.data ?? []} /> : null}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <PaymentsPanel payments={paymentsQuery.data} isClient={isClient} />
            <AuditList heading="Issued certificates" audits={issuedAudits} />
          </div>
        </div>
      </div>
    </>
  );
}
