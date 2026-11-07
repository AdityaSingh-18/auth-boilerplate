import type { MetadataRoute } from "next";

import {
  authCategories,
  authMethods,
} from "@/data/auth-methods";

import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const homepage: MetadataRoute.Sitemap[number] = {
    url: absoluteUrl("/"),
    changeFrequency: "weekly",
    priority: 1,
  };

  const categoryPages: MetadataRoute.Sitemap = authCategories.map(
    (category) => ({
      url: absoluteUrl(`/categories/${category.id}`),
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  const methodPages: MetadataRoute.Sitemap = authMethods
    .filter((method) => method.status === "available")
    .map((method) => ({
      url: absoluteUrl(`/methods/${method.id}`),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [
    homepage,
    ...categoryPages,
    ...methodPages,
  ];
}
