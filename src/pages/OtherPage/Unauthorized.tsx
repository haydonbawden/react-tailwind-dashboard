import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function Unauthorized() {
  return (
    <>
      <PageMeta title="Access restricted" description="You do not have permission to view this page" />
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-error-50 px-4 py-1 text-sm font-semibold text-error-600 dark:bg-error-500/10 dark:text-error-200">
          Permission denied
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">You need additional permissions</h1>
        <p className="max-w-xl text-sm text-gray-500 dark:text-white/60">
          Contact a Castor administrator to request the required role. The action you attempted is only available to specific
          user groups.
        </p>
        <Link
          to="/"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          Return to dashboard
        </Link>
      </div>
    </>
  );
}
