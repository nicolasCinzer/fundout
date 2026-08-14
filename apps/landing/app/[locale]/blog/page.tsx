import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { posts } from "#content";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { Clock } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return buildMetadata({
    locale: locale as "en" | "es",
    pathname: "/blog",
    title: isEs ? "Blog — Fundout" : "Blog — Fundout",
    description: isEs
      ? "Field notes sobre prop firms, analítica de trading y gestión de riesgo."
      : "Field notes on prop firms, trading analytics, and risk management.",
  });
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const items = posts
    .filter((p) => p.locale === locale && !p.draft)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  const isEs = locale === "es";

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Blog
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            {isEs
              ? "Field notes sobre trading en prop firms."
              : "Field notes on prop firm trading."}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          {items.length === 0 ? (
            <p className="text-muted-foreground">
              {isEs ? "Próximamente." : "Coming soon."}
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
                  >
                    {/* Cover placeholder */}
                    <div className="h-40 bg-muted" />

                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="mb-2 font-heading text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
                        {post.title}
                      </h2>
                      <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">
                        {post.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString(locale, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                        {post.metadata.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {isEs
                              ? `${post.metadata.readingTime} min`
                              : `${post.metadata.readingTime} min`}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
