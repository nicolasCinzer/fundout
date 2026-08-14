import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return buildMetadata({
    locale: locale as "en" | "es",
    pathname: "/privacy",
    title: isEs ? "Política de Privacidad" : "Privacy Policy",
    description: isEs
      ? "Cómo Fundout recopila, usa y protege tu información personal."
      : "How Fundout collects, uses, and protects your personal information.",
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isEs = locale === "es";

  return (
    <div>
      {/* Hero banner */}
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            {isEs ? "Política de Privacidad" : "Privacy Policy"}
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
                <h2>Datos que recopilamos</h2>
                <p>
                  Recopilamos el email que proporcionás al registrarte y los datos de
                  trading que ingresás voluntariamente en el journal. No vendemos tus
                  datos a terceros.
                </p>
                <h2>Cómo usamos tus datos</h2>
                <p>
                  Tus datos de trading se usan exclusivamente para calcular las
                  métricas de tu dashboard. Tu email se usa para autenticación y
                  comunicaciones de producto que hayas aceptado.
                </p>
                <h2>Retención de datos</h2>
                <p>
                  Podés eliminar tu cuenta y todos los datos asociados en cualquier
                  momento desde Configuración → Eliminar cuenta.
                </p>
                <h2>Contacto</h2>
                <p>
                  Para consultas sobre privacidad:{" "}
                  <a href="mailto:privacy@fundout.app">privacy@fundout.app</a>
                </p>
              </>
            ) : (
              <>
                <h2>Data we collect</h2>
                <p>
                  We collect the email you provide when signing up, and the trading
                  data you voluntarily enter into the journal. We do not sell your
                  data to third parties.
                </p>
                <h2>How we use your data</h2>
                <p>
                  Your trading data is used exclusively to calculate your dashboard
                  metrics. Your email is used for authentication and product
                  communications you have opted into.
                </p>
                <h2>Data retention</h2>
                <p>
                  You can delete your account and all associated data at any time
                  from Settings → Delete account.
                </p>
                <h2>Contact</h2>
                <p>
                  For privacy inquiries:{" "}
                  <a href="mailto:privacy@fundout.app">privacy@fundout.app</a>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
