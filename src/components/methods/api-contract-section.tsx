import type { ApiPayloadContract } from "@/types/auth";

interface ApiContractSectionProps {
  contracts: ApiPayloadContract[];
}

function PayloadExample({
  title,
  payload,
}: {
  title: string;
  payload?: ApiPayloadContract["request"];
}) {
  if (!payload) return null;

  const content =
    payload.example !== undefined
      ? JSON.stringify(payload.example, null, 2)
      : payload.typeDefinition;

  if (!payload.description && !content) return null;

  return (
    <div className="min-w-0">
      <p className="mb-2 text-[15px] text-zinc-200">{title}</p>

      {payload.description && (
        <p className="mb-3 text-sm text-zinc-400">
          {payload.description}
        </p>
      )}

      {content && (
        <pre className="max-w-full overflow-x-auto rounded-lg bg-black/30 p-4 text-sm leading-6 text-zinc-300">
          <code>{content}</code>
        </pre>
      )}
    </div>
  );
}

export function ApiContractSection({
  contracts,
}: ApiContractSectionProps) {
  if (contracts.length === 0) return null;

  return (
    <section
      aria-labelledby="api-contracts-heading"
      className="mt-6 space-y-5"
    >
      <div>
        <h3
          id="api-contracts-heading"
          className="text-xl font-semibold text-white"
        >
          API request &amp; response contracts
        </h3>

        <p className="mt-1 text-sm text-zinc-400">
          Reference the following API contracts when connecting a custom
          authentication UI.
        </p>
      </div>

      <div className="space-y-4">
        {contracts.map((contract, index) => (
          <article
            key={`${contract.method}-${contract.endpoint}-${index}`}
            className="min-w-0 space-y-4 rounded-xl border border-white/10 bg-zinc-900 p-4"
          >
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="shrink-0 rounded-md bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-400">
                  {contract.method}
                </span>

                <code className="min-w-0 break-all text-sm text-zinc-200">
                  {contract.endpoint}
                </code>
              </div>

              <p className="text-sm text-zinc-400">
                {contract.description}
              </p>
            </div>

            <PayloadExample
              title="Request"
              payload={contract.request}
            />

            <PayloadExample
              title="Response"
              payload={contract.response}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
