import { useTranslations } from "next-intl";
import { Button } from "@fundout/ui/button";
import { Link } from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations("hero");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <section className="mx-auto max-w-3xl py-24">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="mb-6 font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {t("headline")}
        </h1>
        <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
          {t("subhead")}
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <a
              href="https://app.fundout.app/login"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("primaryCta")}
            </a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/how-it-works">{t("secondaryCta")}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
