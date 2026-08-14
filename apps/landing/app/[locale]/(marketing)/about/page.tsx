import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return buildMetadata({
    locale: locale as "en" | "es",
    pathname: "/about",
    title: isEs ? "Nosotros" : "About",
    description: isEs
      ? "Fundout es construido por un trader de prop firms para traders de prop firms. Sin bullshit de trading — solo los números que importan."
      : "Fundout is built by a prop firm trader for prop firm traders. No trading BS — just the numbers that matter.",
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isEs = locale === "es";

  return (
    <div>
      {/* Hero banner */}
      <section className="border-b border-border py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="max-w-2xl font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {isEs
              ? "Hecho por un trader para traders"
              : "Built by a trader, for traders"}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            {isEs
              ? "Fundout nació de una frustración real. Sin hoja de ruta de VC. Sin promesas vacías."
              : "Fundout grew from real frustration. No VC roadmap. No empty promises."}
          </p>
        </div>
      </section>

      {/* Origin story */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                {isEs ? "El problema" : "The problem"}
              </h2>
              <div className="mt-6 space-y-4 text-muted-foreground">
                {isEs ? (
                  <>
                    <p>
                      Nicolás Cinzer pasó demasiado tiempo en hojas de cálculo intentando
                      rastrear su proximidad a los límites de la prop firm mientras
                      simultáneamente intentaba operar.
                    </p>
                    <p>
                      El insight fue simple: las plataformas de trading muestran tu P&amp;L.
                      Nadie muestra tu{" "}
                      <em className="text-foreground">distancia al límite de pérdida diaria en tiempo real</em>.
                      Ese vacío existe porque las plataformas generales no fueron construidas
                      para el mundo específico de las prop firms.
                    </p>
                    <p className="font-medium text-foreground">Fundout sí.</p>
                  </>
                ) : (
                  <>
                    <p>
                      Nicolás Cinzer spent too much time in spreadsheets trying to track his
                      proximity to prop firm limits while simultaneously trying to actually trade.
                    </p>
                    <p>
                      The insight was simple: trading platforms show your P&amp;L. Nobody shows
                      your{" "}
                      <em className="text-foreground">distance to the daily loss limit in real time</em>.
                      That gap exists because general platforms weren&apos;t built for the specific
                      world of prop firms.
                    </p>
                    <p className="font-medium text-foreground">Fundout was.</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                {isEs ? "Filosofía" : "Philosophy"}
              </h2>
              <div className="mt-6 space-y-4 text-muted-foreground">
                {isEs ? (
                  <>
                    <p>
                      No vendemos señales de trading ni prometemos pasar evaluaciones.
                      Vendemos claridad sobre los números que determinan si mantenés tu
                      cuenta fondeada o no.
                    </p>
                    <p>
                      Si tu estrategia funciona, Fundout te ayuda a no torpedearla con
                      malas decisiones de gestión de riesgo. Si no funciona, Fundout te
                      muestra exactamente dónde está el problema.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      We don&apos;t sell trading signals or promise to pass evaluations. We
                      sell clarity on the numbers that determine whether you keep your
                      funded account or not.
                    </p>
                    <p>
                      If your strategy works, Fundout helps you not torpedo it with bad
                      risk management decisions. If it doesn&apos;t, Fundout shows you exactly
                      where the problem is.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pull quote */}
      <section className="border-b border-border bg-muted/40 py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <blockquote className="font-heading text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
            {isEs
              ? "«Las prop firms no te eliminan por mal trading. Te eliminan por mal manejo de riesgo.»"
              : '"Prop firms don\'t eliminate you for bad trading. They eliminate you for bad risk management."'}
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">— Nicolás Cinzer, Fundout</p>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {isEs ? "El equipo" : "The team"}
          </h2>
          <div className="flex max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-8">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center font-heading text-xl font-bold text-primary">
              NC
            </div>
            <div>
              <p className="font-heading text-lg font-semibold">Nicolás Cinzer</p>
              <p className="text-sm text-muted-foreground">
                {isEs ? "Fundador & desarrollador" : "Founder & developer"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isEs
                ? "Desarrollador full-stack y trader de prop firms con experiencia en FTMO, MyFundedFX y otras firmas. Construyó Fundout porque necesitaba la herramienta él mismo."
                : "Full-stack developer and prop firm trader with experience across FTMO, MyFundedFX, and other firms. Built Fundout because he needed the tool himself."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
