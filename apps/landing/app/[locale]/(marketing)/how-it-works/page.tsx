import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@fundout/ui/button";
import { buildMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { BookOpen, SlidersHorizontal, Shield } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return buildMetadata({
    locale: locale as "en" | "es",
    pathname: "/how-it-works",
    title: isEs ? "¿Cómo funciona?" : "How It Works",
    description: isEs
      ? "Descubrí cómo Fundout te ayuda a pasar evaluaciones de prop firms rastreando los números que realmente importan."
      : "Discover how Fundout helps you pass prop firm evaluations by tracking the numbers that actually matter.",
  });
}

export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEs = locale === "es";

  const steps = [
    {
      number: "01",
      icon: <BookOpen className="h-6 w-6" />,
      title: isEs ? "Registrá tus operaciones" : "Journal your trades",
      body: isEs
        ? "Anotá cada operación a medida que operás — entrada, salida, tamaño, notas del setup. Fundout calcula el P&L, el múltiplo R y el impacto en la cuenta automáticamente. Sin hojas de cálculo."
        : "Log every trade as you go — entry, exit, size, setup notes. Fundout computes the P&L, R-multiple, and account impact automatically. No spreadsheets.",
      detail: isEs
        ? "Un journal claro te ayuda a identificar patrones en tu trading: qué setups funcionan, en qué sesiones operás mejor y dónde perdés disciplina."
        : "A clear journal helps you identify patterns in your trading: which setups work, which sessions you trade best, and where you lose discipline.",
    },
    {
      number: "02",
      icon: <SlidersHorizontal className="h-6 w-6" />,
      title: isEs ? "Rastreá las reglas de tu firma" : "Track your firm's rules",
      body: isEs
        ? "Configurá los límites de drawdown, el tope de pérdida diaria y la regla de consistencia de tu firma. Fundout muestra alertas en tiempo real cuando te acercás a un límite."
        : "Configure your firm's drawdown limits, daily loss cap, and consistency rule. Fundout shows live alerts when you're approaching a limit.",
      detail: isEs
        ? "Soportamos las reglas más comunes de FTMO, MyFundedFX, Apex, y más. Si tu firma tiene reglas personalizadas, podés configurarlas manualmente."
        : "We support common rule sets from FTMO, MyFundedFX, Apex, and more. If your firm has custom rules, you can configure them manually.",
    },
    {
      number: "03",
      icon: <Shield className="h-6 w-6" />,
      title: isEs ? "Mantenete fondeado" : "Stay funded",
      body: isEs
        ? "Con los números correctos frente a vos, evitar violaciones de reglas se convierte en un sistema — no en una suposición. Conocés tu margen antes de abrir la próxima operación."
        : "With the right numbers in front of you, avoiding rule breaches becomes a system — not a guess. You know your margin before you place the next trade.",
      detail: isEs
        ? "La calculadora de riesgo de ruina bankroll te da una vista probabilística de cuánto riesgo podés asumir dado tu win rate y el techo de drawdown de tu cuenta."
        : "The bankroll ruin calculator gives you a probabilistic view of how much risk you can take given your win rate and your account's drawdown ceiling.",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="max-w-2xl font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {isEs ? "Cómo funciona Fundout" : "How Fundout works"}
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            {isEs
              ? "Tres pasos simples para convertir tus datos de trading en claridad operativa."
              : "Three simple steps to turn your trading data into operational clarity."}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="space-y-24">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`grid gap-12 md:grid-cols-2 md:items-start ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Step card */}
                <div className="flex gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <div>
                    <p className="mb-1 font-heading text-xs font-bold tracking-widest text-primary">
                      {step.number}
                    </p>
                    <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                      {step.title}
                    </h2>
                    <p className="mt-4 text-muted-foreground">{step.body}</p>
                  </div>
                </div>

                {/* Detail card */}
                <div className="rounded-2xl border border-border bg-card p-8">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl bg-foreground px-8 py-16 text-center text-background">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {isEs ? "¿Listo para empezar?" : "Ready to get started?"}
            </h2>
            <p className="mt-4 text-sm opacity-70">
              {isEs
                ? "Gratis para siempre en una cuenta. Sin tarjeta de crédito."
                : "Free forever on one account. No credit card required."}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" variant="secondary" asChild>
                <a
                  href="https://app.fundout.app/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {isEs ? "Empezar gratis" : "Start free"}
                </a>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-background/70 hover:text-background hover:bg-white/10"
                asChild
              >
                <Link href="/pricing">
                  {isEs ? "Ver precios" : "See pricing"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
