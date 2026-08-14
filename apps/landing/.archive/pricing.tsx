import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@fundout/ui/button";
import { ctaButtonClass } from "@/lib/cta";
import { Reveal } from "./reveal";

const plans = [
  { key: "plan1", featured: false, href: "https://app.fundout.app/login" },
  { key: "plan2", featured: true, href: "https://app.fundout.app/login" },
  { key: "plan3", featured: false, href: "mailto:hello@fundout.app" },
] as const;

export function Pricing() {
  const t = useTranslations("pricing");

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
        <h2 className="mt-2 text-balance font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("headline")}
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          {t("subhead")}
        </p>
      </Reveal>

      <div className="mt-12 grid items-start gap-4 lg:grid-cols-3">
        {plans.map((p, i) => {
          const features = t.raw(`${p.key}Features`) as string[];
          return (
            <Reveal
              key={p.key}
              delay={i * 100}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                p.featured
                  ? "border-primary/50 bg-card shadow-2xl shadow-primary/10 ring-1 ring-primary/20 lg:-mt-4 lg:pb-10"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {p.featured && (
                <>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-x-4 -top-6 bottom-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)] blur-xl"
                  />
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg shadow-primary/30">
                    {t("mostPopular")}
                  </span>
                </>
              )}
              <h3 className="font-heading text-base font-semibold text-foreground">
                {t(`${p.key}Name`)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`${p.key}Desc`)}
              </p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-semibold tracking-tight text-foreground">
                  {t(`${p.key}Price`)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("perMonth")}
                </span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={
                  p.featured
                    ? `mt-7 w-full ${ctaButtonClass}`
                    : "mt-7 w-full border border-border bg-secondary font-medium text-foreground hover:bg-accent"
                }
              >
                <a
                  href={p.href}
                  target={p.href.startsWith("http") ? "_blank" : undefined}
                  rel={p.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {t(`${p.key}Cta`)}
                </a>
              </Button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
