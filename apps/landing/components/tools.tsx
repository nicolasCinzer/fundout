import { useTranslations } from "next-intl";
import { Calculator, Activity, FlaskConical, ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

const tools = [
  { icon: Calculator, key: "card1" },
  { icon: Activity, key: "card2" },
  { icon: FlaskConical, key: "card3" },
] as const;

export function Tools() {
  const t = useTranslations("tools");

  return (
    <section
      id="tools"
      className="relative overflow-hidden border-y border-border bg-card/40 py-20"
    >
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
          <h2 className="mt-2 text-balance font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("headline")}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {t("subhead")}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {tools.map((tool, i) => (
            <Reveal
              key={tool.key}
              delay={i * 100}
              className="gradient-border group flex flex-col rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-secondary text-primary transition-transform duration-300 group-hover:scale-110 group-hover:border-primary/40 group-hover:bg-primary/10">
                <tool.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                {t(`${tool.key}Title`)}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {t(`${tool.key}Body`)}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                {t("openTool")}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
