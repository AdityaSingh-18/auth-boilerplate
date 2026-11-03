"use client";

import { useEffect, useState, type FormEvent } from "react";

interface User {
  id: string;
  username: string;
}

type AuthMode = "register" | "login";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (active) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          setMessage("Unable to check your session.");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Authentication failed.");
        return;
      }

      setUser(data.user);
      setUsername("");
      setPassword("");
      setMessage(
        mode === "register"
          ? "Account created successfully."
          : "Logged in successfully.",
      );
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        setMessage("Unable to log out.");
        return;
      }

      setUser(null);
      setPassword("");
      setMessage("Logged out successfully.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Checking your session...</p>;
  }

  if (user) {
    return (
      <div>
        <p>Welcome, {user.username}!</p>
        <button type="button" onClick={handleLogout} disabled={loading}>
          Log out
        </button>
        {message && <p role="status">{message}</p>}
      </div>
    );
  }

  return (
    <div>
      <div>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setMessage("");
          }}
          aria-pressed={mode === "register"}
        >
          Register
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("login");
            setMessage("");
          }}
          aria-pressed={mode === "login"}
        >
          Login
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          minLength={3}
          maxLength={30}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={
            mode === "register" ? "new-password" : "current-password"
          }
          minLength={8}
          maxLength={128}
          required
        />

        <button type="submit" disabled={loading}>
          {mode === "register" ? "Create account" : "Log in"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
    </div>
  );
}
