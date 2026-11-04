"use client";

import { useEffect, useState, type FormEvent } from "react";

interface AuthUser {
  id: string;
  phone: string;
}

export default function AuthForm() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
        });

        if (!response.ok) return;

        const data = (await response.json()) as {
          user: AuthUser;
        };

        if (active) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          setError("Unable to check your session.");
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

  async function handleRequestOtp(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/auth/request-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ phone }),
        },
      );

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to send verification code.",
        );
      }

      setStep("otp");
      setMessage(
        data.message ??
          "Check your phone for the verification code.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ phone, otp }),
        },
      );

      const data = (await response.json()) as {
        user?: AuthUser;
        error?: string;
      };

      if (!response.ok || !data.user) {
        throw new Error(
          data.error ?? "Unable to verify code.",
        );
      }

      setUser(data.user);
      setOtp("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "same-origin",
        },
      );

      if (!response.ok) {
        throw new Error("Unable to log out.");
      }

      setUser(null);
      setPhone("");
      setOtp("");
      setStep("phone");
      setMessage("You have been logged out.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Checking session...
      </p>
    );
  }

  if (user) {
    return (
      <div className="w-full max-w-md space-y-4 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">
          You are signed in
        </h2>

        <p className="text-sm text-gray-600">
          {user.phone}
        </p>

        <button
          type="button"
          onClick={handleLogout}
          disabled={submitting}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Signing out..." : "Sign out"}
        </button>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-5 rounded-xl border p-6">
      <div>
        <h2 className="text-xl font-semibold">
          Sign in with your phone
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          We will send you a one-time verification code.
        </p>
      </div>

      {step === "phone" ? (
        <form
          onSubmit={handleRequestOtp}
          className="space-y-4"
        >
          <label className="block space-y-1">
            <span className="text-sm font-medium">
              Phone number
            </span>

            <input
              type="tel"
              autoComplete="tel"
              placeholder="+14155552671"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting
              ? "Sending..."
              : "Send verification code"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleVerifyOtp}
          className="space-y-4"
        >
          <p className="text-sm text-gray-600">
            Enter the six-digit code sent to {phone}.
          </p>

          <label className="block space-y-1">
            <span className="text-sm font-medium">
              Verification code
            </span>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6),
                )
              }
              required
              className="w-full rounded-lg border px-3 py-2 tracking-[0.3em]"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || otp.length !== 6}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting
              ? "Verifying..."
              : "Verify and sign in"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError("");
              setMessage("");
            }}
            className="w-full text-sm text-gray-600 underline"
          >
            Change phone number
          </button>
        </form>
      )}

      {message && (
        <p className="text-sm text-green-700">
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
