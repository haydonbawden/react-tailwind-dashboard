import { ChangeEvent, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { api } from "../../lib/api";

type PreviewRow = Record<string, string>;

const containerClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900";

function parseCsv(text: string): PreviewRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: PreviewRow = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? "").trim();
    });
    return row;
  });
}

export default function ImportDataPage() {
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus(null);
    setError(null);
    const text = await file.text();
    setRows(parseCsv(text));
  };

  const handleSubmit = async () => {
    setStatus(null);
    setError(null);
    const { error: apiError } = await api.importSeed({ rows });
    if (apiError) {
      setError(apiError.message);
    } else {
      setStatus("Import submitted to Edge Function (mock).");
    }
  };

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <>
      <PageMeta title="Bulk import" description="Import organisations and audit records" />
      <div className="space-y-6">
        <section className={containerClass}>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">CSV import</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-white/60">
            Upload CSV files for organisations, audits, or pricing updates. Data is validated via Supabase Edge Function.
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <input
              type="file"
              accept="text/csv"
              onChange={handleFileChange}
              className="block w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-700 focus:border-brand-400 focus:outline-hidden focus:ring-2 focus:ring-brand-400/40 dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:max-w-sm"
            />
            <button
              onClick={handleSubmit}
              disabled={rows.length === 0}
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Submit import
            </button>
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

        <section className={containerClass}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview</h2>
          {rows.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-white/60">No data loaded yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/40">
                  <tr>
                    {headers.map((header) => (
                      <th
                        key={header}
                        className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-white/60"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {rows.slice(0, 20).map((row, index) => (
                    <tr key={`${index}-${row[headers[0]] ?? "row"}`} className="bg-white dark:bg-gray-900">
                      {headers.map((header) => (
                        <td key={header} className="px-4 py-2 text-sm text-gray-700 dark:text-white/70">
                          {row[header] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-white/60">Showing first 20 rows of {rows.length}.</p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
