import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { Manrope, Outfit } from "next/font/google";
import "../globals.css";
import { routing } from "@/i18n/routing";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading", display: "swap" });

export const metadata: Metadata = {
  title: {
    template: "%s | Fundout",
    default: "Fundout — Propfirm trading analytics",
  },
  description:
    "Journal every trade. See the math behind your evaluations. Stay funded.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundout.app"
  ),
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "es")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={`${manrope.variable} ${outfit.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
