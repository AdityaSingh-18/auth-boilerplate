
"use client";

import { useEffect, useState, type FormEvent } from "react";

interface User {
  id: string;
  email: string;
}

type AuthMode = "register" | "login";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
        }
      } catch {
        // No active session or unable to reach the API.
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Authentication failed.");
      }

      setUser(data.user);
      setPassword("");
      setMessage(
        mode === "register"
          ? "Account created successfully."
          : "Logged in successfully.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkSession() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (!response.ok) {
        setUser(null);
        throw new Error(data.error ?? "No active session.");
      }

      setUser(data.user);
      setMessage("Session is active.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to check session.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to log out.");
      }

      setUser(null);
      setPassword("");
      setMessage(data.message);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to log out.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md space-y-5 rounded-xl border p-6">
      <div>
        <h2 className="text-xl font-semibold">Email & Password</h2>
        <p className="mt-1 text-sm text-gray-500">
          Reference authentication form
        </p>
      </div>

      {loading && !user ? (
        <p className="text-sm text-gray-500">Checking your session...</p>
      ) : user ? (
        <div className="space-y-4">
          <p className="text-sm">
            Signed in as <strong>{user.email}</strong>
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={checkSession}
              disabled={loading}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            >
              Check session
            </button>

            <button
              type="button"
              onClick={logout}
              disabled={loading}
              className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Log out
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-md px-3 py-2 text-sm ${
                mode === "register" ? "bg-black text-white" : "border"
              }`}
            >
              Register
            </button>

            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-md px-3 py-2 text-sm ${
                mode === "login" ? "bg-black text-white" : "border"
              }`}
            >
              Log in
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1 text-sm">
              <span>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span>Password</span>
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : mode === "register"
                  ? "Create account"
                  : "Log in"}
            </button>
          </form>
        </>
      )}

      {message && (
        <p role="status" className="text-sm text-gray-600">
          {message}
        </p>
      )}
    </section>
  );
}
