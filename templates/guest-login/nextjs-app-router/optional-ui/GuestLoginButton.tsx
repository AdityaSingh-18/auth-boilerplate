"use client";

import { useCallback, useEffect, useState } from "react";

type AuthUser = {
  id: string;
  isGuest: boolean;
  createdAt?: string;
};

type ApiResponse = {
  success: boolean;
  user?: AuthUser;
  error?: string;
  message?: string;
};

async function readApiResponse(
  response: Response
): Promise<ApiResponse> {
  const data: unknown = await response.json().catch(() => null);

  if (
    !data ||
    typeof data !== "object" ||
    !("success" in data) ||
    typeof data.success !== "boolean"
  ) {
    throw new Error("Invalid server response");
  }

  return data as ApiResponse;
}

export default function GuestLoginButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });

      if (response.status === 401) {
        setUser(null);
        return;
      }

      const data = await readApiResponse(response);

      if (!response.ok || !data.success || !data.user) {
        throw new Error(
          data.error || "Unable to retrieve the current user"
        );
      }

      setUser(data.user);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!active) {
          return;
        }

        if (response.status === 401) {
          setUser(null);
          return;
        }

        const data = await readApiResponse(response);

        if (!active) {
          return;
        }

        if (!response.ok || !data.success || !data.user) {
          throw new Error(
            data.error || "Unable to retrieve the current user"
          );
        }

        setUser(data.user);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to check your session"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  async function handleGuestLogin() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.success || !data.user) {
        throw new Error(
          data.error || "Unable to start a guest session"
        );
      }

      setUser(data.user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start a guest session"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to log out");
      }

      setUser(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log out"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        className="text-sm text-zinc-500"
        role="status"
        aria-live="polite"
      >
        Checking authentication...
      </div>
    );
  }

  return (
    <section className="w-full max-w-md space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Guest authentication
        </h2>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Try the application without creating a permanent account.
        </p>
      </div>

      {error && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}

      {user ? (
        <div className="space-y-4">
          <div className="space-y-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Session active
            </p>

            <p className="break-all text-xs text-zinc-500 dark:text-zinc-400">
              User ID: {user.id}
            </p>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                user.isGuest
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
              }`}
            >
              {user.isGuest ? "Guest account" : "Permanent account"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={submitting}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {submitting ? "Logging out..." : "Log out"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Starting guest session..." : "Continue as guest"}
        </button>
      )}

      <button
        type="button"
        onClick={() => void loadCurrentUser()}
        disabled={submitting}
        className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-100"
      >
        Refresh session
      </button>
    </section>
  );
}
