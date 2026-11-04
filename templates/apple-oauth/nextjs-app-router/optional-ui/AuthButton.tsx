"use client";

import { useEffect, useState } from "react";

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  email_verified: boolean;
}

interface SessionResponse {
  user: AuthUser;
}

export function AuthButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const data = (await response.json()) as SessionResponse;

        if (!cancelled) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to load session:", error);

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function signIn() {
    window.location.assign("/api/auth/apple");
  }

  async function signOut() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout request failed.");
      }

      setUser(null);
    } catch (error) {
      console.error("Failed to log out:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <button type="button" disabled>
        Checking session...
      </button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span>
          Signed in as {user.name || user.email || "Apple user"}
        </span>

        <button
          type="button"
          onClick={signOut}
          disabled={loggingOut}
        >
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={signIn}>
      Continue with Apple
    </button>
  );
}
