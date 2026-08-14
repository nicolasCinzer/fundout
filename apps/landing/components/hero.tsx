import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@fundout/ui/button";
import { Link } from "@/i18n/navigation";
import { ctaButtonClass } from "@/lib/cta";

const firms = [
  "Lucid",
  "FTMO",
  "Topstep",
  "Apex",
  "MyForexFunds",
  "The5ers",
  "FundedNext",
  "E8 Markets",
];

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden">
      {/* backgrounds */}
      <div
        aria-hidden="true"
        className="bg-grid mask-fade pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(ellipse_55%_55%_at_50%_-10%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
      />

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="animate-pulse-glow absolute inline-flex size-full rounded-full bg-primary" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            {t("badge")}
          </span>

          <h1
            className="animate-fade-up mt-6 text-balance font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            {t("headline")} <span className="text-shimmer">{t("headlineAccent")}</span>
          </h1>

          <p
            className="animate-fade-up mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {t("subhead")}
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <Button size="lg" asChild className={`w-full sm:w-auto ${ctaButtonClass}`}>
              <a
                href="https://app.fundout.app/login"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("primaryCta")}
                <ArrowUpRight />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full border-border bg-card/60 font-medium text-foreground backdrop-blur hover:bg-accent sm:w-auto"
            >
              <Link href="/how-it-works">{t("secondaryCta")}</Link>
            </Button>
          </div>

          <p
            className="animate-fade-up mt-4 text-xs text-muted-foreground"
            style={{ animationDelay: "320ms" }}
          >
            {t("microcopy")}
          </p>
        </div>

        {/* Product screenshot */}
        <div
          className="animate-fade-up group relative mt-14 [perspective:1600px]"
          style={{ animationDelay: "400ms" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-8 -top-8 bottom-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_20%,transparent),transparent)] blur-2xl"
          />
          <div className="gradient-border overflow-hidden rounded-2xl border border-border bg-card/60 p-2 shadow-2xl shadow-black/50 ring-1 ring-white/5 transition-transform duration-500 ease-out group-hover:[transform:rotateX(1.5deg)]">
            <div className="overflow-hidden rounded-xl border border-border">
              <Image
                src="/static/hero-dashboard.png"
                alt={t("headline")}
                width={2134}
                height={874}
                priority
                sizes="(min-width: 1152px) 1136px, 100vw"
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>

        {/* marquee of firms */}
        <div className="mt-16">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t("marqueeLabel")}
          </p>
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="animate-marquee flex w-max items-center gap-10">
              {[...firms, ...firms].map((firm, i) => (
                <span
                  key={`${firm}-${i}`}
                  className="flex items-center gap-2 text-lg font-semibold text-muted-foreground/70"
                >
                  <Sparkles className="size-4 text-primary/60" />
                  {firm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
