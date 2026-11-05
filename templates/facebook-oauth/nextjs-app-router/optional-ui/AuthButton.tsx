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
  user: AuthUser | null;
}

export default function AuthButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
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
      } catch {
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

  function handleSignIn() {
    window.location.assign("/api/auth/facebook");
  }

  async function handleSignOut() {
    setSigningOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to sign out.");
      }

      setUser(null);
    } catch {
      window.alert("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
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
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-medium">
            {user.name || "Facebook user"}
          </p>

          {user.email && (
            <p className="text-sm text-gray-500">
              {user.email}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="rounded-md border px-4 py-2 disabled:opacity-50"
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="rounded-md bg-[#1877F2] px-4 py-2 font-medium text-white hover:bg-[#166FE5]"
    >
      Continue with Facebook
    </button>
  );
}
