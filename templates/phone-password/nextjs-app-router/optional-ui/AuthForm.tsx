"use client";

import { useEffect, useState, type FormEvent } from "react";

interface User {
  id: string;
  phone: string;
}

export default function AuthForm() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Checks whether a user already has an active session.
  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
        });

        if (!active) return;

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch {
        if (active) {
          setError("Unable to check your session.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  // Handles registration and login.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const endpoint = isRegistering
        ? "/api/auth/register"
        : "/api/auth/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed.");
        return;
      }

      setUser(data.user);
      setPhone("");
      setPassword("");
      setMessage(
        isRegistering
          ? "Registration successful."
          : "Login successful.",
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Logs out the current user.
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
        setError(data.error || "Unable to log out.");
        return;
      }

      setUser(null);
      setPhone("");
      setPassword("");
      setMessage("Logout successful.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p>Checking authentication...</p>;
  }

  if (user) {
    return (
      <div>
        <h2>Welcome!</h2>
        <p>Phone: {user.phone}</p>

        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}

        <button
          type="button"
          onClick={handleLogout}
          disabled={submitting}
        >
          {submitting ? "Logging out..." : "Logout"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>
        {isRegistering ? "Create an account" : "Sign in"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+919876543210"
            autoComplete="tel"
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete={
              isRegistering ? "new-password" : "current-password"
            }
            minLength={8}
            maxLength={128}
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}

        <button type="submit" disabled={submitting}>
          {submitting
            ? "Please wait..."
            : isRegistering
              ? "Register"
              : "Login"}
        </button>
      </form>

      <button
        type="button"
        disabled={submitting}
        onClick={() => {
          setIsRegistering((previous) => !previous);
          setError("");
          setMessage("");
        }}
      >
        {isRegistering
          ? "Already have an account? Login"
          : "Need an account? Register"}
      </button>
    </div>
  );
}
