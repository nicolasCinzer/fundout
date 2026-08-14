import type { ComponentType } from "react";
import { Callout } from "@/components/mdx/callout";

// Inline type — avoids requiring `mdx/types` which is from @next/mdx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MDXComponents = Record<string, ComponentType<any>>;

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    ...components,
  };
}
