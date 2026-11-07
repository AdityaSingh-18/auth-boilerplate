"use client";

import { useEffect, useState } from "react";

interface SamlUser {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string;
}

interface MeResponse {
  success: boolean;
  user?: SamlUser;
  error?: string;
}

interface SamlSignInProps {
  loginEndpoint?: string;
  logoutEndpoint?: string;
  meEndpoint?: string;
  dashboardPath?: string;
}

export default function SamlSignIn({
  loginEndpoint = "/api/auth/saml/login",
  logoutEndpoint = "/api/auth/logout",
  meEndpoint = "/api/auth/me",
  dashboardPath = "/dashboard",
}: SamlSignInProps) {
  const [user, setUser] = useState<SamlUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch(meEndpoint, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const data = (await response.json()) as MeResponse;
        if (!response.ok || !data.success || !data.user) {
          throw new Error(
            data.error || "Unable to retrieve the current user.",
          );
        }

        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setError("Unable to check your authentication status.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [meEndpoint]);

  function handleLogin() {
    setSubmitting(true);
    setError(null);

    window.location.assign(loginEndpoint);
  }

  function handleLogout() {
    setSubmitting(true);
    setError(null);

    const form = document.createElement("form");
    form.method = "POST";
    form.action = logoutEndpoint;

    document.body.appendChild(form);
    form.submit();
  }

  if (loading) {
    return (
      <div
        className="w-full rounded-xl border border-gray-200 p-6 text-center dark:border-gray-800"
        aria-live="polite"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Checking authentication status...
        </p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="w-full space-y-5 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            You are signed in
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your SAML authentication was successful.
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name || "Authenticated user"}
          </p>

          {user.email && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </p>
          )}

          <p className="mt-2 break-all text-xs text-gray-500 dark:text-gray-500">
            User ID: {user.id}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={dashboardPath}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Continue to dashboard
          </a>

          <button
            type="button"
            onClick={handleLogout}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
          >
            {submitting ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Sign in with SSO
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Continue securely using your organization&apos;s configured
          SAML Identity Provider.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleLogin}
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Redirecting..." : "Continue with SAML SSO"}
      </button>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        You will be redirected to your organization&apos;s Identity
        Provider to authenticate.
      </p>
    </div>
  );
}
