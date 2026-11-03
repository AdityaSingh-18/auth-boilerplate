"use client";

import { useEffect, useState, type FormEvent } from "react";

interface User {
  id: string;
  email: string;
}

type AuthMode = "request" | "verify";

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data: { user?: User } = await response.json();

        if (active && data.user) {
          setUser(data.user);
          setEmail(data.user.email);
        }
      } catch {
        if (active) {
          setError("Unable to check your current session.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to request a verification code.");
      }

      setMode("verify");
      setMessage(
        data.message || "If the address can receive a code, an email will be sent.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to request a verification code.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ email, otp }),
      });

      const data: { user?: User; error?: string } = await response.json();

      if (!response.ok || !data.user) {
        throw new Error(data.error || "Unable to verify the code.");
      }

      setUser(data.user);
      setOtp("");
      setMessage("You are now signed in.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify the code.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to log out.");
      }

      setUser(null);
      setEmail("");
      setOtp("");
      setMode("request");
      setMessage("You have been signed out.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to log out.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackToEmail() {
    setMode("request");
    setOtp("");
    setError("");
    setMessage("");
  }

  if (loading) {
    return (
      <div className="w-full max-w-md rounded-xl border p-6">
        <p>Checking your session...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="w-full max-w-md space-y-4 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">You are signed in</h2>

        <p>
          Signed in as <strong>{user.email}</strong>
        </p>

        {message && (
          <p role="status" aria-live="polite" className="text-sm">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={submitting}
          className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Signing out..." : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-5 rounded-xl border p-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {mode === "request" ? "Sign in with email" : "Verify your email"}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {mode === "request"
            ? "Enter your email address and we'll send you a verification code."
            : `Enter the six-digit verification code sent to ${email}.`}
        </p>
      </div>

      {mode === "request" ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? "Sending code..." : "Send verification code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="otp" className="block text-sm font-medium">
              Verification code
            </label>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              className="w-full rounded-lg border px-3 py-2 text-center text-xl tracking-[0.5em]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || otp.length !== 6}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? "Verifying..." : "Verify and sign in"}
          </button>

          <button
            type="button"
            onClick={handleBackToEmail}
            disabled={submitting}
            className="w-full rounded-lg border px-4 py-2 disabled:opacity-50"
          >
            Change email address
          </button>
        </form>
      )}

      {message && (
        <p role="status" aria-live="polite" className="text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
