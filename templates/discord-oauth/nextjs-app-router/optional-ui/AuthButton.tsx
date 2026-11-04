"use client";

import { useEffect, useState } from "react";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image_url: string | null;
  email_verified: boolean;
}

export default function AuthButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) setUser(null);
          return;
        }

        const data: { user?: AuthUser } = await response.json();

        if (active) {
          setUser(data.user ?? null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  function handleSignIn() {
    window.location.assign("/api/auth/discord");
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
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

  if (!user) {
    return (
      <button type="button" onClick={handleSignIn}>
        Continue with Discord
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image_url}
          alt=""
          width={36}
          height={36}
          className="rounded-full"
        />
      ) : null}

      <div className="min-w-0">
        <p className="truncate font-medium">
          {user.name ?? user.email}
        </p>
        <p className="truncate text-sm text-gray-500">{user.email}</p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}