import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

import {
  authCategories,
  getAuthMethodById,
} from "@/data/auth-methods";

import {
  loadTemplateFiles,
  listTemplateVariants,
} from "@/lib/templates";

import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { VariantDownloadControls } from "@/components/methods/variant-download-controls";
import { SourceCodeSection } from "@/components/methods/source-code-section";
import { FileOverview } from "@/components/methods/file-overview";
import { DatabaseAdapterSection } from "@/components/methods/database-adapter-section";
import { ApiContractSection } from "@/components/methods/api-contract-section";

import { methodDocumentation } from "@/data/template-docs";

import { createPageMetadata, absoluteUrl } from "@/lib/seo";

export const instant = false;

interface MethodPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: MethodPageProps): Promise<Metadata> {
  const { id } = await params;

  const method = getAuthMethodById(id);
  if (!method) {
    return createPageMetadata({
      title: "Authentication Method Not Found",
      description:
        "The requested authentication method could not be found.",
      path: `/methods/${id}`,
      index: false,
    });
  }

  const category = authCategories.find(
    (item) => item.id === method.categoryId,
  );

  const methodDocs = methodDocumentation[method.id];
  const documentation = methodDocs?.documentation;

  const documentationKeywords = [
    ...(documentation?.files?.map((file) => file.path) ?? []),
    ...(documentation?.functions?.map((fn) => fn.name) ?? []),
    ...(methodDocs?.databaseAdapters?.map((adapter) => adapter.label) ?? []),
  ];

  return createPageMetadata({
    title: `${method.title} Authentication Boilerplate`,
    description: method.description,
    path: `/methods/${method.id}`,
    keywords: [
      method.title,
      `${method.title} authentication`,
      `${method.title} boilerplate`,
      "Next.js App Router",
      ...(category ? [category.title] : []),
      ...documentationKeywords,
    ],
    index: method.status === "available",
  });
}

export default async function MethodPage({
  params,
}: MethodPageProps) {
  const { id } = await params;

  const method = getAuthMethodById(id);
  if (!method) {
    notFound();
  }

  const methodDocs = methodDocumentation[method.id];
  const documentation = methodDocs?.documentation;
  const databaseAdapters = methodDocs?.databaseAdapters ?? [];

  const category = authCategories.find(
    (item) => item.id === method.categoryId,
  );

  const variants = await listTemplateVariants(method.id);
  const defaultVariant = variants.find((variant) => variant.isDefault) ?? variants[0];

  const files = defaultVariant
    ? await loadTemplateFiles(method.id, defaultVariant.id)
    : [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-12 sm:px-8">
      <BreadcrumbJsonLd
        items={[
          {
            name: "Home",
            url: absoluteUrl("/"),
          },
          {
            name: "Catalog",
            url: absoluteUrl("/#catalog"),
          },
          ...(category
            ? [
                {
                  name: category.title,
                  url: absoluteUrl(`/categories/${category.id}`),
                },
              ]
            : []),
          {
            name: method.title,
            url: absoluteUrl(`/methods/${method.id}`),
          },
        ]}
      />
      <div className="mx-auto max-w-6xl">
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
                href={`/categories/${category.id}`}
                className="transition-colors hover:text-violet-300"
              >
                {category.title}
              </Link>
            </>
          )}

          <ChevronRight size={14} aria-hidden="true" />

          <span className="text-zinc-300">
            {method.title}
          </span>
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

          <div>
            {category && (
              <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400">
                {category.title}
              </span>
            )}
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {method.title}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            {method.description}
          </p>
        </section>

        {/* Variant and download */}
        {variants.length > 0 && (
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

            <p className="mt-4 text-xs leading-5 text-zinc-500">
              The ZIP includes the selected variant folder, including its
              README, core implementation, and optional UI files.
            </p>
          </section>
        )}

        <SourceCodeSection files={files} />

        {documentation && <FileOverview documentation={documentation} />}

        {databaseAdapters.length > 0 && <DatabaseAdapterSection adapters={databaseAdapters} />}

        {methodDocs?.apiContracts && <ApiContractSection contracts={methodDocs.apiContracts} />}
      </div>
    </main>
  );
}
