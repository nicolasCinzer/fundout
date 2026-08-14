import type { NextRequest } from "next/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundout.app";

/**
 * Global feed — redirects to the locale-scoped feed that best matches the
 * request's Accept-Language header. Falls back to /en/feed.xml when the
 * preferred language is unsupported or absent.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const acceptLanguage = req.headers.get("accept-language") ?? "";
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
  const locale = preferred === "es" ? "es" : "en";

  return Response.redirect(`${SITE}/${locale}/feed.xml`, 302);
}
