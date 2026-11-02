"use client";

import { useState } from "react";
import type { DatabaseAdapterExample } from "@/data/template-docs/email-password-adapters";

interface HighlightedAdapter extends DatabaseAdapterExample {
  highlightedCode: string;
}

interface DatabaseAdapterTabsProps {
  adapters: HighlightedAdapter[];
}

export function DatabaseAdapterTabs({
  adapters,
}: DatabaseAdapterTabsProps) {
  const [activeId, setActiveId] = useState(adapters[0]?.id);

  const activeAdapter = adapters.find(
    (adapter) => adapter.id === activeId,
  );

  if (!activeAdapter) return null;

  return (
    <section className="space-y-5 mt-6">
      <div>
        <h3 className="text-xl font-semibold text-white">
          Database adapters
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          Choose a database implementation for the AuthDatabase interface.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-white/10">
        {adapters.map((adapter) => (
          <button
            key={adapter.id}
            type="button"
            onClick={() => setActiveId(adapter.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm transition ${
              activeId === adapter.id
                ? "border-violet-500 text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            {adapter.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-zinc-300">
            {activeAdapter.description}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Install:{" "}
            <code className="rounded bg-white/5 px-2 py-1 text-zinc-300">
              pnpm add {activeAdapter.packageName}
            </code>
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Required environment variables:{" "}
            {activeAdapter.envVariables.join(", ")}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Database setup: {activeAdapter.setup}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900 px-4 py-3">
            <span className="text-xs text-zinc-400">auth-db.ts</span>
            <span className="text-xs text-violet-300">DB Adapter</span>
          </div>

          <div
            className="max-h-[560px] overflow-auto text-sm [&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:leading-6"
            dangerouslySetInnerHTML={{
              __html: activeAdapter.highlightedCode,
            }}
          />
        </div>
      </div>
    </section>
  );
}
