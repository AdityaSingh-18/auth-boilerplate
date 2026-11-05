"use client";

import { useEffect, useState } from "react";

interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
  emailVerified: boolean;
}

export function AuthButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401) {
          if (!cancelled) setUser(null);
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load the current user.");
        }

        const data: { user: AuthUser } = await response.json();

        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to check your authentication status.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  function signIn() {
    window.location.assign("/api/auth/x");
  }

  async function signOut() {
    setSigningOut(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Sign-out failed.");
      }

      setUser(null);
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-400"
      >
        Loading...
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {user ? (
        <>
          <div className="flex items-center gap-3">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt=""
                className="h-9 w-9 rounded-full"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm text-white">
                {(user.name?.[0] ?? "X").toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-white">
                {user.name ?? "Signed in with X"}
              </p>
              <p className="text-xs text-zinc-400">
                Connected to X
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5 disabled:opacity-50"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={signIn}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Continue with X
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
