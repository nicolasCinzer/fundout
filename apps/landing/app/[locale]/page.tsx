import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Tools } from "@/components/tools";
import { FaqCta } from "@/components/faq-cta";
import { buildMetadata, buildOrganizationJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return buildMetadata({
    locale: locale as "en" | "es",
    pathname: "",
    title: isEs
      ? "Fundout — El ROI de tu prop firm, de un vistazo"
      : "Fundout — Your prop firm ROI, at a glance",
    description: isEs
      ? "Registrá cada evaluación, cuenta fondeada y payout en un solo dashboard. Conocé tus números reales."
      : "Track every evaluation, funded account and payout in one dashboard. Know your real numbers.",
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const orgJsonLd = buildOrganizationJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <Hero />
      <Features />
      <Tools />
      <FaqCta />
    </>
  );
}
