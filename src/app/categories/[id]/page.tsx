import { Suspense } from "react";
import { notFound } from "next/navigation";

import {
  authCategories,
  getAuthMethodsByCategory,
} from "@/data/auth-methods";

import { CategoryHero } from "@/components/categories/category-hero";
import { CategoryMethodGrid } from "@/components/categories/category-method-grid";
import { CategoryFeatures } from "@/components/categories/category-features";

interface CategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export function generateStaticParams() {
  return authCategories.map((category) => ({
    id: category.id,
  }));
}

function CategoryPageFallback() {
  return (
    <main className="min-h-screen bg-[#080a12] px-6 py-24">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="mt-8 h-12 max-w-xl rounded bg-white/10" />
        <div className="mt-4 h-5 max-w-2xl rounded bg-white/10" />
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-48 rounded-2xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

async function CategoryPageContent({
  id,
}: {
  id: string;
}) {
  const category = authCategories.find(
    (item) => item.id === id,
  );

  if (!category) {
    notFound();
  }

  const methods = getAuthMethodsByCategory(category.id);

  return (
    <main className="min-h-screen bg-[#080a12]">
      <CategoryHero
        categoryId={category.id}
        categoryTitle={category.title}
        methodCount={methods.length}
      />

      <CategoryMethodGrid
        categoryId={category.id}
        categoryTitle={category.title}
      />

      <CategoryFeatures
        categoryId={category.id}
      />
    </main>
  );
}

export default function CategoryPage({
  params,
}: CategoryPageProps) {
  return (
    <Suspense fallback={<CategoryPageFallback />}>
      {params.then(({ id }) => (
        <CategoryPageContent id={id} />
      ))}
    </Suspense>
  );
}
