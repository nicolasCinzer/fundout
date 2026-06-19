import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import enMessages from "@fundout/i18n-marketing/en/marketing.json";
import esMessages from "@fundout/i18n-marketing/es/marketing.json";

const messages = {
  en: enMessages,
  es: esMessages,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "en" | "es")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: messages[locale as "en" | "es"],
  };
});
