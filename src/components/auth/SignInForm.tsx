import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ChevronLeftIcon } from "../../icons";
import { useAuth } from "../../hooks/useAuth";

export default function SignInForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { error: authError } = await signIn({ email, password });
    if (authError) {
      setError(authError.message ?? "Unable to sign in");
      setIsSubmitting(false);
      return;
    }

    const redirect = (location.state as { from?: string } | null)?.from ?? "/";
    navigate(redirect, { replace: true });
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign in
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use your Castor credentials. Client representatives require admin approval before first login.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-2 text-xs font-medium text-gray-600 dark:text-white/70">
              Email
              <input
                type="email"
                value={email}
                required
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                placeholder="sasha.nguyen@castor.example"
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
                placeholder="Enter your password"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          {error ? (
            <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800/60 dark:bg-error-900/30 dark:text-error-200">
              {error}
            </div>
          ) : null}
          <div className="mt-5 text-sm text-gray-700 dark:text-gray-400">
            <p>
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Register your organisation
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
