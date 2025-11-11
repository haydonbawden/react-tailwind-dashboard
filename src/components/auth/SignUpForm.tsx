import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon } from "../../icons";
import { useAuth } from "../../hooks/useAuth";

export default function SignUpForm() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    setError(null);
    const { error: authError } = await signUp({
      email,
      password,
      given_name: givenName,
      family_name: familyName,
      org_id: orgId || undefined,
      role: "ClientRep",
    });
    if (authError) {
      setError(authError.message ?? "Unable to register");
    } else {
      setFeedback("Registration submitted. A Castor administrator will approve your access.");
      setEmail("");
      setPassword("");
      setGivenName("");
      setFamilyName("");
      setOrgId("");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/login"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to sign in
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Request access
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Provide your organisation ABN so Castor can link your account before approval.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
              Work email
              <input
                type="email"
                value={email}
                required
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                placeholder="you@organisation.example"
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
              Password
              <input
                type="password"
                value={password}
                required
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                placeholder="Create a strong password"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
                Given name
                <input
                  value={givenName}
                  required
                  onChange={(event) => setGivenName(event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
                Family name
                <input
                  value={familyName}
                  required
                  onChange={(event) => setFamilyName(event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
              Organisation ABN
              <input
                value={orgId}
                onChange={(event) => setOrgId(event.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                placeholder="53004085616"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : "Submit registration"}
            </button>
          </form>
          {feedback ? (
            <div className="mt-4 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-800/60 dark:bg-success-900/30 dark:text-success-200">
              {feedback}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-900/30 dark:text-error-200">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
