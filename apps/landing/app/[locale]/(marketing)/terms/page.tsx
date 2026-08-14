import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return buildMetadata({
    locale: locale as "en" | "es",
    pathname: "/terms",
    title: isEs ? "Términos de Servicio" : "Terms of Service",
    description: isEs
      ? "Los términos que rigen el uso de Fundout."
      : "The terms governing your use of Fundout.",
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isEs = locale === "es";

  return (
    <div>
      {/* Hero banner */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            {isEs ? "Términos de Servicio" : "Terms of Service"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {isEs ? "Última actualización: enero 2025" : "Last updated: January 2025"}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {isEs ? (
              <>
                <h2>Aceptación de términos</h2>
                <p>
                  Al usar Fundout, aceptás estos términos. Si no estás de acuerdo,
                  no uses el servicio.
                </p>
                <h2>Descripción del servicio</h2>
                <p>
                  Fundout es una herramienta de journal y analítica de trading. No
                  somos un broker, no proveemos asesoramiento financiero y no
                  garantizamos resultados de trading.
                </p>
                <h2>Uso aceptable</h2>
                <p>
                  No podés usar Fundout para actividades ilegales, para revenderte a
                  terceros sin autorización, ni para interferir con la infraestructura
                  del servicio.
                </p>
                <h2>Limitación de responsabilidad</h2>
                <p>
                  Fundout no es responsable por pérdidas de trading o decisiones
                  tomadas en base a la información del dashboard. Las métricas son
                  informativas, no prescriptivas.
                </p>
                <h2>Contacto</h2>
                <p>
                  <a href="mailto:legal@fundout.app">legal@fundout.app</a>
                </p>
              </>
            ) : (
              <>
                <h2>Acceptance of terms</h2>
                <p>
                  By using Fundout, you agree to these terms. If you disagree, do
                  not use the service.
                </p>
                <h2>Service description</h2>
                <p>
                  Fundout is a trading journal and analytics tool. We are not a
                  broker, we do not provide financial advice, and we make no
                  guarantees about trading results.
                </p>
                <h2>Acceptable use</h2>
                <p>
                  You may not use Fundout for illegal activities, to resell to third
                  parties without authorization, or to interfere with service
                  infrastructure.
                </p>
                <h2>Limitation of liability</h2>
                <p>
                  Fundout is not responsible for trading losses or decisions made
                  based on dashboard information. Metrics are informational, not
                  prescriptive.
                </p>
                <h2>Contact</h2>
                <p>
                  <a href="mailto:legal@fundout.app">legal@fundout.app</a>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
