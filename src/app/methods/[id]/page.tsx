import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

import {
  authCategories,
  getAuthMethodById,
} from "@/data/auth-methods";
import { listTemplateVariants } from "@/lib/templates";
import { VariantDownloadControls } from "@/components/methods/variant-download-controls";

export const instant = false;

interface MethodPageProps {
  params: Promise<{
    id: string;
  }>;
}

const statusStyles = {
  available:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  "in-progress":
    "border-amber-400/20 bg-amber-400/10 text-amber-300",
  planned:
    "border-zinc-400/20 bg-zinc-400/10 text-zinc-400",
} as const;

const statusLabels = {
  available: "Available",
  "in-progress": "In Progress",
  planned: "Planned",
} as const;

export default async function MethodPage({
  params,
}: MethodPageProps) {
  const { id } = await params;

  const method = getAuthMethodById(id);

  if (!method) {
    notFound();
  }

  const category = authCategories.find(
    (item) => item.id === method.categoryId,
  );

  const variants = await listTemplateVariants(method.id);

  return (
    <main className="min-h-screen px-5 pb-24 pt-12 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex flex-wrap items-center gap-2 text-sm text-zinc-500"
        >
          <Link
            href="/"
            className="transition-colors hover:text-violet-300"
          >
            Home
          </Link>

          <ChevronRight size={14} aria-hidden="true" />

          <Link
            href="/#catalog"
            className="transition-colors hover:text-violet-300"
          >
            Catalog
          </Link>

          {category && (
            <>
              <ChevronRight size={14} aria-hidden="true" />
              <Link
                href={`/#${category.id}`}
                className="transition-colors hover:text-violet-300"
              >
                {category.title}
              </Link>
            </>
          )}

          <ChevronRight size={14} aria-hidden="true" />

          <span className="text-zinc-300">{method.title}</span>
        </nav>

        {/* Method header */}
        <section>
          <Link
            href="/#catalog"
            className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-violet-300"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to catalog
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {category && (
              <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400">
                {category.title}
              </span>
            )}

            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles[method.status]}`}
            >
              {statusLabels[method.status]}
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {method.title}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            {method.description}
          </p>
        </section>

        {/* Variant and download */}
        <section className="mt-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-7">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">
              Choose your implementation
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Select a framework variant and download its complete
              boilerplate to integrate into your project.
            </p>
          </div>

          <VariantDownloadControls
            methodId={method.id}
            variants={variants}
          />

          {variants.length > 0 && (
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              The ZIP includes the selected variant folder, including
              its README, core implementation, and optional UI files.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
