import Link from "next/link";
import { ArrowDown, ArrowRight, CheckCircle2 } from "lucide-react";

import type { AuthCategoryId } from "@/data/auth-methods";
import { categoryContent } from "@/data/category-content";
import { CategoryVisual } from "@/components/categories/category-visual";

interface CategoryHeroProps {
  categoryId: AuthCategoryId;
  categoryTitle: string;
  methodCount: number;
}

const focusClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08070e]";

export function CategoryHero({
  categoryId,
  categoryTitle,
  methodCount,
}: CategoryHeroProps) {
  const content = categoryContent[categoryId];

  return (
    <section
      aria-labelledby="category-hero-title"
      className="relative isolate overflow-hidden border-b border-white/[0.08]"
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-48 left-1/4 size-[30rem] rounded-full bg-violet-600/[0.10] blur-[120px]" />
        <div className="absolute right-0 top-40 size-80 rounded-full bg-indigo-500/[0.07] blur-[110px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* Category introduction */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-violet-400"
            />
            <span className="text-[10px] font-bold tracking-[0.14em] text-violet-300">
              {content.eyebrow}
            </span>
          </div>

          <p className="mt-7 text-sm font-medium text-zinc-500">
            Authentication / {categoryTitle}
          </p>

          <h1
            id="category-hero-title"
            className="mt-4 max-w-5xl text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl"
          >
            {content.title}
          </h1>

          <p className="mt-6 max-w-4xl text-base leading-8 text-zinc-400 sm:text-lg">
            {content.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="#methods"
              className={`inline-flex items-center gap-2 rounded-lg bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-400 ${focusClasses}`}
            >
              Explore {categoryTitle}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>

            <Link
              href="/#credentials"
              className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white ${focusClasses}`}
            >
              View full catalog
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2
                size={14}
                className="text-violet-300"
                aria-hidden="true"
              />
              Inspect implementation code
            </span>

            <span className="inline-flex items-center gap-2">
              <CheckCircle2
                size={14}
                className="text-violet-300"
                aria-hidden="true"
              />
              Download reusable boilerplates
            </span>
          </div>

          <div className="mt-10 flex items-center gap-3 border-t border-white/[0.08] pt-6">
            <div className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
              <span className="text-lg font-bold text-violet-300">
                {methodCount}
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-200">
                Authentication methods
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Available in this category
              </p>
            </div>
          </div>
        </div>

        {/* Category visual */}
        <div className="relative animate-in fade-in zoom-in-95 duration-700">
          <CategoryVisual categoryId={categoryId} />
        </div>
      </div>

      {/* Introduction strip */}
      <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 sm:pb-16">
        <div className="flex flex-col gap-4 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold tracking-[0.16em] text-violet-300">
              ABOUT THIS CATEGORY
            </p>

            <p className="mt-3 text-sm leading-7 text-zinc-400 sm:text-base">
              {content.introduction}
            </p>
          </div>

          <Link
            href="#features"
            className={`inline-flex shrink-0 items-center gap-2 text-xs font-medium text-zinc-400 transition-colors hover:text-violet-300 ${focusClasses}`}
          >
            Discover features
            <ArrowDown size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
