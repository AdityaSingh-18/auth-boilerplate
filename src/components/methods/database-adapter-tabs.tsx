"use client";

import { useState } from "react";
import type { DatabaseAdapterExample } from "@/types/auth";

interface HighlightedAdapter extends DatabaseAdapterExample {
  highlightedCode: string;
}

interface DatabaseAdapterTabsProps {
  adapters: HighlightedAdapter[];
}

const focusClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d12]";

export function DatabaseAdapterTabs({
  adapters,
}: DatabaseAdapterTabsProps) {
  const [selectedId, setSelectedId] = useState(adapters[0]?.id);

  const activeAdapter = adapters.find(
      (adapter) => adapter.id === selectedId
    ) ?? adapters[0];

  if (!activeAdapter) return null;

  const activeId = activeAdapter.id;

  return (
    <section
      aria-labelledby="database-adapters-heading"
      className="mt-6 space-y-5"
    >
      <div>
        <h3
          id="database-adapters-heading"
          className="text-xl font-semibold text-white"
        >
          Database adapters
        </h3>

        <p className="mt-1 text-sm text-zinc-400">
          Choose a database implementation for the AuthDatabase interface.
        </p>
      </div>

      <div
        role="group"
        aria-label="Database adapter selection"
        className="flex gap-2 overflow-x-auto border-b border-white/10"
      >
        {adapters.map((adapter) => {
          const isActive = activeId === adapter.id;

          return (
            <button
              key={adapter.id}
              type="button"
              onClick={() => setSelectedId(adapter.id)}
              aria-pressed={isActive}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm transition-colors ${focusClasses} ${
                isActive
                  ? "border-violet-500 text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {adapter.label}
            </button>
          );
        })}
      </div>

      <div className="min-w-0 space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-zinc-300">
              {activeAdapter.description}
            </p>

            <span
              className={`rounded-md px-2 py-1 text-xs ${
                activeAdapter.implemented
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-amber-500/10 text-amber-300"
              }`}
            >
              {activeAdapter.implemented
                ? "Implemented"
                : "Reference example"}
            </span>
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>Install:</span>
            <code className="max-w-full overflow-x-auto rounded bg-white/5 px-2 py-1 text-zinc-300">
              pnpm add {activeAdapter.packageName}
            </code>
          </p>

          <div className="mt-2">
            <p className="text-xs text-zinc-500">
              Required environment variables:
            </p>

            {activeAdapter.envVariables.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {activeAdapter.envVariables.map((variable) => (
                  <code
                    key={variable}
                    className="break-all rounded bg-white/5 px-2 py-1 text-xs text-zinc-300"
                  >
                    {variable}
                  </code>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">
                None documented.
              </p>
            )}
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-xs text-zinc-500">
              Database setup
            </p>

            <pre className="max-w-full overflow-x-auto rounded-lg border border-white/10 bg-zinc-900 p-4 text-sm leading-6 text-zinc-300">
              <code>{activeAdapter.setup}</code>
            </pre>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-zinc-900 px-4 py-3">
            <span className="text-xs text-zinc-400">
              auth-db.ts
            </span>

            <span className="shrink-0 text-xs text-violet-300">
              DB Adapter
            </span>
          </div>

          <div
            className="max-h-[560px] min-w-0 overflow-auto text-sm [&_pre]:min-w-0 [&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:leading-6"
            dangerouslySetInnerHTML={{
              __html: activeAdapter.highlightedCode,
            }}
          />
        </div>
      </div>
    </section>
  );
}
