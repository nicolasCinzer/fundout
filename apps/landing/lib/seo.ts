import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundout.app";

export type Locale = "en" | "es";

interface BuildMetadataParams {
  locale: Locale;
  /** Canonical pathname (English key), e.g. "/how-it-works" or "" for home */
  pathname: string;
  title: string;
  description: string;
  /** Absolute URL — falls back to undefined (inherits parent OG image) */
  ogImage?: string;
}

/**
 * Builds the full Next.js Metadata object for a page, including:
 * - Unique title / description
 * - Canonical link
 * - hreflang alternates (en, es, x-default → EN)
 * - Open Graph
 * - Twitter card
 */
export function buildMetadata({
  locale,
  pathname,
  title,
  description,
  ogImage,
}: BuildMetadataParams): Metadata {
  const suffix = pathname === "" ? "" : pathname;
  const canonical = `${SITE}/${locale}${suffix}`;
  const enUrl = `${SITE}/en${suffix}`;
  const esUrl = `${SITE}/es${suffix}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: enUrl,
        es: esUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** JSON-LD schema for the home page */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Fundout",
    url: SITE,
    logo: `${SITE}/logo.png`,
    description:
      "Propfirm trading analytics. It's not your trading. It's just math.",
    sameAs: [],
  };
}

/** JSON-LD schema for a blog post page */
export function buildArticleJsonLd({
  title,
  description,
  publishedAt,
  updatedAt,
  url,
  author,
}: {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  url: string;
  author: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    url,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "Fundout",
      url: SITE,
    },
  };
}

/** JSON-LD BreadcrumbList helper */
export function buildBreadcrumbJsonLd(
  crumbs: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
