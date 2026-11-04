"use client";

import { FormEvent, useEffect, useState } from "react";

interface AuthUser {
  id: string;
  email: string;
}

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        return data.user as AuthUser;
      })
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setError("Unable to check your current session.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleRequestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to request a sign-in link.");
      }

      setMessage(data.message || "Check your inbox for your sign-in link.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to log out.");
      setUser(null);
      setMessage("You have been logged out.");
    } catch {
      setError("Unable to log out. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Checking session...</p>;
  }

  if (user) {
    return (
      <div className="space-y-4 rounded-xl border p-6">
        <p className="text-sm">Signed in as <strong>{user.email}</strong></p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={submitting}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Signing out..." : "Sign out"}
        </button>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {message && <p role="status" className="text-sm text-green-700">{message}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleRequestLink} className="max-w-md space-y-4 rounded-xl border p-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Sign in with email</h2>
        <p className="text-sm text-gray-500">
          We&apos;ll email you a secure link to sign in. No password required.
        </p>
      </div>

      <label htmlFor="magic-link-email" className="block space-y-2 text-sm font-medium">
        Email address
        <input
          id="magic-link-email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border px-3 py-2 font-normal"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Sending link..." : "Email me a sign-in link"}
      </button>

      {message && <p role="status" className="text-sm text-green-700">{message}</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
