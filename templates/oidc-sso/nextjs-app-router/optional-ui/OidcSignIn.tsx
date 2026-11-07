"use client";

import { useEffect, useState } from "react";

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  user?: T;
  authorizationUrl?: string;
  error?: string;
};

async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "The request could not be completed";

    throw new Error(message);
  }

  return data as T;
}

export default function OidcSignIn() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetchJson<ApiResponse<AuthUser>>(
          "/api/auth/me",
        );

        if (!cancelled && response.success && response.user) {
          setUser(response.user);
        }
      } catch {
        // A missing session is a normal unauthenticated state.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your work email address.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetchJson<ApiResponse<AuthUser>>(
        "/api/auth/oidc/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        },
      );

      if (!response.authorizationUrl) {
        throw new Error("The identity provider URL was not returned.");
      }

      window.location.assign(response.authorizationUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start single sign-on.",
      );
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError("");
    setSubmitting(true);

    try {
      await fetchJson<{ success: boolean }>("/api/auth/logout", {
        method: "POST",
      });

      setUser(null);
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log out.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-md rounded-xl border border-zinc-200 p-6 text-sm text-zinc-600">
        Checking your session...
      </div>
    );
  }

  if (user) {
    return (
      <div className="w-full max-w-md space-y-4 rounded-xl border border-zinc-200 p-6">
        <div>
          <p className="text-sm text-zinc-500">
            Signed in with organization SSO
          </p>

          <p className="mt-1 font-medium text-zinc-900">
            {user.name || user.email}
          </p>

          <p className="text-sm text-zinc-600">{user.email}</p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={submitting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing out..." : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSignIn}
      className="w-full max-w-md space-y-4 rounded-xl border border-zinc-200 p-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">
          Sign in with your organization
        </h2>

        <p className="mt-1 text-sm text-zinc-600">
          Enter your work email to continue with your organization&apos;s identity provider.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="oidc-email"
          className="block text-sm font-medium text-zinc-700"
        >
          Work email
        </label>

        <input
          id="oidc-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          disabled={submitting}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-60"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Connecting..." : "Continue with SSO"}
      </button>

      <p className="text-xs leading-5 text-zinc-500">
        Your organization must have an administrator-configured
        OpenID Connect provider for your email domain.
      </p>
    </form>
  );
}
