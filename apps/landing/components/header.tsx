import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@fundout/ui/button";
import { LocaleSwitcher } from "./locale-switcher";

export function Header() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-heading text-lg font-bold">
          Fundout
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("howItWorks")}
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("pricing")}
          </Link>
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("blog")}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Button size="sm" asChild>
            <a
              href="https://app.fundout.app/login"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("startFree")}
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
