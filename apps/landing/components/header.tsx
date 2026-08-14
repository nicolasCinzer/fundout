import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@fundout/ui/button";
import { ctaButtonClass } from "@/lib/cta";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";

const navLinks = [
  { href: "#features", key: "features" },
  { href: "#tools", key: "tools" },
  { href: "#faq", key: "faq" },
] as const;

export function Header() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Fundout" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            <a
              href="https://app.fundout.app/login"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("signIn")}
            </a>
          </Button>
          <Button size="sm" asChild className={ctaButtonClass}>
            <a
              href="https://app.fundout.app/login"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("getStarted")}
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
