// Primary CTA styling, lifted from the app's "New evaluation" button
// (apps/web · app-sidebar.tsx, line 126): teal top-to-bottom gradient, colored
// glow, ring, press-scale, and a plus/arrow icon that rotates 90° on hover.
// `border-0` neutralizes the @fundout/ui Button base's `border-transparent
// bg-clip-padding`, which would otherwise leak the dark page bg as a 1px edge;
// the app's SidebarMenuButton has no border, so this matches it.
export const ctaButtonClass =
  "h-9 gap-2 px-4 border-0 bg-linear-to-b from-primary to-primary/85 font-semibold text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/40 transition-all hover:from-primary hover:to-primary hover:text-primary-foreground hover:shadow-primary/50 hover:ring-primary/60 active:scale-[0.98] active:text-primary-foreground [&_svg]:size-4.5 [&_svg]:transition-transform hover:[&_svg]:rotate-90";
