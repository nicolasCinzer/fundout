import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-6xl font-bold">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {t("description")}
      </p>
      <Link
        href="/"
        className="mt-8 text-primary underline underline-offset-4 hover:opacity-80"
      >
        {t("cta")}
      </Link>
    </main>
  );
}
