import rehypeShiki from "@shikijs/rehype";
import { defineConfig, s } from "velite";

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: {
    posts: {
      name: "Post",
      pattern: "blog/**/*.mdx",
      schema: s
        .object({
          title: s.string().max(120),
          description: s.string().max(200),
          publishedAt: s.isodate(),
          updatedAt: s.isodate().optional(),
          locale: s.enum(["en", "es"]),
          tags: s.array(s.string()).default([]),
          draft: s.boolean().default(false),
          author: s.string().default("Nicolás Cinzer"),
          cover: s.image().optional(),
          metadata: s.metadata(),
          excerpt: s.excerpt(),
          content: s.mdx({
            rehypePlugins: [
              [
                rehypeShiki,
                { theme: "github-dark-dimmed", defaultLanguage: "text" },
              ],
            ],
          }),
        })
        .transform((data, { meta }) => ({
          ...data,
          slug: meta.path.split("/").pop()!.replace(/\.mdx$/, ""),
          permalink: `/${data.locale}/blog/${meta.path.split("/").pop()!.replace(/\.mdx$/, "")}`,
        })),
    },
  },
  mdx: {
    rehypePlugins: [],
    remarkPlugins: [],
  },
});
