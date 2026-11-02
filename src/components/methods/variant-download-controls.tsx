"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import type { AuthVariant } from "@/types/auth";

interface VariantDownloadControlsProps {
  methodId: string;
  variants: AuthVariant[];
}

export function VariantDownloadControls({
  methodId,
  variants,
}: VariantDownloadControlsProps) {
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];

  const [selectedVariantId, setSelectedVariantId] = useState(
    defaultVariant?.id ?? "",
  );

  const downloadUrl = selectedVariantId
    ? `/api/templates/${encodeURIComponent(methodId)}/${encodeURIComponent(selectedVariantId)}/download`
    : undefined;

  if (variants.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-zinc-300">
          No downloadable variant yet
        </p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          A template for this authentication method is not available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <label
          htmlFor="template-variant"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400"
        >
          Implementation
        </label>

        <div className="relative">
          <select
            id="template-variant"
            value={selectedVariantId}
            onChange={(event) => setSelectedVariantId(event.target.value)}
            className="w-full appearance-none rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 pr-10 text-sm font-medium text-zinc-100 outline-none transition-colors hover:border-violet-400/30 focus:border-violet-400"
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.title}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
        </div>
      </div>

      <a
        href={downloadUrl}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
      >
        <Download size={16} aria-hidden="true" />
        Download ZIP
      </a>
    </div>
  );
}
