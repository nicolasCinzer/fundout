import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/how-it-works": { en: "/how-it-works", es: "/como-funciona" },
    "/pricing": { en: "/pricing", es: "/precios" },
    "/about": { en: "/about", es: "/nosotros" },
    "/privacy": { en: "/privacy", es: "/privacidad" },
    "/terms": { en: "/terms", es: "/terminos" },
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
  },
});
