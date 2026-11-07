import type { Metadata } from "next";

export const SITE_NAME = "Auth Boilerplate";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const DEFAULT_TITLE =
  "Auth Boilerplate — Authentication Implementations";

export const DEFAULT_DESCRIPTION =
  "Explore, inspect, and download reusable authentication implementations. From email and password to OAuth, passkeys, and enterprise SSO.";

export const DEFAULT_KEYWORDS = [
  "authentication boilerplates",
  "Next.js authentication",
  "authentication templates",
  "Next.js auth",
  "OAuth implementation",
  "passwordless authentication",
  "passkey authentication",
  "enterprise SSO",
  "authentication source code",
];

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${SITE_URL}${normalizedPath}`;
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  image = "/opengraph-image",
  index = true,
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string;
  index?: boolean;
}): Metadata {
  const canonicalUrl = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    keywords: [...DEFAULT_KEYWORDS, ...keywords],

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${title}`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },

    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
      },
    },
  };
}