import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { posts } from "#content";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundout.app";

const STATIC_ROUTES = [
  "/",
  "/how-it-works",
  "/pricing",
  "/about",
  "/privacy",
  "/terms",
  "/blog",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages × locales
  for (const locale of routing.locales) {
    for (const route of STATIC_ROUTES) {
      const suffix = route === "/" ? "" : route;
      entries.push({
        url: `${SITE}/${locale}${suffix}`,
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${SITE}/${l}${suffix}`])
          ),
        },
      });
    }
  }

  // Blog posts (already contain locale in permalink)
  for (const post of posts.filter((p) => !p.draft)) {
    entries.push({
      url: `${SITE}${post.permalink}`,
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
    });
  }

  return entries;
}
