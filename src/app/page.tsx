import type { Metadata } from "next";
import { Hero } from "@/components/layout/hero";
import { CatalogSection } from "@/components/catalog/catalog-section";

import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Authentication Boilerplates for Your Next Project",
  description:
    "Explore, inspect, and download reusable authentication implementations. From email and password to OAuth, passkeys, and enterprise SSO.",
  path: "/",
  keywords: [
    "authentication starter templates",
    "Next.js authentication boilerplates",
    "reusable authentication code",
    "authentication examples",
  ],
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <CatalogSection />
    </>
  );
}
