import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  getAuthMethodsByCategory,
  type AuthCategoryId,
} from "@/data/auth-methods";

import { CategoryMethodCard } from "@/components/categories/category-method-card";

interface CategoryMethodGridProps {
  categoryId: AuthCategoryId;
  categoryTitle: string;
}

export function CategoryMethodGrid({
  categoryId,
  categoryTitle,
}: CategoryMethodGridProps) {
  const methods = getAuthMethodsByCategory(categoryId);

  return (
    <section
      id="methods"
      className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-violet-300">
            EXPLORE IMPLEMENTATIONS
          </p>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {categoryTitle} authentication methods
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
            Explore the available authentication implementations in this
            category. Inspect their source code, review documentation,
            and download the boilerplate you need.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            {methods.length} methods
          </span>
        </div>
      </div>

      {methods.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((method, index) => (
            <div
              key={method.id}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500"
              style={{
                animationDelay: `${index * 70}ms`,
                animationFillMode: "both",
              }}
            >
              <CategoryMethodCard method={method} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-12 text-center">
          <h3 className="text-base font-semibold text-zinc-200">
            No methods available
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            There are currently no authentication methods in this category.
          </p>

          <Link
            href="/#catalog"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-violet-300 transition-colors hover:text-violet-200"
          >
            Browse full catalog
            <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </section>
  );
}
