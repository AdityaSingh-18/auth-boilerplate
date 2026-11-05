"use client";

import { useState } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

type Props = {
  allowRegistration?: boolean;
};

type RegistrationOptions = Parameters<
  typeof startRegistration
>[0]["optionsJSON"];

type AuthenticationOptions = Parameters<
  typeof startAuthentication
>[0]["optionsJSON"];

async function jsonOrThrow<T>(response: Response): Promise<T> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    const errorMessage =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Request failed.";

    throw new Error(errorMessage);
  }

  return body as T;
}

export function PasskeyAuth({
  allowRegistration = false,
}: Props) {
  const [busy, setBusy] = useState<
    "register" | "signin" | null
  >(null);

  const [message, setMessage] = useState("");

  async function register() {
    if (busy !== null) return;

    setBusy("register");
    setMessage("");

    try {
      const optionsResponse = await fetch(
        "/api/auth/passkeys/register/options",
        {
          method: "POST",
          cache: "no-store",
        },
      );

      const options =
        await jsonOrThrow<RegistrationOptions>(optionsResponse);

      const credential = await startRegistration({
        optionsJSON: options,
      });

      const verifyResponse = await fetch(
        "/api/auth/passkeys/register/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credential),
        },
      );

      await jsonOrThrow<{ verified: boolean }>(verifyResponse);

      setMessage("Passkey registered successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Passkey registration failed.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function signIn() {
    if (busy !== null) return;

    setBusy("signin");
    setMessage("");

    try {
      const optionsResponse = await fetch(
        "/api/auth/passkeys/authenticate/options",
        {
          method: "POST",
          cache: "no-store",
        },
      );

      const options =
        await jsonOrThrow<AuthenticationOptions>(optionsResponse);

      const assertion = await startAuthentication({
        optionsJSON: options,
      });

      const verifyResponse = await fetch(
        "/api/auth/passkeys/authenticate/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assertion),
        },
      );

      await jsonOrThrow<{ verified: boolean }>(verifyResponse);

      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Passkey sign-in failed.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {allowRegistration && (
        <button
          type="button"
          onClick={register}
          disabled={busy !== null}
        >
          {busy === "register"
            ? "Registering…"
            : "Create a passkey"}
        </button>
      )}

      <button
        type="button"
        onClick={signIn}
        disabled={busy !== null}
      >
        {busy === "signin"
          ? "Signing in…"
          : "Sign in with a passkey"}
      </button>

      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
