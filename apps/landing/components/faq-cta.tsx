"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@fundout/ui/button";
import { Link } from "@/i18n/navigation";
import { ctaButtonClass } from "@/lib/cta";
import { Reveal } from "./reveal";

const faqKeys = ["1", "2", "3", "4"] as const;

export function FaqCta() {
  const t = useTranslations("faq");
  const c = useTranslations("ctaBanner");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <section id="faq" className="border-t border-border bg-card/40 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
            <h2 className="mt-2 text-balance font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t("headline")}
            </h2>
          </Reveal>
          <Reveal className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
            {faqKeys.map((n, i) => {
              const isOpen = open === i;
              return (
                <div key={n}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-accent/40"
                  >
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {t(`q${n}`)}
                    </h3>
                    <ChevronDown
                      className={`size-5 shrink-0 text-primary transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
                        {t(`a${n}`)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal className="gradient-border relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_0%,black,transparent)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {c("headline")} <span className="text-shimmer">{c("headlineAccent")}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty leading-relaxed text-muted-foreground">
              {c("subhead")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className={`w-full sm:w-auto ${ctaButtonClass}`}>
                <a
                  href="https://app.fundout.app/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {c("primaryCta")}
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full border-border bg-background font-medium text-foreground hover:bg-accent sm:w-auto"
              >
                <Link href="/how-it-works">{c("secondaryCta")}</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
