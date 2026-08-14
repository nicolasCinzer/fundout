import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ClipboardList,
  Landmark,
  Wallet,
} from "lucide-react";
import { Reveal } from "./reveal";

const features = [
  { icon: LayoutDashboard, key: "card1" },
  { icon: ClipboardList, key: "card2" },
  { icon: Landmark, key: "card3" },
  { icon: Wallet, key: "card4" },
] as const;

export function Features() {
  const t = useTranslations("features");

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
        <h2 className="mt-2 text-balance font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("headline")}
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          {t("subhead")}
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <Reveal
            key={f.key}
            delay={i * 90}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
            />
            <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-secondary text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-5 font-heading text-base font-semibold text-foreground">
              {t(`${f.key}Title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(`${f.key}Body`)}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
