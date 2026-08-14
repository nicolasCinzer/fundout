import { posts } from "#content";
import type { NextRequest } from "next/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundout.app";

const SUPPORTED_LOCALES = ["en", "es"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function buildRss(locale: Locale): string {
  const items = posts
    .filter((p) => !p.draft && p.locale === locale)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .map(
      (p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE}${p.permalink}</link>
      <guid>${SITE}${p.permalink}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${p.description}]]></description>
    </item>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Fundout Blog (${locale.toUpperCase()})</title>
    <link>${SITE}/${locale}</link>
    <description>Propfirm trading analytics field notes.</description>
    ${items}
  </channel>
</rss>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
): Promise<Response> {
  const { locale } = await params;

  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    return new Response("Not Found", { status: 404 });
  }

  const xml = buildRss(locale as Locale);
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
