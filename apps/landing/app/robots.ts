import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundout.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: [
      `${SITE}/sitemap.xml`,
      `${SITE}/en/feed.xml`,
      `${SITE}/es/feed.xml`,
    ],
    host: SITE,
  };
}
