import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(req: NextRequest) {
  // Root request → Accept-Language redirect (default EN per locked decision)
  if (req.nextUrl.pathname === "/") {
    const accept = req.headers.get("accept-language") || "";
    const prefersEs = /^es\b|,\s*es\b/i.test(accept);
    const locale = prefersEs ? "es" : "en";
    return NextResponse.redirect(new URL(`/${locale}`, req.url), { status: 307 });
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/", "/(en|es)/:path*"],
};
