"use client";

import Image from "next/image";
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

        if (response.ok) {
          const data = await response.json();

          if (active) {
            setUser(data.user);
          }
        } else if (response.status !== 401) {
          throw new Error("Unable to check your session.");
        }
      } catch {
        if (active) {
          setError("Unable to check your sign-in status.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  function signInWithGoogle() {
    window.location.href = "/api/auth/google";
  }

  async function logout() {
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      setUser(null);
    } catch {
      setError("Unable to log out. Please try again.");
    }
  }

  if (loading) {
    return <p>Checking sign-in status...</p>;
  }

  if (user) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {user.image_url ? (
            <Image
              src={user.image_url}
              alt=""
              width={40}
              height={40}
              unoptimized
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-full"
            />
          ) : null}

          <div>
            <p className="font-medium">
              {user.name || user.email}
            </p>
            <p className="text-sm text-gray-500">
              {user.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded-md border px-4 py-2"
        >
          Sign out
        </button>

        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={signInWithGoogle}
        className="flex items-center justify-center gap-3 rounded-md border px-5 py-3 font-medium hover:bg-gray-50"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="h-5 w-5"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 1.96 13.22l7.98 6.19C11.9 13.72 17.47 9.5 24 9.5Z"
            transform="translate(0 0) scale(1)"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.94 46.98 31.82 46.98 24.55Z"
          />
          <path
            fill="#FBBC05"
            d="M9.94 28.59A14.4 14.4 0 0 1 9.17 24c0-1.59.27-3.13.77-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.38-6.19Z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.47 0 11.9-2.13 15.87-5.8l-7.73-6c-2.14 1.44-4.87 2.3-8.14 2.3-6.53 0-12.1-4.22-14.06-10.09l-7.38 6.19C7.11 42.62 15.22 48 24 48Z"
          />
        </svg>

        Continue with Google
      </button>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
