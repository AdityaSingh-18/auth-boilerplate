"use client";

import { useState } from "react";

export default function AuthFormExample() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Registration failed.");
      }

      setMessage(`Account created for ${data.user.email}`);
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3">
      <h2 className="text-lg font-semibold">Create an account</h2>

      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        className="rounded-md border p-2"
      />

      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        className="rounded-md border p-2"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black p-2 text-white disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>

      {message && <p role="status">{message}</p>}
    </form>
  );
}
