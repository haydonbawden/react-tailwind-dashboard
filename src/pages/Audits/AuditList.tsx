import { useMemo, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { useAudits } from "../../hooks/useAudits";
import { useAuditTypes } from "../../hooks/useAuditTypes";
import { useAuth } from "../../hooks/useAuth";
import { AuditStatus } from "../../types/models";

const statusOptions: { label: string; value: AuditStatus | "all" }[] = [
  { label: "All statuses", value: "all" },
  { label: "Awaiting evidence", value: "AwaitingEvidence" },
  { label: "In review", value: "InReview" },
  { label: "Changes requested", value: "ChangesRequested" },
  { label: "Approved", value: "Approved" },
  { label: "Issued", value: "Issued" },
  { label: "Expired", value: "Expired" },
];

const cellClass = "px-4 py-3 text-sm text-gray-700 dark:text-white/70";

export default function AuditList() {
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<AuditStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const auditsQuery = useAudits({
    orgId: profile?.role === "ClientRep" ? profile.org_id ?? undefined : undefined,
    reviewerId: profile?.role === "Reviewer" ? profile.id ?? undefined : undefined,
  });
  const typesQuery = useAuditTypes();

  const filteredAudits = useMemo(() => {
    const audits = auditsQuery.data ?? [];
    return audits.filter((audit) => {
      const matchesStatus =
        statusFilter === "all" ? true : audit.status === statusFilter;
      const matchesType =
        typeFilter === "all" ? true : audit.audit_type?.id === typeFilter || audit.audit_type_version_id === typeFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = term
        ? [
            audit.organisation?.legal_name,
            audit.organisation?.trading_name,
            audit.audit_type?.name,
            audit.id,
          ]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(term))
        : true;
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [auditsQuery.data, statusFilter, typeFilter, searchTerm]);

  return (
    <>
      <PageMeta title="Audits" description="Manage and track Castor audits" />
      <div className="space-y-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Audits</h1>
            <p className="text-sm text-gray-500 dark:text-white/60">
              Filter audits by status, type, or organisation. Use the detail view to review evidence and findings.
            </p>
          </div>
          <Link
            to="/admin/import"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            Import audits
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
            Status
            <select
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AuditStatus | "all")}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
            Audit type
            <select
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">All types</option>
              {(typesQuery.data?.types ?? []).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70 sm:col-span-2 lg:col-span-2">
            Search
            <input
              type="search"
              placeholder="Search by organisation, audit ID, or type"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Audit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Organisation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Type & version
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Due date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Reviewer
                  </th>
                  <th className="sr-only">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500 dark:text-white/60" colSpan={6}>
                      No audits matched the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((audit) => (
                    <tr key={audit.id} className="transition hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className={`${cellClass} font-medium text-gray-900 dark:text-white`}>{audit.id}</td>
                      <td className={cellClass}>
                        {audit.organisation?.trading_name ?? audit.organisation?.legal_name ?? "Unlinked"}
                      </td>
                      <td className={cellClass}>
                        <div className="flex flex-col text-xs text-gray-600 dark:text-white/60">
                          <span className="text-sm text-gray-900 dark:text-white">{audit.audit_type?.name ?? "Unknown"}</span>
                          <span>v{audit.version?.version ?? "n/a"}</span>
                        </div>
                      </td>
                      <td className={cellClass}>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-white/80">
                          {audit.status}
                        </span>
                      </td>
                      <td className={cellClass}>
                        {audit.due_date ? new Date(audit.due_date).toLocaleDateString("en-AU") : "TBC"}
                      </td>
                      <td className={cellClass}>{audit.reviewer?.given_name ?? "Unassigned"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/audits/${audit.id}`}
                          className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
