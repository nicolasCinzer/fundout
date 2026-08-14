import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";

type InternalLink = {
  key: string;
  href: "/blog" | "/about";
  internal: true;
};
type ExternalLink = { key: string; href: string; internal?: false };
// TODO: re-enable Blog and About once those pages are ready (target: soon).
type DisabledLink = { key: string; disabled: true };
type FooterLink = InternalLink | ExternalLink | DisabledLink;

const columns: { titleKey: string; links: FooterLink[] }[] = [
  {
    titleKey: "col1Title",
    links: [
      { key: "col1Link1", href: "https://app.fundout.app" },
      { key: "col1Link2", href: "https://app.fundout.app" },
      { key: "col1Link3", href: "https://app.fundout.app" },
      { key: "col1Link4", href: "https://app.fundout.app" },
    ],
  },
  {
    titleKey: "col2Title",
    links: [
      { key: "col2Link1", href: "#tools" },
      { key: "col2Link2", href: "#tools" },
      { key: "col2Link3", href: "#tools" },
      // TODO: Blog disabled until the blog is ready.
      { key: "col2Link4", disabled: true },
    ],
  },
  {
    titleKey: "col3Title",
    links: [
      // TODO: About disabled until the page is ready.
      { key: "col3Link1", disabled: true },
      { key: "col3Link3", href: "mailto:hello@fundout.app" },
    ],
  },
];

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  const linkClass =
    "text-sm text-muted-foreground transition-colors hover:text-foreground";

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.titleKey}>
              <h4 className="font-heading text-sm font-semibold text-foreground">
                {t(col.titleKey)}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.key}>
                    {"disabled" in link ? (
                      <span className="inline-flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground/50">
                        {t(link.key)}
                        <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                          {t("soon")}
                        </span>
                      </span>
                    ) : link.internal ? (
                      <Link href={link.href} className={linkClass}>
                        {t(link.key)}
                      </Link>
                    ) : (
                      <a href={link.href} className={linkClass}>
                        {t(link.key)}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Fundout. {t("rights")}
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <LocaleSwitcher />
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              {t("legalPrivacy")}
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              {t("legalTerms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
