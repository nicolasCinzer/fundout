"use client";

import * as runtime from "react/jsx-runtime";
import { useMDXComponents } from "@/mdx-components";

interface MDXContentProps {
  code: string;
}

export function MDXContent({ code }: MDXContentProps) {
  const components = useMDXComponents({});
  // Velite compiles MDX to a self-contained ESM function; run it with the jsx runtime
  const fn = new Function(code);
  const mod = fn({ ...runtime, _components: components }) as {
    default?: () => React.ReactElement;
  };
  const Component = mod.default;
  if (!Component) return null;
  return <Component />;
}
