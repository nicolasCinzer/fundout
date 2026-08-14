import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@fundout/ui/button";
import { Badge } from "@fundout/ui/badge";
import { Card, CardContent, CardHeader } from "@fundout/ui/card";
import { Check } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return buildMetadata({
    locale: locale as "en" | "es",
    pathname: "/pricing",
    title: isEs ? "Precios" : "Pricing",
    description: isEs
      ? "Empezá gratis. Sin tarjeta de crédito. Fundout crece con vos."
      : "Start for free. No credit card required. Fundout grows with you.",
  });
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isEs = locale === "es";

  const plans = [
    {
      name: isEs ? "Gratis" : "Free",
      price: "$0",
      period: isEs ? "para siempre" : "forever",
      description: isEs
        ? "Para traders que están empezando con las prop firms."
        : "For traders just getting started with prop firms.",
      features: isEs
        ? [
            "1 cuenta activa",
            "Journal ilimitado",
            "Dashboard básico",
            "Alertas de límite de reglas",
          ]
        : [
            "1 active account",
            "Unlimited journal entries",
            "Basic dashboard",
            "Rule-limit alerts",
          ],
      cta: isEs ? "Empezar gratis" : "Start free",
      href: "https://app.fundout.app/login",
      highlight: false,
      badge: null,
    },
    {
      name: "Pro",
      price: isEs ? "Próximamente" : "Coming soon",
      period: "",
      description: isEs
        ? "Para traders serios con múltiples cuentas y firmas."
        : "For serious traders with multiple accounts and firms.",
      features: isEs
        ? [
            "Cuentas ilimitadas",
            "Reglas personalizadas por firma",
            "Alertas avanzadas",
            "Calculadora de riesgo de ruina",
            "Tarjeta de progreso compartible",
          ]
        : [
            "Unlimited accounts",
            "Custom firm rule presets",
            "Advanced alerts",
            "Risk-of-ruin calculator",
            "Shareable progress card",
          ],
      cta: isEs ? "Notificarme" : "Notify me",
      href: "#newsletter",
      highlight: true,
      badge: isEs ? "Próximamente" : "Coming soon",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            {isEs ? "Precios simples" : "Simple pricing"}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {isEs
              ? "Empezá gratis. Actualizá cuando estés listo."
              : "Start free. Upgrade when you're ready."}
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative overflow-hidden ${
                  plan.highlight
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border"
                }`}
              >
                {plan.badge && (
                  <div className="absolute right-4 top-4">
                    <Badge variant="secondary">{plan.badge}</Badge>
                  </div>
                )}
                <CardHeader className="p-8 pb-0">
                  <h2 className="font-heading text-2xl font-bold">{plan.name}</h2>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-heading text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">
                        / {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-8 w-full"
                    variant={plan.highlight ? "outline" : "default"}
                  >
                    <a href={plan.href}>{plan.cta}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            {isEs
              ? "¿Preguntas? Escribinos a "
              : "Questions? Reach us at "}
            <a
              href="mailto:hello@fundout.app"
              className="underline underline-offset-4 hover:text-foreground"
            >
              hello@fundout.app
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
