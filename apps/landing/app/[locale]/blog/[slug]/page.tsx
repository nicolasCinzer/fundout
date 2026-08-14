import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { posts } from "#content";
import { MDXContent } from "@/components/mdx-content";
import { Link } from "@/i18n/navigation";
import {
  buildMetadata,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import { ArrowLeft, Clock } from "lucide-react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fundout.app";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  return posts
    .filter((p) => !p.draft)
    .map((p) => ({ locale: p.locale, slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = posts.find((p) => p.locale === locale && p.slug === slug);
  if (!post) return {};

  return {
    ...buildMetadata({
      locale: locale as "en" | "es",
      pathname: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
    }),
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${SITE}${post.permalink}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = posts.find((p) => p.locale === locale && p.slug === slug);
  if (!post) notFound();

  const isEs = locale === "es";

  const articleJsonLd = buildArticleJsonLd({
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    url: `${SITE}${post.permalink}`,
    author: post.author,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Fundout", url: `${SITE}/${locale}` },
    { name: "Blog", url: `${SITE}/${locale}/blog` },
    { name: post.title, url: `${SITE}${post.permalink}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero image placeholder */}
      <div className="h-56 w-full bg-muted sm:h-72 md:h-80" />

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Back link */}
        <Link
          href="/blog"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEs ? "Volver al blog" : "Back to blog"}
        </Link>

        <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-16">
          {/* Article */}
          <article>
            <header className="mb-12">
              <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                {post.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                {post.metadata.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {isEs
                      ? `${post.metadata.readingTime} min de lectura`
                      : `${post.metadata.readingTime} min read`}
                  </span>
                )}
                <span>
                  {isEs ? `por ${post.author}` : `by ${post.author}`}
                </span>
              </div>
            </header>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <MDXContent code={post.content} />
            </div>
          </article>

          {/* Sticky TOC sidebar (desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {isEs ? "En este artículo" : "In this article"}
              </p>
              <p className="text-xs text-muted-foreground">
                {post.title}
              </p>
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  {isEs ? `por ${post.author}` : `by ${post.author}`}
                </p>
                <time
                  dateTime={post.publishedAt}
                  className="mt-1 block text-xs text-muted-foreground"
                >
                  {new Date(post.publishedAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
