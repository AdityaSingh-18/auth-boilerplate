"use client";

import { useState } from "react";
import {
  authCategories,
  authMethods,
  type AuthCategoryId,
  type AuthMethodStatus,
} from "@/data/auth-methods";

type CategoryFilter = "all" | AuthCategoryId;
type StatusFilter = "all" | AuthMethodStatus;

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All Statuses" },
  { id: "available", label: "Available" },
  { id: "in-progress", label: "In Progress" },
  { id: "planned", label: "Planned" },
];

export function CatalogSection() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");

  const filteredMethods = authMethods.filter((method) => {
    const matchesCategory = activeCategory === "all" || method.categoryId === activeCategory;
    const matchesStatus = activeStatus === "all" || method.status === activeStatus;

    return matchesCategory && matchesStatus;
  });

  function resetFilters() {
    setActiveCategory("all");
    setActiveStatus("all");
  }

  return (
    <section
      id="catalog"
      className="mx-auto max-w-7xl border-t border-white/[0.08] px-5 py-20 sm:px-8"
    >
      <p className="text-[10px] font-bold tracking-[0.16em] text-violet-300">
        THE CATALOG
      </p>

      <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
        Your authentication starting point.
      </h2>

      <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-400">
        Browse reusable implementations by authentication method.
        Filter by category and implementation status to find what
        you need.
      </p>
      
      <div className="mt-10">
        {/* Category tabs */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by authentication category"
        >
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            aria-pressed={activeCategory === "all"}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === "all"
                ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            All
            <span className="ml-2 text-xs opacity-60">
              {authMethods.length}
            </span>
          </button>

          {authCategories.map((category) => {
            const count = authMethods.filter((method) => 
              method.categoryId === category.id
            ).length;

            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={isActive}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {category.title}
                <span className="ml-2 text-xs opacity-60">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status filters and result count */}
        <div className="mt-6 flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter by implementation status"
          >
            <span className="mr-1 text-xs font-medium text-zinc-500">
              Status:
            </span>

            {statusFilters.map((status) => {
              const isActive = activeStatus === status.id;

              return (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => setActiveStatus(status.id)}
                  aria-pressed={isActive}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
                  }`}
                >
                  {status.label}
                </button>
              );
            })}
          </div>

          <p
            className="text-xs text-zinc-500"
            aria-live="polite"
            aria-atomic="true"
          >
            Showing{" "}
            <span className="font-semibold text-zinc-300">
              {filteredMethods.length}
            </span>{" "}
            of {authMethods.length} methods
          </p>
        </div>

        {/* Filtered results */}
        {filteredMethods.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            {filteredMethods.map((method) => (
              <li
                key={method.id}
                className="text-sm text-zinc-400"
              >
                {method.title}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center">
            <h3 className="text-base font-semibold text-zinc-200">
              No methods found
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              No authentication methods match the selected filters.
              Try changing your category or status.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/20"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
