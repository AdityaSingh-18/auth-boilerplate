"use client";

import { useState } from "react";
import type { AuthVariant } from "@/types/auth";

interface VariantDownloadControlsProps {
  methodId: string;
  variants: AuthVariant[];
}

type DownloadPackage = "full" | "core";

const focusClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d12]";

export function VariantDownloadControls({
  methodId,
  variants,
}: VariantDownloadControlsProps) {
  const defaultVariant =
    variants.find((variant) => variant.isDefault) ?? variants[0];

  const [selectedVariantId, setSelectedVariantId] = useState(
    defaultVariant?.id ?? "",
  );

  const [selectedPackage, setSelectedPackage] =
    useState<DownloadPackage>("full");

  if (variants.length === 0) {
    return (
      <p className="text-sm text-zinc-400" role="status">
        No downloadable variants are available yet.
      </p>
    );
  }

  const downloadUrl =
    `/api/templates/${encodeURIComponent(methodId)}/${encodeURIComponent(selectedVariantId)}/download` +
    `?package=${selectedPackage}`;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-2">
        <label
          htmlFor="template-variant"
          className="block text-sm font-medium text-zinc-300"
        >
          Implementation
        </label>

        <select
          id="template-variant"
          value={selectedVariantId}
          onChange={(event) => setSelectedVariantId(event.target.value)}
          className={`w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white transition-colors focus:border-violet-500 ${focusClasses}`}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.title}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <label
          htmlFor="template-package"
          className="block text-sm font-medium text-zinc-300"
        >
          Package
        </label>

        <select
          id="template-package"
          value={selectedPackage}
          onChange={(event) =>
            setSelectedPackage(event.target.value as DownloadPackage)
          }
          className={`w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white transition-colors focus:border-violet-500 ${focusClasses}`}
        >
          <option value="full">
            Full Package — Core + UI + README
          </option>
          <option value="core">
            Headless Core Only — Core + README
          </option>
        </select>
      </div>

      <a
        href={downloadUrl}
        className={`inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 sm:w-auto ${focusClasses}`}
      >
        Download ZIP
      </a>
    </div>
  );
}
