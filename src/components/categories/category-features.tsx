import {
  Fingerprint,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import { categoryContent } from "@/data/category-content";
import type { AuthCategoryId } from "@/data/auth-methods";

interface CategoryFeaturesProps {
  categoryId: AuthCategoryId;
}

const featureIcons = [
  ShieldCheck,
  Fingerprint,
  Layers3,
];

export function CategoryFeatures({
  categoryId,
}: CategoryFeaturesProps) {
  const content = categoryContent[categoryId];

  return (
    <section
      id="features"
      aria-labelledby="category-features-heading"
      className="scroll-mt-24 border-t border-white/10 bg-[#080a12] px-5 py-20 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
            What you can explore
          </p>

          <h2
            id="category-features-heading"
            className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            Understand the implementation,
            <span className="text-violet-400">
              {" "}not just the interface.
            </span>
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-400">
            Explore the concepts and implementation details behind{" "}
            {content.title.toLowerCase()}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {content.features.map((feature, index) => {
            const Icon = featureIcons[index] ?? ShieldCheck;

            return (
              <article
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.05]"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300 transition duration-300 group-hover:border-violet-400/40 group-hover:bg-violet-400/15">
                  <Icon size={22} aria-hidden="true" />
                </div>

                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
