const registrationContract = {
  endpoint: "POST /api/auth",
  description: "Registers a user with an email address and password.",
  request: {
    contentType: "application/json",
    body: {
      email: "user@example.com",
      password: "your-password",
    },
  },
  responses: [
    {
      status: 201,
      description: "User registered successfully.",
      body: {
        user: {
          id: "user_123",
          email: "user@example.com",
        },
      },
    },
    {
      status: 400,
      description: "Invalid input or registration failed.",
      body: {
        error: "Email and password are required.",
      },
    },
  ],
};

export function ApiContractSection() {
  return (
    <section className="space-y-5 mt-6">
      <div>
        <h3 className="text-xl font-semibold text-white">
          API request &amp; response contract
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          Use this JSON contract when connecting a custom registration UI.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-md bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-400">
              POST
            </span>
            <code className="text-sm text-zinc-200">
              /api/auth
            </code>
          </div>

          <p className="mb-3 text-xs text-zinc-400">
            Request body · application/json
          </p>

          <pre className="overflow-x-auto rounded-lg bg-black/30 p-4 text-sm leading-6 text-zinc-300">
            {JSON.stringify(registrationContract.request.body, null, 2)}
          </pre>
        </div>

        {registrationContract.responses.map((response) => (
          <div
            key={response.status}
            className="rounded-xl border border-white/10 bg-zinc-900 p-4"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-200">
                {response.status}
              </span>
              <p className="text-sm text-zinc-400">
                {response.description}
              </p>
            </div>

            <pre className="overflow-x-auto rounded-lg bg-black/30 p-4 text-sm leading-6 text-zinc-300">
              {JSON.stringify(response.body, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
